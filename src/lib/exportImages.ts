import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ImageFile, ExportSettings } from '@/types/image';
import { getCropRect } from './cropMath';
import { processImage, generateExportFilename } from './imageUtils';

/**
 * Export all images as a ZIP file
 */
export async function exportImages(
  images: ImageFile[],
  settings: ExportSettings,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (images.length === 0) {
    throw new Error('No images to export');
  }

  // Single image - download directly
  if (images.length === 1) {
    const image = images[0];
    if (!image.bitmap) throw new Error('Image not loaded');

    const cropRect = getCropRect(image.originalWidth, image.originalHeight, image.cropState);
    const blob = await processImage(image.bitmap, cropRect, settings);
    const filename = generateExportFilename(0, settings);
    
    saveAs(blob, filename);
    onProgress?.(1, 1);
    return;
  }

  // Multiple images - create ZIP
  const zip = new JSZip();

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    if (!image.bitmap) continue;

    const cropRect = getCropRect(image.originalWidth, image.originalHeight, image.cropState);
    const blob = await processImage(image.bitmap, cropRect, settings);
    const filename = generateExportFilename(i, settings);

    zip.file(filename, blob);
    onProgress?.(i + 1, images.length);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toISOString().slice(0, 10);
  saveAs(zipBlob, `mybirme-export-${timestamp}.zip`);
}

/**
 * Export a single image
 */
export async function exportSingleImage(
  image: ImageFile,
  settings: ExportSettings,
  index: number = 0
): Promise<void> {
  if (!image.bitmap) throw new Error('Image not loaded');

  const cropRect = getCropRect(image.originalWidth, image.originalHeight, image.cropState);
  const blob = await processImage(image.bitmap, cropRect, settings);
  const filename = generateExportFilename(index, settings);

  saveAs(blob, filename);
}
