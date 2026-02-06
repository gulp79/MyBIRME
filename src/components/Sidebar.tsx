import { useState } from 'react';
import {
  Settings2,
  Download,
  Trash2,
  Link,
  Sparkles,
  RefreshCw,
  Copy,
  Grid3X3,
  Crop,
  Image as ImageIcon,
  FileImage,
  Loader2,
  Unlink,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAspectRatio } from '@/hooks/useAspectRatio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { exportImages } from '@/lib/exportImages';
import { toast } from 'sonner';

export function Sidebar() {
  const {
    state,
    updateSettings,
    updateExportSettings,
    clearImages,
    applyCropToAll,
    recomputeSmartCrop,
  } = useApp();
  const { width, height, aspectLocked, setWidth, setHeight, toggleAspectLock } = useAspectRatio();
  const [isExporting, setIsExporting] = useState(false);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setWidth(value);
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setHeight(value);
    }
  };

  const handleExport = async () => {
    if (state.images.length === 0) {
      toast.error('No images to export');
      return;
    }

    setIsExporting(true);
    try {
      await exportImages(state.images, state.settings.exportSettings);
      toast.success(`Exported ${state.images.length} images`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleApplyToAll = () => {
    if (state.images.length === 0) return;
    const firstImage = state.images[0];
    applyCropToAll(firstImage.cropState);
    toast.success('Applied crop to all images');
  };

  const handleRecomputeSmartCrop = async () => {
    if (state.images.length === 0) return;
    await recomputeSmartCrop();
    toast.success('Recomputed smart crop for all images');
  };

  const handleClearWorkspace = () => {
    if (state.images.length === 0) return;
    clearImages();
    toast.success('Workspace cleared');
  };

  const aspectPresets = [
    { label: '1:1 Square', value: 1 },
    { label: '4:3 Standard', value: 4 / 3 },
    { label: '3:2 Classic', value: 3 / 2 },
    { label: '16:9 Widescreen', value: 16 / 9 },
    { label: '9:16 Portrait', value: 9 / 16 },
    { label: '21:9 Ultrawide', value: 21 / 9 },
  ];

  return (
    <aside className="w-72 bg-sidebar border-l border-sidebar-border flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="sidebar-section flex items-center gap-2">
        <Settings2 className="w-5 h-5 text-sidebar-primary" />
        <h2 className="font-semibold">Settings</h2>
      </div>

      {/* Dimensions */}
      <div className="sidebar-section">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Output Size
        </h3>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="width" className="text-xs text-muted-foreground">
              Width
            </Label>
            <Input
              id="width"
              type="number"
              value={width}
              onChange={handleWidthChange}
              className="h-9 mt-1"
              min={1}
            />
          </div>

          <Button
            variant={aspectLocked ? 'default' : 'outline'}
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={toggleAspectLock}
            title={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          >
            {aspectLocked ? (
              <Link className="w-4 h-4" />
            ) : (
              <Unlink className="w-4 h-4" />
            )}
          </Button>

          <div className="flex-1">
            <Label htmlFor="height" className="text-xs text-muted-foreground">
              Height
            </Label>
            <Input
              id="height"
              type="number"
              value={height}
              onChange={handleHeightChange}
              className="h-9 mt-1"
              min={1}
            />
          </div>
        </div>

        {/* Aspect presets */}
        <div className="mt-3">
          <Label className="text-xs text-muted-foreground">Presets</Label>
          <Select
            value=""
            onValueChange={(value) => {
              const preset = aspectPresets.find((p) => p.value.toString() === value);
              if (preset) {
                const newHeight = Math.round(width / preset.value);
                updateExportSettings({ targetHeight: newHeight });
              }
            }}
          >
            <SelectTrigger className="h-9 mt-1">
              <SelectValue placeholder="Choose aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              {aspectPresets.map((preset) => (
                <SelectItem key={preset.label} value={preset.value.toString()}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Crop Settings */}
      <div className="sidebar-section">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Crop className="w-4 h-4" />
          Crop Settings
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-crop" className="text-sm cursor-pointer">
              Enable crop overlay
            </Label>
            <Switch
              id="enable-crop"
              checked={state.settings.enableCrop}
              onCheckedChange={(checked) => updateSettings({ enableCrop: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="rule-of-thirds" className="text-sm cursor-pointer">
              Show rule of thirds
            </Label>
            <Switch
              id="rule-of-thirds"
              checked={state.settings.showRuleOfThirds}
              onCheckedChange={(checked) => updateSettings({ showRuleOfThirds: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="smart-crop" className="text-sm cursor-pointer flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Auto focal detection
            </Label>
            <Switch
              id="smart-crop"
              checked={state.settings.enableSmartCrop}
              onCheckedChange={(checked) => updateSettings({ enableSmartCrop: checked })}
            />
          </div>

          {state.settings.enableSmartCrop && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleRecomputeSmartCrop}
              disabled={state.images.length === 0}
            >
              <RefreshCw className="w-4 h-4" />
              Recompute all
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={handleApplyToAll}
            disabled={state.images.length < 2}
          >
            <Copy className="w-4 h-4" />
            Copy crop to all
          </Button>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Export Settings */}
      <div className="sidebar-section">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <FileImage className="w-4 h-4" />
          Export Settings
        </h3>

        <div className="space-y-3">
          <div>
            <Label htmlFor="format" className="text-xs text-muted-foreground">
              Format
            </Label>
            <Select
              value={state.settings.exportSettings.format}
              onValueChange={(value: 'jpeg' | 'png' | 'webp') =>
                updateExportSettings({ format: value })
              }
            >
              <SelectTrigger className="h-9 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state.settings.exportSettings.format !== 'png' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs text-muted-foreground">Quality</Label>
                <span className="text-xs text-muted-foreground">
                  {state.settings.exportSettings.quality}%
                </span>
              </div>
              <Slider
                value={[state.settings.exportSettings.quality]}
                min={10}
                max={100}
                step={5}
                onValueChange={(value) => updateExportSettings({ quality: value[0] })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="prefix" className="text-xs text-muted-foreground">
                Prefix
              </Label>
              <Input
                id="prefix"
                value={state.settings.exportSettings.prefix}
                onChange={(e) => updateExportSettings({ prefix: e.target.value })}
                className="h-9 mt-1"
                placeholder="image-"
              />
            </div>
            <div>
              <Label htmlFor="start-index" className="text-xs text-muted-foreground">
                Start #
              </Label>
              <Input
                id="start-index"
                type="number"
                value={state.settings.exportSettings.startIndex}
                onChange={(e) =>
                  updateExportSettings({ startIndex: parseInt(e.target.value, 10) || 1 })
                }
                className="h-9 mt-1"
                min={0}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Actions */}
      <div className="sidebar-section mt-auto">
        <div className="space-y-2">
          <Button
            className="w-full gap-2 btn-glow"
            onClick={handleExport}
            disabled={state.images.length === 0 || isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Exporting...' : `Download All (${state.images.length})`}
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2 text-destructive hover:text-destructive"
            onClick={handleClearWorkspace}
            disabled={state.images.length === 0}
          >
            <Trash2 className="w-4 h-4" />
            Clear Workspace
          </Button>
        </div>
      </div>

      {/* Stats */}
      {state.images.length > 0 && (
        <div className="sidebar-section border-t border-sidebar-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Grid3X3 className="w-3.5 h-3.5" />
              {state.images.length} images
            </span>
            <span>
              {width} × {height}px
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
