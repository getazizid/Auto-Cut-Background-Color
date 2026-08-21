import { loadImage } from './bgRemovalService';

export interface PrintSheetItemConfig {
  dataUrl: string;
  count2x3: number;
  count3x4: number;
  count4x6: number;
}

export interface SheetOptions {
  paperSize: '4R' | 'A4';
  dpi: number;
  includeCutMarks: boolean;
  watermarkLabel?: string;
}

/**
 * Dimensions for paper in cm at 300 DPI
 * 4R: 10.2 x 15.2 cm (approx 4 x 6 inches) -> 1205 x 1795 px at 300 DPI
 * A4: 21.0 x 29.7 cm -> 2480 x 3508 px at 300 DPI
 */
export async function generatePrintSheet(
  items: PrintSheetItemConfig[],
  options: SheetOptions
): Promise<string> {
  const { paperSize, dpi = 300, includeCutMarks = true, watermarkLabel } = options;

  let sheetWidthCm = 10.2;
  let sheetHeightCm = 15.2;

  if (paperSize === 'A4') {
    sheetWidthCm = 21.0;
    sheetHeightCm = 29.7;
  }

  const pxPerCm = dpi / 2.54;
  const canvasWidth = Math.round(sheetWidthCm * pxPerCm);
  const canvasHeight = Math.round(sheetHeightCm * pxPerCm);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // Fill clean photo paper background (pure white)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Define dimensions for standard sizes in px
  const dim2x3 = { w: Math.round(2.16 * pxPerCm), h: Math.round(2.79 * pxPerCm), label: '2x3 cm' };
  const dim3x4 = { w: Math.round(2.79 * pxPerCm), h: Math.round(3.81 * pxPerCm), label: '3x4 cm' };
  const dim4x6 = { w: Math.round(3.81 * pxPerCm), h: Math.round(5.59 * pxPerCm), label: '4x6 cm' };

  // Prepare list of all individual photo cuts to place
  const photoCuts: { img: HTMLImageElement; w: number; h: number; label: string }[] = [];

  for (const item of items) {
    if (!item.dataUrl) continue;
    const img = await loadImage(item.dataUrl);

    for (let i = 0; i < item.count4x6; i++) {
      photoCuts.push({ img, w: dim4x6.w, h: dim4x6.h, label: dim4x6.label });
    }
    for (let i = 0; i < item.count3x4; i++) {
      photoCuts.push({ img, w: dim3x4.w, h: dim3x4.h, label: dim3x4.label });
    }
    for (let i = 0; i < item.count2x3; i++) {
      photoCuts.push({ img, w: dim2x3.w, h: dim2x3.h, label: dim2x3.label });
    }
  }

  // Pack items onto the canvas with margins and spacing
  const margin = Math.round(0.5 * pxPerCm); // 5mm paper edge margin
  const gap = Math.round(0.25 * pxPerCm); // 2.5mm spacing between photos

  let currentX = margin;
  let currentY = margin;
  let rowMaxH = 0;

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#d1d5db'; // Light guide line for cutting

  for (const cut of photoCuts) {
    // Check if item fits in current row
    if (currentX + cut.w > canvasWidth - margin) {
      // Move to next row
      currentX = margin;
      currentY += rowMaxH + gap;
      rowMaxH = 0;
    }

    // Check if item overflows the sheet height
    if (currentY + cut.h > canvasHeight - margin) {
      break; // Sheet full
    }

    // Draw the photo
    ctx.drawImage(cut.img, currentX, currentY, cut.w, cut.h);

    // Draw cutting marks/borders if enabled
    if (includeCutMarks) {
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(currentX - 0.5, currentY - 0.5, cut.w + 1, cut.h + 1);
      ctx.setLineDash([]); // Reset dash

      // Small corner tick marks
      const tick = 10;
      ctx.strokeStyle = '#9ca3af';
      // Top-left
      ctx.beginPath();
      ctx.moveTo(currentX - tick, currentY);
      ctx.lineTo(currentX, currentY);
      ctx.moveTo(currentX, currentY - tick);
      ctx.lineTo(currentX, currentY);
      // Top-right
      ctx.moveTo(currentX + cut.w, currentY - tick);
      ctx.lineTo(currentX + cut.w, currentY);
      ctx.lineTo(currentX + cut.w + tick, currentY);
      // Bottom-left
      ctx.moveTo(currentX - tick, currentY + cut.h);
      ctx.lineTo(currentX, currentY + cut.h);
      ctx.lineTo(currentX, currentY + cut.h + tick);
      // Bottom-right
      ctx.moveTo(currentX + cut.w + tick, currentY + cut.h);
      ctx.lineTo(currentX + cut.w, currentY + cut.h);
      ctx.lineTo(currentX + cut.w, currentY + cut.h + tick);
      ctx.stroke();
    }

    currentX += cut.w + gap;
    rowMaxH = Math.max(rowMaxH, cut.h);
  }

  // Header / Footer text on paper margin
  ctx.fillStyle = '#6b7280';
  ctx.font = `${Math.round(12 * (dpi / 300))}px sans-serif`;
  ctx.fillText(
    `AutoCut Studio Print Sheet • Ukuran Kertas: ${paperSize} (${sheetWidthCm}x${sheetHeightCm} cm @ ${dpi} DPI)`,
    margin,
    canvasHeight - Math.round(0.2 * pxPerCm)
  );

  if (watermarkLabel) {
    ctx.textAlign = 'right';
    ctx.fillText(watermarkLabel, canvasWidth - margin, canvasHeight - Math.round(0.2 * pxPerCm));
  }

  return canvas.toDataURL('image/jpeg', 0.98);
}
