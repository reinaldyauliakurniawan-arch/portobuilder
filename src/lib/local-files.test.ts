import { describe, expect, it } from 'vitest';
import { isWritableContent, isWritableUpload } from './local-files';

describe('whitelist path mode lokal', () => {
  it.each(['src/content/settings/site.json', 'src/content/pages/home.json', 'src/content/custom-pages/layanan-2.json', 'src/content/projects/kopi-senja.md'])(
    'konten boleh: %s',
    (p) => expect(isWritableContent(p)).toBe(true),
  );
  it.each([
    'src/content/../../package.json',
    'src/content/custom-pages/../../../.env',
    'src/content/settings/other.json',
    'src/pages/index.astro',
    'src/content/projects/x.json',
    'src/content/custom-pages/Layanan.json',
    '/etc/passwd',
  ])('konten ditolak: %s', (p) => expect(isWritableContent(p)).toBe(false));

  it.each(['public/uploads/foto-1.webp', 'public/uploads/2026/cv.pdf', 'public/uploads/logo_baru.svg'])('upload boleh: %s', (p) => expect(isWritableUpload(p)).toBe(true));
  it.each(['public/uploads/../index.html', 'public/admin/config.yml', 'public/uploads/x.html', 'public/uploads/x.js', 'public/uploads/.htaccess'])(
    'upload ditolak: %s',
    (p) => expect(isWritableUpload(p)).toBe(false),
  );
});
