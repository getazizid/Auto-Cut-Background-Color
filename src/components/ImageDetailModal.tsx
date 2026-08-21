import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  RotateCw,
  Sparkles,
  Sliders,
  ZoomIn,
  Move,
  Sun,
  Palette,
  Crop,
  Check,
  SplitSquareVertical,
} from 'lucide-react';
import { ImageItem, BackgroundConfig, SizePreset, FitMode } from '../types';
import { ColorPalettePicker } from './ColorPalettePicker';
import { SizeSelector } from './SizeSelector';
import { renderCompositedPhoto } from '../services/bgRemovalService';

interface ImageDetailModalProps {
  item: ImageItem;
  onClose: () => void;
  onUpdateItem: (updated: ImageItem) => void;
  onReprocess: (id: string) => void;
  onDownloadSingle: (item: ImageItem) => void;
  lang: 'id' | 'en';
}

export const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  item,
  onClose,
  onUpdateItem,
  onReprocess,
  onDownloadSingle,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'color' | 'size' | 'adjust'>('color');
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100% for before/after comparison
  const [previewUrl, setPreviewUrl] = useState<string>(item.resultDataUrl || item.originalDataUrl);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Local state for instant live changes
  const [customBg, setCustomBg] = useState<BackgroundConfig>(item.customBg || { type: 'solid', color: '#db1514' });
  const [customSize, setCustomSize] = useState<SizePreset>(item.customSize || {
    id: 'pasfoto_3x4',
    name: 'Pas Foto 3x4 cm',
    nameEn: 'Passport 3x4 cm',
    category: 'pasfoto',
    width: 2.79,
    height: 3.81,
    unit: 'cm',
  });
  const [fitMode, setFitMode] = useState<FitMode>(item.customFitMode || 'auto-portrait');
  const [scale, setScale] = useState<number>(item.scale || 1.0);
  const [offsetX, setOffsetX] = useState<number>(item.offsetX || 0);
  const [offsetY, setOffsetY] = useState<number>(item.offsetY || 0);
  const [feathering, setFeathering] = useState<number>(item.feathering || 0);
  const [brightness, setBrightness] = useState<number>(item.brightness || 0);
  const [contrast, setContrast] = useState<number>(item.contrast || 0);
  const [edgeDefringe, setEdgeDefringe] = useState<boolean>(item.edgeDefringe ?? true);
  const [edgeErode, setEdgeErode] = useState<number>(item.edgeErode ?? 0);
  const [edgeSharpness, setEdgeSharpness] = useState<number>(item.edgeSharpness ?? 85);

  // Trigger live re-rendering when sliders or background changes
  useEffect(() => {
    let isCancelled = false;
    const reRender = async () => {
      if (!item.noBgDataUrl) return;
      setIsUpdating(true);
      try {
        const url = await renderCompositedPhoto({
          noBgImageUrl: item.noBgDataUrl,
          background: customBg,
          sizePreset: customSize,
          fitMode: fitMode,
          scale,
          offsetX,
          offsetY,
          feathering,
          brightness,
          contrast,
          edgeDefringe,
          edgeErode,
          edgeSharpness,
          exportFormat: 'image/png',
        });
        if (!isCancelled) {
          setPreviewUrl(url);
          onUpdateItem({
            ...item,
            customBg,
            customSize,
            customFitMode: fitMode,
            scale,
            offsetX,
            offsetY,
            feathering,
            brightness,
            contrast,
            edgeDefringe,
            edgeErode,
            edgeSharpness,
            resultDataUrl: url,
          });
        }
      } catch (err) {
        console.error('Error re-rendering detail photo:', err);
      } finally {
        if (!isCancelled) setIsUpdating(false);
      }
    };

    reRender();
    return () => {
      isCancelled = true;
    };
  }, [customBg, customSize, fitMode, scale, offsetX, offsetY, feathering, brightness, contrast, edgeDefringe, edgeErode, edgeSharpness, item.noBgDataUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 truncate max-w-sm sm:max-w-md">
                {item.name}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'id' ? 'Sesuaikan warna, posisi objek, dan ukuran khusus' : 'Fine-tune color, placement & dimensions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownloadSingle({ ...item, resultDataUrl: previewUrl })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Unduh Foto' : 'Download'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left Canvas Preview: Interactive Before/After Split Viewer */}
          <div className="lg:col-span-7 bg-slate-900 p-6 flex flex-col items-center justify-center relative select-none overflow-hidden">
            <div className="relative max-w-md w-full aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
              {/* After Layer (AI Result + New Color) */}
              <img
                src={previewUrl}
                alt="After Preview"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* Before Layer (Original Photo) clipped by slider */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img
                  src={item.originalDataUrl}
                  alt="Before Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              {/* Split Line Divider */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-lg flex items-center justify-center border-2 border-slate-900">
                  <SplitSquareVertical className="w-4 h-4" />
                </div>
              </div>

              {/* Slider Input overlay */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                title={lang === 'id' ? 'Geser untuk membandingkan Sebelum & Sesudah' : 'Slide to compare Before & After'}
              />

              {/* Labels */}
              <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-md pointer-events-none z-10">
                {lang === 'id' ? 'Foto Asli' : 'Original'}
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-red-600/90 backdrop-blur-xs text-white text-[10px] font-bold rounded-md pointer-events-none z-10">
                {lang === 'id' ? 'Hasil AI' : 'AI Cutout'}
              </div>
            </div>

            {/* Slider Hint */}
            <p className="text-[11px] text-slate-400 mt-3 text-center">
              {lang === 'id'
                ? 'Geser ke kiri / kanan pada foto untuk melihat perbandingan Sebelum & Sesudah'
                : 'Drag slider left / right to compare Before vs After'}
            </p>
          </div>

          {/* Right Controls Panel */}
          <div className="lg:col-span-5 p-6 bg-white overflow-y-auto space-y-5 border-t lg:border-t-0 lg:border-l border-slate-200">
            {/* Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              {[
                { id: 'color', label: lang === 'id' ? 'Warna Palet' : 'Palette Color', icon: Palette },
                { id: 'size', label: lang === 'id' ? 'Ukuran' : 'Dimensions', icon: Crop },
                { id: 'adjust', label: lang === 'id' ? 'Posisi & Objek' : 'Adjustments', icon: Sliders },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-red-600" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Color Picker */}
            {activeTab === 'color' && (
              <div className="space-y-4">
                <ColorPalettePicker
                  value={customBg}
                  onChange={(bg) => setCustomBg(bg)}
                  lang={lang}
                  label={lang === 'id' ? 'Pilih Warna Background Foto Ini' : 'Background Color for this photo'}
                />
              </div>
            )}

            {/* Tab 2: Size & Dimensions */}
            {activeTab === 'size' && (
              <div className="space-y-4">
                <SizeSelector
                  selectedPreset={customSize}
                  onSelectPreset={(p) => setCustomSize(p)}
                  dpi={300}
                  onChangeDpi={() => {}}
                  fitMode={fitMode}
                  onChangeFitMode={(m) => setFitMode(m)}
                  lang={lang}
                />
              </div>
            )}

            {/* Tab 3: Adjustments (Zoom, Offset X/Y, Softness, Brightness, Contrast) */}
            {activeTab === 'adjust' && (
              <div className="space-y-4 text-xs">
                {/* Scale / Zoom */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>{lang === 'id' ? 'Ukuran Objek (Zoom)' : 'Subject Scale'}</span>
                    <span className="text-slate-500 font-mono">{(scale * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.02"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Offset Y (Up / Down) */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>{lang === 'id' ? 'Posisi Vertikal (Atas/Bawah)' : 'Vertical Position (Y)'}</span>
                    <span className="text-slate-500 font-mono">{offsetY}%</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    step="1"
                    value={offsetY}
                    onChange={(e) => setOffsetY(parseInt(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Offset X (Left / Right) */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>{lang === 'id' ? 'Posisi Horisontal (Kiri/Kanan)' : 'Horizontal Position (X)'}</span>
                    <span className="text-slate-500 font-mono">{offsetX}%</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    step="1"
                    value={offsetX}
                    onChange={(e) => setOffsetX(parseInt(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Feathering / Softness */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>{lang === 'id' ? 'Kelembutan Tepi (Feathering)' : 'Edge Softness'}</span>
                    <span className="text-slate-500 font-mono">{feathering}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={feathering}
                    onChange={(e) => setFeathering(parseInt(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Brightness */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>{lang === 'id' ? 'Kecerahan Wajah (Brightness)' : 'Face Brightness'}</span>
                    <span className="text-slate-500 font-mono">{brightness > 0 ? `+${brightness}` : brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    step="1"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>{lang === 'id' ? 'Kontras Foto (Contrast)' : 'Photo Contrast'}</span>
                    <span className="text-slate-500 font-mono">{contrast > 0 ? `+${contrast}` : contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    step="1"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Edge Cleanup & Inward Trim (Anti-Halo Putih) */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{lang === 'id' ? 'Pembersih Pinggiran Putih (Defringe)' : 'Edge Defringe (Anti-Halo)'}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={edgeDefringe}
                      onChange={(e) => setEdgeDefringe(e.target.checked)}
                      className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {lang === 'id'
                      ? 'Menghilangkan pendaran putih/abu-abu halus di sekitar rambut dan pakaian'
                      : 'Eliminates faint white halos & fringe bleeding around hair and clothing'}
                  </p>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>{lang === 'id' ? 'Pangkas Tepi Masuk (Edge Trim)' : 'Edge Inward Contraction'}</span>
                      <span className="text-slate-500 font-mono">+{edgeErode} px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="1"
                      value={edgeErode}
                      onChange={(e) => setEdgeErode(parseInt(e.target.value))}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>Normal (0px)</span>
                      <span>1px (Rapi)</span>
                      <span>2px</span>
                      <span>3px (Ketat)</span>
                    </div>
                  </div>

                  {/* Edge Sharpness & Crispness Boost */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>{lang === 'id' ? 'Ketajaman Potongan Tepi' : 'Edge Cut Crispness & Sharpness'}</span>
                      <span className="text-slate-500 font-mono">{edgeSharpness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={edgeSharpness}
                      onChange={(e) => setEdgeSharpness(parseInt(e.target.value))}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>Lembut (0%)</span>
                      <span>Standar (50%)</span>
                      <span>Tajam (85%)</span>
                      <span>Sangat Tajam (100%)</span>
                    </div>
                  </div>
                </div>

                {/* Reset button */}
                <button
                  type="button"
                  onClick={() => {
                    setScale(1.0);
                    setOffsetX(0);
                    setOffsetY(0);
                    setFeathering(0);
                    setBrightness(0);
                    setContrast(0);
                    setEdgeDefringe(true);
                    setEdgeErode(0);
                    setEdgeSharpness(85);
                  }}
                  className="w-full py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  {lang === 'id' ? 'Reset Pengaturan Posisi' : 'Reset Position & Adjustments'}
                </button>
              </div>
            )}

            {/* Reprocess AI Button */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onReprocess(item.id)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === 'id' ? 'Proses Ulang AI untuk Foto Ini' : 'Re-run AI Cutout on this photo'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
