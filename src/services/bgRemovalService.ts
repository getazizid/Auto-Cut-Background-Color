import { removeBackground } from '@imgly/background-removal';
import { BackgroundConfig, FitMode, SizePreset } from '../types';

/**
 * Calculates pixel dimensions based on unit and DPI
 */
export function calculatePixelDimensions(
  sizePreset: SizePreset,
  dpi: number = 300,
  originalWidth: number = 1000,
  originalHeight: number = 1000
): { width: number; height: number } {
  if (sizePreset.id === 'original_ratio' || (sizePreset.width === 0 && sizePreset.height === 0)) {
    return { width: originalWidth, height: originalHeight };
  }

  if (sizePreset.unit === 'px') {
    return {
      width: Math.round(sizePreset.width),
      height: Math.round(sizePreset.height),
    };
  }

  // Conversion rates to inches
  let widthInInches = 0;
  let heightInInches = 0;

  if (sizePreset.unit === 'cm') {
    widthInInches = sizePreset.width / 2.54;
    heightInInches = sizePreset.height / 2.54;
  } else if (sizePreset.unit === 'mm') {
    widthInInches = sizePreset.width / 25.4;
    heightInInches = sizePreset.height / 25.4;
  } else if (sizePreset.unit === 'inch') {
    widthInInches = sizePreset.width;
    heightInInches = sizePreset.height;
  }

  return {
    width: Math.max(10, Math.round(widthInInches * dpi)),
    height: Math.max(10, Math.round(heightInInches * dpi)),
  };
}

/**
 * Loads an image URL into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Gagal memuat gambar: ' + (e as Event).type));
    img.src = src;
  });
}

/**
 * Converts File to Base64 Data URL
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Fallback background removal using intelligent color/luminance edge segmentation
 * in case WebAssembly takes longer to download or fails in sandboxes.
 */
export async function fallbackRemoveBackground(imageSource: string | File | Blob): Promise<Blob> {
  const dataUrl = typeof imageSource === 'string' ? imageSource : await fileToDataUrl(imageSource);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Sample the 4 corners to detect dominant background colors
  const cornerIndices = [
    0, // top-left
    (w - 1) * 4, // top-right
    ((h - 1) * w) * 4, // bottom-left
    ((h - 1) * w + (w - 1)) * 4, // bottom-right
  ];

  const cornerColors = cornerIndices.map((idx) => ({
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
  }));

  // Helper to calculate color distance
  function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
    return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
  }

  // Create an elliptical mask focused on subject center (portrait bias)
  const centerX = w / 2;
  const centerY = h * 0.45;
  const radiusX = w * 0.42;
  const radiusY = h * 0.48;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Normalized distance from center
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);

      // Distance to corner background colors
      let minBgDist = 999;
      for (const corner of cornerColors) {
        const d = colorDistance(r, g, b, corner.r, corner.g, corner.b);
        if (d < minBgDist) minBgDist = d;
      }

      // If close to edge and matching corner color, make transparent
      if (distFromCenter > 0.75 && minBgDist < 45) {
        data[idx + 3] = 0;
      } else if (distFromCenter > 0.95 && minBgDist < 75) {
        const alphaFactor = Math.max(0, 1 - (distFromCenter - 0.95) / 0.15);
        data[idx + 3] = Math.round(data[idx + 3] * alphaFactor);
      } else if (minBgDist < 25 && y < h * 0.3) {
        data[idx + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/png');
  });
}

/**
 * Primary AI Background removal function
 */
export async function executeBackgroundRemoval(
  imageSource: string | File | Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    if (onProgress) onProgress(20);

    // Call @imgly/background-removal with public assets configuration
    const blob = await removeBackground(imageSource, {
      progress: (key, current, total) => {
        if (total > 0 && onProgress) {
          const ratio = Math.min(0.9, 0.2 + (current / total) * 0.7);
          onProgress(Math.round(ratio * 100));
        }
      },
      output: {
        format: 'image/png',
        quality: 0.95,
      },
    });

    if (onProgress) onProgress(95);
    const dataUrl = await fileToDataUrl(blob);
    if (onProgress) onProgress(100);
    return dataUrl;
  } catch (error) {
    console.warn('Neural network bg removal fallback triggered:', error);
    if (onProgress) onProgress(50);
    // Fallback to Canvas-based segmentation
    const fallbackBlob = await fallbackRemoveBackground(imageSource);
    const dataUrl = await fileToDataUrl(fallbackBlob);
    if (onProgress) onProgress(100);
    return dataUrl;
  }
}

/**
 * Composite the transparent subject onto the chosen background and size
 */
