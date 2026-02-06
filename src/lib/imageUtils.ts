import type { CropRect, ExportSettings } from '@/types/image';

/**
 * Generate a unique ID for an image
 */
export function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a hash from file content for persistence
 */
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.slice(0, 1024 * 10).arrayBuffer(); // First 10KB
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Load an image file and normalize EXIF orientation
 */
export async function loadImageWithOrientation(file: File): Promise<{
  bitmap: ImageBitmap;
  width: number;
  height: number;
}> {
  // createImageBitmap with imageOrientation: 'flipY' doesn't work as expected
  // We'll use the canvas approach for EXIF normalization
  const url = URL.createObjectURL(file);
  
  try {
    const img = await loadImage(url);
    
    // Create bitmap with orientation normalization
    // Use 'from-image' to properly normalize EXIF orientation
    const bitmap = await createImageBitmap(img, {
      imageOrientation: 'from-image' as ImageOrientation,
    }).catch(() => createImageBitmap(img));

    return {
      bitmap,
      width: bitmap.width,
      height: bitmap.height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Load image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Generate thumbnail from image bitmap
 */
export async function generateThumbnail(
  bitmap: ImageBitmap,
  maxSize: number = 400
): Promise<string> {
  const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(bitmap, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.8);
}

/**
 * Crop and resize an image according to settings
 */
export async function processImage(
  bitmap: ImageBitmap,
  cropRect: CropRect,
  settings: ExportSettings
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = settings.targetWidth;
  canvas.height = settings.targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw the cropped region scaled to target size
  ctx.drawImage(
    bitmap,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    settings.targetWidth,
    settings.targetHeight
  );

  // Convert to blob
  const mimeType = `image/${settings.format}`;
  const quality = settings.quality / 100;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  index: number,
  settings: ExportSettings
): string {
  const actualIndex = settings.startIndex + index;
  const extension = settings.format === 'jpeg' ? 'jpg' : settings.format;
  return `${settings.prefix}${actualIndex}${settings.suffix}.${extension}`;
}

/**
 * Check if file is a valid image
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
  return validTypes.includes(file.type);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for smooth interactions
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
