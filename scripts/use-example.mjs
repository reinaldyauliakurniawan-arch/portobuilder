// Terapkan contoh beranda ke konten situs: `npm run example spotlight` (atau showcase / cutout).
// Menimpa src/content/pages/home.json dan menggabungkan theme/navigation/site. Cek hasilnya dengan git diff.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const name = process.argv[2];
const file = `examples/home-${name}.json`;
if (!name || !existsSync(file)) {
  console.error('Pakai: npm run example <spotlight|showcase|cutout>');
  process.exit(1);
}
const ex = JSON.parse(readFileSync(file, 'utf8'));
const merge = (path, patch) => {
  const cur = JSON.parse(readFileSync(path, 'utf8'));
  writeFileSync(path, JSON.stringify({ ...cur, ...patch }, null, 2) + '\n');
};
merge('src/content/settings/theme.json', ex.theme);
merge('src/content/settings/navigation.json', ex.navigation);
merge('src/content/settings/site.json', ex.site);
writeFileSync('src/content/pages/home.json', JSON.stringify(ex.home, null, 2) + '\n');
console.log(`Contoh "${name}" diterapkan. Batalkan dengan: git checkout -- src/content`);
