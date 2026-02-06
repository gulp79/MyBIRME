import type { CropState, CropRect, CropCalculation } from '@/types/image';

/**
 * Calculate the crop dimensions and position based on CropState
 * 
 * At scale = 1 (fit):
 * - If target aspect >= image aspect: baseW = imageWidth, baseH = imageWidth / targetAspect
 * - Else: baseH = imageHeight, baseW = imageHeight * targetAspect
 * 
 * With zoom: cropW = baseW / scale, cropH = baseH / scale
 */
export function calculateCrop(
  imageWidth: number,
  imageHeight: number,
  cropState: CropState
): CropCalculation {
  const { centerX, centerY, scale, aspect } = cropState;
  const imageAspect = imageWidth / imageHeight;

  let baseWidth: number;
  let baseHeight: number;

  if (aspect >= imageAspect) {
    // Target is wider than image - fit to width
    baseWidth = imageWidth;
    baseHeight = imageWidth / aspect;
  } else {
    // Target is taller than image - fit to height
    baseHeight = imageHeight;
    baseWidth = imageHeight * aspect;
  }

  // Apply zoom
  const cropWidth = baseWidth / scale;
  const cropHeight = baseHeight / scale;

  // Calculate top-left position from center
  let cropX = centerX * imageWidth - cropWidth / 2;
  let cropY = centerY * imageHeight - cropHeight / 2;

  // Clamp to image bounds
  cropX = Math.max(0, Math.min(imageWidth - cropWidth, cropX));
  cropY = Math.max(0, Math.min(imageHeight - cropHeight, cropY));

  return {
    baseWidth,
    baseHeight,
    cropWidth,
    cropHeight,
    cropX,
    cropY,
  };
}

/**
 * Get the actual crop rectangle in source image pixels
 */
export function getCropRect(
  imageWidth: number,
  imageHeight: number,
  cropState: CropState
): CropRect {
  const calc = calculateCrop(imageWidth, imageHeight, cropState);
  return {
    x: Math.round(calc.cropX),
    y: Math.round(calc.cropY),
    width: Math.round(calc.cropWidth),
    height: Math.round(calc.cropHeight),
  };
}

/**
 * Convert smartcrop result to CropState
 */
export function smartCropToCropState(
  smartCrop: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
  targetAspect: number
): CropState {
  // Center of the smartcrop region (normalized)
  const centerX = (smartCrop.x + smartCrop.width / 2) / imageWidth;
  const centerY = (smartCrop.y + smartCrop.height / 2) / imageHeight;

  // Calculate scale based on how much we need to zoom to fit the smartcrop
  const imageAspect = imageWidth / imageHeight;
  let baseWidth: number;
  let baseHeight: number;

  if (targetAspect >= imageAspect) {
    baseWidth = imageWidth;
    baseHeight = imageWidth / targetAspect;
  } else {
    baseHeight = imageHeight;
    baseWidth = imageHeight * targetAspect;
  }

  // Scale is how much the base is divided to get the smartcrop size
  // We want to fit the smartcrop region, so scale = base / smartcropSize
  const scaleX = baseWidth / smartCrop.width;
  const scaleY = baseHeight / smartCrop.height;
  
  // Use the smaller scale to ensure the crop fits within the smartcrop suggestion
  let scale = Math.min(scaleX, scaleY);
  
  // Clamp scale to reasonable bounds
  scale = Math.max(1, Math.min(scale, 5));

  return {
    centerX,
    centerY,
    scale,
    aspect: targetAspect,
  };
}

/**
 * Clamp center position to keep crop within image bounds
 */
export function clampCropCenter(
  centerX: number,
  centerY: number,
  cropWidth: number,
  cropHeight: number,
  imageWidth: number,
  imageHeight: number
): { centerX: number; centerY: number } {
  const minCenterX = (cropWidth / 2) / imageWidth;
  const maxCenterX = 1 - minCenterX;
  const minCenterY = (cropHeight / 2) / imageHeight;
  const maxCenterY = 1 - minCenterY;

  return {
    centerX: Math.max(minCenterX, Math.min(maxCenterX, centerX)),
    centerY: Math.max(minCenterY, Math.min(maxCenterY, centerY)),
  };
}

/**
 * Calculate max scale allowed to keep crop within image
 */
export function getMaxScale(
  imageWidth: number,
  imageHeight: number,
  aspect: number
): number {
  const imageAspect = imageWidth / imageHeight;
  
  let baseWidth: number;
  let baseHeight: number;

  if (aspect >= imageAspect) {
    baseWidth = imageWidth;
    baseHeight = imageWidth / aspect;
  } else {
    baseHeight = imageHeight;
    baseWidth = imageHeight * aspect;
  }

  // Max scale is when crop equals the smaller dimension
  const maxScaleX = baseWidth / 50; // Min 50px crop
  const maxScaleY = baseHeight / 50;

  return Math.min(maxScaleX, maxScaleY, 10); // Cap at 10x
}

/**
 * Apply framing (center/scale) from one image to another
 * Adapts to different native sizes while preserving relative positioning
 */
export function applyFramingToImage(
  sourceCropState: CropState,
  targetImageWidth: number,
  targetImageHeight: number,
  targetAspect: number
): CropState {
  // Keep the same relative center and scale
  return {
    centerX: sourceCropState.centerX,
    centerY: sourceCropState.centerY,
    scale: sourceCropState.scale,
    aspect: targetAspect,
  };
}
