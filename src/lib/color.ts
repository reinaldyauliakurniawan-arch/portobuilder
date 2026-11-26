import { clampChroma, converter, formatHex } from 'culori';

const toRgb = converter('rgb');
const toOklch = converter('oklch');

const BLACK = '#000000';
const WHITE = '#ffffff';
const MARGIN = 0.1;

function parse(hex: string) {
  const c = toRgb(hex);
  if (!c) throw new Error(`Warna tidak valid: "${hex}". Pakai format hex, contoh #1A1A1A.`);
  return c;
}

function lin(v: number) {
  v = Math.min(1, Math.max(0, v));
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** Luminans relatif WCAG 2.x. */
export function luminance(hex: string): number {
  const c = parse(hex);
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

export function contrastFromLum(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function contrast(a: string, b: string): number {
  return contrastFromLum(luminance(a), luminance(b));
}

export function normalize(hex: string): string {
  return formatHex(parse(hex));
}

/** Hitam atau putih, mana yang kontrasnya paling tinggi terhadap `bg`. */
export function bestExtreme(bg: string): string {
  return contrast(BLACK, bg) >= contrast(WHITE, bg) ? BLACK : WHITE;
}

/** Ganti lightness OKLCH, pertahankan hue & chroma (di-clamp ke gamut sRGB). */
function withLightness(hex: string, l: number): string {
  const c = toOklch(parse(hex))!;
  return formatHex(clampChroma({ ...c, l: Math.min(1, Math.max(0, l)) }, 'oklch'));
}

function lightnessOf(hex: string): number {
  return toOklch(parse(hex))!.l;
}

const minContrast = (hex: string, against: string[]) => Math.min(...against.map((b) => contrast(hex, b)));

/**
 * Geser lightness `hex` seminimal mungkin sampai kontrasnya ke semua warna `against` >= target.
 * against[0] adalah jangkar (latar): arah pertama menjauh dari luminansnya.
 */
export function ensureContrast(hex: string, against: string[], target: number): string {
  hex = normalize(hex);
  if (minContrast(hex, against) >= target) return hex;

  const goal = target + MARGIN;
  const startL = lightnessOf(hex);
  const first = bestExtreme(against[0]) === BLACK ? 0 : 1;

  for (const end of [first, 1 - first]) {
    if (minContrast(withLightness(hex, end), against) < goal) continue;
    let lo = startL; // gagal
    let hi = end; // lolos
    for (let i = 0; i < 32; i++) {
      const mid = (lo + hi) / 2;
      if (minContrast(withLightness(hex, mid), against) >= goal) hi = mid;
      else lo = mid;
    }
    const out = withLightness(hex, hi);
    if (minContrast(out, against) >= target) return out;
  }
  // Fallback terakhir: hitam/putih.
  return minContrast(BLACK, against) >= minContrast(WHITE, against) ? BLACK : WHITE;
}

/** Surface kartu: latar digeser 3–5% lightness, tanpa merusak warna ekstrem yang aman untuk teks. */
function deriveSurface(bg: string): string {
  const safe = bestExtreme(bg);
  const l = lightnessOf(bg);
  const candidates =
    safe === WHITE ? [withLightness(bg, l + 0.05), withLightness(bg, l - 0.04)] : [withLightness(bg, l + 0.04), withLightness(bg, l - 0.03)];
  for (const s of candidates) {
    if (s !== bg && contrast(safe, s) >= 4.5 + MARGIN && contrast(safe, bg) >= 4.5) return s;
  }
  return bg;
}

function mixLightness(from: string, toward: string, t: number): string {
  const a = lightnessOf(from);
  const b = lightnessOf(toward);
  return withLightness(from, a + (b - a) * t);
}

export interface ThemeInput {
  bg: string;
  text: string;
  accent: string;
  /** Titik awal opsional dari preset; tetap melewati pemeriksaan kontras. */
  surface?: string;
  muted?: string;
  /** Warna indikator status (non-teks, target 3:1). */
  success?: string;
}

export interface Adjustment {
  token: string;
  from: string;
  to: string;
  ratio: number;
}

export interface ThemeColors {
  vars: Record<string, string>;
  cardMode: 'dark' | 'light';
  adjustments: Adjustment[];
}

/** Target kontras per pasangan (Bagian 7 PRD). Dipakai juga oleh test. */
export const CONTRAST_RULES: { fg: string; bg: string[]; target: number }[] = [
  { fg: '--text', bg: ['--bg', '--surface'], target: 4.5 },
  { fg: '--muted', bg: ['--bg', '--surface'], target: 4.5 },
  { fg: '--accent', bg: ['--bg', '--surface'], target: 4.5 },
  { fg: '--accent-hover', bg: ['--bg', '--surface'], target: 4.5 },
  { fg: '--accent-contrast', bg: ['--accent'], target: 4.5 },
  { fg: '--accent-hover-contrast', bg: ['--accent-hover'], target: 4.5 },
  { fg: '--border', bg: ['--bg', '--surface'], target: 3 },
  { fg: '--success', bg: ['--bg', '--surface'], target: 3 },
];

export function buildThemeColors(input: ThemeInput): ThemeColors {
  const bg = normalize(input.bg);
  // Surface preset dipakai hanya bila teks ekstrem yang aman tetap lolos di atasnya.
  const presetSurface = input.surface && contrast(bestExtreme(bg), normalize(input.surface)) >= 4.5 + MARGIN ? normalize(input.surface) : undefined;
  const surface = presetSurface ?? deriveSurface(bg);
  const pair = [bg, surface];
  const adjustments: Adjustment[] = [];

  const track = (token: string, from: string, to: string, against: string[]) => {
    if (normalize(from) !== to) adjustments.push({ token, from: normalize(from), to, ratio: round2(minContrast(to, against)) });
    return to;
  };

  const text = track('--text', input.text, ensureContrast(input.text, pair, 4.5), pair);
  const mutedRaw = ensureContrast(input.muted ?? mixLightness(text, bg, 0.35), pair, 4.5);
  const muted = input.muted ? track('--muted', input.muted, mutedRaw, pair) : mutedRaw;
  const border = ensureContrast(mixLightness(text, bg, 0.6), pair, 3);
  const accent = track('--accent', input.accent, ensureContrast(input.accent, pair, 4.5), pair);
  const accentL = lightnessOf(accent);
  const hoverStart = withLightness(accent, bestExtreme(bg) === BLACK ? accentL - 0.08 : accentL + 0.08);
  const accentHover = ensureContrast(hoverStart, pair, 4.5);

  return {
    vars: {
      '--bg': bg,
      '--surface': surface,
      '--text': text,
      '--muted': muted,
      '--border': border,
      '--accent': accent,
      '--accent-contrast': bestExtreme(accent),
      '--accent-hover': accentHover,
      '--accent-hover-contrast': bestExtreme(accentHover),
      '--success': ensureContrast(input.success ?? '#16A34A', pair, 3),
    },
    cardMode: luminance(bg) < 0.18 ? 'dark' : 'light',
    adjustments,
  };
}

/**
 * Opacity overlay hitam supaya teks putih di atas foto lolos 4,5:1.
 * `p95Lum` = luminans persentil ke-95 area teks pada gambar.
 */
export function overlayAlpha(p95Lum: number, target = 4.5): number {
  // Luminans -> nilai abu-abu sRGB, lalu digelapkan (1 - a).
  const gray = p95Lum <= 0.0031308 ? p95Lum * 12.92 : 1.055 * p95Lum ** (1 / 2.4) - 0.055;
  const passes = (a: number) => contrastFromLum(1, lin(gray * (1 - a))) >= target + MARGIN;
  if (passes(0)) return 0;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (passes(mid)) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi * 100) / 100;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Warna aksen dari piksel foto: hue dominan di antara piksel yang cukup berwarna
 * (abaikan hampir hitam/putih dan abu dengan chroma OKLCH < 0,08), lalu ambil versi yang paling saturasi
 * dari hue itu (persentil ke-80 chroma). `null` bila foto praktis monokrom.
 */
export function pickAccent(px: ArrayLike<number>, channels: number): string | null {
  const BINS = 24;
  const weight = new Array<number>(BINS).fill(0);
  const members: { c: number; hex: string }[][] = Array.from({ length: BINS }, () => []);
  for (let i = 0; i + 2 < px.length; i += channels) {
    if (channels === 4 && px[i + 3] < 128) continue;
    const hex = '#' + [px[i], px[i + 1], px[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');
    const o = toOklch(hex);
    if (!o || o.l < 0.2 || o.l > 0.95 || (o.c ?? 0) < 0.08 || o.h === undefined) continue;
    const b = Math.floor(((o.h % 360) / 360) * BINS) % BINS;
    weight[b] += o.c;
    members[b].push({ c: o.c, hex });
  }
  // Hue bertetangga dijumlah supaya gradasi satu warna tidak terpecah ke dua bin.
  let best = -1;
  let bestW = 0;
  for (let b = 0; b < BINS; b++) {
    const w = weight[b] + 0.5 * (weight[(b + 1) % BINS] + weight[(b + BINS - 1) % BINS]);
    if (w > bestW) {
      bestW = w;
      best = b;
    }
  }
  const total = members.reduce((n, m) => n + m.length, 0);
  if (best < 0 || members[best].length < Math.max(3, total * 0.02)) return null;
  const sorted = members[best].sort((a, b) => a.c - b.c);
  return normalize(sorted[Math.floor(sorted.length * 0.8)].hex);
}

/**
 * Opacity scrim hitam di bawah panel kaca supaya teks putih lolos `target` pada kondisi terburuk:
 * luminans persentil-95 foto, digelapkan scrim, lalu dicampur tint putih kaca (`tint`).
 */
export function glassScrim(p95Lum: number, tint = 0.06, target = 4.5): number {
  const gray = p95Lum <= 0.0031308 ? p95Lum * 12.92 : 1.055 * p95Lum ** (1 / 2.4) - 0.055;
  const lumAt = (a: number) => lin(gray * (1 - a) * (1 - tint) + tint);
  const passes = (a: number) => contrastFromLum(1, lumAt(a)) >= target + MARGIN;
  if (passes(0)) return 0;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (passes(mid)) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi * 100) / 100;
}

/** Token "skema gelap lokal" untuk satu section (mis. kartu hero showcase) di atas preset terang. */
export function darkScheme(base: string, accent: string): Record<string, string> {
  const bg = luminance(base) < 0.05 ? normalize(base) : '#0a0a0a';
  return buildThemeColors({ bg, text: '#ffffff', accent }).vars;
}

/** Luminans -> nilai abu-abu sRGB 0–1. */
const toGray = (lum: number) => (lum <= 0.0031308 ? lum * 12.92 : 1.055 * lum ** (1 / 2.4) - 0.055);

/**
 * Opacity lapisan `overlayHex` di atas foto supaya `textHex` lolos `target` pada piksel terburuk
 * (`worstLum`: p95 untuk teks terang, p5 untuk teks gelap). Dipakai nama raksasa (3:1) & teks di atas foto (4,5:1).
 */
export function scrimAlpha(worstLum: number, overlayHex: string, textHex: string, target: number): number {
  const g = toGray(worstLum);
  const o = toGray(luminance(overlayHex));
  const t = luminance(textHex);
  const passes = (a: number) => contrastFromLum(t, lin(g * (1 - a) + o * a)) >= target + MARGIN;
  if (passes(0)) return 0;
  if (!passes(1)) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (passes(mid)) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi * 100) / 100;
}
