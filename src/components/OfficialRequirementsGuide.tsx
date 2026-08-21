import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck, CheckCircle, Info } from 'lucide-react';

interface OfficialRequirementsGuideProps {
  lang: 'id' | 'en';
}

export const OfficialRequirementsGuide: React.FC<OfficialRequirementsGuideProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              {lang === 'id'
                ? 'Panduan Warna & Ketentuan Pas Foto Resmi Indonesia'
                : 'Indonesian Official ID & Passport Photo Guidelines'}
            </h4>
            <p className="text-[11px] text-slate-500">
              {lang === 'id'
                ? 'Aturan warna merah vs biru, ukuran Disdukcapil, BKN, CPNS, dan Kedubes'
                : 'Rules for Red vs Blue backgrounds, CPNS, civil registry, and visas'}
            </p>
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs text-slate-600 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Merah */}
            <div className="p-3 rounded-xl bg-red-50/50 border border-red-100 space-y-1">
              <div className="font-bold text-red-900 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
                <span>Background Merah (#DB1514)</span>
              </div>
              <p className="text-[11px] text-slate-700">
                <strong>Untuk Tahun Kelahiran GANJIL</strong> (contoh: 1993, 1995, 1997, 2001, dsb.). Digunakan
                untuk pembuatan KTP, SKCK, Rekrutmen CPNS / CASN, BKN, SIM, dan Kedinasan.
              </p>
            </div>

            {/* Biru */}
            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                <span>Background Biru (#0055A5)</span>
              </div>
              <p className="text-[11px] text-slate-700">
                <strong>Untuk Tahun Kelahiran GENAP</strong> (contoh: 1994, 1996, 1998, 2000, dsb.). Digunakan
                untuk KTP, Ijazah Sekolah/Universitas, SKCK, dan Dokumen Instansi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">2x3 cm (21.6x27.9 mm)</strong>
              Buku Nikah (KUA), Ijazah, KTA, Registrasi Kampus.
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">3x4 cm (27.9x38.1 mm)</strong>
              KTP, SKCK Polri, Lamaran Kerja, Ijazah, SIM.
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">4x6 cm (38.1x55.9 mm)</strong>
              Paspor Imigrasi, Pendaftaran CPNS/Kedinasan, BKN, Visa.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
