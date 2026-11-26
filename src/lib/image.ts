import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { luminance as _l, overlayAlpha, pickAccent } from './color';
import type { Preview } from './content';

type Locals = { preview?: Preview } | undefined;

// Gambar dari CMS ada di public/uploads, jadi tidak lewat astro:assets.
// Ukuran responsif dibuat Netlify Image CDN (/.netlify/images) saat jalan di Netlify;
// di lokal URL asli dipakai apa adanya. Lihat CLAUDE.md.
const USE_CDN = process.env.NETLIFY === 'true' || process.env.IMAGE_CDN === 'true';
export const WIDTHS = [480, 800, 1200, 1600, 2000];

const isLocal = (src: string) => src.startsWith('/');
const isSvg = (src: string) => /\.svg($|\?)/i.test(src);

function localPath(src: string) {
  const p = join(process.cwd(), 'public', decodeURIComponent(src.split('?')[0]));
  if (!existsSync(p)) throw new Error(`Gambar tidak ditemukan: "${src}". Pastikan file sudah di-upload lewat CMS.`);
  return p;
}

/** Di preview editor, gambar yang baru di-upload belum ada di disk. */
const pending = (src: string, l: Locals) =>
  !!l?.preview && isLocal(src) && !existsSync(join(process.cwd(), 'public', decodeURIComponent(src.split('?')[0])));

// Lazy: route preview (Netlify Function) biasanya tidak butuh modul native ini.
const loadSharp = async () => (await import('sharp')).default;

const dimCache = new Map<string, Promise<{ width: number; height: number }>>();

/** Ukuran asli gambar (untuk atribut width/height & layout masonry). */
export function getDimensions(src: string, l?: Locals) {
  const known = l?.preview?.assets?.[src];
  if (known) return Promise.resolve(known);
  if (!isLocal(src) || pending(src, l)) return Promise.resolve({ width: 1600, height: 1200 });
  let p = dimCache.get(src);
  if (!p) {
    p = loadSharp()
      .then((sharp) => sharp(localPath(src)).metadata())
      .then((m) => ({ width: m.width ?? 1600, height: m.height ?? 1200 }));
    dimCache.set(src, p);
  }
  return p;
}

export function cdnUrl(src: string, w: number, h?: number, q = 75, l?: Locals) {
  if (!USE_CDN || l?.preview || !isLocal(src) || isSvg(src)) return src;
  const params = new URLSearchParams({ url: src, w: String(w), q: String(q) });
  if (h) {
    params.set('h', String(h));
    params.set('fit', 'cover');
  }
  return `/.netlify/images?${params}`;
}

/** src/srcset/width/height untuk <img>. `ratio` = lebar/tinggi slot; kosong = rasio asli. */
export async function responsive(src: string, ratio?: number, maxWidth = 2000, l?: Locals) {
  const dims = await getDimensions(src, l);
  const r = ratio ?? dims.width / dims.height;
  const width = Math.min(dims.width, maxWidth);
  const height = Math.round(width / r);
  if (!USE_CDN || l?.preview || !isLocal(src) || isSvg(src)) return { src, srcset: undefined, width, height };
  const widths = WIDTHS.filter((w) => w <= dims.width);
  if (!widths.length) widths.push(dims.width);
  const srcset = widths.map((w) => `${cdnUrl(src, w, ratio ? Math.round(w / r) : undefined)} ${w}w`).join(', ');
  return { src: cdnUrl(src, widths.at(-1)!, ratio ? Math.round(widths.at(-1)! / r) : undefined), srcset, width, height };
}

const overlayCache = new Map<string, Promise<number>>();

/**
 * Opacity overlay gelap supaya teks putih di atas foto lolos 4,5:1 (Bagian 7 langkah 6).
 * Luminans persentil ke-95 diambil dari area teks (default: 70% bawah gambar).
 */
