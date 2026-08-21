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
 * Refines the alpha mask / foreground edges of a transparent PNG subject image:
 * - Hair Gap & Enclosed Background Cutout (cleans background between hair strands & loops)
 * - Color Decontamination / Foreground Inpainting on Hair Fringe (replaces white backdrop spill with pure hair RGB)
 * - Anti-Aliased Sub-Pixel Alpha Matting (remove.bg studio quality)
 * - 100% Solid Core Protection (white shirts, ties, teeth, skin remain fully intact)
 */
export function cleanAndDefringeEdges(
  canvas: HTMLCanvasElement,
  options: {
    erodeRadius?: number; // Inward contraction in pixels
    defringe?: boolean;   // Removes white backdrop halo
    sharpness?: number;   // 0 to 100% sharpness boost
    feather?: number;     // Soft feathering
  } = {}
) {
  const { erodeRadius = 0, defringe = true, sharpness = 75 } = options;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const numPixels = w * h;

  // 1. Capture original alpha & RGB
  const origAlpha = new Uint8Array(numPixels);
  for (let i = 0; i < numPixels; i++) {
    origAlpha[i] = data[i * 4 + 3];
  }

  // 2. Identify Background Pixels (External border AND enclosed hair gaps/holes)
  const isBg = new Uint8Array(numPixels);
  const bgQueue: number[] = [];

  for (let i = 0; i < numPixels; i++) {
    const a = origAlpha[i];
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const brightness = (r + g + b) / 3;

    // Faint alpha, transparent pixels, or white background spill in low-alpha hair gaps
    if (a < 35 || (a < 75 && brightness > 210)) {
      isBg[i] = 1;
      bgQueue.push(i);
    }
  }

  // Also flood fill from canvas borders with threshold < 85 to capture fuzzy outer backdrop
  for (let x = 0; x < w; x++) {
    const topIdx = x;
    const btmIdx = (h - 1) * w + x;
    if (origAlpha[topIdx] < 85 && !isBg[topIdx]) { isBg[topIdx] = 1; bgQueue.push(topIdx); }
    if (origAlpha[btmIdx] < 85 && !isBg[btmIdx]) { isBg[btmIdx] = 1; bgQueue.push(btmIdx); }
  }
  for (let y = 0; y < h; y++) {
    const leftIdx = y * w;
    const rightIdx = y * w + (w - 1);
    if (origAlpha[leftIdx] < 85 && !isBg[leftIdx]) { isBg[leftIdx] = 1; bgQueue.push(leftIdx); }
    if (origAlpha[rightIdx] < 85 && !isBg[rightIdx]) { isBg[rightIdx] = 1; bgQueue.push(rightIdx); }
  }

  // 3. Compute Euclidean Distance from Nearest Background (External or Hair Hole)
  const distToBg = new Float32Array(numPixels);
  distToBg.fill(999);
  const distQueue: number[] = [];

  for (let i = 0; i < numPixels; i++) {
    if (isBg[i] === 1) {
      distToBg[i] = 0;
      distQueue.push(i);
    }
  }

  let distHead = 0;
  while (distHead < distQueue.length) {
    const curr = distQueue[distHead++];
    const curDist = distToBg[curr];
    if (curDist >= 6) continue;

    const cx = curr % w;
    const cy = Math.floor(curr / w);

    for (let dy = -1; dy <= 1; dy++) {
      const ny = cy + dy;
      if (ny < 0 || ny >= h) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx;
        if (nx < 0 || nx >= w) continue;

        const nIdx = ny * w + nx;
        const step = (dx !== 0 && dy !== 0) ? 1.414 : 1.0;
        const newDist = curDist + step;

        if (newDist < distToBg[nIdx]) {
          distToBg[nIdx] = newDist;
          distQueue.push(nIdx);
        }
      }
    }
  }

  // 4. Identify Solid Core Foreground Pixels for Color Decontamination
  const nearestCorePixel = new Int32Array(numPixels);
  nearestCorePixel.fill(-1);
  const coreQueue: number[] = [];

  for (let i = 0; i < numPixels; i++) {
    // Solid subject core: far from background and high opacity
    if (isBg[i] === 0 && distToBg[i] >= 2.5 && origAlpha[i] >= 220) {
      nearestCorePixel[i] = i;
      coreQueue.push(i);
    }
  }

  // Fallback if no deep core (e.g. very thin strands)
  if (coreQueue.length === 0) {
    for (let i = 0; i < numPixels; i++) {
      if (isBg[i] === 0 && origAlpha[i] >= 180) {
        nearestCorePixel[i] = i;
        coreQueue.push(i);
      }
    }
  }

  // Propagate pure Core Foreground Color outwards into hair strands & border pixels
  let coreHead = 0;
  while (coreHead < coreQueue.length) {
    const curr = coreQueue[coreHead++];
    const srcCore = nearestCorePixel[curr];
    const cx = curr % w;
    const cy = Math.floor(curr / w);

    for (let dy = -1; dy <= 1; dy++) {
      const ny = cy + dy;
      if (ny < 0 || ny >= h) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx;
        if (nx < 0 || nx >= w) continue;

        const nIdx = ny * w + nx;
        if (nearestCorePixel[nIdx] === -1 && distToBg[nIdx] < 4.0) {
          nearestCorePixel[nIdx] = srcCore;
          coreQueue.push(nIdx);
        }
      }
    }
  }

  // 5. Inpaint pure subject/hair RGB into semi-transparent border & hair gap pixels
  if (defringe) {
    for (let i = 0; i < numPixels; i++) {
      if (isBg[i] === 0 && distToBg[i] < 3.5) {
        const coreSrc = nearestCorePixel[i];
        if (coreSrc !== -1 && coreSrc !== i) {
          const coreR = data[coreSrc * 4];
          const coreG = data[coreSrc * 4 + 1];
          const coreB = data[coreSrc * 4 + 2];

          // Check if pixel is contaminated with light/white background
          const curR = data[i * 4];
          const curG = data[i * 4 + 1];
          const curB = data[i * 4 + 2];
          const curBrightness = (curR + curG + curB) / 3;
          const coreBrightness = (coreR + coreG + coreB) / 3;

          // If pixel was contaminated by brighter background, replace with pure hair/subject color
          if (curBrightness > coreBrightness + 15 || origAlpha[i] < 200) {
            data[i * 4] = coreR;
            data[i * 4 + 1] = coreG;
            data[i * 4 + 2] = coreB;
          }
        }
      }
    }
  }

  // 6. Studio-Grade Alpha Matting for Hair and Body
  const effectiveErode = Math.max(0.4, erodeRadius);
  for (let i = 0; i < numPixels; i++) {
    if (isBg[i] === 1) {
      data[i * 4 + 3] = 0;
      continue;
    }

    const dist = distToBg[i];
    const rawA = origAlpha[i];

    if (dist < effectiveErode) {
      // Outermost background spill layer
      data[i * 4 + 3] = 0;
    } else if (dist >= 3.0 && rawA >= 220) {
      // 100% Solid internal subject (clothes, skin, face, teeth, thick hair)
      data[i * 4 + 3] = 255;
    } else {
      // Hair strand / edge transition zone: Smooth anti-aliased alpha
      const t = Math.min(1.0, Math.max(0, (dist - effectiveErode) / 1.5));
      const distAlpha = t * t * (3 - 2 * t); // smoothstep
      const rawAlphaNorm = Math.min(1.0, Math.max(0, (rawA - 30) / 195));

      // Combine distance confidence with raw hair strand density
      const blendedNorm = distAlpha * 0.4 + rawAlphaNorm * 0.6;
      
      // Sigmoid sharpness contrast curve
      const steepFactor = 3.0 + (sharpness / 100) * 8.0;
      const sharpNorm = 1 / (1 + Math.exp(-steepFactor * (blendedNorm - 0.42)));
      
      let finalA = Math.round(sharpNorm * 255);
      if (finalA > 225) finalA = 255;
      if (finalA < 18) finalA = 0;

      data[i * 4 + 3] = Math.min(255, Math.max(0, finalA));
    }
  }

  // 7. Edge Unsharp Masking on Outer Contour & Hair Outlines
  if (sharpness > 20) {
    const sharpWeight = Math.min(0.6, (sharpness / 100) * 0.5);
    const copyData = new Uint8ClampedArray(data);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        const a = copyData[idx + 3];

        if (a >= 70 && a <= 250) {
          for (let c = 0; c < 3; c++) {
            const center = copyData[idx + c];
            const top = copyData[((y - 1) * w + x) * 4 + c];
            const btm = copyData[((y + 1) * w + x) * 4 + c];
            const lft = copyData[(y * w + (x - 1)) * 4 + c];
            const rgt = copyData[(y * w + (x + 1)) * 4 + c];

            const laplacian = 4 * center - top - btm - lft - rgt;
            const sharpenedVal = center + sharpWeight * laplacian;
            data[idx + c] = Math.min(255, Math.max(0, Math.round(sharpenedVal)));
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Post-processes a transparent PNG dataURL to eliminate white fringes & smooth borders
 */
export async function refineSubjectEdges(
  dataUrl: string,
  erodeRadius: number = 0,
  defringe: boolean = true,
  sharpness: number = 75
): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0);
  cleanAndDefringeEdges(canvas, { erodeRadius, defringe, sharpness });

  return canvas.toDataURL('image/png');
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
          const ratio = Math.min(0.85, 0.2 + (current / total) * 0.65);
          onProgress(Math.round(ratio * 100));
        }
      },
      output: {
        format: 'image/png',
        quality: 0.98,
      },
    });

    if (onProgress) onProgress(90);
    const rawDataUrl = await fileToDataUrl(blob);
    
    // Auto-clean, sharpen & Defringe edges to eliminate white fringes/halos completely without cutting interior details
    const refinedDataUrl = await refineSubjectEdges(rawDataUrl, 0, true, 75);

    if (onProgress) onProgress(100);
    return refinedDataUrl;
  } catch (error) {
    console.warn('Neural network bg removal fallback triggered:', error);
    if (onProgress) onProgress(50);
    // Fallback to Canvas-based segmentation
    const fallbackBlob = await fallbackRemoveBackground(imageSource);
    const rawDataUrl = await fileToDataUrl(fallbackBlob);
    const refinedDataUrl = await refineSubjectEdges(rawDataUrl, 0, true, 75);
    if (onProgress) onProgress(100);
    return refinedDataUrl;
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
  edgeDefringe = true,
  edgeErode = 0,
  edgeSharpness = 75,
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
  edgeDefringe?: boolean;
  edgeErode?: number;
  edgeSharpness?: number;
  exportFormat?: 'image/png' | 'image/jpeg' | 'image/webp';
  jpegQuality?: number;
}): Promise<string> {
  // If user requested custom edge contraction (erode), sharpness, or defringe toggling in detail modal
  let processedSubjectUrl = noBgImageUrl;
  if (edgeErode > 0 || edgeSharpness !== 75 || !edgeDefringe) {
    processedSubjectUrl = await refineSubjectEdges(noBgImageUrl, edgeErode, edgeDefringe, edgeSharpness);
  }

  const subjectImg = await loadImage(processedSubjectUrl);
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
