// Jalankan CLI (astro/vitest) dari path dengan huruf besar-kecil asli.
// Windows: `cd c:\laragon\...` (c kecil) membuat Vite melihat dua path berbeda untuk file yang sama,
// sehingga hash scoped CSS Astro tidak cocok dengan HTML (tampilan dev rusak) dan Vitest memuat dua instance.
import { realpathSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const BINS = { astro: 'node_modules/astro/bin/astro.mjs', vitest: 'node_modules/vitest/vitest.mjs' };
const [name, ...args] = process.argv.slice(2);
if (!BINS[name]) {
  console.error(`real-cwd: CLI tidak dikenal "${name}" (pilihan: ${Object.keys(BINS).join(', ')})`);
  process.exit(1);
}
const cwd = realpathSync.native(process.cwd());
const bin = fileURLToPath(new URL(`../${BINS[name]}`, import.meta.url));
const child = spawn(process.execPath, [realpathSync.native(bin), ...args], { cwd, stdio: 'inherit' });
// Ctrl+C sampai ke anak lewat konsol yang sama; teruskan kode keluarnya.
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
