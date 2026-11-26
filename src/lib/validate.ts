// Validasi seluruh konten sebelum publish dari editor visual: aturan yang sama dengan build
// (skema Zod + slug dicadangkan/bentrok + link ke halaman yang tidak ada/draft), dengan pesan berbahasa Indonesia.
import type { ContentState } from './content-files';
import { RESERVED_SLUGS, aboutSchema, customPageSchema, homeSchema, navigationSchema, projectSchema, siteSchema, themeSchema } from './schemas';

export interface Problem {
  /** Lokasi yang bisa dibuka editor: "home", "about", "custom:<id>", "project:<id>", "site", "theme", "navigation". */
  doc: string;
  /** Path field di dalam dokumen, mis. "sections.0.headline". */
  path: string;
  message: string;
}

type Schema = { safeParse: (v: unknown) => { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } } };

function check(doc: string, schema: Schema, value: unknown, out: Problem[]) {
  const r = schema.safeParse(value);
  if (!r.success) for (const i of r.error!.issues) out.push({ doc, path: i.path.map(String).join('.'), message: i.message });
}

/** Kunjungi semua objek link (punya linkType) di dalam nilai. */
function links(v: unknown, path: string[], cb: (link: Record<string, any>, path: string) => void) {
  if (Array.isArray(v)) v.forEach((x, i) => links(x, [...path, String(i)], cb));
  else if (v && typeof v === 'object') {
    const o = v as Record<string, any>;
    if (typeof o.linkType === 'string') cb(o, path.join('.'));
    for (const [k, x] of Object.entries(o)) links(x, [...path, k], cb);
  }
}

export function validateContent(s: ContentState): Problem[] {
  const out: Problem[] = [];
  check('site', siteSchema, s.site, out);
  check('theme', themeSchema, s.theme, out);
  check('navigation', navigationSchema, s.navigation, out);
  check('home', homeSchema, s.home, out);
  check('about', aboutSchema, s.about, out);

  const seen = new Map<string, string>();
  for (const [id, page] of Object.entries(s.customPages)) {
    const doc = `custom:${id}`;
    check(doc, customPageSchema, page, out);
    const slug = page?.slug;
    if (typeof slug === 'string') {
      if (RESERVED_SLUGS.includes(slug)) continue; // sudah dilaporkan skema
      const other = seen.get(slug);
      if (other) out.push({ doc, path: 'slug', message: `Alamat "/${slug}" sudah dipakai halaman "${s.customPages[other]?.title ?? other}". Ganti salah satu.` });
      else seen.set(slug, id);
    }
  }
  for (const [id, p] of Object.entries(s.projects)) check(`project:${id}`, projectSchema, p.data, out);

  const published = new Set(
    Object.values(s.customPages)
      .filter((p) => !p?.draft && typeof p?.slug === 'string')
      .map((p) => p.slug as string),
  );
  const docs: [string, unknown][] = [
    ['navigation', s.navigation],
    ['home', s.home],
    ['about', s.about],
    ...Object.entries(s.customPages).filter(([, p]) => !p?.draft).map(([id, p]) => [`custom:${id}`, p] as [string, unknown]),
  ];
  for (const [doc, value] of docs) {
    links(value, [], (link, path) => {
      if (link.linkType !== 'custom' || !link.customPage) return;
      if (doc === 'navigation' && path.startsWith('ctaButton') && !(value as any).ctaButton?.enabled) return;
      if (!published.has(link.customPage))
        out.push({ doc, path, message: `Link "${link.label ?? ''}" mengarah ke /${link.customPage} yang tidak ada atau masih draft.` });
    });
  }
  return out;
}

/** Hapus semua link ke halaman custom `slug` dari menu (dipakai saat halaman dihapus/di-draft). */
export function removeMenuLinks(nav: Record<string, any>, slug: string): Record<string, any> {
  const keep = (m: Record<string, any>) => !(m.linkType === 'custom' && m.customPage === slug);
  const next: Record<string, any> = { ...nav, mainMenu: (nav.mainMenu ?? []).filter(keep), footerMenu: (nav.footerMenu ?? []).filter(keep) };
  if (nav.ctaButton?.linkType === 'custom' && nav.ctaButton.customPage === slug) next.ctaButton = { ...nav.ctaButton, enabled: false };
  return next;
}
