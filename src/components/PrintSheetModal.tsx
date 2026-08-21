import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Sparkles, Layers, Scissors, Check } from 'lucide-react';
import { ImageItem } from '../types';
import { generatePrintSheet, PrintSheetItemConfig } from '../services/printSheetService';

interface PrintSheetModalProps {
  items: ImageItem[];
  onClose: () => void;
  lang: 'id' | 'en';
}

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({ items, onClose, lang }) => {
  const doneItems = items.filter((x) => x.status === 'done' && x.resultDataUrl);
  const [selectedImageId, setSelectedImageId] = useState<string>(doneItems[0]?.id || '');

  const [paperSize, setPaperSize] = useState<'4R' | 'A4'>('4R');
  const [count2x3, setCount2x3] = useState<number>(4);
  const [count3x4, setCount3x4] = useState<number>(4);
  const [count4x6, setCount4x6] = useState<number>(2);
  const [includeCutMarks, setIncludeCutMarks] = useState<boolean>(true);

  const [sheetPreviewUrl, setSheetPreviewUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    const activeItem = doneItems.find((x) => x.id === selectedImageId) || doneItems[0];
    if (!activeItem || !activeItem.resultDataUrl) return;

    let isCancelled = false;
    const generate = async () => {
      setIsGenerating(true);
      try {
        const payload: PrintSheetItemConfig[] = [
          {
            dataUrl: activeItem.resultDataUrl!,
            count2x3,
            count3x4,
            count4x6,
          },
        ];

        const url = await generatePrintSheet(payload, {
          paperSize,
          dpi: 300,
          includeCutMarks,
        });

        if (!isCancelled) {
          setSheetPreviewUrl(url);
        }
      } catch (err) {
        console.error('Error generating print sheet:', err);
      } finally {
        if (!isCancelled) setIsGenerating(false);
      }
    };

    generate();
    return () => {
      isCancelled = true;
    };
  }, [selectedImageId, paperSize, count2x3, count3x4, count4x6, includeCutMarks, doneItems]);

  const handleDownloadSheet = () => {
    if (!sheetPreviewUrl) return;
    const link = document.createElement('a');
    link.href = sheetPreviewUrl;
    link.download = `lembar-cetak-pasfoto-${paperSize}-300dpi.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDirectPrint = () => {
    if (!sheetPreviewUrl) return;
    const win = window.open('');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Cetak Lembar Pas Foto - AutoCut Studio</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
              img { max-width: 100%; height: auto; }
              @media print {
                body { margin: 0; }
                img { width: 100%; }
              }
            </style>
          </head>
          <body onload="window.print();window.close()">
            <img src="${sheetPreviewUrl}" />
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'id' ? 'Lembar Cetak Pas Foto Studio (4R / A4)' : 'Passport Photo Print Sheet Generator'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'id'
                  ? 'Susun otomatis foto 2x3, 3x4, dan 4x6 dalam 1 lembar kertas siap cetak di lab foto'
                  : 'Auto-pack 2x3, 3x4, and 4x6 photos into 1 sheet ready for studio photo lab print'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Left: Preview Canvas */}
          <div className="md:col-span-7 bg-slate-900 p-6 flex flex-col items-center justify-center overflow-hidden">
            <div className="max-w-xs sm:max-w-sm w-full bg-white shadow-2xl rounded-lg p-2 border border-slate-700">
              {sheetPreviewUrl ? (
                <img
                  src={sheetPreviewUrl}
                  alt="Print Sheet Preview"
                  className="w-full h-auto object-contain rounded shadow-2xs"
                />
              ) : (
                <div className="aspect-[4/6] bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs">
                  {lang === 'id' ? 'Menyiapkan lembar cetak...' : 'Rendering sheet...'}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-3 text-center">
              {lang === 'id'
                ? `Standar Cetak 300 DPI • Garis potong presisi & anti luntur`
                : '300 DPI Lab Print Standard • Precise cutting marks'}
            </p>
          </div>

          {/* Right: Quantities & Paper options */}
          <div className="md:col-span-5 p-6 bg-white space-y-5 overflow-y-auto">
            {/* Choose which photo */}
            {doneItems.length > 1 && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  {lang === 'id' ? 'Pilih Foto yang Dicetak' : 'Select Photo to Print'}
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {doneItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedImageId(item.id)}
                      className={`relative w-12 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImageId === item.id
                          ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-105'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={item.resultDataUrl} alt={item.name} className="w-full h-full object-cover" />
                      {selectedImageId === item.id && (
                        <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Paper Size selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                {lang === 'id' ? 'Ukuran Kertas Foto' : 'Photo Paper Size'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '4R', label: '4R (10.2 x 15.2 cm)', desc: 'Ukuran Standar Lab Foto' },
                  { id: 'A4', label: 'A4 (21.0 x 29.7 cm)', desc: 'Kertas HVS / Glossy A4' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaperSize(p.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      paperSize === p.id
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-500/20 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{p.label}</div>
                    <div className="text-[10px] text-slate-500">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Quantities */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                {lang === 'id' ? 'Jumlah Pas Foto Tiap Ukuran' : 'Quantity Per Photo Size'}
              </label>

              {/* 4x6 count */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800">Ukuran 4x6 cm</span>
                  <p className="text-[10px] text-slate-500">Paspor / CPNS / Kedinasan</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCount4x6(Math.max(0, count4x6 - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-xs text-slate-800">{count4x6}</span>
                  <button
                    type="button"
                    onClick={() => setCount4x6(count4x6 + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 3x4 count */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800">Ukuran 3x4 cm</span>
                  <p className="text-[10px] text-slate-500">KTP / SKCK / Ijazah</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCount3x4(Math.max(0, count3x4 - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-xs text-slate-800">{count3x4}</span>
                  <button
                    type="button"
                    onClick={() => setCount3x4(count3x4 + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 2x3 count */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800">Ukuran 2x3 cm</span>
                  <p className="text-[10px] text-slate-500">Buku Nikah / Ijazah</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCount2x3(Math.max(0, count2x3 - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-xs text-slate-800">{count2x3}</span>
                  <button
                    type="button"
                    onClick={() => setCount2x3(count2x3 + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Cut marks toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === 'id' ? 'Garis Panduan Potong (Cut Marks)' : 'Show Cut Marks'}</span>
              </span>
              <input
                type="checkbox"
                checked={includeCutMarks}
                onChange={(e) => setIncludeCutMarks(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Actions: Download Sheet & Print */}
            <div className="pt-3 space-y-2">
              <button
                type="button"
                onClick={handleDownloadSheet}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'id' ? 'Unduh Lembar Cetak (High-Res 300 DPI)' : 'Download Print Sheet (300 DPI)'}</span>
              </button>

              <button
                type="button"
                onClick={handleDirectPrint}
                className="w-full py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>{lang === 'id' ? 'Cetak Langsung ke Printer' : 'Direct Print via Browser'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
