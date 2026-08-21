import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Eye,
  Maximize2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { BackgroundConfig, ImageItem } from '../types';
import { COLOR_CATEGORIES } from '../constants/presets';

interface BatchImageListProps {
  items: ImageItem[];
  onSelectItem: (item: ImageItem) => void;
  onRemoveItem: (id: string) => void;
  onReprocessItem: (id: string) => void;
  onQuickChangeBg: (id: string, bg: BackgroundConfig) => void;
  onDownloadSingle: (item: ImageItem) => void;
  isProcessing: boolean;
  lang: 'id' | 'en';
}

export const BatchImageList: React.FC<BatchImageListProps> = ({
  items,
  onSelectItem,
  onRemoveItem,
  onReprocessItem,
  onQuickChangeBg,
  onDownloadSingle,
  isProcessing,
  lang,
}) => {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const doneCount = items.filter((x) => x.status === 'done').length;
  const processingCount = items.filter((x) => x.status === 'processing').length;
  const pendingCount = items.filter((x) => x.status === 'idle').length;

  return (
    <div className="space-y-4">
      {/* Batch Header Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-slate-900">
            {lang === 'id' ? 'Daftar Foto Antrean' : 'Queued Photos'} ({items.length})
          </h3>
          <div className="flex items-center gap-1.5 text-xs">
            {doneCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {doneCount} {lang === 'id' ? 'Selesai' : 'Done'}
              </span>
            )}
            {processingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                <RotateCw className="w-3 h-3 animate-spin" />
                {processingCount} {lang === 'id' ? 'Proses' : 'Processing'}
              </span>
            )}
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                {pendingCount} {lang === 'id' ? 'Menunggu' : 'Waiting'}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          {lang === 'id'
            ? 'Klik foto untuk preview & penyesuaian detail'
            : 'Click any photo to fine-tune & adjust'}
        </p>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, index) => {
          const isDone = item.status === 'done';
          const isProcessingItem = item.status === 'processing';
          const isError = item.status === 'error';

          // Background style helper for preview
          const bgConfig = item.customBg;
          const bgStyle =
            bgConfig?.type === 'gradient'
              ? bgConfig.gradientDirection === 'radial'
                ? `radial-gradient(circle, ${bgConfig.color}, ${bgConfig.secondaryColor || '#000'})`
                : `linear-gradient(135deg, ${bgConfig.color}, ${bgConfig.secondaryColor || '#000'})`
              : bgConfig?.type === 'transparent'
              ? `conic-gradient(#e2e8f0 90deg, #ffffff 90deg 180deg, #e2e8f0 180deg 270deg, #ffffff 270deg)`
              : bgConfig?.color || '#db1514';

          return (
            <div
              key={item.id}
              className={`group relative bg-white rounded-2xl border transition-all overflow-hidden flex flex-col ${
                isDone
                  ? 'border-slate-200 hover:border-slate-400 hover:shadow-md'
                  : isProcessingItem
                  ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Photo Preview Canvas Container */}
              <div
                className="relative w-full aspect-[3/4] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center"
                onClick={() => onSelectItem(item)}
              >
                {/* Background Representation if done */}
                {isDone && item.resultDataUrl ? (
                  <img
                    src={item.resultDataUrl}
                    alt={item.name}
                    className="w-full h-full object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <img
                    src={item.originalDataUrl}
                    alt={item.name}
                    className="w-full h-full object-cover filter blur-[0.5px] transition-transform group-hover:scale-105"
                  />
                )}

                {/* Status Overlay / Loading bar */}
                {isProcessingItem && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white">
                    <RotateCw className="w-8 h-8 animate-spin text-amber-400 mb-2" />
                    <span className="text-xs font-bold">{lang === 'id' ? 'Memproses AI...' : 'AI Cutout...'}</span>
                    <div className="w-full max-w-[120px] bg-white/20 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-300 mt-1">{item.progress}%</span>
                  </div>
                )}

                {isError && (
                  <div className="absolute inset-0 bg-red-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white text-center">
                    <AlertCircle className="w-6 h-6 text-red-400 mb-1" />
                    <span className="text-xs font-bold text-red-200">Gagal</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReprocessItem(item.id);
                      }}
                      className="mt-2 px-2.5 py-1 text-[10px] font-semibold bg-white text-red-700 rounded-lg"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}

                {/* Index & Status Tag Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white rounded-md">
                    #{index + 1}
                  </span>
                  {isDone && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-md flex items-center gap-0.5 shadow-xs">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 pointer-events-none">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 text-xs font-bold shadow-md">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span>{lang === 'id' ? 'Sesuaikan' : 'Edit'}</span>
                  </span>
                </div>
              </div>

              {/* Bottom Card Controls */}
              <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <span className="text-[10px] text-slate-600 font-mono shrink-0">
                      {(item.size / 1024).toFixed(0)} KB
                    </span>
                  </div>

                  {/* Size Preset Name */}
                  <p className="text-[10px] text-slate-700 truncate mt-0.5">
                    {item.customSize ? item.customSize.name : 'Pas Foto 3x4 cm'}
                  </p>
                </div>

                {/* Quick Passport Color Swatches for this specific photo */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {[
                      { color: '#db1514', name: 'Merah' },
                      { color: '#0055a5', name: 'Biru' },
                      { color: '#FFFFFF', name: 'Putih', isWhite: true },
                      { color: '#64748b', name: 'Abu' },
                    ].map((swatch) => {
                      const isActive = item.customBg?.color?.toLowerCase() === swatch.color.toLowerCase();
                      return (
                        <button
                          key={swatch.color}
                          type="button"
                          onClick={() =>
                            onQuickChangeBg(item.id, { type: 'solid', color: swatch.color })
                          }
                          className={`w-5 h-5 rounded-md border transition-all ${
                            isActive
                              ? 'ring-2 ring-slate-900 border-slate-900 scale-110'
                              : swatch.isWhite
                              ? 'border-slate-300'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: swatch.color }}
                          title={swatch.name}
                        />
                      );
                    })}

                    {/* Transparent quick button */}
                    <button
                      type="button"
                      onClick={() =>
                        onQuickChangeBg(item.id, { type: 'transparent', color: '#00000000' })
                      }
                      className={`w-5 h-5 rounded-md border transition-all overflow-hidden ${
                        item.customBg?.type === 'transparent'
                          ? 'ring-2 ring-red-600 border-red-600 scale-110'
                          : 'border-slate-300'
                      }`}
                      style={{
                        backgroundImage: `conic-gradient(#cbd5e1 90deg, #ffffff 90deg 180deg, #cbd5e1 180deg 270deg, #ffffff 270deg)`,
                        backgroundSize: '4px 4px',
                      }}
                      title="Transparan (PNG)"
                    />
                  </div>

                  {/* Actions: Download Single & Remove */}
                  <div className="flex items-center gap-1">
                    {isDone && (
                      <button
                        type="button"
                        onClick={() => onDownloadSingle(item)}
                        className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={lang === 'id' ? 'Unduh Foto Ini' : 'Download Photo'}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={lang === 'id' ? 'Hapus dari antrean' : 'Remove item'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
