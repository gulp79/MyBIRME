import { createContext, useContext, useReducer, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { ImageFile, CropState, AppSettings, ExportSettings } from '@/types/image';
import { DEFAULT_APP_SETTINGS, DEFAULT_CROP_STATE } from '@/types/image';
import { saveSettings, loadSettings, saveCropStates, loadCropStates, clearStorage } from '@/lib/storage';
import { generateImageId, generateFileHash, loadImageWithOrientation, generateThumbnail, isValidImageFile } from '@/lib/imageUtils';
import { analyzeImage, clearSmartCropCache } from '@/lib/smartCropWorker';
import { smartCropToCropState } from '@/lib/cropMath';

// State types
interface AppState {
  images: ImageFile[];
  settings: AppSettings;
  isProcessing: boolean;
  selectedImageId: string | null;
  editingImageId: string | null;
}

type AppAction =
  | { type: 'ADD_IMAGES'; payload: ImageFile[] }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'CLEAR_IMAGES' }
  | { type: 'UPDATE_CROP_STATE'; payload: { id: string; cropState: CropState } }
  | { type: 'UPDATE_ALL_CROP_STATES'; payload: { aspect: number } }
  | { type: 'APPLY_CROP_TO_ALL'; payload: CropState }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'UPDATE_EXPORT_SETTINGS'; payload: Partial<ExportSettings> }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_SELECTED_IMAGE'; payload: string | null }
  | { type: 'SET_EDITING_IMAGE'; payload: string | null }
  | { type: 'SET_IMAGE_SMART_CROP'; payload: { id: string; result: ImageFile['smartCropResult'] } }
  | { type: 'SET_IMAGE_PROCESSING'; payload: { id: string; isProcessing: boolean } }
  | { type: 'SET_IMAGE_SMART_CROP_PENDING'; payload: { id: string; pending: boolean } }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const initialState: AppState = {
  images: [],
  settings: DEFAULT_APP_SETTINGS,
  isProcessing: false,
  selectedImageId: null,
  editingImageId: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_IMAGES':
      return { ...state, images: [...state.images, ...action.payload] };

    case 'REMOVE_IMAGE':
      return { ...state, images: state.images.filter(img => img.id !== action.payload) };

    case 'CLEAR_IMAGES':
      return { ...state, images: [], selectedImageId: null, editingImageId: null };

    case 'UPDATE_CROP_STATE':
      return {
        ...state,
        images: state.images.map(img =>
          img.id === action.payload.id
            ? { ...img, cropState: action.payload.cropState }
            : img
        ),
      };

    case 'UPDATE_ALL_CROP_STATES':
      return {
        ...state,
        images: state.images.map(img => ({
          ...img,
          cropState: { ...img.cropState, aspect: action.payload.aspect },
        })),
      };

    case 'APPLY_CROP_TO_ALL':
      return {
        ...state,
        images: state.images.map(img => ({
          ...img,
          cropState: {
            ...action.payload,
            aspect: state.settings.exportSettings.targetWidth / state.settings.exportSettings.targetHeight,
          },
        })),
      };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'UPDATE_EXPORT_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          exportSettings: { ...state.settings.exportSettings, ...action.payload },
        },
      };

    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };

    case 'SET_SELECTED_IMAGE':
      return { ...state, selectedImageId: action.payload };

    case 'SET_EDITING_IMAGE':
      return { ...state, editingImageId: action.payload };

    case 'SET_IMAGE_SMART_CROP':
      return {
        ...state,
        images: state.images.map(img =>
          img.id === action.payload.id
            ? { ...img, smartCropResult: action.payload.result, isSmartCropPending: false }
            : img
        ),
      };

    case 'SET_IMAGE_PROCESSING':
      return {
        ...state,
        images: state.images.map(img =>
          img.id === action.payload.id
            ? { ...img, isProcessing: action.payload.isProcessing }
            : img
        ),
      };

    case 'SET_IMAGE_SMART_CROP_PENDING':
      return {
        ...state,
        images: state.images.map(img =>
          img.id === action.payload.id
            ? { ...img, isSmartCropPending: action.payload.pending }
            : img
        ),
      };

    case 'LOAD_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  addImages: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  clearImages: () => void;
  updateCropState: (id: string, cropState: CropState) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateExportSettings: (settings: Partial<ExportSettings>) => void;
  setSelectedImage: (id: string | null) => void;
  setEditingImage: (id: string | null) => void;
  applyCropToAll: (cropState: CropState) => void;
  recomputeSmartCrop: () => Promise<void>;
  runSmartCropForImage: (id: string, imageOverride?: ImageFile) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = loadSettings();
    if (savedSettings) {
      dispatch({ type: 'LOAD_STATE', payload: { settings: savedSettings } });
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    saveSettings(state.settings);
  }, [state.settings]);

  // Save crop states when they change
  useEffect(() => {
    const cropStates: Record<string, CropState> = {};
    state.images.forEach(img => {
      if (img.cropState.sourceHash) {
        cropStates[img.cropState.sourceHash] = img.cropState;
      }
    });
    if (Object.keys(cropStates).length > 0) {
      saveCropStates(cropStates);
    }
  }, [state.images]);

  // Use a ref to always access the latest images without stale closures
  const imagesRef = useRef(state.images);
  imagesRef.current = state.images;

  const runSmartCropForImage = useCallback(async (id: string, imageOverride?: ImageFile) => {
    const image = imageOverride ?? imagesRef.current.find(img => img.id === id);
    if (!image || !image.bitmap || !state.settings.enableSmartCrop) return;

    dispatch({ type: 'SET_IMAGE_SMART_CROP_PENDING', payload: { id, pending: true } });

    try {
      const { targetWidth, targetHeight } = state.settings.exportSettings;
      const result = await analyzeImage(image.bitmap, targetWidth, targetHeight, id);

      if (result) {
        dispatch({ type: 'SET_IMAGE_SMART_CROP', payload: { id, result } });

        // Convert to crop state
        const newCropState = smartCropToCropState(
          result,
          image.originalWidth,
          image.originalHeight,
          targetWidth / targetHeight
        );
        newCropState.sourceHash = image.cropState.sourceHash;

        dispatch({ type: 'UPDATE_CROP_STATE', payload: { id, cropState: newCropState } });
      }
    } catch (error) {
      console.error('Smart crop failed for image:', id, error);
      dispatch({ type: 'SET_IMAGE_SMART_CROP_PENDING', payload: { id, pending: false } });
    }
  }, [state.settings.enableSmartCrop, state.settings.exportSettings]);

  const addImages = useCallback(async (files: File[]) => {
    dispatch({ type: 'SET_PROCESSING', payload: true });

    const validFiles = files.filter(isValidImageFile);
    const newImages: ImageFile[] = [];
    const savedCrops = loadCropStates() || {};
    const { targetWidth, targetHeight } = state.settings.exportSettings;
    const aspect = targetWidth / targetHeight;

    for (const file of validFiles) {
      try {
        const id = generateImageId();
        const hash = await generateFileHash(file);
        const { bitmap, width, height } = await loadImageWithOrientation(file);
        const thumbnail = await generateThumbnail(bitmap);

        // Check for saved crop state
        const savedCrop = savedCrops[hash];
        const cropState: CropState = savedCrop || {
          ...DEFAULT_CROP_STATE,
          aspect,
          sourceHash: hash,
        };
        cropState.sourceHash = hash;

        newImages.push({
          id,
          file,
          name: file.name,
          originalWidth: width,
          originalHeight: height,
          bitmap,
          thumbnail,
          cropState,
          isProcessing: false,
          isSmartCropPending: state.settings.enableSmartCrop && !savedCrop,
        });
      } catch (error) {
        console.error('Failed to load image:', file.name, error);
      }
    }

    dispatch({ type: 'ADD_IMAGES', payload: newImages });
    dispatch({ type: 'SET_PROCESSING', payload: false });

    // Run smart crop for new images if enabled and no saved state
    if (state.settings.enableSmartCrop) {
      for (const img of newImages) {
        if (img.isSmartCropPending && img.bitmap) {
          // Pass the image object directly to avoid stale closure issues
          setTimeout(() => runSmartCropForImage(img.id, img), 100);
        }
      }
    }
  }, [state.settings.exportSettings, state.settings.enableSmartCrop, runSmartCropForImage]);

  const removeImage = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_IMAGE', payload: id });
    clearSmartCropCache(id);
  }, []);

  const clearImages = useCallback(() => {
    dispatch({ type: 'CLEAR_IMAGES' });
    clearSmartCropCache();
    clearStorage();
  }, []);

  const updateCropState = useCallback((id: string, cropState: CropState) => {
    dispatch({ type: 'UPDATE_CROP_STATE', payload: { id, cropState } });
  }, []);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const updateExportSettings = useCallback((settings: Partial<ExportSettings>) => {
    dispatch({ type: 'UPDATE_EXPORT_SETTINGS', payload: settings });

    // If aspect ratio changed, update all crop states
    if (settings.targetWidth !== undefined || settings.targetHeight !== undefined) {
      const newWidth = settings.targetWidth ?? state.settings.exportSettings.targetWidth;
      const newHeight = settings.targetHeight ?? state.settings.exportSettings.targetHeight;
      const newAspect = newWidth / newHeight;

      dispatch({ type: 'UPDATE_ALL_CROP_STATES', payload: { aspect: newAspect } });

      // Clear smart crop cache and recompute if enabled
      if (state.settings.enableSmartCrop) {
        clearSmartCropCache();
      }
    }
  }, [state.settings.exportSettings, state.settings.enableSmartCrop]);

  const setSelectedImage = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_IMAGE', payload: id });
  }, []);

  const setEditingImage = useCallback((id: string | null) => {
    dispatch({ type: 'SET_EDITING_IMAGE', payload: id });
  }, []);

  const applyCropToAll = useCallback((cropState: CropState) => {
    dispatch({ type: 'APPLY_CROP_TO_ALL', payload: cropState });
  }, []);

  const recomputeSmartCrop = useCallback(async () => {
    if (!state.settings.enableSmartCrop) return;

    clearSmartCropCache();

    for (const img of state.images) {
      if (img.bitmap) {
        await runSmartCropForImage(img.id);
      }
    }
  }, [state.settings.enableSmartCrop, state.images, runSmartCropForImage]);

  return (
    <AppContext.Provider
      value={{
        state,
        addImages,
        removeImage,
        clearImages,
        updateCropState,
        updateSettings,
        updateExportSettings,
        setSelectedImage,
        setEditingImage,
        applyCropToAll,
        recomputeSmartCrop,
        runSmartCropForImage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
