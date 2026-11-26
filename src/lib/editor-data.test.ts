import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PATHS, diffFiles, parseFiles, parseMarkdown, serialize, slugify, uniqueId } from './content-files';
import { removeMenuLinks, validateContent } from './validate';
import { parsePreviewRequest } from './preview';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const j = (o: unknown) => JSON.stringify(o, null, 2) + '\n';

/** Konten minimal mandiri, tidak bergantung pada konten situs yang sedang dipakai. */
function fixture(): Record<string, string> {
  const page = (title: string, slug: string, sections: unknown[]) => j({ title, slug, sections, seo: { noindex: false }, draft: false });
  return {
    [PATHS.site]: j({ ownerName: 'Uji Coba', role: 'Tester', email: 'uji@example.com', seo: { description: 'Deskripsi', ogImage: '/uploads/og.webp' } }),
    [PATHS.theme]: j({ preset: 'mono', motion: 'full' }),
    [PATHS.navigation]: j({
      mainMenu: [
        { label: 'B', linkType: 'custom', customPage: 'b' },
        { label: 'Grup', linkType: 'none', children: [{ label: 'C', linkType: 'custom', customPage: 'c' }] },
      ],
      ctaButton: { enabled: false },
      footerMenu: [],
    }),
    [PATHS.home]: j({ sections: [{ type: 'hero', variant: 'split', headline: 'Halo' }] }),
    [PATHS.about]: j({ photo: '/uploads/a.webp', photoAlt: 'Foto', headline: 'Tentang', bio: 'Bio' }),
    [`${PATHS.customDir}a.json`]: page('A', 'a', [{ type: 'ctaBanner', headline: 'Ke B', button: { label: 'B', linkType: 'custom', customPage: 'b' } }]),
    [`${PATHS.customDir}b.json`]: page('B', 'b', [{ type: 'richText', body: 'Isi' }]),
    [`${PATHS.customDir}c.json`]: page('C', 'c', [{ type: 'richText', body: 'Isi' }]),
    [`${PATHS.projectDir}p1.md`]: '---\ntitle: "P1"\ncategory: "Branding"\nyear: 2026\ncover: "/uploads/c.webp"\ncoverAlt: "Cover"\nsummary: "Ringkas"\n---\n\nIsi proyek\n',
  };
}

function loadRepo(): Record<string, string> {
  const files: Record<string, string> = {};
  const add = (p: string) => (files[p] = readFileSync(p, 'utf8'));
  [PATHS.site, PATHS.theme, PATHS.navigation, PATHS.home, PATHS.about].forEach(add);
  readdirSync(PATHS.customDir).forEach((f) => add(PATHS.customDir + f));
  readdirSync(PATHS.projectDir).forEach((f) => add(PATHS.projectDir + f));
  return files;
}

describe('content-files', () => {
  it('parse → serialize → parse stabil', () => {
    const state = parseFiles(fixture());
    expect(parseFiles(serialize(state))).toEqual(state);
    expect(Object.keys(state.projects)).toEqual(['p1']);
    expect(state.customPages.b.slug).toBe('b');
  });

  it('serialisasi ulang tanpa perubahan tidak menghasilkan diff (juga untuk konten asli)', () => {
    for (const files of [fixture(), loadRepo()]) {
      const once = serialize(parseFiles(files));
      expect(diffFiles(once, serialize(parseFiles(once)))).toEqual({});
    }
  });

  it('diff mendeteksi ubah, tambah, dan hapus', () => {
    const base = serialize(parseFiles(fixture()));
    const s = parseFiles(base);
    s.home.sections[0].headline = 'Baru';
    s.customPages.d = { ...clone(s.customPages.b), slug: 'd' };
    delete s.customPages.c;
    const d = diffFiles(base, serialize(s));
    expect(Object.keys(d).sort()).toEqual([PATHS.home, `${PATHS.customDir}c.json`, `${PATHS.customDir}d.json`].sort());
    expect(d[`${PATHS.customDir}c.json`]).toBeNull();
  });

  it('frontmatter + body markdown', () => {
    expect(parseMarkdown('---\ntitle: "A"\nyear: 2026\n---\n\n## Isi\n')).toEqual({ data: { title: 'A', year: 2026 }, body: '## Isi' });
  });

  it('slugify & uniqueId', () => {
    expect(slugify('Pameran Kemasan 2026!')).toBe('pameran-kemasan-2026');
    expect(slugify('Café Ümlaut')).toBe('cafe-umlaut');
    expect(uniqueId('faq', ['faq', 'faq-2'])).toBe('faq-3');
  });
});

describe('validateContent', () => {
  const ok = () => parseFiles(fixture());

  it('fixture valid', () => expect(validateContent(ok())).toEqual([]));
  it('konten situs yang sedang dipakai valid', () => expect(validateContent(parseFiles(loadRepo()))).toEqual([]));

  it('halaman draft yang masih di menu (termasuk submenu) ditolak', () => {
    const s = ok();
    s.customPages.c.draft = true;
    expect(validateContent(s).some((x) => x.doc === 'navigation' && /\/c\b/.test(x.message))).toBe(true);
  });

  it('removeMenuLinks membereskan menu, tombol di halaman lain tetap dilaporkan', () => {
    const s = ok();
    s.customPages.b.draft = true;
    s.navigation = removeMenuLinks(s.navigation, 'b');
    expect(validateContent(s).map((x) => x.doc)).toEqual(['custom:a']);
  });

  it('item menu "tanpa link" wajib punya submenu; tombol biasa tidak boleh tanpa link', () => {
    const s = ok();
    s.navigation.mainMenu[1].children = [];
    s.customPages.a.sections[0].button.linkType = 'none';
    const docs = validateContent(s).map((x) => x.doc);
    expect(docs).toContain('navigation');
    expect(docs).toContain('custom:a');
  });

  it('slug dicadangkan & bentrok', () => {
    const s = ok();
    s.customPages.c.slug = 'b';
    s.customPages.a.slug = 'admin';
    const msgs = validateContent(s).map((x) => `${x.doc} ${x.path}`);
    expect(msgs).toContain('custom:c slug');
    expect(msgs).toContain('custom:a slug');
  });

  it('pesan field dari skema', () => {
    const s = ok();
    s.home.sections[0].headline = 'x'.repeat(90);
    expect(validateContent(s)).toContainEqual({ doc: 'home', path: 'sections.0.headline', message: 'Maks. 80 karakter' });
  });
});

describe('parsePreviewRequest', () => {
  const base = () => {
    const s = parseFiles(fixture());
    return {
      site: s.site,
      theme: s.theme,
      navigation: s.navigation,
      customPages: Object.values(s.customPages).map((p) => ({ slug: p.slug, title: p.title, draft: !!p.draft })),
      projects: Object.entries(s.projects).map(([id, p]) => ({ id, data: p.data })),
      s,
    };
  };

  it('menerima halaman valid dan menandai mode kanvas', () => {
    const { s, ...ctx } = base();
    const r = parsePreviewRequest({ ...ctx, kind: 'home', page: s.home });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.context.canvas).toBe(true);
  });

  it('menolak halaman tidak valid dengan path', () => {
    const { s, ...ctx } = base();
    s.home.sections[0].headline = '';
    const r = parsePreviewRequest({ ...ctx, kind: 'home', page: s.home });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0].path).toBe('page.sections.0.headline');
  });

  it('menolak jenis halaman asing', () => {
    const { s, ...ctx } = base();
    expect(parsePreviewRequest({ ...ctx, kind: 'admin', page: s.home }).ok).toBe(false);
  });
});