export async function renderCompositedPhoto({
  noBgImageUrl,
  background,
  sizePreset,
  dpi = 300,
  fitMode = 'auto-portrait',
  scale = 1.0,
  offsetX = 0,
  offsetY = 0,
  feathering = 0,
  brightness = 0,
  contrast = 0,
  exportFormat = 'image/jpeg',
  jpegQuality = 0.92,
}: {
  noBgImageUrl: string;
  background: BackgroundConfig;
  sizePreset: SizePreset;
  dpi?: number;
  fitMode?: FitMode;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  feathering?: number;
  brightness?: number;
  contrast?: number;
  exportFormat?: 'image/png' | 'image/jpeg' | 'image/webp';
  jpegQuality?: number;
}): Promise<string> {
  const subjectImg = await loadImage(noBgImageUrl);
  const srcW = subjectImg.naturalWidth || subjectImg.width;
  const srcH = subjectImg.naturalHeight || subjectImg.height;

  const targetDim = calculatePixelDimensions(sizePreset, dpi, srcW, srcH);
  const canvas = document.createElement('canvas');
  canvas.width = targetDim.width;
  canvas.height = targetDim.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context could not be created');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw Background
  if (background.type === 'transparent') {
    // If output is JPEG, fallback to white since JPEG doesn't support alpha
    if (exportFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  } else if (background.type === 'solid') {
    ctx.fillStyle = background.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (background.type === 'gradient') {
    const secColor = background.secondaryColor || '#000000';
    let gradient: CanvasGradient;

    if (background.gradientDirection === 'radial') {
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.45;
      const radius = Math.max(canvas.width, canvas.height) * 0.75;
      gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
      gradient.addColorStop(0, background.color);
      gradient.addColorStop(1, secColor);
    } else if (background.gradientDirection === 'to-right') {
      gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, background.color);
      gradient.addColorStop(1, secColor);
    } else if (background.gradientDirection === 'to-bottom-right') {
      gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, background.color);
      gradient.addColorStop(1, secColor);
    } else {
      // to-bottom default
      gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, background.color);
      gradient.addColorStop(1, secColor);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (background.type === 'custom-image' && background.customImageUri) {
    try {
      const bgImg = await loadImage(background.customImageUri);
      // Cover the canvas with the background image
      const bgAspect = bgImg.width / bgImg.height;
      const canvasAspect = canvas.width / canvas.height;
      let bgDrawW = canvas.width;
      let bgDrawH = canvas.height;
      let bgDrawX = 0;
      let bgDrawY = 0;

      if (bgAspect > canvasAspect) {
        bgDrawH = canvas.height;
        bgDrawW = canvas.height * bgAspect;
        bgDrawX = (canvas.width - bgDrawW) / 2;
      } else {
        bgDrawW = canvas.width;
        bgDrawH = canvas.width / bgAspect;
        bgDrawY = (canvas.height - bgDrawH) / 2;
      }
      ctx.drawImage(bgImg, bgDrawX, bgDrawY, bgDrawW, bgDrawH);
    } catch {
      ctx.fillStyle = background.color || '#db1514';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // 2. Calculate Subject Dimensions & Position
  let drawW = canvas.width;
  let drawH = canvas.height;
  let drawX = 0;
  let drawY = 0;

  const srcAspect = srcW / srcH;
  const canvasAspect = canvas.width / canvas.height;

  if (fitMode === 'original') {
    drawW = canvas.width;
    drawH = canvas.height;
    drawX = 0;
    drawY = 0;
  } else if (fitMode === 'contain') {
    if (srcAspect > canvasAspect) {
      drawW = canvas.width * 0.9;
      drawH = drawW / srcAspect;
      drawX = (canvas.width - drawW) / 2;
      drawY = (canvas.height - drawH) / 2;
    } else {
      drawH = canvas.height * 0.9;
      drawW = drawH * srcAspect;
      drawX = (canvas.width - drawW) / 2;
      drawY = (canvas.height - drawH) / 2;
    }
  } else if (fitMode === 'cover') {
    if (srcAspect > canvasAspect) {
      drawH = canvas.height;
      drawW = canvas.height * srcAspect;
      drawX = (canvas.width - drawW) / 2;
      drawY = 0;
    } else {
      drawW = canvas.width;
      drawH = canvas.width / srcAspect;
      drawX = 0;
      drawY = (canvas.height - drawH) / 2;
    }
  } else if (fitMode === 'auto-portrait') {
    // Standard Pas Foto / Portrait Rule: Head & shoulders fill ~75-85% height, positioned aligned towards bottom/center
    const baseHeight = canvas.height * 1.05;
    drawH = baseHeight;
    drawW = baseHeight * srcAspect;
    drawX = (canvas.width - drawW) / 2;
    drawY = canvas.height - drawH + canvas.height * 0.03; // Ground slightly towards bottom
  }

  // Apply user scale and user offsets
  const appliedScale = Math.max(0.2, scale);
  const finalW = drawW * appliedScale;
  const finalH = drawH * appliedScale;
  const finalX = drawX + (drawW - finalW) / 2 + (offsetX / 100) * canvas.width;
  const finalY = drawY + (drawH - finalH) / 2 + (offsetY / 100) * canvas.height;

  // 3. Draw subject with optional filters
  ctx.save();

  // Apply brightness & contrast filters
  if (brightness !== 0 || contrast !== 0) {
    const bVal = 100 + brightness;
    const cVal = 100 + contrast;
    ctx.filter = `brightness(${bVal}%) contrast(${cVal}%)`;
  }

  // Apply shadow or soft feathering if requested
  if (feathering > 0) {
    ctx.shadowBlur = feathering * 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  }

  ctx.drawImage(subjectImg, finalX, finalY, finalW, finalH);
  ctx.restore();

  // 4. Return as Data URL
  return canvas.toDataURL(exportFormat, exportFormat === 'image/jpeg' ? jpegQuality : undefined);
}

/**
 * Creates a batch zip file from processed images
 */
export async function createBatchZip(
  images: { name: string; dataUrl: string }[],
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const total = images.length;
  for (let i = 0; i < total; i++) {
    const item = images[i];
    // Strip header from dataUrl
    const base64Data = item.dataUrl.split(',')[1];
    zip.file(item.name, base64Data, { base64: true });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 100));
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}
