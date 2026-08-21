import { SizePreset, BackgroundConfig } from '../types';

export interface ColorPresetCategory {
  id: string;
  name: string;
  nameEn: string;
  colors: {
    name: string;
    nameEn: string;
    color: string;
    desc?: string;
    secondaryColor?: string;
    gradientDirection?: 'to-bottom' | 'to-right' | 'to-bottom-right' | 'radial';
  }[];
}

export const COLOR_CATEGORIES: ColorPresetCategory[] = [
  {
    id: 'pasfoto_resmi',
    name: 'Pas Foto Resmi Indonesia',
    nameEn: 'Indonesian Official ID Photos',
    colors: [
      {
        name: 'Merah Resmi (Ganjil)',
        nameEn: 'Official Red (Odd Year)',
        color: '#db1514',
        desc: 'KTP, SKCK, CPNS, SIM (Tahun Kelahiran Ganjil)',
      },
      {
        name: 'Biru Resmi (Genap)',
        nameEn: 'Official Blue (Even Year)',
        color: '#0055a5',
        desc: 'KTP, SKCK, Ijazah, BKN (Tahun Kelahiran Genap)',
      },
      {
        name: 'Putih Bersih (Visa/Haji)',
        nameEn: 'Pure White (Visa/Hajj)',
        color: '#FFFFFF',
        desc: 'Visa Umroh/Haji, Paspor Internasional, Kedubes',
      },
      {
        name: 'Kuning Lembaga',
        nameEn: 'Institution Yellow',
        color: '#f59e0b',
        desc: 'KTA, Sertifikat, Wisuda universitas tertentu',
      },
      {
        name: 'Hijau Kedinasan',
        nameEn: 'Military/Gov Green',
        color: '#15803d',
        desc: 'Instansi Lingkungan, Kemenag, TNI/Polri tertentu',
      },
      {
        name: 'Abu-Abu Studio Netral',
        nameEn: 'Neutral Gray Studio',
        color: '#64748b',
        desc: 'Foto profil profesional, resume, kartu pegawai',
      },
    ],
  },
  {
    id: 'pastel_soft',
    name: 'Pastel & Studio Lembut',
    nameEn: 'Pastel & Soft Studio',
    colors: [
      { name: 'Sky Soft Blue', nameEn: 'Sky Soft Blue', color: '#bae6fd' },
      { name: 'Warm Cream Peach', nameEn: 'Warm Cream Peach', color: '#fed7aa' },
      { name: 'Mint Sage', nameEn: 'Mint Sage', color: '#bbf7d0' },
      { name: 'Soft Lavender', nameEn: 'Soft Lavender', color: '#e9d5ff' },
      { name: 'Dusty Rose', nameEn: 'Dusty Rose', color: '#fbcfe8' },
      { name: 'Alabaster Beige', nameEn: 'Alabaster Beige', color: '#f5f5f4' },
      { name: 'Matcha Foam', nameEn: 'Matcha Foam', color: '#dcfce7' },
      { name: 'Lemon Custard', nameEn: 'Lemon Custard', color: '#fef08a' },
    ],
  },
  {
    id: 'solid_modern',
    name: 'Modern & Korporat',
    nameEn: 'Modern & Corporate',
    colors: [
      { name: 'Midnight Navy', nameEn: 'Midnight Navy', color: '#0f172a' },
      { name: 'Deep Royal Blue', nameEn: 'Deep Royal Blue', color: '#1e3a8a' },
      { name: 'Dark Slate', nameEn: 'Dark Slate', color: '#334155' },
      { name: 'Emerald Forest', nameEn: 'Emerald Forest', color: '#064e3b' },
      { name: 'Crimson Velvet', nameEn: 'Crimson Velvet', color: '#881337' },
      { name: 'Pitch Black', nameEn: 'Pitch Black', color: '#18181b' },
      { name: 'Warm Mocha', nameEn: 'Warm Mocha', color: '#451a03' },
      { name: 'Deep Amethyst', nameEn: 'Deep Amethyst', color: '#4c1d95' },
    ],
  },
  {
    id: 'gradients',
    name: 'Gradien Studio & Trend',
    nameEn: 'Studio & Trend Gradients',
    colors: [
      {
        name: 'Studio Spotlight (Radial)',
        nameEn: 'Studio Spotlight (Radial)',
        color: '#3b82f6',
        secondaryColor: '#1e1b4b',
        gradientDirection: 'radial',
      },
      {
        name: 'Studio Gray Vignette',
        nameEn: 'Studio Gray Vignette',
        color: '#94a3b8',
        secondaryColor: '#1e293b',
        gradientDirection: 'radial',
      },
      {
        name: 'Red Warm Aura',
        nameEn: 'Red Warm Aura',
        color: '#ef4444',
        secondaryColor: '#7f1d1d',
        gradientDirection: 'to-bottom',
      },
      {
        name: 'Sunset Horizon',
        nameEn: 'Sunset Horizon',
        color: '#f97316',
        secondaryColor: '#db2777',
        gradientDirection: 'to-bottom-right',
      },
      {
        name: 'Ocean Breeze',
        nameEn: 'Ocean Breeze',
        color: '#06b6d4',
        secondaryColor: '#2563eb',
        gradientDirection: 'to-bottom',
      },
      {
        name: 'Aurora Borealis',
        nameEn: 'Aurora Borealis',
        color: '#10b981',
        secondaryColor: '#3b82f6',
        gradientDirection: 'to-bottom-right',
      },
    ],
  },
];

