import { z } from 'astro/zod';
import { YOUTUBE_PATTERN } from './youtube';
import { PRESET_IDS } from './themes';

// Skema bersama. WAJIB sinkron dengan src/lib/cms-fields.mjs (dicek oleh src/lib/cms-sync.test.ts).

export const CATEGORIES = ['Branding', 'UI/UX', 'Ilustrasi', 'Video'] as const;
export const BUILTIN_PAGES = ['home', 'projects', 'about', '#kontak'] as const;
export const RESERVED_SLUGS = ['admin', 'projects', 'about', 'dev', 'uploads', '404', 'index', '_astro'];
export const SOCIAL_PLATFORMS = ['LinkedIn', 'Instagram', 'Behance', 'Dribbble', 'GitHub', 'YouTube', 'TikTok', 'X'] as const;
export const MAPS_PATTERN = /^https:\/\/(www\.|maps\.)?google\.[a-z.]+\/maps(\/embed)?\?.+/;
// dissolve = vignette + fade-bottom (keempat tepi menyatu dengan latar); fade-left = gradien latar dari kiri + bawah lembut.
export const IMAGE_EDGES = ['none', 'frame', 'vignette', 'fade-bottom', 'dark-vignette', 'dissolve', 'fade-left'] as const;
export const NAME_SUFFIXES = ['none', '®', '™', '*'] as const;
export const NAV_STYLES = ['default', 'pill', 'glass-center'] as const;
export const EDGE_INTENSITIES = ['soft', 'medium', 'strong'] as const;

/** String opsional: string kosong dari CMS dianggap tidak diisi. */
const opt = <T extends z.ZodType>(s: T) => z.preprocess((v) => (v === '' || v === null ? undefined : v), s.optional());

const text = (max?: number) => (max ? z.string().trim().min(1).max(max, `Maks. ${max} karakter`) : z.string().trim().min(1));
const optText = (max?: number) => opt(max ? z.string().trim().max(max, `Maks. ${max} karakter`) : z.string().trim());
const image = z.string().min(1, 'Gambar wajib diisi');
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Warna harus format hex 6 digit, contoh #1A1A1A');
const slugRule = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung');

const linkFields = {
  // none = tanpa link (khusus item menu yang hanya membuka dropdown)
  linkType: z.enum(['builtin', 'custom', 'external', 'none']),
  builtinPage: opt(z.enum(BUILTIN_PAGES)),
  customPage: opt(slugRule),
  url: opt(z.string().trim()),
};
type LinkFields = { linkType?: string; builtinPage?: string; customPage?: string; url?: string };
function checkLink(l: LinkFields, ctx: z.RefinementCtx) {
  if (l.linkType === 'builtin' && !l.builtinPage) ctx.addIssue({ code: 'custom', message: 'Pilih halaman bawaan untuk link jenis "builtin"' });
  if (l.linkType === 'custom' && !l.customPage) ctx.addIssue({ code: 'custom', message: 'Pilih halaman custom untuk link jenis "custom"' });
  if (l.linkType === 'external' && !l.url) ctx.addIssue({ code: 'custom', message: 'Isi URL untuk link jenis "external"' });
  // "Tanpa link" hanya sah untuk item menu navbar (yang punya field children).
  if (l.linkType === 'none' && !('children' in l)) ctx.addIssue({ code: 'custom', message: 'Pilih tujuan link' });
}

const labeledLink = z.object({ label: text(30), ...linkFields }).superRefine(checkLink);
export type Link = z.infer<typeof labeledLink>;
/** CTA opsional: objek tanpa label (form CMS yang dikosongkan) dianggap tidak ada. */
export const ctaSchema = z.preprocess(
  (v) => (v && typeof v === 'object' && !(v as { label?: string }).label ? undefined : v),
  labeledLink.optional(),
);

const edge = {
  imageEdge: z.enum(IMAGE_EDGES).optional(),
  edgeIntensity: z.enum(EDGE_INTENSITIES).default('medium'),
};

