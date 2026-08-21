import React from 'react';
import { Sparkles, Layers, Image as ImageIcon, Download, Trash2, Printer, Languages } from 'lucide-react';

interface NavbarProps {
  totalCount: number;
  doneCount: number;
  isProcessing: boolean;
  onClearAll: () => void;
  onDownloadAllZip: () => void;
  onOpenPrintSheet: () => void;
  onLoadSamples: () => void;
  lang: 'id' | 'en';
  onToggleLang: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalCount,
  doneCount,
  isProcessing,
  onClearAll,
  onDownloadAllZip,
  onOpenPrintSheet,
  onLoadSamples,
  lang,
  onToggleLang,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">AutoCut Studio</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                  AI Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {lang === 'id'
                  ? 'Hapus Background, Ganti Palet Warna & Pas Foto Massal'
                  : 'Bulk Background Removal & Color Palette Editor'}
              </p>
            </div>
          </div>

          {/* Center / Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {totalCount === 0 && (
              <button
                id="btn-load-samples"
                type="button"
                onClick={onLoadSamples}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === 'id' ? 'Coba Foto Demo' : 'Load Demo Photos'}</span>
              </button>
            )}

            {totalCount > 0 && (
              <>
                <button
                  id="btn-open-print-sheet"
                  type="button"
                  onClick={onOpenPrintSheet}
                  disabled={doneCount === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden md:inline">{lang === 'id' ? 'Cetak Lembar Pas Foto (4R/A4)' : 'Print Sheet (4R/A4)'}</span>
                  <span className="md:hidden">{lang === 'id' ? 'Lembar Cetak' : 'Print'}</span>
                </button>

                <button
                  id="btn-download-all-zip"
                  type="button"
                  onClick={onDownloadAllZip}
                  disabled={doneCount === 0 || isProcessing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'id'
                      ? `Unduh Semua ZIP (${doneCount}/${totalCount})`
                      : `Download All ZIP (${doneCount}/${totalCount})`}
                  </span>
                </button>

                <button
                  id="btn-clear-all"
                  type="button"
                  onClick={onClearAll}
                  disabled={isProcessing}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title={lang === 'id' ? 'Hapus semua antrean' : 'Clear all queue'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Language switch */}
            <button
              id="btn-toggle-lang"
              type="button"
              onClick={onToggleLang}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              title="Ganti Bahasa / Switch Language"
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="font-semibold">{lang.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
