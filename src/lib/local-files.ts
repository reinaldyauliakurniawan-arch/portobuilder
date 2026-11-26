// Akses file konten untuk editor visual di mode lokal (npm run dev). Server-only.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { PATHS, isWritableContent, isWritableUpload } from './content-files';

export { isWritableContent, isWritableUpload };

export async function readContentFiles(root = process.cwd()): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const add = async (p: string) => (files[p] = await readFile(join(root, p), 'utf8'));
  await Promise.all([PATHS.site, PATHS.theme, PATHS.navigation, PATHS.home, PATHS.about].map(add));
  for (const dir of [PATHS.customDir, PATHS.projectDir])
    for (const f of await readdir(join(root, dir))) if (isWritableContent(dir + f)) await add(dir + f);
  return files;
}

export async function writeChanges(
  changes: Record<string, string | null>,
  uploads: Record<string, string>,
  root = process.cwd(),
): Promise<void> {
  for (const p of Object.keys(changes)) if (!isWritableContent(p)) throw new Error(`Path konten tidak diizinkan: ${p}`);
  for (const p of Object.keys(uploads)) if (!isWritableUpload(p)) throw new Error(`Path upload tidak diizinkan: ${p}`);
  // Upload dulu, supaya konten tidak pernah menunjuk gambar yang belum ada.
  for (const [p, b64] of Object.entries(uploads)) {
    await mkdir(dirname(join(root, p)), { recursive: true });
    await writeFile(join(root, p), Buffer.from(b64, 'base64'));
  }
  for (const [p, c] of Object.entries(changes)) {
    if (c === null) await rm(join(root, p), { force: true });
    else await writeFile(join(root, p), c, 'utf8');
  }
}
