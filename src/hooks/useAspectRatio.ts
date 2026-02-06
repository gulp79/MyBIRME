import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';

export function useAspectRatio() {
  const { state, updateExportSettings } = useApp();
  const { targetWidth, targetHeight, aspectLocked } = state.settings.exportSettings;

  const aspect = useMemo(() => targetWidth / targetHeight, [targetWidth, targetHeight]);

  const setWidth = (width: number) => {
    if (aspectLocked) {
      const newHeight = Math.round(width / aspect);
      updateExportSettings({ targetWidth: width, targetHeight: newHeight });
    } else {
      updateExportSettings({ targetWidth: width });
    }
  };

  const setHeight = (height: number) => {
    if (aspectLocked) {
      const newWidth = Math.round(height * aspect);
      updateExportSettings({ targetWidth: newWidth, targetHeight: height });
    } else {
      updateExportSettings({ targetHeight: height });
    }
  };

  const setAspect = (newAspect: number) => {
    const newHeight = Math.round(targetWidth / newAspect);
    updateExportSettings({ targetHeight: newHeight });
  };

  const toggleAspectLock = () => {
    updateExportSettings({ aspectLocked: !aspectLocked });
  };

  return {
    width: targetWidth,
    height: targetHeight,
    aspect,
    aspectLocked,
    setWidth,
    setHeight,
    setAspect,
    toggleAspectLock,
  };
}
