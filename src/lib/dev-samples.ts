// Data contoh untuk katalog /dev/sections. Setiap sampel di-parse dengan skema Zod,
// jadi katalog sekaligus membuktikan sampel valid.
import { SECTION_TYPES, sectionSchemas, type Section, type SectionType } from './schemas';

export type Mode = 'normal' | 'max' | 'min';

const WORDS = 'desain yang jelas membantu orang memahami cerita brand anda lebih cepat dan lebih lama diingat'.split(' ');
/** Teks sepanjang `n` karakter (batas maksimum CMS). */
export const long = (n: number) => {
  let s = '';
  let i = 0;
  while (s.length < n) s += (s ? ' ' : '') + WORDS[i++ % WORDS.length];
  return s.slice(0, n).trimEnd();
};
const t = (mode: Mode, normal: string, max: number) => (mode === 'max' ? long(max) : normal);

const link = { linkType: 'builtin', builtinPage: 'projects' };

export function variantsOf(type: SectionType): string[] {
  const v = (sectionSchemas[type].shape as Record<string, any>).variant;
  return v.unwrap().options as string[];
}

function raw(type: SectionType, variant: string, mode: Mode): Record<string, unknown> {
  const min = mode === 'min';
  const base = { type, enabled: true, variant };
  switch (type) {
    case 'hero': {
      const sc = variant === 'showcase';
      return {
        ...base,
        eyebrow: min ? '' : t(mode, 'Desainer · Yogyakarta', sc ? 32 : 40),
        headline: t(mode, 'Brand dan produk digital yang mudah dipahami', sc ? 60 : 80),
        subheadline: min ? '' : t(mode, 'Tujuh tahun membantu UMKM dan startup tampil jelas.', sc ? 120 : 160),
        image: min && variant !== 'cutout' ? '' : '/uploads/sample/hero.webp',
        imageAlt: 'Komposisi geometris',
        primaryCta: min ? undefined : { label: t(mode, 'Lihat proyek', 30), ...link },
        secondaryCta: min ? undefined : { label: t(mode, 'Hubungi saya', 30), linkType: 'builtin', builtinPage: '#kontak' },
        ...(variant === 'spotlight' && {
          image: min ? '' : '/uploads/sample/spotlight-subject.webp',
          displayName: min ? '' : t(mode, 'Raka Pratama', 40),
          serviceColumns: min ? [] : [1, 2, 3].map((i) => ({ label: `0${i}`, title: t(mode, 'Identitas brand', 40), description: t(mode, 'Logo, warna, dan tipografi yang konsisten.', 90) })),
        }),
        ...(sc && {
          image: min ? '' : '/uploads/sample/showcase-subject.webp',
          heroVideoUrl: min ? '' : 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
          serviceColumns: min ? [] : [1, 2, 3].map(() => ({ title: t(mode, 'Identitas brand', 40), description: t(mode, 'Logo, warna, dan panduan brand.', 90) })),
        }),
        // Cutout: normal = PNG/WebP transparan; max = foto berlatar (uji fallback + peringatan build); min = hanya `image`.
        ...(variant === 'cutout' && {
          cutoutImage: min ? '' : mode === 'max' ? '/uploads/sample/hero.webp' : '/uploads/sample/cutout-figure.webp',
          displayName: min ? '' : t(mode, 'Raka Pratama', 40),
          intro: min ? '' : t(mode, 'Desainer brand & produk digital dari Yogyakarta.', 120),
          textCta: min ? undefined : { label: t(mode, '// HIRE ME', 30), linkType: 'builtin', builtinPage: '#kontak' },
          rotatingServices: min ? [] : (mode === 'max' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4]).map((i) => t(mode, `Layanan ${i}`, 28)),
          watermarkText: mode === 'max' ? long(16) : '',
        }),
      };
    }
    case 'featuredProjects':
      return { ...base, eyebrow: min ? '' : t(mode, 'Karya pilihan', 40), title: min ? '' : t(mode, 'Proyek unggulan', 80), count: mode === 'max' ? 9 : 3, source: 'latest' };
    case 'richText':
      return {
        ...base,
        title: min ? '' : t(mode, 'Cara saya bekerja', 80),
        body: mode === 'max' ? `## ${long(60)}\n\n${long(600)}\n\n- ${long(80)}\n- ${long(80)}\n\n> ${long(140)}` : 'Saya mulai dari **riset singkat**, lalu menguji ide sedini mungkin.\n\n- Dengarkan dulu\n- Gambar kemudian',
      };
    case 'video':
      return { ...base, youtubeUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', title: t(mode, 'Showreel 2026', 100), caption: min ? '' : t(mode, 'Kumpulan animasi tahun ini.', 200) };
    case 'aboutShort':
      return {
        ...base,
        eyebrow: min ? '' : t(mode, 'Tentang saya', 40),
        title: min ? '' : t(mode, 'Desain yang bekerja', 80),
        text: mode === 'max' ? long(500) : 'Saya mulai dari pertanyaan sederhana: siapa yang akan memakai ini?',
        image: min ? '' : '/uploads/sample/about.webp',
        imageAlt: 'Potret abstrak',
        cta: min ? undefined : { label: t(mode, 'Kenalan', 30), linkType: 'builtin', builtinPage: 'about' },
      };
    case 'stats':
      return {
        ...base,
        title: min ? '' : t(mode, 'Dalam angka', 80),
        items: (min ? [1] : [1, 2, 3, 4]).map((i) => ({ value: mode === 'max' ? '1234567890' : `${i * 12}+`, label: t(mode, 'Proyek selesai', 40) })),
      };
    case 'logos':
      return { ...base, title: min ? '' : t(mode, 'Dipercaya oleh', 80), items: (min ? [1] : [1, 2, 3, 4, 5, 6]).map((i) => ({ logo: `/uploads/sample/logo-${i}.svg`, name: `Klien ${i}` })) };
    case 'testimonials':
      return {
        ...base,
        title: min ? '' : t(mode, 'Kata mereka', 80),
        items: (min ? [1] : [1, 2, 3, 4]).map((i) => ({ quote: t(mode, 'Prosesnya rapi dan setiap keputusan ada alasannya.', 400), name: t(mode, `Klien ${i}`, 60), role: min ? '' : t(mode, 'Pemilik usaha', 80), photo: min ? '' : `/uploads/sample/avatar-${i}.webp` })),
      };
    case 'services':
      return {
        ...base,
        eyebrow: min ? '' : t(mode, 'Layanan', 40),
        title: min ? '' : t(mode, 'Apa yang saya kerjakan', 80),
        intro: min ? '' : t(mode, 'Semua paket termasuk dua kali revisi.', 240),
        items: (min ? [1] : [1, 2, 3]).map(() => ({ title: t(mode, 'Identitas brand', 60), description: t(mode, 'Logo, warna, tipografi, dan panduan brand.', 300), price: min ? '' : t(mode, 'Mulai Rp7,5 juta', 40), cta: min ? undefined : { label: t(mode, 'Tanya', 30), ...link } })),
      };
    case 'faq':
      return { ...base, title: t(mode, 'Pertanyaan umum', 80), items: (min ? [1] : [1, 2, 3]).map(() => ({ question: t(mode, 'Berapa lama satu proyek?', 160), answer: mode === 'max' ? long(500) : 'Rata-rata **3–4 minggu**.' })) };
    case 'gallery':
      return { ...base, title: min ? '' : t(mode, 'Galeri', 80), items: (min ? [1] : [1, 2, 3, 4, 5, 6]).map((i) => ({ image: `/uploads/sample/gallery-${i}.webp`, alt: `Contoh galeri ${i}`, caption: min ? '' : t(mode, 'Keterangan foto', 160) })) };
    case 'map':
      return { ...base, title: min ? '' : t(mode, 'Lokasi studio', 80), embedUrl: 'https://maps.google.com/maps?q=Yogyakarta&output=embed', address: min ? '' : t(mode, 'Jl. Contoh No. 12, Yogyakarta', 240), hours: min ? '' : t(mode, 'Senin–Jumat 09.00–17.00', 240) };
    case 'ctaBanner':
      return { ...base, headline: t(mode, 'Punya proyek? Ayo ngobrol.', 100), button: { label: t(mode, 'Hubungi saya', 30), linkType: 'builtin', builtinPage: '#kontak' } };
    case 'contact':
      return { ...base, title: t(mode, 'Mari bekerja sama', 80), text: min ? '' : t(mode, 'Saya balas dalam 1×24 jam.', 300), showForm: !min, showDirect: true };
  }
}

export function sample(type: SectionType, variant: string, mode: Mode): Section {
  const r = sectionSchemas[type].safeParse(raw(type, variant, mode));
  if (!r.success) throw new Error(`[dev-samples] ${type}/${variant}/${mode} tidak valid: ${r.error.message}`);
  return r.data as Section;
}

export const catalog = SECTION_TYPES.flatMap((type) => variantsOf(type).map((variant) => ({ type, variant })));
