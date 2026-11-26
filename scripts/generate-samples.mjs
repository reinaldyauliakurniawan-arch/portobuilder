// Membuat gambar contoh (abstrak) di public/uploads/sample/. Jalankan: node scripts/generate-samples.mjs
// Ganti dengan karya asli lewat CMS; file ini hanya untuk konten demo.
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';

const out = 'public/uploads/sample';
mkdirSync(out, { recursive: true });

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];

const palettes = [
  ['#1f2a44', '#e76f51', '#f4a261', '#e9c46a', '#f5f1ea'],
  ['#0b0b0f', '#a3e635', '#3f3f46', '#ededed', '#18181b'],
  ['#2a9d8f', '#264653', '#e9c46a', '#f7f7f2', '#14213d'],
  ['#fdf6f0', '#e07a5f', '#3d405b', '#81b29a', '#f2cc8f'],
  ['#ff3b00', '#111111', '#ffffff', '#ffd400', '#2b59c3'],
  ['#c2410c', '#1a1a1a', '#f5f1ea', '#d6c7ae', '#7c2d12'],
  ['#5b5bd6', '#0f172a', '#f1f5f9', '#22d3ee', '#f472b6'],
  ['#3a5a40', '#a3b18a', '#dad7cd', '#344e41', '#588157'],
];

function art(w, h, palette, kind = 'shapes') {
  const [bg, ...cs] = palette;
  let shapes = '';
  if (kind === 'portrait') {
    // Siluet abstrak: kepala + bahu
    shapes += `<circle cx="${w / 2}" cy="${h * 0.4}" r="${w * 0.2}" fill="${cs[0]}"/>`;
    shapes += `<ellipse cx="${w / 2}" cy="${h * 1.02}" rx="${w * 0.45}" ry="${h * 0.38}" fill="${cs[1]}"/>`;
    shapes += `<circle cx="${w * 0.8}" cy="${h * 0.15}" r="${w * 0.1}" fill="${cs[2]}" opacity=".8"/>`;
  } else {
    const n = 5 + Math.floor(rnd() * 5);
    for (let i = 0; i < n; i++) {
      const c = pick(cs);
      const x = rnd() * w;
      const y = rnd() * h;
      const s = (0.15 + rnd() * 0.45) * Math.min(w, h);
      const t = rnd();
      if (t < 0.4) shapes += `<circle cx="${x}" cy="${y}" r="${s / 2}" fill="${c}" opacity="${0.75 + rnd() * 0.25}"/>`;
      else if (t < 0.7)
        shapes += `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s * (0.4 + rnd())}" rx="${rnd() * s * 0.2}" fill="${c}" transform="rotate(${rnd() * 40 - 20} ${x} ${y})"/>`;
      else shapes += `<path d="M ${x - s} ${y} A ${s} ${s} 0 0 1 ${x + s} ${y}" stroke="${c}" stroke-width="${s * 0.12}" fill="none"/>`;
    }
  }
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${cs[3]}" stop-opacity=".35"/></linearGradient>
      <filter id="n"><feTurbulence baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0"/></filter></defs>
      <rect width="100%" height="100%" fill="${bg}"/><rect width="100%" height="100%" fill="url(#g)"/>${shapes}
      <rect width="100%" height="100%" filter="url(#n)"/></svg>`,
  );
}

async function save(name, w, h, palette, kind) {
  if (existsSync(`${out}/${name}.webp`)) return; // jangan menimpa (file bisa sedang dipakai dev server)
  await sharp(art(w, h, palette, kind)).webp({ quality: 80 }).toFile(`${out}/${name}.webp`);
}

const jobs = [
  ['hero', 2400, 1350, palettes[5]],
  ['hero-dark', 2400, 1350, palettes[1]],
  ['about', 1200, 1500, palettes[0], 'portrait'],
  ['og', 1200, 630, palettes[5]],
  ['header-layanan', 2400, 1000, palettes[2]],
];
for (let i = 1; i <= 8; i++) jobs.push([`project-${i}`, 1600, 1200, palettes[i % palettes.length]]);
const galleryRatios = [
  [1600, 1200],
  [1200, 1600],
  [1600, 900],
  [1400, 1400],
  [1200, 1500],
  [1600, 1066],
];
galleryRatios.forEach(([w, h], i) => jobs.push([`gallery-${i + 1}`, w, h, palettes[(i + 3) % palettes.length]]));
for (let i = 1; i <= 4; i++) jobs.push([`avatar-${i}`, 400, 400, palettes[(i + 1) % palettes.length], 'portrait']);

for (const j of jobs) await save(...j);

// Logo klien: wordmark SVG abu-abu netral (terbaca di latar terang & gelap).
const brands = ['Kopi Senja', 'Arunika', 'Lumbung', 'Teduh Studio', 'Pasar Rakyat', 'Nusa Labs'];
const { writeFileSync } = await import('node:fs');
brands.forEach((b, i) => {
  const w = 40 + b.length * 15;
  writeFileSync(
    `${out}/logo-${i + 1}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="48" viewBox="0 0 ${w} 48"><circle cx="20" cy="24" r="12" fill="#808080"/><text x="40" y="31" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#808080">${b}</text></svg>`,
  );
});
console.log(`Selesai: ${jobs.length} gambar + ${brands.length} logo di ${out}`);

