import { useState, useRef, useEffect, useCallback, type MouseEvent, type TouchEvent, type WheelEvent, type KeyboardEvent } from 'react';
import { X, RotateCcw, Maximize2, Move, ZoomIn, ZoomOut, Check, Crosshair } from 'lucide-react';
import type { ImageFile, CropState } from '@/types/image';
import { useApp } from '@/context/AppContext';
import { useCropState } from '@/hooks/useCropState';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface CropEditorModalProps {
  image: ImageFile;
  onClose: () => void;
}

export function CropEditorModal({ image, onClose }: CropEditorModalProps) {
  const { updateCropState, state } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [localCropState, setLocalCropState] = useState<CropState>(image.cropState);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStartCenter, setCropStartCenter] = useState({ x: 0.5, y: 0.5 });

  const { displayCrop, maxScale, updateCenter, updateScale, reset, center, fit } = useCropState(
    localCropState,
    image.originalWidth,
    image.originalHeight
  );

  // Measure container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate display scale
  const displayScale = Math.min(
    containerSize.width / image.originalWidth,
    containerSize.height / image.originalHeight,
    1
  ) * 0.9; // 90% to add padding
  const displayImageWidth = image.originalWidth * displayScale;
  const displayImageHeight = image.originalHeight * displayScale;
  const imageOffsetX = (containerSize.width - displayImageWidth) / 2;
  const imageOffsetY = (containerSize.height - displayImageHeight) / 2;

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image.bitmap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = containerSize.width;
    canvas.height = containerSize.height;

    ctx.clearRect(0, 0, containerSize.width, containerSize.height);

    // Checkerboard background
    const checkerSize = 10;
    for (let x = 0; x < containerSize.width; x += checkerSize) {
      for (let y = 0; y < containerSize.height; y += checkerSize) {
        ctx.fillStyle = ((x + y) / checkerSize) % 2 === 0 ? '#1a1a2e' : '#16162a';
        ctx.fillRect(x, y, checkerSize, checkerSize);
      }
    }

    // Image
    ctx.drawImage(
      image.bitmap,
      imageOffsetX,
      imageOffsetY,
      displayImageWidth,
      displayImageHeight
    );

    // Overlay outside crop
    const cropX = imageOffsetX + displayCrop.x * displayScale;
    const cropY = imageOffsetY + displayCrop.y * displayScale;
    const cropW = displayCrop.width * displayScale;
    const cropH = displayCrop.height * displayScale;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    // Top
    ctx.fillRect(0, 0, containerSize.width, cropY);
    // Bottom
    ctx.fillRect(0, cropY + cropH, containerSize.width, containerSize.height - cropY - cropH);
    // Left
    ctx.fillRect(0, cropY, cropX, cropH);
    // Right
    ctx.fillRect(cropX + cropW, cropY, containerSize.width - cropX - cropW, cropH);

    // Crop border
    ctx.strokeStyle = 'hsl(199, 89%, 48%)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropW, cropH);

    // Rule of thirds
    if (state.settings.showRuleOfThirds) {
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
      ctx.lineWidth = 1;
      const thirdW = cropW / 3;
      const thirdH = cropH / 3;
      ctx.beginPath();
      ctx.moveTo(cropX + thirdW, cropY);
      ctx.lineTo(cropX + thirdW, cropY + cropH);
      ctx.moveTo(cropX + thirdW * 2, cropY);
      ctx.lineTo(cropX + thirdW * 2, cropY + cropH);
      ctx.moveTo(cropX, cropY + thirdH);
      ctx.lineTo(cropX + cropW, cropY + thirdH);
      ctx.moveTo(cropX, cropY + thirdH * 2);
      ctx.lineTo(cropX + cropW, cropY + thirdH * 2);
      ctx.stroke();
    }

    // Corner handles
    const handleSize = 12;
    ctx.fillStyle = 'hsl(199, 89%, 48%)';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    const corners = [
      { x: cropX, y: cropY },
      { x: cropX + cropW, y: cropY },
      { x: cropX, y: cropY + cropH },
      { x: cropX + cropW, y: cropY + cropH },
    ];
    corners.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.arc(x, y, handleSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Center crosshair
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cropX + cropW / 2, cropY);
    ctx.lineTo(cropX + cropW / 2, cropY + cropH);
    ctx.moveTo(cropX, cropY + cropH / 2);
    ctx.lineTo(cropX + cropW, cropY + cropH / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [containerSize, image.bitmap, displayCrop, displayScale, imageOffsetX, imageOffsetY, displayImageWidth, displayImageHeight, state.settings.showRuleOfThirds]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCropStartCenter({ x: localCropState.centerX, y: localCropState.centerY });
  }, [localCropState]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = (e.clientX - dragStart.x) / displayImageWidth;
    const deltaY = (e.clientY - dragStart.y) / displayImageHeight;
    const newState = updateCenter(
      cropStartCenter.x - deltaX,
      cropStartCenter.y - deltaY
    );
    setLocalCropState(newState);
  }, [isDragging, dragStart, cropStartCenter, displayImageWidth, displayImageHeight, updateCenter]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setCropStartCenter({ x: localCropState.centerX, y: localCropState.centerY });
    }
  }, [localCropState]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = (touch.clientX - dragStart.x) / displayImageWidth;
    const deltaY = (touch.clientY - dragStart.y) / displayImageHeight;
    const newState = updateCenter(
      cropStartCenter.x - deltaX,
      cropStartCenter.y - deltaY
    );
    setLocalCropState(newState);
  }, [isDragging, dragStart, cropStartCenter, displayImageWidth, displayImageHeight, updateCenter]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newScale = localCropState.scale * (1 + delta);
    const newState = updateScale(newScale);
    setLocalCropState(newState);
  }, [localCropState, updateScale]);

  // ✅ Dichiarata PRIMA, memoizzata e riutilizzata
  const handleApply = useCallback(() => {
    updateCropState(image.id, localCropState);
    onClose();
  }, [image.id, localCropState, updateCropState, onClose]);

  // Keyboard shortcuts (usa handleApply nelle deps)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const zoomStep = e.shiftKey ? 0.2 : 0.1;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        setLocalCropState(updateCenter(localCropState.centerX - step, localCropState.centerY));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setLocalCropState(updateCenter(localCropState.centerX + step, localCropState.centerY));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setLocalCropState(updateCenter(localCropState.centerX, localCropState.centerY - step));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setLocalCropState(updateCenter(localCropState.centerX, localCropState.centerY + step));
        break;
      case '+':
      case '=':
        e.preventDefault();
        setLocalCropState(updateScale(localCropState.scale + zoomStep));
        break;
      case '-':
        e.preventDefault();
        setLocalCropState(updateScale(localCropState.scale - zoomStep));
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        setLocalCropState(reset());
        break;
      case 'Enter':
        e.preventDefault();
        handleApply();
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [localCropState, updateCenter, updateScale, reset, handleApply, onClose]);

  const handleReset = () => {
    setLocalCropState(reset());
  };
  const handleCenter = () => {
    setLocalCropState(center());
  };
  const handleFit = () => {
    setLocalCropState(fit());
  };
  const handleZoomIn = () => {
    setLocalCropState(updateScale(localCropState.scale + 0.1));
  };
  const handleZoomOut = () => {
    setLocalCropState(updateScale(localCropState.scale - 0.1));
  };
  const handleSliderChange = (value: number[]) => {
    setLocalCropState(updateScale(value[0]));
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[1200px] h-[800px] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full" onKeyDown={handleKeyDown} tabIndex={0}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Edit Crop</h2>
              <span className="text-sm text-muted-foreground">{image.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Canvas area */}
          <div
            ref={containerRef}
            className="flex-1 editor-canvas-container cursor-move touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0"
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={handleCenter} className="gap-1.5">
                <Crosshair className="w-4 h-4" />
                Center
              </Button>
              <Button variant="outline" size="sm" onClick={handleFit} className="gap-1.5">
                <Maximize2 className="w-4 h-4" />
                Fit
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <div className="w-32">
                <Slider
                  value={[localCropState.scale]}
                  min={1}
                  max={maxScale}
                  step={0.01}
                  onValueChange={handleSliderChange}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-right">
                {Math.round(localCropState.scale * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleApply} className="gap-1.5">
                <Check className="w-4 h-4" />
                Apply
              </Button>
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="flex items-center justify-center gap-4 px-4 py-2 text-xs text-muted-foreground border-t border-border bg-surface-elevated">
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓←→</kbd> Move
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">+/−</kbd> Zoom
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">R</kbd> Reset
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> Apply
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> Cancel
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
