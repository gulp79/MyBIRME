// Smart crop worker utilities
// Note: Due to browser limitations with workers and modules,
// we'll run smartcrop in the main thread but debounced

import smartcrop from 'smartcrop';

export interface SmartCropJob {
  imageId: string;
  imageData: ImageData;
  targetWidth: number;
  targetHeight: number;
}

export interface SmartCropJobResult {
  imageId: string;
  result: {
    x: number;
    y: number;
    width: number;
    height: number;
    score: number;
  } | null;
  error?: string;
}

// Cache for smartcrop results
const cropCache = new Map<string, SmartCropJobResult['result']>();

function getCacheKey(imageId: string, targetWidth: number, targetHeight: number): string {
  return `${imageId}_${targetWidth}_${targetHeight}`;
}

/**
 * Run smartcrop analysis on an image
 */
export async function analyzeImage(
  imageElement: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  targetWidth: number,
  targetHeight: number,
  imageId: string
): Promise<SmartCropJobResult['result']> {
  const cacheKey = getCacheKey(imageId, targetWidth, targetHeight);
  
  // Check cache first
  if (cropCache.has(cacheKey)) {
    return cropCache.get(cacheKey)!;
  }

  try {
    // For ImageBitmap, we need to draw to canvas first
    let source: HTMLImageElement | HTMLCanvasElement;
    
    if (imageElement instanceof ImageBitmap) {
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      ctx.drawImage(imageElement, 0, 0);
      source = canvas;
    } else {
      source = imageElement;
    }

    const result = await smartcrop.crop(source, {
      width: targetWidth,
      height: targetHeight,
      minScale: 0.5,
    });

    const topCrop = result.topCrop;
    const cropResult = {
      x: topCrop.x,
      y: topCrop.y,
      width: topCrop.width,
      height: topCrop.height,
      score: (topCrop as { score?: number }).score ?? 1,
    };

    // Cache the result
    cropCache.set(cacheKey, cropResult);

    return cropResult;
  } catch (error) {
    console.error('Smartcrop analysis failed:', error);
    return null;
  }
}

/**
 * Clear the cache for a specific image or all images
 */
export function clearSmartCropCache(imageId?: string): void {
  if (imageId) {
    // Clear all entries for this image
    for (const key of cropCache.keys()) {
      if (key.startsWith(imageId)) {
        cropCache.delete(key);
      }
    }
  } else {
    cropCache.clear();
  }
}

/**
 * Process multiple images with concurrency limit
 */
export async function batchAnalyze(
  jobs: Array<{
    imageId: string;
    bitmap: ImageBitmap;
    targetWidth: number;
    targetHeight: number;
  }>,
  concurrency: number = 2,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, SmartCropJobResult['result']>> {
  const results = new Map<string, SmartCropJobResult['result']>();
  let completed = 0;

  // Process in batches
  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    
    await Promise.all(
      batch.map(async (job) => {
        const result = await analyzeImage(
          job.bitmap,
          job.targetWidth,
          job.targetHeight,
          job.imageId
        );
        results.set(job.imageId, result);
        completed++;
        onProgress?.(completed, jobs.length);
      })
    );
  }

  return results;
}
