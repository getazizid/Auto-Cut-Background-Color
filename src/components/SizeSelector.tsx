import React, { useState } from 'react';
import { Maximize2, Crop, Check, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { SizePreset, DimensionUnit, FitMode } from '../types';
import { SIZE_PRESETS, DPI_OPTIONS } from '../constants/presets';

interface SizeSelectorProps {
  selectedPreset: SizePreset;
  onSelectPreset: (preset: SizePreset) => void;
  dpi: number;
  onChangeDpi: (dpi: number) => void;
  fitMode: FitMode;
  onChangeFitMode: (fit: FitMode) => void;
  lang: 'id' | 'en';
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  selectedPreset,
  onSelectPreset,
  dpi,
  onChangeDpi,
  fitMode,
  onChangeFitMode,
  lang,
}) => {
  const [isCustomMode, setIsCustomMode] = useState<boolean>(selectedPreset.category === 'custom' && selectedPreset.id !== 'original_ratio');
  const [customWidth, setCustomWidth] = useState<number>(selectedPreset.width || 3);
  const [customHeight, setCustomHeight] = useState<number>(selectedPreset.height || 4);
  const [customUnit, setCustomUnit] = useState<DimensionUnit>(selectedPreset.unit || 'cm');
  const [customName, setCustomName] = useState<string>('Ukuran Khusus');

  const handleApplyCustom = () => {
    const newPreset: SizePreset = {
      id: `custom_${Date.now()}`,
      name: `${customName} (${customWidth}x${customHeight} ${customUnit})`,
      nameEn: `Custom (${customWidth}x${customHeight} ${customUnit})`,
      category: 'custom',
      width: Number(customWidth) || 1,
      height: Number(customHeight) || 1,
      unit: customUnit,
      description: `Kustom ${customWidth} x ${customHeight} ${customUnit} @ ${dpi} DPI`,
    };
    onSelectPreset(newPreset);
    setIsCustomMode(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Crop className="w-3.5 h-3.5 text-blue-600" />
          <span>{lang === 'id' ? 'Ukuran & Dimensi' : 'Size & Dimensions'}</span>
        </label>
        <span className="text-xs text-blue-600 font-semibold">
          {lang === 'id' ? selectedPreset.name : selectedPreset.nameEn}
        </span>
      </div>

      {/* Quick Select Buttons for the Most Popular Pas Foto Sizes */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          SIZE_PRESETS.find((p) => p.id === 'pasfoto_2x3')!,
          SIZE_PRESETS.find((p) => p.id === 'pasfoto_3x4')!,
          SIZE_PRESETS.find((p) => p.id === 'pasfoto_4x6')!,
        ].map((preset) => {
          const isSelected = selectedPreset.id === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setIsCustomMode(false);
                onSelectPreset(preset);
              }}
              className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 font-bold shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold">{preset.name.replace('Pas Foto ', '')}</div>
              <div className="text-[10px] text-slate-500">{preset.description?.split('(')[0].trim()}</div>
            </button>
          );
        })}
      </div>

      {/* Dropdown for All Other Presets */}
      <div className="flex items-center gap-2">
        <select
          value={isCustomMode ? 'custom' : selectedPreset.id}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'custom') {
              setIsCustomMode(true);
            } else {
              setIsCustomMode(false);
              const found = SIZE_PRESETS.find((p) => p.id === val);
              if (found) onSelectPreset(found);
            }
          }}
          className="flex-1 px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        >
          <optgroup label={lang === 'id' ? 'Pas Foto Indonesia' : 'Indonesian ID Photos'}>
            {SIZE_PRESETS.filter((p) => p.category === 'pasfoto').map((p) => (
              <option key={p.id} value={p.id}>
                {lang === 'id' ? p.name : p.nameEn} - {p.description}
              </option>
            ))}
          </optgroup>

          <optgroup label={lang === 'id' ? 'Paspor & Visa Internasional' : 'Passport & Visa'}>
            {SIZE_PRESETS.filter((p) => p.category === 'passport').map((p) => (
              <option key={p.id} value={p.id}>
                {lang === 'id' ? p.name : p.nameEn}
              </option>
            ))}
          </optgroup>

          <optgroup label={lang === 'id' ? 'Media Sosial & Digital' : 'Social & Digital'}>
            {SIZE_PRESETS.filter((p) => p.category === 'social').map((p) => (
              <option key={p.id} value={p.id}>
                {lang === 'id' ? p.name : p.nameEn}
              </option>
            ))}
          </optgroup>

          <optgroup label={lang === 'id' ? 'Lainnya & Kustom' : 'Other & Custom'}>
            <option value="original_ratio">
              {lang === 'id' ? 'Ukuran Asli Foto (Tanpa Potong)' : 'Original Image Dimensions'}
            </option>
            <option value="custom">
              {lang === 'id' ? '+ Tentukan Ukuran Sendiri (Kustom)' : '+ Custom Dimensions...'}
            </option>
          </optgroup>
        </select>

        {/* DPI dropdown */}
        <select
          value={dpi}
          onChange={(e) => onChangeDpi(Number(e.target.value))}
          className="w-28 px-2.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          title="Resolusi DPI untuk cetak"
        >
          {DPI_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.value} DPI
            </option>
          ))}
        </select>
      </div>

      {/* Custom Size Form if active */}
      {isCustomMode && (
        <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2.5">
          <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
            <span>{lang === 'id' ? 'Pengaturan Ukuran Kustom' : 'Custom Dimensions'}</span>
            <span className="text-[11px] font-normal text-blue-700">@ {dpi} DPI</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                {lang === 'id' ? 'Lebar (W)' : 'Width (W)'}
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={customWidth}
                onChange={(e) => setCustomWidth(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                {lang === 'id' ? 'Tinggi (H)' : 'Height (H)'}
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={customHeight}
                onChange={(e) => setCustomHeight(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                {lang === 'id' ? 'Satuan' : 'Unit'}
              </label>
              <select
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value as DimensionUnit)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
              >
                <option value="cm">cm</option>
                <option value="mm">mm</option>
                <option value="inch">inch</option>
                <option value="px">pixel (px)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyCustom}
            className="w-full py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{lang === 'id' ? 'Gunakan Ukuran Ini' : 'Apply Dimension'}</span>
          </button>
        </div>
      )}

      {/* Fit Mode Selector */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500">
          {lang === 'id' ? 'Mode Pengepasan Objek:' : 'Subject Fit Mode:'}
        </span>
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
          {[
            { id: 'auto-portrait', label: lang === 'id' ? 'Pas Foto (Otomatis)' : 'Portrait Fit' },
            { id: 'cover', label: lang === 'id' ? 'Penuh (Cover)' : 'Cover' },
            { id: 'contain', label: lang === 'id' ? 'Muat (Contain)' : 'Contain' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChangeFitMode(m.id as FitMode)}
              className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all ${
                fitMode === m.id
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