export const SIZE_PRESETS: SizePreset[] = [
  // Pas Foto Indonesia (Standar Disdukcapil / BKN / Kemenkumham)
  {
    id: 'pasfoto_2x3',
    name: 'Pas Foto 2x3 cm',
    nameEn: 'Passport 2x3 cm',
    category: 'pasfoto',
    width: 2.16,
    height: 2.79,
    unit: 'cm',
    description: 'Buku Nikah, Ijazah, KTA (21.6 x 27.9 mm)',
    aspectRatioDisplay: '2:3',
  },
  {
    id: 'pasfoto_3x4',
    name: 'Pas Foto 3x4 cm',
    nameEn: 'Passport 3x4 cm',
    category: 'pasfoto',
    width: 2.79,
    height: 3.81,
    unit: 'cm',
    description: 'KTP, SKCK, Ijazah, Lamaran Kerja (27.9 x 38.1 mm)',
    aspectRatioDisplay: '3:4',
  },
  {
    id: 'pasfoto_4x6',
    name: 'Pas Foto 4x6 cm',
    nameEn: 'Passport 4x6 cm',
    category: 'pasfoto',
    width: 3.81,
    height: 5.59,
    unit: 'cm',
    description: 'Paspor Indonesia, CPNS, BKN, SIM (38.1 x 55.9 mm)',
    aspectRatioDisplay: '4:6',
  },
  {
    id: 'id_card_ktp',
    name: 'Format KTP / ID Card (CR80)',
    nameEn: 'ID Card / KTP Size (CR80)',
    category: 'pasfoto',
    width: 8.56,
    height: 5.4,
    unit: 'cm',
    description: 'Ukuran kartu KTP / SIM / Badge (85.6 x 54 mm)',
    aspectRatioDisplay: '16:10',
  },

  // Paspor & Visa Internasional
  {
    id: 'paspor_ri',
    name: 'Paspor RI Resmi (3.5 x 4.5 cm)',
    nameEn: 'Indonesian Passport (3.5 x 4.5 cm)',
    category: 'passport',
    width: 3.5,
    height: 4.5,
    unit: 'cm',
    description: 'Standar Imigrasi Indonesia & ICAO',
    aspectRatioDisplay: '7:9',
  },
  {
    id: 'visa_us',
    name: 'Visa USA / India (5x5 cm / 2x2 in)',
    nameEn: 'USA / India Visa (5x5 cm / 2x2 in)',
    category: 'passport',
    width: 5.08,
    height: 5.08,
    unit: 'cm',
    description: 'Square 2 x 2 inch (50.8 x 50.8 mm)',
    aspectRatioDisplay: '1:1',
  },
  {
    id: 'visa_schengen',
    name: 'Visa Schengen / Eropa (3.5 x 4.5 cm)',
    nameEn: 'Schengen / Europe Visa (3.5 x 4.5 cm)',
    category: 'passport',
    width: 3.5,
    height: 4.5,
    unit: 'cm',
    description: 'Standar Visa Negara Uni Eropa',
    aspectRatioDisplay: '7:9',
  },
  {
    id: 'visa_japan',
    name: 'Visa Jepang / Korea (4.5 x 4.5 cm)',
    nameEn: 'Japan / Korea Visa (4.5 x 4.5 cm)',
    category: 'passport',
    width: 4.5,
    height: 4.5,
    unit: 'cm',
    description: 'Kedutaan Besar Jepang & Korea Selatan',
    aspectRatioDisplay: '1:1',
  },

  // Media Sosial & Digital
  {
    id: 'social_square',
    name: 'Persegi 1:1 (Avatar / IG Feed)',
    nameEn: 'Square 1:1 (Avatar / IG Feed)',
    category: 'social',
    width: 1080,
    height: 1080,
    unit: 'px',
    description: '1080 x 1080 px untuk Foto Profil / WhatsApp / Instagram',
    aspectRatioDisplay: '1:1',
  },
  {
    id: 'social_portrait',
    name: 'Portrait 4:5 (Instagram Feed)',
    nameEn: 'Portrait 4:5 (Instagram Feed)',
    category: 'social',
    width: 1080,
    height: 1350,
    unit: 'px',
    description: '1080 x 1350 px Feed Vertikal Instagram',
    aspectRatioDisplay: '4:5',
  },
  {
    id: 'social_story',
    name: 'Story / Reel 9:16 (Vertikal Penuh)',
    nameEn: 'Story / Reel 9:16 (Full Vertical)',
    category: 'social',
    width: 1080,
    height: 1920,
    unit: 'px',
    description: '1080 x 1920 px TikTok / IG Story / WA Status',
    aspectRatioDisplay: '9:16',
  },
  {
    id: 'social_landscape',
    name: 'Landscape 16:9 (Presentasi / YouTube)',
    nameEn: 'Landscape 16:9 (YouTube / Presentation)',
    category: 'social',
    width: 1920,
    height: 1080,
    unit: 'px',
    description: '1920 x 1080 px Banner / Slide / Thumbnail',
    aspectRatioDisplay: '16:9',
  },
  {
    id: 'original_ratio',
    name: 'Ukuran Asli Foto (Tanpa Crop)',
    nameEn: 'Original Image Dimensions',
    category: 'custom',
    width: 0,
    height: 0,
    unit: 'px',
    description: 'Mempertahankan resolusi dan dimensi foto asli',
    aspectRatioDisplay: 'Original',
  },
];

export const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: 'solid',
  color: '#db1514', // Default Merah Paspor Resmi RI
};

export const DPI_OPTIONS = [
  { value: 72, label: '72 DPI (Web & Layar Standar)' },
  { value: 150, label: '150 DPI (Draft / Medium Print)' },
  { value: 300, label: '300 DPI (Standar Cetak Foto Studio / Lab)' },
  { value: 600, label: '600 DPI (Ultra High-Definition Print)' },
];

// Sample demo images (SVG Data URLs representing diverse portraits for instant 1-click testing)
export const SAMPLE_DEMO_IMAGES = [
  {
    name: 'sample-pria-formal.jpg',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    title: 'Pria Formal (Jas)',
  },
  {
    name: 'sample-wanita-hijab.jpg',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    title: 'Wanita Studio Portrait',
  },
  {
    name: 'sample-pria-casual.jpg',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    title: 'Pria Kemeja',
  },
  {
    name: 'sample-wanita-profesional.jpg',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    title: 'Wanita Profesional',
  },
];
