import { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, Loader2, Sparkles } from 'lucide-react';
import type { ImageFile } from '@/types/image';
import { useApp } from '@/context/AppContext';
import { CropOverlay } from './CropOverlay';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/imageUtils';

interface ImageCardProps {
  image: ImageFile;
}

export function ImageCard({ image }: ImageCardProps) {
  const { removeImage, setEditingImage, state } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Measure container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="image-card group animate-fade-in">
      <div
        ref={containerRef}
        className="relative aspect-square overflow-hidden bg-surface-elevated"
      >
        {/* Thumbnail */}
        <img
          src={image.thumbnail}
          alt={image.name}
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />

        {/* Crop overlay */}
        {state.settings.enableCrop && dimensions.width > 0 && dimensions.height > 0 && (
          <CropOverlay
            imageWidth={image.originalWidth}
            imageHeight={image.originalHeight}
            cropState={image.cropState}
            containerWidth={dimensions.width}
            containerHeight={dimensions.height}
            showRuleOfThirds={state.settings.showRuleOfThirds}
          />
        )}

        {/* Processing indicator */}
        {(image.isProcessing || image.isSmartCropPending) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm">
                {image.isSmartCropPending ? 'Analyzing...' : 'Processing...'}
              </span>
            </div>
          </div>
        )}

        {/* Smart crop badge */}
        {image.smartCropResult && state.settings.enableSmartCrop && (
          <div className="absolute top-2 left-2">
            <div className="flex items-center gap-1 bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Smart
            </div>
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/30">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEditingImage(image.id)}
            className="gap-1.5 shadow-lg"
          >
            <Pencil className="w-4 h-4" />
            Edit Crop
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => removeImage(image.id)}
            className="shadow-lg"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info footer */}
      <div className="p-2 border-t border-border">
        <p className="text-sm font-medium truncate" title={image.name}>
          {image.name}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
          <span>
            {image.originalWidth} × {image.originalHeight}
          </span>
          <span>{formatFileSize(image.file.size)}</span>
        </div>
      </div>
    </div>
  );
}
