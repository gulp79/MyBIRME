declare module 'smartcrop' {
  export interface CropResult {
    topCrop: Crop;
  }

  export interface Crop {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface CropOptions {
    width?: number;
    height?: number;
    minScale?: number;
    maxScale?: number;
    ruleOfThirds?: boolean;
    debug?: boolean;
  }

  export function crop(
    image: HTMLImageElement | HTMLCanvasElement,
    options: CropOptions
  ): Promise<CropResult>;

  const smartcrop: {
    crop: typeof crop;
  };

  export default smartcrop;
}
