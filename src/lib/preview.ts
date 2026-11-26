import { z } from 'astro/zod';
import { aboutSchema, customPageSchema, homeSchema, navigationSchema, projectSchema, siteSchema, themeSchema } from './schemas';
import type { Preview, Project } from './content';

export interface FieldError {
  path: string;
  message: string;
}

const pageKinds = z.enum(['home', 'about', 'custom', 'project', 'projects']);
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const projectEntry = z.object({ id: slug, data: projectSchema, body: z.string().optional() });

const envelope = z.object({
  kind: pageKinds,
  page: z.unknown().optional(),
  project: z.unknown().optional(),
  site: siteSchema,
  home: homeSchema.optional(),
  theme: themeSchema,
  navigation: navigationSchema,
  customPages: z.array(z.object({ slug: z.string(), title: z.string(), draft: z.boolean() })),
  projects: z.array(projectEntry),
  assets: z.record(z.string(), z.object({ width: z.number().positive(), height: z.number().positive() })).default({}),
});

type Req =
  | { kind: 'home'; page: z.infer<typeof homeSchema>; context: Preview }
  | { kind: 'about'; page: z.infer<typeof aboutSchema>; context: Preview }
  | { kind: 'custom'; page: z.infer<typeof customPageSchema>; context: Preview }
  | { kind: 'project'; project: Project; context: Preview }
  | { kind: 'projects'; context: Preview };

export function issues(err: z.ZodError, prefix = ''): FieldError[] {
  return err.issues.map((i) => ({ path: [prefix, ...i.path.map(String)].filter(Boolean).join('.'), message: i.message }));
}

/** Validasi body POST dari editor. Pesan error memakai path data (mis. "page.sections.0.headline"). */
export function parsePreviewRequest(body: unknown): { ok: true; value: Req } | { ok: false; errors: FieldError[] } {
  const env = envelope.safeParse(body);
  if (!env.success) return { ok: false, errors: issues(env.error) };
  const e = env.data;
  const context: Preview = { site: e.site, home: e.home, theme: e.theme, navigation: e.navigation, customPages: e.customPages, projects: e.projects, assets: e.assets, canvas: true };
  const schema = { home: homeSchema, about: aboutSchema, custom: customPageSchema } as const;
  if (e.kind === 'projects') return { ok: true, value: { kind: 'projects', context } };
  if (e.kind === 'project') {
    const p = projectEntry.safeParse(e.project);
    if (!p.success) return { ok: false, errors: issues(p.error, 'page') };
    return { ok: true, value: { kind: 'project', project: p.data, context } };
  }
  const page = schema[e.kind].safeParse(e.page);
  if (!page.success) return { ok: false, errors: issues(page.error, 'page') };
  return { ok: true, value: { kind: e.kind, page: page.data, context } as Req };
}
