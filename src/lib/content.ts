import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { RESERVED_SLUGS } from './schemas';

export type CustomPage = CollectionEntry<'customPages'>;
export type ProjectData = CollectionEntry<'projects'>['data'];
/** Proyek minimal yang dipakai komponen (entri koleksi, atau override dari editor). */
export interface Project {
  id: string;
  data: ProjectData;
  body?: string;
}

/**
 * Data override dari editor visual (/edit). Diisi di Astro.locals.preview oleh route /edit/render,
 * supaya halaman bisa dirender dengan konten yang belum dipublikasikan. Di build biasa kosong.
 */
export interface Preview {
  site?: CollectionEntry<'site'>['data'];
  theme?: CollectionEntry<'theme'>['data'];
  navigation?: CollectionEntry<'navigation'>['data'];
  customPages?: { slug: string; title: string; draft: boolean }[];
  projects?: Project[];
  /** Beranda draft: sumber foto untuk aksen `auto`. */
  home?: CollectionEntry<'home'>['data'];
  /** Dimensi gambar yang baru di-upload dan belum ada di disk. */
  assets?: Record<string, { width: number; height: number }>;
  /** true = dirender di kanvas editor (penanda edit, tanpa animasi/ClientRouter, section tersembunyi tampil, link longgar). */
  canvas?: boolean;
}
type Locals = { preview?: Preview } | undefined;

export interface LinkLike {
  label?: string;
  linkType?: 'builtin' | 'custom' | 'external' | 'none';
  builtinPage?: string;
  customPage?: string;
  url?: string;
}

const BUILTIN_HREF: Record<string, string> = { home: '/', projects: '/projects', about: '/about', '#kontak': '/#kontak' };

type Single = 'site' | 'theme' | 'navigation' | 'home' | 'about';
/** Koleksi satu-file: id entri sama dengan nama koleksi. */
async function one<C extends Single>(c: C): Promise<CollectionEntry<C>['data']> {
  const e = await getEntry(c, c);
  if (!e) throw new Error(`File konten untuk "${c}" tidak ditemukan di src/content.`);
  return e.data as CollectionEntry<C>['data'];
}

export const getSite = async (l?: Locals) => l?.preview?.site ?? one('site');
export const getTheme = async (l?: Locals) => l?.preview?.theme ?? one('theme');
export const getHome = () => one('home');

/** Foto hero pertama di Beranda: sumber warna aksen `auto`. */
export async function accentSource(l?: Locals): Promise<string | undefined> {
  const home = l?.preview?.home ?? (await getHome());
  const hero = home.sections.find((s) => s.enabled && s.type === 'hero') as { cutoutImage?: string; image?: string } | undefined;
  return hero?.cutoutImage || hero?.image;
}
export const getAbout = () => one('about');

/** Halaman custom yang terbit. Gagal build bila slug bentrok/dicadangkan. */
export async function getCustomPages(): Promise<CustomPage[]> {
  const all = await getCollection('customPages');
  const seen = new Map<string, string>();
  for (const p of all) {
    const where = p.filePath ?? p.id;
    if (RESERVED_SLUGS.includes(p.data.slug)) throw new Error(`[Halaman Custom] ${where}: slug "${p.data.slug}" dicadangkan sistem.`);
    const other = seen.get(p.data.slug);
    if (other) throw new Error(`[Halaman Custom] Slug "${p.data.slug}" dipakai dua halaman: ${other} dan ${where}. Ganti salah satu.`);
    seen.set(p.data.slug, where);
  }
  return all.filter((p) => !p.data.draft);
}

export function sortProjects<T extends Project>(list: T[]): T[] {
  return list
    .filter((p) => !p.data.draft)
    .sort((a, b) => {
      const oa = a.data.order ?? Infinity;
      const ob = b.data.order ?? Infinity;
      if (oa !== ob) return oa - ob;
      return b.data.year - a.data.year || a.data.title.localeCompare(b.data.title);
    });
}

/** Proyek terbit, urut `order` lalu `year` terbaru. */
export async function getProjects(l?: Locals): Promise<Project[]> {
  if (l?.preview?.projects) return sortProjects(l.preview.projects);
  return sortProjects(await getCollection('projects'));
}

/**
 * Ubah link jadi href. Link ke halaman custom yang tidak ada / draft menggagalkan build.
 * Di preview editor (`lenient`) link rusak menjadi "#" supaya kanvas tetap tampil; editor memvalidasi sendiri.
 */
export function resolveHref(link: LinkLike, publishedSlugs: Set<string>, where: string, lenient = false): string {
  switch (link.linkType) {
    case 'builtin':
      return BUILTIN_HREF[link.builtinPage ?? ''] ?? '/';
    case 'custom':
      if (!link.customPage || !publishedSlugs.has(link.customPage)) {
        if (lenient) return '#';
        throw new Error(
          `[${where}] Link "${link.label ?? ''}" mengarah ke halaman custom "/${link.customPage}" yang tidak ada atau masih draft. Hapus link ini dari menu, atau terbitkan halamannya.`,
        );
      }
      return `/${link.customPage}`;
    case 'external':
      return link.url ?? '#';
    case 'none':
      return '';
    default:
      return '#';
  }
}

let navCache: ReturnType<typeof buildNav> | undefined;

async function buildNav(l?: Locals) {
  const p = l?.preview;
  const nav = p?.navigation ?? (await one('navigation'));
  const slugs = new Set(p?.customPages ? p.customPages.filter((c) => !c.draft).map((c) => c.slug) : (await getCustomPages()).map((c) => c.data.slug));
  const lenient = !!p?.canvas;
  const main = nav.mainMenu.map((m) => ({
    label: m.label,
    href: resolveHref(m, slugs, 'Menu Navbar', lenient),
    newTab: m.openNewTab,
    children: (m.children ?? []).map((c) => ({ label: c.label, href: resolveHref(c, slugs, `Submenu ${m.label}`, lenient) })),
  }));
  const footer = nav.footerMenu.map((m) => ({ label: m.label, href: resolveHref(m, slugs, 'Menu Footer', lenient) }));
  const cta = nav.ctaButton.enabled
    ? { label: nav.ctaButton.label ?? '', href: resolveHref({ ...nav.ctaButton, linkType: nav.ctaButton.linkType }, slugs, 'Tombol CTA Navbar', lenient) }
    : undefined;
  return { main, footer, cta, slugs, lenient, style: (nav.navStyle ?? 'default') as 'default' | 'pill' | 'glass-center' };
}

export function getNavigation(l?: Locals) {
  if (l?.preview || import.meta.env.DEV) return buildNav(l); // dev/preview: konten bisa berubah tanpa restart
  return (navCache ??= buildNav());
}

/** Href untuk CTA di dalam section. */
export async function ctaHref(link: LinkLike, where: string, l?: Locals) {
  const { slugs, lenient } = await getNavigation(l);
  return resolveHref(link, slugs, where, lenient);
}

export const isExternal = (href: string) => /^https?:\/\//.test(href);
