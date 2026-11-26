import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  aboutSchema,
  customPageSchema,
  homeSchema,
  navigationSchema,
  projectSchema,
  siteSchema,
  themeSchema,
} from './lib/schemas';

// Skema ada di src/lib/schemas.ts. WAJIB sinkron dengan public/admin/config.yml (lewat scripts/cms-config.mjs).
const single = (file: string, base: string) => glob({ pattern: file, base: `./src/content/${base}` });

export const collections = {
  site: defineCollection({ loader: single('site.json', 'settings'), schema: siteSchema }),
  theme: defineCollection({ loader: single('theme.json', 'settings'), schema: themeSchema }),
  navigation: defineCollection({ loader: single('navigation.json', 'settings'), schema: navigationSchema }),
  home: defineCollection({ loader: single('home.json', 'pages'), schema: homeSchema }),
  about: defineCollection({ loader: single('about.json', 'pages'), schema: aboutSchema }),
  customPages: defineCollection({
    // id = nama file (bukan field `slug`), supaya slug bentrok terdeteksi di lib/content.ts alih-alih digabung diam-diam.
    loader: glob({ pattern: '*.json', base: './src/content/custom-pages', generateId: ({ entry }) => entry.replace(/\.json$/, '') }),
    schema: customPageSchema,
  }),
  projects: defineCollection({
    loader: glob({ pattern: '*.md', base: './src/content/projects' }),
    schema: projectSchema,
  }),
};
