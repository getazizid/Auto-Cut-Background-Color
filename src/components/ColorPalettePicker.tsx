import React, { useState, useRef } from 'react';
import { Check, Pipette, Sparkles, Image as ImageIcon, Sliders, Palette, Eye } from 'lucide-react';
import { BackgroundConfig } from '../types';
import { COLOR_CATEGORIES } from '../constants/presets';

interface ColorPalettePickerProps {
  value: BackgroundConfig;
  onChange: (bg: BackgroundConfig) => void;
  lang: 'id' | 'en';
  label?: string;
  compact?: boolean;
}

export const ColorPalettePicker: React.FC<ColorPalettePickerProps> = ({
  value,
  onChange,
  lang,
  label,
  compact = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('pasfoto_resmi');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onChange({
          type: 'custom-image',
          color: '#ffffff',
          customImageUri: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectColor = (colorHex: string, secondaryColor?: string, gradientDirection?: any) => {
    if (secondaryColor) {
      onChange({
        type: 'gradient',
        color: colorHex,
        secondaryColor: secondaryColor,
        gradientDirection: gradientDirection || 'to-bottom',
      });
    } else {
      onChange({
        type: 'solid',
        color: colorHex,
      });
    }
  };

  const isTransparent = value.type === 'transparent';
  const isCustomImage = value.type === 'custom-image';

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-red-600" />
            <span>{label}</span>
          </label>
          <span className="text-xs text-slate-500 font-mono">
            {isTransparent
              ? (lang === 'id' ? 'Transparan (PNG)' : 'Transparent (PNG)')
              : isCustomImage
              ? (lang === 'id' ? 'Gambar Kustom' : 'Custom Image')
              : value.color.toUpperCase()}
          </span>
        </div>
      )}

      {/* Quick Color Swatches Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Transparent Option */}
        <button
          type="button"
          onClick={() => onChange({ type: 'transparent', color: '#00000000' })}
          className={`relative group w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center overflow-hidden ${
            isTransparent
              ? 'border-red-600 ring-2 ring-red-500/30 scale-105'
              : 'border-slate-300 hover:border-slate-400'
          }`}
          title={lang === 'id' ? 'Latar Belakang Transparan (PNG Cutout)' : 'Transparent Background (PNG Cutout)'}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `conic-gradient(#e2e8f0 90deg, #ffffff 90deg 180deg, #e2e8f0 180deg 270deg, #ffffff 270deg)`,
              backgroundSize: '8px 8px',
            }}
          />
          {isTransparent && <Check className="w-4 h-4 text-slate-800 absolute z-10 stroke-[3]" />}
        </button>

        {/* Top 4 Official Passport Swatches */}
        {[
          { name: 'Merah Paspor (Ganjil)', color: '#db1514' },
          { name: 'Biru Paspor (Genap)', color: '#0055a5' },
          { name: 'Putih Bersih (Visa/Haji)', color: '#FFFFFF', isLight: true },
          { name: 'Abu Studio', color: '#64748b' },
          { name: 'Kuning Instansi', color: '#f59e0b' },
        ].map((c) => {
          const isSelected = value.type === 'solid' && value.color.toLowerCase() === c.color.toLowerCase();
          return (
            <button
              key={c.color}
              type="button"
              onClick={() => handleSelectColor(c.color)}
              className={`relative group w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center shadow-xs ${
                isSelected
                  ? 'border-slate-900 ring-2 ring-slate-900/30 scale-105'
                  : c.isLight
                  ? 'border-slate-300 hover:border-slate-400'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: c.color }}
              title={c.name}
            >
              {isSelected && (
                <Check
                  className={`w-4 h-4 stroke-[3] ${
                    c.isLight ? 'text-slate-900' : 'text-white'
                  }`}
                />
              )}
            </button>
          );
        })}

        {/* Custom Hex / Eyedropper Input button */}
        <div className="relative inline-flex items-center">
          <input
            type="color"
            id="native-color-picker"
            value={value.color.startsWith('#') && value.color.length === 7 ? value.color : '#db1514'}
            onChange={(e) => handleSelectColor(e.target.value)}
            className="w-9 h-9 rounded-xl border-2 border-slate-300 cursor-pointer overflow-hidden opacity-0 absolute inset-0 z-10"
          />
          <div
            className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 text-white shadow-xs ${
              value.type === 'solid' && !COLOR_CATEGORIES.some((cat) => cat.colors.some((x) => x.color.toLowerCase() === value.color.toLowerCase()))
                ? 'border-slate-900 ring-2 ring-slate-900/30'
                : 'border-slate-300 hover:border-slate-400'
            }`}
            title={lang === 'id' ? 'Pilih Warna Kustom (Color Picker)' : 'Pick Custom Color'}
          >
            <Pipette className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* Upload Custom BG Image */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-xs ${
            isCustomImage ? 'border-red-600 ring-2 ring-red-500/30 text-red-600' : 'border-slate-300'
          }`}
          title={lang === 'id' ? 'Unggah Background Gambar/Tekstur Sendiri' : 'Upload Custom BG Image/Texture'}
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCustomImageUpload}
        />
      </div>

      {!compact && (
        <div className="pt-2 border-t border-slate-100">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 mb-2.5 text-xs scrollbar-none">
            {COLOR_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lang === 'id' ? cat.name : cat.nameEn}
              </button>
            ))}
          </div>

          {/* Categorized Palette Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COLOR_CATEGORIES.find((cat) => cat.id === activeCategory)?.colors.map((c) => {
              const isSelected =
                value.type === 'gradient'
                  ? value.color.toLowerCase() === c.color.toLowerCase() &&
                    value.secondaryColor?.toLowerCase() === c.secondaryColor?.toLowerCase()
                  : value.type === 'solid' && value.color.toLowerCase() === c.color.toLowerCase();

              const isGradient = !!c.secondaryColor;
              const bgStyle = isGradient
                ? c.gradientDirection === 'radial'
                  ? `radial-gradient(circle, ${c.color}, ${c.secondaryColor})`
                  : `linear-gradient(135deg, ${c.color}, ${c.secondaryColor})`
                : c.color;

              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleSelectColor(c.color, c.secondaryColor, c.gradientDirection)}
                  className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg border border-black/10 shrink-0 flex items-center justify-center shadow-2xs"
                    style={{ background: bgStyle }}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] ${
                          c.color === '#FFFFFF' || c.color === '#f5f5f4' || c.color === '#dcfce7'
                            ? 'text-slate-900'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {lang === 'id' ? c.name : c.nameEn}
                    </p>
                    {c.desc && <p className="text-[10px] text-slate-500 truncate">{c.desc}</p>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hex Input bar */}
          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-500">HEX:</span>
            <input
              type="text"
              value={value.color}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith('#') || val.length <= 7) {
                  handleSelectColor(val);
                }
              }}
              placeholder="#DB1514"
              className="px-2.5 py-1 text-xs font-mono font-medium uppercase bg-slate-50 border border-slate-200 rounded-lg text-slate-800 w-28 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            {value.type === 'gradient' && (
              <>
                <span className="text-[11px] font-medium text-slate-500">HEX 2:</span>
                <input
                  type="text"
                  value={value.secondaryColor || '#000000'}
                  onChange={(e) => handleSelectColor(value.color, e.target.value, value.gradientDirection)}
                  className="px-2.5 py-1 text-xs font-mono font-medium uppercase bg-slate-50 border border-slate-200 rounded-lg text-slate-800 w-28 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
