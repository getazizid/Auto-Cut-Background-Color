import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Plus, Sparkles, FolderUp } from 'lucide-react';
import { SAMPLE_DEMO_IMAGES } from '../constants/presets';

interface UploadZoneProps {
  onFilesAdded: (files: File[]) => void;
  onLoadSamples: () => void;
  lang: 'id' | 'en';
  isCompact?: boolean;
  totalCount: number;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesAdded,
  onLoadSamples,
  lang,
  isCompact = false,
  totalCount,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Support clipboard paste of images!
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        onFilesAdded(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesAdded]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles: File[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.type.startsWith('image/')) {
          validFiles.push(file);
        }
      }
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles: File[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        validFiles.push(e.target.files[i]);
      }
      onFilesAdded(validFiles);
      // Reset input value so same files can be re-uploaded if desired
      e.target.value = '';
    }
  };

  if (isCompact && totalCount > 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-between gap-3 ${
          isDragOver
            ? 'border-red-500 bg-red-50/70 scale-[1.01]'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png, image/jpeg, image/webp, image/avif, image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">
              {lang === 'id' ? '+ Tambah Foto Lainnya (Bisa Banyak)' : '+ Add More Photos (Bulk)'}
            </p>
            <p className="text-[10px] text-slate-500">
              {lang === 'id' ? 'Klik atau Tarik & Lepas (Drag & Drop)' : 'Click or Drag & Drop multiple images'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLoadSamples();
          }}
          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors shrink-0"
        >
          {lang === 'id' ? 'Foto Demo' : 'Demo Pics'}
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative p-8 sm:p-10 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center group ${
        isDragOver
          ? 'border-red-500 bg-red-50/80 scale-[1.01] shadow-lg shadow-red-500/10'
          : 'border-slate-300 hover:border-red-400 bg-gradient-to-b from-white to-slate-50/80 hover:bg-slate-50/50 shadow-xs'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/webp, image/avif, image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="max-w-md mx-auto space-y-4">
        {/* Upload Icon Badge */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-red-500 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {lang === 'id'
              ? 'Tarik & Lepas Foto di Sini (Bisa Banyak Sekaligus)'
              : 'Drag & Drop Multiple Photos Here'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'id'
              ? 'atau klik untuk memilih file foto dari perangkat / paste dari clipboard (Ctrl+V)'
              : 'or click to browse from device / paste image from clipboard (Ctrl+V)'}
          </p>
        </div>

        {/* Supported badges */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[11px] font-medium text-slate-600">
          <span className="px-2 py-0.5 bg-slate-100 rounded-md">JPG</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded-md">PNG</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded-md">WEBP</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded-md">Bulk Queue Unlimited</span>
        </div>

        {/* Sample Photo CTA */}
        <div className="pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSamples();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>{lang === 'id' ? 'Gunakan 4 Contoh Foto Pas Foto (1-Klik)' : 'Try 4 Sample Photos (1-Click)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
