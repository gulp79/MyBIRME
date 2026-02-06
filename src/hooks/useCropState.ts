import { useMemo } from 'react';
import type { CropState, CropRect } from '@/types/image';
import { calculateCrop, getCropRect, getMaxScale, clampCropCenter } from '@/lib/cropMath';

interface UseCropStateResult {
  cropRect: CropRect;
  displayCrop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  maxScale: number;
  updateCenter: (centerX: number, centerY: number) => CropState;
  updateScale: (scale: number) => CropState;
  reset: () => CropState;
  center: () => CropState;
  fit: () => CropState;
}

export function useCropState(
  cropState: CropState,
  imageWidth: number,
  imageHeight: number
): UseCropStateResult {
  const calculation = useMemo(
    () => calculateCrop(imageWidth, imageHeight, cropState),
    [imageWidth, imageHeight, cropState]
  );

  const cropRect = useMemo(
    () => getCropRect(imageWidth, imageHeight, cropState),
    [imageWidth, imageHeight, cropState]
  );

  const maxScale = useMemo(
    () => getMaxScale(imageWidth, imageHeight, cropState.aspect),
    [imageWidth, imageHeight, cropState.aspect]
  );

  const displayCrop = useMemo(() => ({
    x: calculation.cropX,
    y: calculation.cropY,
    width: calculation.cropWidth,
    height: calculation.cropHeight,
  }), [calculation]);

  const updateCenter = (centerX: number, centerY: number): CropState => {
    const clamped = clampCropCenter(
      centerX,
      centerY,
      calculation.cropWidth,
      calculation.cropHeight,
      imageWidth,
      imageHeight
    );
    return { ...cropState, centerX: clamped.centerX, centerY: clamped.centerY };
  };

  const updateScale = (scale: number): CropState => {
    const clampedScale = Math.max(1, Math.min(maxScale, scale));
    return { ...cropState, scale: clampedScale };
  };

  const reset = (): CropState => ({
    ...cropState,
    centerX: 0.5,
    centerY: 0.5,
    scale: 1,
  });

  const center = (): CropState => ({
    ...cropState,
    centerX: 0.5,
    centerY: 0.5,
  });

  const fit = (): CropState => ({
    ...cropState,
    centerX: 0.5,
    centerY: 0.5,
    scale: 1,
  });

  return {
    cropRect,
    displayCrop,
    maxScale,
    updateCenter,
    updateScale,
    reset,
    center,
    fit,
  };
}
