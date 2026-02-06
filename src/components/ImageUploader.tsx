import { useCallback, useState, type DragEvent } from 'react';
import { Upload, ImageIcon, FolderOpen } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';

export function ImageUploader() {
  const { addImages, state } = useApp();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await addImages(files);
      }
    },
    [addImages]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (files.length > 0) {
        await addImages(files);
      }
    };

    input.click();
  }, [addImages]);

  const handleFolderSelect = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;

    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (files.length > 0) {
        await addImages(files);
      }
    };

    input.click();
  }, [addImages]);

  return (
    <div
      className={`dropzone flex flex-col items-center justify-center p-8 transition-all duration-200 ${
        isDragOver ? 'dropzone-active' : ''
      } ${state.images.length === 0 ? 'min-h-[300px]' : 'min-h-[120px]'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className={`rounded-full p-4 bg-primary/10 ${isDragOver ? 'animate-pulse-glow' : ''}`}>
          {isDragOver ? (
            <Upload className="w-8 h-8 text-primary" />
          ) : (
            <ImageIcon className="w-8 h-8 text-primary" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {isDragOver ? 'Drop images here' : 'Drag & drop images'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            or click the buttons below to select files
          </p>
        </div>

        <div className="flex gap-3 mt-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleFileSelect}
            disabled={state.isProcessing}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Select Files
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFolderSelect}
            disabled={state.isProcessing}
            className="gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Select Folder
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Supports JPG, PNG, WebP, GIF • All processing is done locally
        </p>
      </div>
    </div>
  );
}
