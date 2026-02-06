import { useMemo, useRef, useEffect } from 'react';
import type { CropState } from '@/types/image';
import { calculateCrop } from '@/lib/cropMath';

interface CropOverlayProps {
  imageWidth: number;
  imageHeight: number;
  cropState: CropState;
  containerWidth: number;
  containerHeight: number;
  showRuleOfThirds?: boolean;
  interactive?: boolean;
}

export function CropOverlay({
  imageWidth,
  imageHeight,
  cropState,
  containerWidth,
  containerHeight,
  showRuleOfThirds = true,
  interactive = false,
}: CropOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate display scale
  const scale = useMemo(() => {
    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;
    return Math.min(scaleX, scaleY);
  }, [containerWidth, containerHeight, imageWidth, imageHeight]);

  // Calculate crop in display coordinates
  const displayCrop = useMemo(() => {
    const calc = calculateCrop(imageWidth, imageHeight, cropState);
    return {
      x: calc.cropX * scale,
      y: calc.cropY * scale,
      width: calc.cropWidth * scale,
      height: calc.cropHeight * scale,
    };
  }, [imageWidth, imageHeight, cropState, scale]);

  // Calculate image offset to center
  const imageOffset = useMemo(() => ({
    x: (containerWidth - imageWidth * scale) / 2,
    y: (containerHeight - imageHeight * scale) / 2,
  }), [containerWidth, containerHeight, imageWidth, imageHeight, scale]);

  // Draw overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Clear
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Calculate actual crop position
    const cropX = imageOffset.x + displayCrop.x;
    const cropY = imageOffset.y + displayCrop.y;
    const cropW = displayCrop.width;
    const cropH = displayCrop.height;

    // Draw semi-transparent overlay outside crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    
    // Top
    ctx.fillRect(0, 0, containerWidth, cropY);
    // Bottom
    ctx.fillRect(0, cropY + cropH, containerWidth, containerHeight - cropY - cropH);
    // Left
    ctx.fillRect(0, cropY, cropX, cropH);
    // Right
    ctx.fillRect(cropX + cropW, cropY, containerWidth - cropX - cropW, cropH);

    // Draw diagonal stripes pattern in overlay areas
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    
    const pattern = createStripesPattern(ctx);
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, containerWidth, containerHeight);
    }
    ctx.restore();

    // Draw crop border
    ctx.strokeStyle = 'hsl(199, 89%, 48%)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropW, cropH);

    // Draw rule of thirds if enabled
    if (showRuleOfThirds) {
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
      ctx.lineWidth = 1;

      // Vertical lines
      const thirdW = cropW / 3;
      ctx.beginPath();
      ctx.moveTo(cropX + thirdW, cropY);
      ctx.lineTo(cropX + thirdW, cropY + cropH);
      ctx.moveTo(cropX + thirdW * 2, cropY);
      ctx.lineTo(cropX + thirdW * 2, cropY + cropH);
      ctx.stroke();

      // Horizontal lines
      const thirdH = cropH / 3;
      ctx.beginPath();
      ctx.moveTo(cropX, cropY + thirdH);
      ctx.lineTo(cropX + cropW, cropY + thirdH);
      ctx.moveTo(cropX, cropY + thirdH * 2);
      ctx.lineTo(cropX + cropW, cropY + thirdH * 2);
      ctx.stroke();
    }

    // Draw corner handles if interactive
    if (interactive) {
      const handleSize = 10;
      ctx.fillStyle = 'hsl(199, 89%, 48%)';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;

      const handles = [
        { x: cropX, y: cropY }, // NW
        { x: cropX + cropW, y: cropY }, // NE
        { x: cropX, y: cropY + cropH }, // SW
        { x: cropX + cropW, y: cropY + cropH }, // SE
      ];

      handles.forEach(({ x, y }) => {
        ctx.beginPath();
        ctx.arc(x, y, handleSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }
  }, [containerWidth, containerHeight, displayCrop, imageOffset, showRuleOfThirds, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: containerWidth, height: containerHeight }}
    />
  );
}

function createStripesPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = 8;
  patternCanvas.height = 8;
  const patternCtx = patternCanvas.getContext('2d');
  if (!patternCtx) return null;

  patternCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  patternCtx.lineWidth = 1;
  patternCtx.beginPath();
  patternCtx.moveTo(0, 8);
  patternCtx.lineTo(8, 0);
  patternCtx.stroke();

  return ctx.createPattern(patternCanvas, 'repeat');
}
