// Sumber public/admin/config.yml (Sveltia CMS). Jalan otomatis sebelum `npm run dev` / `npm run build`.
// JANGAN edit config.yml langsung. Definisi field ada di src/lib/cms-fields.mjs.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { collections, sectionTypes } from '../src/lib/cms-fields.mjs';

export { collections, sectionTypes };

/** owner/repo dari env Netlify (REPOSITORY_URL) atau CMS_REPO. */
export function repo() {
  const url = process.env.REPOSITORY_URL ?? ''; // diisi Netlify saat build
  const m = url.match(/github\.com[/:]([^/]+\/[^/.]+)/);
  return process.env.CMS_REPO || (m ? m[1] : 'USERNAME/portfolio');
}

export function buildConfig() {
  return {
    // Tanpa base_url: Sveltia memakai OAuth Netlify (lihat CLAUDE.md / PRD Bagian 12).
    backend: { name: 'github', repo: repo(), branch: process.env.CMS_BRANCH || 'main', commit_messages: { create: 'CMS: buat {{collection}} "{{slug}}"', update: 'CMS: ubah {{collection}} "{{slug}}"', delete: 'CMS: hapus {{collection}} "{{slug}}"', uploadMedia: 'CMS: upload "{{path}}"', deleteMedia: 'CMS: hapus media "{{path}}"' } },
    media_folder: 'public/uploads',
    public_folder: '/uploads',
    media_libraries: { all: { transformations: { raster_image: { format: 'webp', quality: 85, width: 2400, height: 2400 } } } },
    slug: { encoding: 'ascii', clean_accents: true },
    collections,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync('public/admin', { recursive: true });
  const header = '# DIBUAT OTOMATIS oleh scripts/cms-config.mjs. Jangan edit file ini langsung.\n';
  writeFileSync('public/admin/config.yml', header + stringify(buildConfig(), { aliasDuplicateObjects: false, lineWidth: 0 }));
  console.log(`[cms] public/admin/config.yml ditulis (repo: ${repo()})`);
}