const base = { enabled: z.boolean().default(true) };

// ---------- Section ----------

export const sectionSchemas = {
  hero: z.object({
    type: z.literal('hero'),
    ...base,
    variant: z.enum(['split', 'centered', 'fullbleed', 'spotlight', 'showcase', 'cutout']).default('split'),
    eyebrow: optText(40),
    // Wajib kecuali spotlight/cutout (yang memakai nama raksasa); lihat superRefine di bawah.
    headline: optText(80),
    subheadline: optText(160),
    image: opt(image),
    imageAlt: optText(160),
    videoMp4: opt(z.string()),
    ...edge,
    primaryCta: ctaSchema,
    secondaryCta: ctaSchema,
    // --- spotlight / cutout ---
    displayName: optText(40),
    serviceColumns: z.array(z.object({ label: optText(24), title: text(40), description: text(90) })).max(3, 'Maks. 3 kolom').default([]),
    // --- showcase ---
    focusX: z.number().int().min(0).max(100).default(70),
    heroVideoUrl: opt(z.string().regex(YOUTUBE_PATTERN, 'Harus link YouTube')),
    // --- cutout ---
    cutoutImage: opt(image),
    intro: optText(120),
    textCta: ctaSchema,
    rotatingServices: z.array(text(28)).max(6, 'Maks. 6 layanan').default([]),
    watermarkText: optText(16),
    nameLayer: z.enum(['behind', 'front']).default('behind'),
  }).superRefine((h, ctx) => {
    const big = h.variant === 'spotlight' || h.variant === 'cutout';
    if (!big && !h.headline) ctx.addIssue({ code: 'custom', path: ['headline'], message: 'Judul besar wajib diisi' });
    if (h.variant === 'showcase') {
      for (const [k, max] of [['headline', 60], ['subheadline', 120], ['eyebrow', 32]] as const)
        if ((h[k]?.length ?? 0) > max) ctx.addIssue({ code: 'custom', path: [k], message: `Maks. ${max} karakter untuk gaya Showcase` });
    }
    if (h.variant === 'cutout') {
      if (!h.cutoutImage && !h.image) ctx.addIssue({ code: 'custom', path: ['cutoutImage'], message: 'Gaya Cutout butuh Foto Cutout' });
      if (h.rotatingServices.length && h.rotatingServices.length < 3) ctx.addIssue({ code: 'custom', path: ['rotatingServices'], message: 'Isi 3–6 layanan (atau kosongkan)' });
    }
  }),
  featuredProjects: z.object({
    type: z.literal('featuredProjects'),
    ...base,
    variant: z.enum(['grid', 'list', 'masonry']).default('grid'),
    eyebrow: optText(40),
    title: optText(80),
    count: z.number().int().min(3).max(9).default(6),
    source: z.enum(['featured', 'latest', 'category']).default('featured'),
    category: opt(z.enum(CATEGORIES)),
  }),
  richText: z.object({
    type: z.literal('richText'),
    ...base,
    variant: z.enum(['narrow', 'two-column']).default('narrow'),
    title: optText(80),
    body: text(),
  }),
  video: z.object({
    type: z.literal('video'),
    ...base,
    variant: z.enum(['wide', 'framed']).default('framed'),
    youtubeUrl: z.string().regex(YOUTUBE_PATTERN, 'Harus link YouTube'),
    title: text(100),
    caption: optText(200),
  }),
  aboutShort: z.object({
    type: z.literal('aboutShort'),
    ...base,
    variant: z.enum(['split', 'stacked']).default('split'),
    eyebrow: optText(40),
    title: optText(80),
    text: text(),
    image: opt(image),
    imageAlt: optText(160),
    ...edge,
    cta: ctaSchema,
  }),
  stats: z.object({
    type: z.literal('stats'),
    ...base,
    variant: z.enum(['inline', 'cards']).default('inline'),
    title: optText(80),
    items: z.array(z.object({ value: text(10), label: text(40) })).min(1).max(4, 'Maks. 4 statistik'),
  }),
  logos: z.object({
    type: z.literal('logos'),
    ...base,
    variant: z.enum(['row', 'marquee', 'tiles']).default('row'),
    title: optText(80),
    logoTone: z.enum(['mono', 'color']).default('mono'),
    items: z.array(z.object({ logo: image, name: text(60) })).min(1),
  }),
  testimonials: z.object({
    type: z.literal('testimonials'),
    ...base,
    variant: z.enum(['carousel', 'grid']).default('grid'),
    title: optText(80),
    items: z.array(z.object({ quote: text(400), name: text(60), role: optText(80), photo: opt(image) })).min(1),
  }),
  services: z.object({
    type: z.literal('services'),
    ...base,
    variant: z.enum(['cards', 'numbered']).default('cards'),
    eyebrow: optText(40),
    title: optText(80),
    intro: optText(240),
    items: z.array(z.object({ title: text(60), description: text(300), price: optText(40), cta: ctaSchema })).min(1),
  }),
  faq: z.object({
    type: z.literal('faq'),
    ...base,
    variant: z.enum(['accordion', 'two-column']).default('accordion'),
    title: text(80),
    items: z.array(z.object({ question: text(160), answer: text() })).min(1),
  }),
  gallery: z.object({
    type: z.literal('gallery'),
    ...base,
    variant: z.enum(['grid', 'masonry']).default('grid'),
    title: optText(80),
    items: z.array(z.object({ image, alt: text(160), caption: optText(160) })).min(1),
  }),
  map: z.object({
    type: z.literal('map'),
    ...base,
    variant: z.enum(['full', 'split']).default('split'),
    title: optText(80),
    embedUrl: z.string().regex(MAPS_PATTERN, 'Harus link embed Google Maps (Bagikan → Sematkan peta → salin link src)'),
    address: optText(240),
    hours: optText(240),
  }),
  ctaBanner: z.object({
    type: z.literal('ctaBanner'),
    ...base,
    variant: z.enum(['default']).default('default'),
    headline: text(100),
    button: labeledLink,
  }),
  contact: z.object({
    type: z.literal('contact'),
    ...base,
    variant: z.enum(['simple', 'split']).default('split'),
    title: text(80),
    text: optText(300),
    showForm: z.boolean().default(true),
    showDirect: z.boolean().default(true),
  }),
};

