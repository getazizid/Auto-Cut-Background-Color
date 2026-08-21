export type ProcessingStatus = 'idle' | 'processing' | 'done' | 'error';

export type BackgroundType = 'solid' | 'gradient' | 'transparent' | 'custom-image';

export interface BackgroundConfig {
  type: BackgroundType;
  color: string; // Hex, e.g. '#db1514'
  secondaryColor?: string; // For gradient
  gradientDirection?: 'to-bottom' | 'to-right' | 'to-bottom-right' | 'radial';
  customImageUri?: string;
}

export type DimensionUnit = 'cm' | 'mm' | 'inch' | 'px';

export type FitMode = 'cover' | 'contain' | 'auto-portrait' | 'original';

export interface SizePreset {
  id: string;
  name: string;
  nameEn: string;
  category: 'pasfoto' | 'passport' | 'social' | 'print' | 'custom';
  width: number;
  height: number;
  unit: DimensionUnit;
  description?: string;
  aspectRatioDisplay?: string;
}

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  originalDataUrl: string;
  maskDataUrl?: string;
  noBgDataUrl?: string;
  resultDataUrl?: string;
  status: ProcessingStatus;
  progress: number;
  error?: string;
  // Per-image customizations (overrides global if set)
  customBg?: BackgroundConfig;
  customSize?: SizePreset;
  customFitMode?: FitMode;
  scale: number; // 0.5 to 2.0
  offsetX: number; // -100 to 100
  offsetY: number; // -100 to 100
  feathering: number; // 0 to 10
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
}

export interface GlobalSettings {
  background: BackgroundConfig;
  sizePreset: SizePreset;
  dpi: number;
  fitMode: FitMode;
  exportFormat: 'image/png' | 'image/jpeg' | 'image/webp';
  jpegQuality: number; // 0.1 to 1.0
  autoProcessOnUpload: boolean;
  concurrency: number;
}

export interface PrintSheetItem {
  imageId: string;
  sizeType: '2x3' | '3x4' | '4x6' | 'custom';
  count: number;
}

export interface PrintSheetConfig {
  paperSize: '4R' | 'A4';
  dpi: number;
  includeCutMarks: boolean;
  paperBackground: string;
  items: PrintSheetItem[];
}