// ---------- Subjek siluet untuk hero Spotlight / Showcase / Cutout (bukan foto tokoh) ----------
function person({ w, h, cx, scale, skin, cloth, rim, bg, transparent = false }) {
  const s = scale;
  const head = `<ellipse cx="${cx}" cy="${h * 0.3}" rx="${95 * s}" ry="${120 * s}" fill="url(#skin)"/>`;
  const hair = `<path d="M${cx - 100 * s} ${h * 0.29} Q${cx - 110 * s} ${h * 0.12} ${cx} ${h * 0.13} Q${cx + 115 * s} ${h * 0.12} ${cx + 100 * s} ${h * 0.3} Q${cx + 60 * s} ${h * 0.2} ${cx} ${h * 0.21} Q${cx - 60 * s} ${h * 0.2} ${cx - 100 * s} ${h * 0.29}Z" fill="#141414"/>`;
  const neck = `<rect x="${cx - 42 * s}" y="${h * 0.38}" width="${84 * s}" height="${170 * s}" rx="${30 * s}" fill="url(#skin)"/>`;
  const body = `<path d="M${cx - 330 * s} ${h} C${cx - 320 * s} ${h * 0.6} ${cx - 220 * s} ${h * 0.47} ${cx} ${h * 0.46} C${cx + 220 * s} ${h * 0.47} ${cx + 320 * s} ${h * 0.6} ${cx + 330 * s} ${h}Z" fill="url(#cloth)"/>`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="skin" cx="35%" cy="35%" r="80%"><stop offset="0" stop-color="${skin[0]}"/><stop offset="1" stop-color="${skin[1]}"/></radialGradient>
      <linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${cloth[0]}"/><stop offset="1" stop-color="${cloth[1]}"/></linearGradient>
      <radialGradient id="rim" cx="${rim.x}" cy="35%" r="55%"><stop offset="0" stop-color="${rim.color}" stop-opacity=".85"/><stop offset="1" stop-color="${rim.color}" stop-opacity="0"/></radialGradient>
      <filter id="n"><feTurbulence baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .08 0"/></filter>
    </defs>
    ${transparent ? '' : `<rect width="100%" height="100%" fill="${bg}"/><rect width="100%" height="100%" fill="url(#rim)"/>`}
    <g>${body}${neck}${head}${hair}</g>
    ${transparent ? '' : `<rect width="100%" height="100%" filter="url(#n)"/>`}
  </svg>`);
}

await sharp(person({ w: 1600, h: 2000, cx: 800, scale: 1.7, skin: ['#c98b66', '#5a3424'], cloth: ['#1d1d1d', '#050505'], rim: { x: '70%', color: '#ff5a1f' }, bg: '#000000' }))
  .webp({ quality: 82 })
  .toFile(`${out}/spotlight-subject.webp`);
await sharp(person({ w: 2400, h: 1400, cx: 1700, scale: 1.25, skin: ['#d6a07a', '#6b4030'], cloth: ['#24403c', '#0b1514'], rim: { x: '80%', color: '#2bb5a0' }, bg: '#0a0f0e' }))
  .webp({ quality: 82 })
  .toFile(`${out}/showcase-subject.webp`);
await sharp(person({ w: 1200, h: 1500, cx: 600, scale: 1.3, skin: ['#d9a07e', '#7a4a35'], cloth: ['#8e1622', '#4a0a12'], rim: { x: '50%', color: '#8e1622' }, bg: '', transparent: true }))
  .webp({ quality: 85, alphaQuality: 90 })
  .toFile(`${out}/cutout-figure.webp`);

// Logo klien fiktif berwarna (contoh logoTone mono → berwarna saat hover)
const colorBrands = [
  ['Kalira', '#e4572e'],
  ['Bumiloka', '#2a9d8f'],
  ['Senandika', '#6d5bd0'],
  ['Pelita&Co', '#e9a23b'],
  ['Arsa Studio', '#1f7ae0'],
  ['Nayaka', '#c2185b'],
];
colorBrands.forEach(([b, c], i) => {
  const w = 44 + b.length * 14;
  writeFileSync(
    `${out}/brand-${i + 1}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="48" viewBox="0 0 ${w} 48"><rect x="6" y="12" width="24" height="24" rx="${i % 2 ? 12 : 6}" fill="${c}"/><text x="40" y="31" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="${c}">${b.replace('&', '&amp;')}</text></svg>`,
  );
});
console.log('Selesai: subjek hero (spotlight, showcase, cutout) + 6 logo berwarna');

// Logo ikon saja (untuk varian tile: ikon + nama). Dibuat ulang hanya bila belum ada.
['#e4572e', '#2a9d8f', '#6d5bd0', '#e9a23b', '#1f7ae0', '#c2185b'].forEach((c, i) => {
  const shape =
    i % 3 === 0
      ? `<circle cx="24" cy="24" r="18" fill="${c}"/><circle cx="24" cy="24" r="7" fill="#fff"/>`
      : i % 3 === 1
        ? `<rect x="7" y="7" width="34" height="34" rx="9" fill="${c}"/><path d="M15 31 24 15l9 16z" fill="#fff"/>`
        : `<path d="M24 5 43 24 24 43 5 24z" fill="${c}"/><rect x="18" y="18" width="12" height="12" fill="#fff"/>`;
  const f = `${out}/brand-mark-${i + 1}.svg`;
  if (!existsSync(f)) writeFileSync(f, `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">${shape}</svg>`);
});
