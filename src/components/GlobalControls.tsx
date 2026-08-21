import React from 'react';
import { Play, RotateCw, CheckCheck, FileDown, Layers, Sliders, Sparkles } from 'lucide-react';
import { ColorPalettePicker } from './ColorPalettePicker';
import { SizeSelector } from './SizeSelector';
import { BackgroundConfig, FitMode, GlobalSettings, SizePreset } from '../types';

interface GlobalControlsProps {
  settings: GlobalSettings;
  onUpdateSettings: (newSettings: Partial<GlobalSettings>) => void;
  onApplyToAll: () => void;
  onProcessAll: () => void;
  isProcessing: boolean;
  totalCount: number;
  doneCount: number;
  lang: 'id' | 'en';
}

export const GlobalControls: React.FC<GlobalControlsProps> = ({
  settings,
  onUpdateSettings,
  onApplyToAll,
  onProcessAll,
  isProcessing,
  totalCount,
  doneCount,
  lang,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-red-600" />
            <span>{lang === 'id' ? 'Pengaturan Utama (Bulk Settings)' : 'Global Bulk Settings'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'id'
              ? 'Warna dan ukuran ini akan diterapkan ke semua foto yang diproses'
              : 'These settings apply to all photos in the batch'}
          </p>
        </div>

        {totalCount > 0 && (
          <button
            type="button"
            onClick={onApplyToAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
            title={lang === 'id' ? 'Terapkan warna & ukuran ini ke semua foto di antrean' : 'Apply current color and size to all photos'}
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'id' ? 'Terapkan ke Semua' : 'Apply to All'}</span>
          </button>
        )}
      </div>

      {/* 1. Color Palette Selector */}
      <ColorPalettePicker
        value={settings.background}
        onChange={(bg) => onUpdateSettings({ background: bg })}
        lang={lang}
        label={lang === 'id' ? 'Warna Latar Belakang (Palet Resmi / Kustom)' : 'Background Color (Official / Custom)'}
      />

      {/* 2. Size & Dimensions Selector */}
      <div className="pt-2 border-t border-slate-100">
        <SizeSelector
          selectedPreset={settings.sizePreset}
          onSelectPreset={(preset) => onUpdateSettings({ sizePreset: preset })}
          dpi={settings.dpi}
          onChangeDpi={(dpi) => onUpdateSettings({ dpi })}
          fitMode={settings.fitMode}
          onChangeFitMode={(fit) => onUpdateSettings({ fitMode: fit })}
          lang={lang}
        />
      </div>

      {/* 3. Export Format & Edge Cleanup */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              {lang === 'id' ? 'Format File Output' : 'Export File Format'}
            </label>
            <span className="text-[10px] text-slate-500">
              {settings.exportFormat === 'image/png'
                ? 'Mendukung transparansi (Lossless)'
                : 'Ukuran file lebih kecil (Standard Pas Foto)'}
            </span>
          </div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            {[
              { id: 'image/jpeg', label: 'JPG' },
              { id: 'image/png', label: 'PNG' },
              { id: 'image/webp', label: 'WEBP' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => onUpdateSettings({ exportFormat: fmt.id as any })}
                className={`px-3 py-1 font-bold rounded-lg transition-all ${
                  settings.exportFormat === fmt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global Edge Defringe & Sharpness */}
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === 'id' ? 'Ketajaman & Anti-Halo Tepi' : 'Crisp Edge & Anti-Halo'}</span>
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {lang === 'id'
                  ? 'Pertajam potongan tepi & bersihkan pendaran putih'
                  : 'Crisp subject contour & defringe background halos'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.edgeDefringe}
              onChange={(e) => onUpdateSettings({ edgeDefringe: e.target.checked })}
              className="w-4 h-4 accent-red-600 rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
              <span>{lang === 'id' ? 'Ketajaman Garis Potong' : 'Contour Sharpness'}</span>
              <span className="text-slate-500 font-mono">{settings.edgeSharpness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.edgeSharpness}
              onChange={(e) => onUpdateSettings({ edgeSharpness: parseInt(e.target.value) })}
              className="w-full accent-red-600 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>Halus (0%)</span>
              <span>Standar (50%)</span>
              <span>Ekstra Tajam (85%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Button: Process All Batch */}
      {totalCount > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onProcessAll}
            disabled={isProcessing}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              isProcessing
                ? 'bg-amber-500 text-white cursor-wait'
                : doneCount === totalCount
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-500/25'
            }`}
          >
            {isProcessing ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'id' ? 'Sedang Memproses Foto...' : 'Processing Photos...'}</span>
              </>
            ) : doneCount === totalCount ? (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{lang === 'id' ? 'Proses Ulang Semua Foto' : 'Reprocess All Photos'}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {lang === 'id'
                    ? `Hapus & Ganti Warna Semua Foto (${totalCount} Foto)`
                    : `Process All Backgrounds (${totalCount} Photos)`}
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