export type SectionType = keyof typeof sectionSchemas;
export const SECTION_TYPES = Object.keys(sectionSchemas) as SectionType[];

const S = sectionSchemas;
export const sectionSchema = z.discriminatedUnion(
  'type',
  [S.hero, S.featuredProjects, S.richText, S.video, S.aboutShort, S.stats, S.logos, S.testimonials, S.services, S.faq, S.gallery, S.map, S.ctaBanner, S.contact],
  { error: (iss) => (iss.code === 'invalid_union' ? `Jenis section tidak dikenal. Pilihan: ${SECTION_TYPES.join(', ')}` : undefined) },
);
export type Section = { [K in SectionType]: z.infer<(typeof sectionSchemas)[K]> }[SectionType];
export const sectionsSchema = z.array(sectionSchema);

// ---------- Koleksi ----------

export const siteSchema = z.object({
  ownerName: text(60),
  role: text(40),
  logo: opt(image),
  favicon: opt(image),
  email: z.email('Email tidak valid'),
  whatsapp: opt(z.string().regex(/^62\d{8,14}$/, 'Format WhatsApp: 62xxx tanpa + atau spasi')),
  socials: z.array(z.object({ platform: z.enum(SOCIAL_PLATFORMS), url: z.url('URL sosial media tidak valid') })).default([]),
  cvFile: opt(z.string()),
  seo: z.object({ description: text(160), ogImage: image }),
  footerText: optText(160),
  nameSuffix: z.enum(NAME_SUFFIXES).default('none'),
  language: z.enum(['id', 'en']).default('id'),
  address: optText(200),
  availability: z.object({ enabled: z.boolean().default(false), label: optText(24) }).default({ enabled: false }),
});