export function textOverlayAlpha(src: string, area: 'bottom' | 'center' = 'bottom', l?: Locals): Promise<number> {
  if (pending(src, l)) return Promise.resolve(0.55);
  const key = `${src}|${area}`;
  let p = overlayCache.get(key);
  if (!p) {
    p = (async () => {
      if (!isLocal(src) || isSvg(src)) return 0.55;
      const sharp = await loadSharp();
      const { data, info } = await sharp(localPath(src)).resize(96).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const y0 = area === 'bottom' ? Math.floor(info.height * 0.3) : Math.floor(info.height * 0.2);
      const y1 = area === 'bottom' ? info.height : Math.ceil(info.height * 0.8);
      const lums: number[] = [];
      for (let y = y0; y < y1; y++)
        for (let x = 0; x < info.width; x++) {
          const i = (y * info.width + x) * info.channels;
          const hex = '#' + [data[i], data[i + 1], data[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');
          lums.push(_l(hex));
        }
      lums.sort((a, b) => a - b);
      const p95 = lums[Math.floor(lums.length * 0.95)] ?? 1;
      return overlayAlpha(p95);
    })();
    overlayCache.set(key, p);
  }
  return p;
}

const accentCache = new Map<string, Promise<string | null>>();

/** Warna aksen otomatis dari foto (lib/color.ts pickAccent). `null` bila foto monokrom / belum ada di disk. */
export function imageAccent(src: string, l?: Locals): Promise<string | null> {
  if (!isLocal(src) || isSvg(src) || pending(src, l)) return Promise.resolve(null);
  let p = accentCache.get(src);
  if (!p) {
    p = (async () => {
      const sharp = await loadSharp();
      const { data } = await sharp(localPath(src)).resize(64, 64, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const hex = pickAccent(data, 4);
      console.log(`[tema] Aksen otomatis dari ${src}: ${hex ?? 'tidak ada warna dominan, memakai aksen preset'}`);
      return hex;
    })();
    accentCache.set(src, p);
  }
  return p;
}

const cutoutCache = new Map<string, Promise<boolean>>();

/**
 * Foto cutout dianggap transparan bila punya alpha dan ≥ 15% piksel hampir tembus pandang (alpha < 10).
 * Di preview editor, file yang belum ada di disk dianggap transparan bila PNG/WebP.
 */
export function isCutout(src: string, l?: Locals): Promise<boolean> {
  if (pending(src, l) || !isLocal(src)) return Promise.resolve(/\.(png|webp)$/i.test(src));
  if (isSvg(src)) return Promise.resolve(true);
  let p = cutoutCache.get(src);
  if (!p) {
    p = (async () => {
      const sharp = await loadSharp();
      const img = sharp(localPath(src));
      if (!(await img.metadata()).hasAlpha) return false;
      const { data, info } = await img.resize(128, 128, { fit: 'inside' }).extractChannel('alpha').raw().toBuffer({ resolveWithObject: true });
      let clear = 0;
      for (let i = 0; i < data.length; i++) if (data[i] < 10) clear++;
      return clear / (info.width * info.height) >= 0.15;
    })().then((ok) => {
      if (!ok) console.warn(`[hero cutout] Foto hero cutout belum transparan, memakai fallback vignette: ${src}`);
      return ok;
    });
    cutoutCache.set(src, p);
  }
  return p;
}

/**
 * Luminans persentil `pct` di area foto (koordinat 0–1). p95 = piksel terang terburuk untuk teks terang,
 * p5 = piksel gelap terburuk untuk teks gelap. Dipakai overlay teks & kaca.
 */
export function regionLum(src: string, box: { x0: number; y0: number; x1: number; y1: number }, pct = 0.95, l?: Locals): Promise<number> {
  if (!isLocal(src) || isSvg(src) || pending(src, l)) return Promise.resolve(pct >= 0.5 ? 0.6 : 0.02);
  return (async () => {
    const sharp = await loadSharp();
    const { data, info } = await sharp(localPath(src)).resize(96).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const lums: number[] = [];
    for (let y = Math.floor(info.height * box.y0); y < Math.ceil(info.height * box.y1); y++)
      for (let x = Math.floor(info.width * box.x0); x < Math.ceil(info.width * box.x1); x++) {
        const i = (y * info.width + x) * info.channels;
        lums.push(_l('#' + [data[i], data[i + 1], data[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')));
      }
    lums.sort((a, b) => a - b);
    return lums[Math.min(lums.length - 1, Math.floor(lums.length * pct))] ?? 0.6;
  })();
}
