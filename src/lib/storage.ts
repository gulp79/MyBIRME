import type { CropState, AppSettings, DEFAULT_APP_SETTINGS } from '@/types/image';

const STORAGE_PREFIX = 'mybirme_';
const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;
const CROPS_KEY = `${STORAGE_PREFIX}crops`;

/**
 * Save app settings to localStorage
 */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Load app settings from localStorage
 */
export function loadSettings(): AppSettings | null {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return null;
}

/**
 * Save crop states to localStorage
 */
export function saveCropStates(crops: Record<string, CropState>): void {
  try {
    localStorage.setItem(CROPS_KEY, JSON.stringify(crops));
  } catch (error) {
    console.error('Failed to save crop states:', error);
  }
}

/**
 * Load crop states from localStorage
 */
export function loadCropStates(): Record<string, CropState> | null {
  try {
    const stored = localStorage.getItem(CROPS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load crop states:', error);
  }
  return null;
}

/**
 * Clear all stored data
 */
export function clearStorage(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(CROPS_KEY);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}

/**
 * Get stored crop state by source hash
 */
export function getCropStateByHash(hash: string): CropState | null {
  const crops = loadCropStates();
  if (crops && crops[hash]) {
    return crops[hash];
  }
  return null;
}

/**
 * Update crop state by source hash
 */
export function updateCropState(hash: string, cropState: CropState): void {
  const crops = loadCropStates() || {};
  crops[hash] = cropState;
  saveCropStates(crops);
}
