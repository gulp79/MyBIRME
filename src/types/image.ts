// Core types for MyBIRME image processing

export interface CropState {
  centerX: number; // 0..1 normalized position
  centerY: number; // 0..1 normalized position
  scale: number;   // 1 = fit; >1 = zoom in
  aspect: number;  // targetWidth / targetHeight
  rotation?: number; // reserved (EXIF pre-normalized)
  sourceHash?: string; // for persistence
}

export interface ImageFile {
  id: string;
  file: File;
  name: string;
  originalWidth: number;
  originalHeight: number;
  bitmap: ImageBitmap | null;
  thumbnail: string; // base64 or object URL
  cropState: CropState;
  smartCropResult?: SmartCropResult;
  isProcessing: boolean;
  isSmartCropPending: boolean;
}

export interface SmartCropResult {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

export interface ExportSettings {
  format: 'jpeg' | 'png' | 'webp';
  quality: number; // 0-100
  targetWidth: number;
  targetHeight: number;
  aspectLocked: boolean;
  prefix: string;
  suffix: string;
  startIndex: number;
}

export interface AppSettings {
  enableCrop: boolean;
  enableSmartCrop: boolean;
  showRuleOfThirds: boolean;
  exportSettings: ExportSettings;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Utility type for crop calculation
export interface CropCalculation {
  baseWidth: number;
  baseHeight: number;
  cropWidth: number;
  cropHeight: number;
  cropX: number;
  cropY: number;
}

// Default values
export const DEFAULT_CROP_STATE: CropState = {
  centerX: 0.5,
  centerY: 0.5,
  scale: 1,
  aspect: 1,
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  format: 'jpeg',
  quality: 90,
  targetWidth: 1200,
  targetHeight: 800,
  aspectLocked: true,
  prefix: 'image-',
  suffix: '',
  startIndex: 1,
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  enableCrop: true,
  enableSmartCrop: true,
  showRuleOfThirds: true,
  exportSettings: DEFAULT_EXPORT_SETTINGS,
};