export const themeSchema = z.object({
  preset: z.enum(PRESET_IDS).default('editorial'),
  backgroundColor: opt(hex),
  textColor: opt(hex),
  accentColor: opt(hex.or(z.literal('auto'))),
  motion: z.enum(['full', 'subtle', 'off']).default('full'),
});

export const navigationSchema = z.object({
  navStyle: z.enum(NAV_STYLES).default('default'),
  mainMenu: z
    .array(
      z
        .object({
          label: text(30),
          ...linkFields,
          openNewTab: z.boolean().default(false),
          children: z.array(z.object({ label: text(40), ...linkFields }).superRefine(checkLink)).max(12, 'Submenu maks. 12 item').default([]),
        })
        .superRefine((m, ctx) => {
          checkLink(m, ctx);
          if (m.linkType === 'none' && !m.children.length) ctx.addIssue({ code: 'custom', message: 'Item tanpa link harus punya submenu' });
        }),
    )
    .max(6, 'Menu navbar maks. 6 item'),
  ctaButton: z
    .object({
      enabled: z.boolean().default(false),
      label: optText(30),
      linkType: opt(linkFields.linkType),
      builtinPage: linkFields.builtinPage,
      customPage: linkFields.customPage,
      url: linkFields.url,
    })
    .superRefine((c, ctx) => {
      if (!c.enabled) return;
      if (!c.label) ctx.addIssue({ code: 'custom', message: 'Tombol CTA navbar aktif: isi teks tombolnya' });
      if (!c.linkType) ctx.addIssue({ code: 'custom', message: 'Tombol CTA navbar aktif: pilih jenis link' });
      checkLink(c, ctx);
    }),
  footerMenu: z.array(labeledLink).max(10, 'Menu footer maks. 10 item').default([]),
});

export const homeSchema = z.object({ sections: sectionsSchema });

export const aboutSchema = z.object({
  photo: image,
  photoAlt: text(160),
  ...edge,
  headline: text(80),
  bio: text(),
  experience: z.array(z.object({ period: text(40), title: text(80), org: text(80), description: optText(300) })).default([]),
  skills: z.array(text(40)).default([]),
  sections: sectionsSchema.default([]),
});

export const customPageSchema = z.object({
  title: text(80),
  slug: slugRule.refine((s) => !RESERVED_SLUGS.includes(s), { message: `Slug ini dicadangkan sistem (${RESERVED_SLUGS.join(', ')}). Pakai alamat lain.` }),
  pageHeader: opt(
    z.object({
      enabled: z.boolean().default(true),
      eyebrow: optText(40),
      subtitle: optText(200),
      image: opt(image),
      imageAlt: optText(160),
      ...edge,
    }),
  ),
  sections: sectionsSchema.min(1, 'Halaman custom minimal punya 1 section'),
  seo: z.object({ description: optText(160), ogImage: opt(image), noindex: z.boolean().default(false) }).default({ noindex: false }),
  draft: z.boolean().default(false),
});

export const projectSchema = z.object({
  title: text(80),
  category: z.enum(CATEGORIES),
  year: z.number().int().min(1990).max(2100),
  cover: image,
  coverAlt: text(160),
  summary: text(160),
  role: optText(80),
  client: optText(80),
  tools: z.array(text(30)).default([]),
  featured: z.boolean().default(false),
  order: opt(z.number()),
  gallery: z.array(z.object({ image, alt: text(160), caption: optText(160) })).default([]),
  videos: z.array(z.object({ youtubeUrl: z.string().regex(YOUTUBE_PATTERN, 'Harus link YouTube'), title: text(100) })).default([]),
  externalUrl: opt(z.url('URL tidak valid')),
  draft: z.boolean().default(false),
});
