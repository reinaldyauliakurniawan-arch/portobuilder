// Konversi file konten (src/content/**) <-> state editor. Tanpa dependensi Astro: jalan di browser & Node.
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export const PATHS = {
  site: 'src/content/settings/site.json',
  theme: 'src/content/settings/theme.json',
  navigation: 'src/content/settings/navigation.json',
  home: 'src/content/pages/home.json',
  about: 'src/content/pages/about.json',
  customDir: 'src/content/custom-pages/',
  projectDir: 'src/content/projects/',
  uploads: 'public/uploads/',
} as const;

type Obj = Record<string, any>;

const CONTENT_RE = /^src\/content\/(settings\/(site|theme|navigation)\.json|pages\/(home|about)\.json|custom-pages\/[a-z0-9]+(-[a-z0-9]+)*\.json|projects\/[a-z0-9]+(-[a-z0-9]+)*\.md)$/;
const UPLOAD_RE = /^public\/uploads\/([a-z0-9]+(-[a-z0-9]+)*\/)*[a-z0-9]+([-_][a-z0-9]+)*\.(webp|png|jpe?g|gif|svg|pdf|mp4)$/;
/** Hanya path konten/upload yang dikenal yang boleh ditulis editor (mencegah path traversal). */
export const isWritableContent = (p: string) => CONTENT_RE.test(p);
export const isWritableUpload = (p: string) => UPLOAD_RE.test(p);

export interface ContentState {
  site: Obj;
  theme: Obj;
  navigation: Obj;
  home: Obj;
  about: Obj;
  /** id = nama file tanpa .json */
  customPages: Record<string, Obj>;
  /** id = nama file tanpa .md (= slug URL proyek) */
  projects: Record<string, { data: Obj; body: string }>;
}

export function parseMarkdown(src: string): { data: Obj; body: string } {
  const m = src.replace(/^\s+/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: src.trim() };
  return { data: (parseYaml(m[1]) as Obj) ?? {}, body: m[2].trim() };
}

export function stringifyMarkdown({ data, body }: { data: Obj; body: string }): string {
  return `---\n${stringifyYaml(clean(data), { lineWidth: 0 })}---\n\n${body.trim()}\n`;
}

const json = (o: Obj) => JSON.stringify(clean(o), null, 2) + '\n';

/** Buang undefined supaya file tetap rapi. String kosong dipertahankan (artinya "dikosongkan"). */
function clean<T>(v: T): T {
  return JSON.parse(JSON.stringify(v ?? null)) as T;
}

export function parseFiles(files: Record<string, string>): ContentState {
  const get = (p: string) => {
    if (!(p in files)) throw new Error(`File ${p} tidak ditemukan`);
    return JSON.parse(files[p]) as Obj;
  };
  const state: ContentState = {
    site: get(PATHS.site),
    theme: get(PATHS.theme),
    navigation: get(PATHS.navigation),
    home: get(PATHS.home),
    about: get(PATHS.about),
    customPages: {},
    projects: {},
  };
  for (const [p, text] of Object.entries(files)) {
    if (p.startsWith(PATHS.customDir) && p.endsWith('.json')) state.customPages[p.slice(PATHS.customDir.length, -5)] = JSON.parse(text);
    if (p.startsWith(PATHS.projectDir) && p.endsWith('.md')) state.projects[p.slice(PATHS.projectDir.length, -3)] = parseMarkdown(text);
  }
  return state;
}

export function serialize(s: ContentState): Record<string, string> {
  const out: Record<string, string> = {
    [PATHS.site]: json(s.site),
    [PATHS.theme]: json(s.theme),
    [PATHS.navigation]: json(s.navigation),
    [PATHS.home]: json(s.home),
    [PATHS.about]: json(s.about),
  };
  for (const [id, page] of Object.entries(s.customPages)) out[`${PATHS.customDir}${id}.json`] = json(page);
  for (const [id, p] of Object.entries(s.projects)) out[`${PATHS.projectDir}${id}.md`] = stringifyMarkdown(p);
  return out;
}

/** File yang berubah. `null` = dihapus. Dibandingkan setelah serialisasi supaya format seragam. */
export function diffFiles(base: Record<string, string>, next: Record<string, string>): Record<string, string | null> {
  const changes: Record<string, string | null> = {};
  for (const [p, c] of Object.entries(next)) if (base[p] !== c) changes[p] = c;
  for (const p of Object.keys(base)) if (!(p in next)) changes[p] = null;
  return changes;
}

/** Slug URL dari teks bebas: "Pameran 2026!" -> "pameran-2026". */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

/** id unik: "layanan", "layanan-2", ... */
export function uniqueId(base: string, taken: Iterable<string>): string {
  const set = new Set(taken);
  const b = base || 'halaman';
  if (!set.has(b)) return b;
  for (let i = 2; ; i++) if (!set.has(`${b}-${i}`)) return `${b}-${i}`;
}
