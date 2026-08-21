import React, { useState, useRef, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Layers,
  UploadCloud,
  Download,
  Trash2,
  Sliders,
  CheckCircle,
  Play,
  RotateCw,
  FileArchive,
  Image as ImageIcon,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { UploadZone } from './components/UploadZone';
import { GlobalControls } from './components/GlobalControls';
import { BatchImageList } from './components/BatchImageList';
import { ImageDetailModal } from './components/ImageDetailModal';
import { PrintSheetModal } from './components/PrintSheetModal';
import { OfficialRequirementsGuide } from './components/OfficialRequirementsGuide';
import { BackgroundConfig, GlobalSettings, ImageItem, SizePreset } from './types';
import { DEFAULT_BACKGROUND, SAMPLE_DEMO_IMAGES, SIZE_PRESETS } from './constants/presets';
import {
  executeBackgroundRemoval,
  fileToDataUrl,
  renderCompositedPhoto,
  createBatchZip,
} from './services/bgRemovalService';

export default function App() {
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const [items, setItems] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeDetailItem, setActiveDetailItem] = useState<ImageItem | null>(null);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState<boolean>(false);

  // Global Default Settings
  const [settings, setSettings] = useState<GlobalSettings>({
    background: DEFAULT_BACKGROUND,
    sizePreset: SIZE_PRESETS.find((p) => p.id === 'pasfoto_3x4') || SIZE_PRESETS[1],
    dpi: 300,
    fitMode: 'auto-portrait',
    exportFormat: 'image/jpeg',
    jpegQuality: 0.95,
    autoProcessOnUpload: true,
    concurrency: 2,
    edgeDefringe: true,
    edgeErode: 0,
  });

  // Track processing cancellation
  const isCancelledRef = useRef<boolean>(false);

  // Add new files to the batch
  const handleFilesAdded = useCallback(
    async (files: File[]) => {
      const newItems: ImageItem[] = [];

      for (const file of files) {
        try {
          const dataUrl = await fileToDataUrl(file);
          newItems.push({
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            file,
            name: file.name,
            size: file.size,
            originalDataUrl: dataUrl,
            status: 'idle',
            progress: 0,
            customBg: { ...settings.background },
            customSize: { ...settings.sizePreset },
            customFitMode: settings.fitMode,
            scale: 1.0,
            offsetX: 0,
            offsetY: 0,
            feathering: 0,
            brightness: 0,
            contrast: 0,
            edgeDefringe: settings.edgeDefringe,
            edgeErode: settings.edgeErode,
          });
        } catch (err) {
          console.error('Error reading file:', file.name, err);
        }
      }

      setItems((prev) => [...prev, ...newItems]);
    },
    [settings]
  );

  // Process a single item
  const processItem = async (item: ImageItem): Promise<ImageItem> => {
    try {
      // 1. If background not yet removed, run AI removal
      let noBgUrl = item.noBgDataUrl;
      if (!noBgUrl) {
        noBgUrl = await executeBackgroundRemoval(item.originalDataUrl, (prog) => {
          setItems((prev) =>
            prev.map((x) => (x.id === item.id ? { ...x, progress: Math.min(90, prog) } : x))
          );
        });
      }

      // 2. Composite with chosen background, size, fitMode & filters
      const targetBg = item.customBg || settings.background;
      const targetSize = item.customSize || settings.sizePreset;
      const targetFit = item.customFitMode || settings.fitMode;

      const resultUrl = await renderCompositedPhoto({
        noBgImageUrl: noBgUrl,
        background: targetBg,
        sizePreset: targetSize,
        dpi: settings.dpi,
        fitMode: targetFit,
        scale: item.scale,
        offsetX: item.offsetX,
        offsetY: item.offsetY,
        feathering: item.feathering,
        brightness: item.brightness,
        contrast: item.contrast,
        edgeDefringe: item.edgeDefringe ?? settings.edgeDefringe,
        edgeErode: item.edgeErode ?? settings.edgeErode,
        exportFormat: settings.exportFormat,
        jpegQuality: settings.jpegQuality,
      });

      return {
        ...item,
        noBgDataUrl: noBgUrl,
        resultDataUrl: resultUrl,
        status: 'done',
        progress: 100,
      };
    } catch (error: any) {
      console.error('Error processing item:', item.name, error);
      return {
        ...item,
        status: 'error',
        error: error?.message || 'Gagal memproses background foto',
      };
    }
  };

  // Process all queue items in controlled concurrency
  const handleProcessAll = async () => {
    if (items.length === 0 || isProcessing) return;
    setIsProcessing(true);
    isCancelledRef.current = false;

    // Get list of items that need processing
    const currentItems = [...items];

    // Concurrency pool (process up to 2 simultaneously)
    const concurrency = settings.concurrency || 2;
    let index = 0;

    const worker = async () => {
      while (index < currentItems.length && !isCancelledRef.current) {
        const currentIndex = index++;
        const item = currentItems[currentIndex];

        // Mark as processing
        setItems((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, status: 'processing', progress: 10 } : x))
        );

        const updated = await processItem(item);

        // Update state with result
        setItems((prev) => prev.map((x) => (x.id === item.id ? updated : x)));
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, currentItems.length) }, () => worker());
    await Promise.all(workers);

    setIsProcessing(false);

    // Fire celebratory confetti if all are done!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignored
    }
  };

  // Re-process a specific single item
  const handleReprocessSingle = async (id: string) => {
    const item = items.find((x) => x.id === id);
    if (!item) return;

    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: 'processing', progress: 10, noBgDataUrl: undefined } : x))
    );

    const updated = await processItem({ ...item, noBgDataUrl: undefined });
    setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
    if (activeDetailItem?.id === id) {
      setActiveDetailItem(updated);
    }
  };

  // Quick background color changer for an item
  const handleQuickChangeBg = async (id: string, bg: BackgroundConfig) => {
    const item = items.find((x) => x.id === id);
    if (!item) return;

    const updatedItem = { ...item, customBg: bg };

    if (item.noBgDataUrl) {
      const resultUrl = await renderCompositedPhoto({
        noBgImageUrl: item.noBgDataUrl,
        background: bg,
        sizePreset: item.customSize || settings.sizePreset,
        dpi: settings.dpi,
        fitMode: item.customFitMode || settings.fitMode,
        scale: item.scale,
        offsetX: item.offsetX,
        offsetY: item.offsetY,
        feathering: item.feathering,
        brightness: item.brightness,
        contrast: item.contrast,
        edgeDefringe: item.edgeDefringe ?? settings.edgeDefringe,
        edgeErode: item.edgeErode ?? settings.edgeErode,
        exportFormat: settings.exportFormat,
        jpegQuality: settings.jpegQuality,
      });
      updatedItem.resultDataUrl = resultUrl;
      updatedItem.status = 'done';
    }

    setItems((prev) => prev.map((x) => (x.id === id ? updatedItem : x)));
  };

  // Apply current global settings to all photos
  const handleApplyToAll = async () => {
    const updated = await Promise.all(
      items.map(async (item) => {
        const newItem = {
          ...item,
          customBg: { ...settings.background },
          customSize: { ...settings.sizePreset },
          customFitMode: settings.fitMode,
          edgeDefringe: settings.edgeDefringe,
          edgeErode: settings.edgeErode,
        };
        if (newItem.noBgDataUrl) {
          const resultUrl = await renderCompositedPhoto({
            noBgImageUrl: newItem.noBgDataUrl,
            background: settings.background,
            sizePreset: settings.sizePreset,
            dpi: settings.dpi,
            fitMode: settings.fitMode,
            scale: newItem.scale,
            offsetX: newItem.offsetX,
            offsetY: newItem.offsetY,
            feathering: newItem.feathering,
            brightness: newItem.brightness,
            contrast: newItem.contrast,
            edgeDefringe: settings.edgeDefringe,
            edgeErode: settings.edgeErode,
            exportFormat: settings.exportFormat,
            jpegQuality: settings.jpegQuality,
          });
          newItem.resultDataUrl = resultUrl;
        }
        return newItem;
      })
    );

    setItems(updated);
  };

  // Download a single photo
  const handleDownloadSingle = (item: ImageItem) => {
    const url = item.resultDataUrl || item.originalDataUrl;
    const ext = settings.exportFormat === 'image/png' ? 'png' : settings.exportFormat === 'image/webp' ? 'webp' : 'jpg';
    const cleanName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    const filename = `${cleanName}-autocut-${item.customBg?.type || 'color'}.${ext}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all finished photos as a ZIP file
  const handleDownloadAllZip = async () => {
    const doneItems = items.filter((x) => x.status === 'done' && x.resultDataUrl);
    if (doneItems.length === 0) return;

    const ext = settings.exportFormat === 'image/png' ? 'png' : settings.exportFormat === 'image/webp' ? 'webp' : 'jpg';

    const payload = doneItems.map((item, idx) => {
      const cleanName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
      return {
        name: `${String(idx + 1).padStart(2, '0')}-${cleanName}.${ext}`,
        dataUrl: item.resultDataUrl!,
      };
    });

    const zipBlob = await createBatchZip(payload);
    const url = URL.createObjectURL(zipBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `autocut-pasfoto-bulk-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load 4 demo portrait photos
  const handleLoadSamples = async () => {
    const sampleFiles: File[] = [];

    for (const sample of SAMPLE_DEMO_IMAGES) {
      try {
        const response = await fetch(sample.url);
        const blob = await response.blob();
        const file = new File([blob], sample.name, { type: blob.type || 'image/jpeg' });
        sampleFiles.push(file);
      } catch (err) {
        console.warn('Could not load remote sample, generating fallback SVG image:', sample.name);
        // Create a synthetic SVG portrait file
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
          <rect width="600" height="800" fill="#cbd5e1"/>
          <circle cx="300" cy="300" r="140" fill="#f87171"/>
          <path d="M 120 750 C 120 500, 480 500, 480 750 Z" fill="#1e293b"/>
          <text x="300" y="320" font-family="sans-serif" font-size="28" fill="#ffffff" text-anchor="middle" font-weight="bold">${sample.title}</text>
        </svg>`;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const file = new File([blob], sample.name, { type: 'image/svg+xml' });
        sampleFiles.push(file);
      }
    }

    if (sampleFiles.length > 0) {
      await handleFilesAdded(sampleFiles);
    }
  };

  const doneCount = items.filter((x) => x.status === 'done').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col selection:bg-red-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        totalCount={items.length}
        doneCount={doneCount}
        isProcessing={isProcessing}
        onClearAll={() => setItems([])}
        onDownloadAllZip={handleDownloadAllZip}
        onOpenPrintSheet={() => setIsPrintSheetOpen(true)}
        onLoadSamples={handleLoadSamples}
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'id' ? 'en' : 'id'))}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Hero / Welcome Banner for empty state */}
        {items.length === 0 && (
          <div className="text-center max-w-3xl mx-auto space-y-3 pt-2 pb-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100/80 text-red-700 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>
                {lang === 'id'
                  ? 'Pemotong Latar Belakang AI Presisi Tinggi & Ganti Palet Warna Pas Foto'
                  : 'High Precision AI Background Remover & Color Palette Editor'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'id' ? (
                <>
                  Hapus Background & Ubah Warna{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-amber-500">
                    Banyak Foto Sekaligus
                  </span>
                </>
              ) : (
                <>
                  Bulk Remove Background & Replace{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-amber-500">
                    Color Palettes & Passport Sizes
                  </span>
                </>
              )}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              {lang === 'id'
                ? 'Standar resmi pas foto Indonesia (Merah KTP/SKCK, Biru Ijazah, Putih Visa/Haji), ukuran 2x3, 3x4, 4x6, dimensi kustom, dan ekspor ZIP massal.'
                : 'Official Indonesian passport standards, custom dimensions, 300 DPI high-res output, and batch ZIP export.'}
            </p>
          </div>
        )}

        {/* Upload Zone */}
        <section id="section-upload">
          <UploadZone
            onFilesAdded={handleFilesAdded}
            onLoadSamples={handleLoadSamples}
            lang={lang}
            isCompact={items.length > 0}
            totalCount={items.length}
          />
        </section>

        {/* Grid Workspace: Left = Global Controls / Palettes, Right = Batch Queue & Photos */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar: Controls & Palettes */}
            <div className="lg:col-span-4 space-y-6 sticky top-20">
              <GlobalControls
                settings={settings}
                onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
                onApplyToAll={handleApplyToAll}
                onProcessAll={handleProcessAll}
                isProcessing={isProcessing}
                totalCount={items.length}
                doneCount={doneCount}
                lang={lang}
              />

              <OfficialRequirementsGuide lang={lang} />
            </div>

            {/* Right Main Area: Batch Image List */}
            <div className="lg:col-span-8 space-y-6">
              <BatchImageList
                items={items}
                onSelectItem={(item) => setActiveDetailItem(item)}
                onRemoveItem={(id) => setItems((prev) => prev.filter((x) => x.id !== id))}
                onReprocessItem={handleReprocessSingle}
                onQuickChangeBg={handleQuickChangeBg}
                onDownloadSingle={handleDownloadSingle}
                isProcessing={isProcessing}
                lang={lang}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Features Highlight Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-xs font-bold text-slate-900">
                  {lang === 'id' ? 'Proses Massal (Bulk)' : 'Unlimited Bulk Batch'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {lang === 'id'
                    ? 'Tarik puluhan foto sekaligus, proses di browser dengan cepat dan aman tanpa batasan.'
                    : 'Upload dozens of photos at once, processed safely and securely in your browser.'}
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-xs font-bold text-slate-900">
                  {lang === 'id' ? 'Palet Warna Pas Foto Resmi' : 'Official Passport Palettes'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {lang === 'id'
                    ? 'Merah Ganjil (#DB1514), Biru Genap (#0055A5), Putih Visa, warna pastel, gradien studio, atau custom HEX.'
                    : 'Official red, blue, white, pastels, studio gradients, or custom HEX picker.'}
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-xs font-bold text-slate-900">
                  {lang === 'id' ? 'Ukuran & Lembar Cetak 4R' : 'Custom Sizes & Print Sheet'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {lang === 'id'
                    ? 'Ukuran 2x3, 3x4, 4x6, KTP, Visa, sosial media, serta generator lembar cetak lab foto 300 DPI.'
                    : '2x3, 3x4, 4x6 cm, passport/visa, and 4R/A4 photo studio print sheet generator.'}
                </p>
              </div>
            </div>

            <OfficialRequirementsGuide lang={lang} />
          </div>
        )}
      </main>

      {/* Detail Fine-Tuning Modal */}
      {activeDetailItem && (
        <ImageDetailModal
          item={activeDetailItem}
          onClose={() => setActiveDetailItem(null)}
          onUpdateItem={(updated) => {
            setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            setActiveDetailItem(updated);
          }}
          onReprocess={handleReprocessSingle}
          onDownloadSingle={handleDownloadSingle}
          lang={lang}
        />
      )}

      {/* Print Sheet 4R / A4 Modal */}
      {isPrintSheetOpen && (
        <PrintSheetModal
          items={items}
          onClose={() => setIsPrintSheetOpen(false)}
          lang={lang}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">AutoCut Studio</span>
            <span>•</span>
            <span>{lang === 'id' ? 'Aplikasi Penghapus Background & Pas Foto Massal' : 'Bulk Background Remover & ID Photo Studio'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Client-Side Privacy Safe (WASM)</span>
            <span>•</span>
            <span className="font-mono">300 DPI Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
