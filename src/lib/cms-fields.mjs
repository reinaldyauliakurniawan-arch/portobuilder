// Definisi field (label, hint, widget, batas) untuk SEMUA editor: Sveltia (/admin) dan editor visual (/edit).
// Modul murni tanpa API Node supaya bisa diimpor di browser.
// WAJIB sinkron dengan src/lib/schemas.ts; dicek oleh src/lib/cms-sync.test.ts.

// Sama dengan src/lib/schemas.ts & src/lib/youtube.ts
const CATEGORIES = ['Branding', 'UI/UX', 'Ilustrasi', 'Video'];
const SOCIALS = ['LinkedIn', 'Instagram', 'Behance', 'Dribbble', 'GitHub', 'YouTube', 'TikTok', 'X'];
const YOUTUBE = '^(https?://)?(www\\.|m\\.)?(youtube\\.com|youtu\\.be|youtube-nocookie\\.com)/.+';
const MAPS = '^https://(www\\.|maps\\.)?google\\.[a-z.]+/maps(/embed)?\\?.+';
const SLUG = '^[a-z0-9]+(-[a-z0-9]+)*$';
const HEX = '^#[0-9a-fA-F]{6}$';

// ---------- helper field ----------
const opts = (pairs) => pairs.map(([value, label]) => ({ label, value }));
const string = (name, label, hint, o = {}) => ({ name, label, widget: 'string', hint, required: o.required ?? true, ...(o.max && { maxlength: o.max }), ...(o.pattern && { pattern: o.pattern }), ...(o.type && { type: o.type }), ...(o.default !== undefined && { default: o.default }) });
const optString = (name, label, hint, o = {}) => string(name, label, hint, { ...o, required: false });
const text = (name, label, hint, o = {}) => ({ name, label, widget: 'text', hint, required: o.required ?? true, ...(o.max && { maxlength: o.max }) });
const md = (name, label, hint, required = true) => ({ name, label, widget: 'markdown', hint, required, buttons: ['bold', 'italic', 'link', 'heading-two', 'heading-three', 'bulleted-list', 'numbered-list', 'quote'], editor_components: ['image'] });
const image = (name, label, hint, required = true) => ({ name, label, widget: 'image', hint, required });
const bool = (name, label, def, hint) => ({ name, label, widget: 'boolean', default: def, required: false, ...(hint && { hint }) });
const select = (name, label, pairs, def, hint, required = true) => ({ name, label, widget: 'select', options: opts(pairs), ...(def !== undefined && { default: def }), hint, required });
const number = (name, label, hint, o = {}) => ({ name, label, widget: 'number', value_type: 'int', hint, required: o.required ?? true, ...(o.min !== undefined && { min: o.min }), ...(o.max !== undefined && { max: o.max }), ...(o.default !== undefined && { default: o.default }) });
const list = (name, label, hint, fields, o = {}) => ({ name, label, widget: 'list', hint, required: o.required ?? false, ...(o.min && { min: o.min }), ...(o.max && { max: o.max }), ...(o.summary && { summary: o.summary }), fields });
const object = (name, label, hint, fields, required = false) => ({ name, label, widget: 'object', hint, required, collapsed: !required, fields });

const BUILTIN = [
  ['home', 'Beranda'],
  ['projects', 'Daftar Proyek'],
  ['about', 'About'],
  ['#kontak', 'Bagian Kontak (#kontak)'],
];

/** Field link: jenis + 3 kemungkinan tujuan. Sveltia belum punya field kondisional, jadi dijelaskan lewat hint. */
const linkFields = () => [
  select('linkType', 'Jenis link', [['builtin', 'Halaman bawaan'], ['custom', 'Halaman custom'], ['external', 'Link luar (URL)'], ['none', 'Tanpa link (hanya membuka dropdown)']], 'builtin', 'Pilih jenisnya, lalu isi SATU field tujuan di bawah yang sesuai. "Tanpa link" hanya untuk item menu navbar yang punya submenu.'),
  select('builtinPage', 'Halaman bawaan', BUILTIN, undefined, 'Isi bila Jenis link = Halaman bawaan.', false),
  {
    name: 'customPage',
    label: 'Halaman custom',
    widget: 'relation',
    collection: 'custom_pages',
    value_field: '{{fields.slug}}',
    display_fields: ['{{fields.title}} (/{{fields.slug}})'],
    search_fields: ['title', 'slug'],
    filters: [{ field: 'draft', values: [false] }],
    required: false,
    hint: 'Isi bila Jenis link = Halaman custom. Halaman draft tidak muncul di sini.',
  },
  optString('url', 'URL eksternal', 'Isi bila Jenis link = Link luar. Contoh: https://instagram.com/nama'),
];
const cta = (name, label, hint) => object(name, label, `${hint} Kosongkan teks tombol untuk menyembunyikan.`, [optString('label', 'Teks tombol', 'Maks. 30 karakter', { max: 30 }), ...linkFields()]);

const EDGES = [
  ['none', 'Tanpa efek: gambar tampil penuh'],
  ['frame', 'Bingkai: sudut membulat + garis tipis'],
  ['vignette', 'Vignette: tepi memudar halus ke warna latar'],
  ['fade-bottom', 'Pudar bawah: bagian bawah memudar ke latar'],
  ['dark-vignette', 'Vignette gelap: tepi menggelap seperti lensa kamera'],
  ['dissolve', 'Larut: keempat tepi memudar ke latar (cocok untuk foto di latar gelap)'],
  ['fade-left', 'Gelap dari kiri: sisi kiri menyatu ke latar supaya teks di atasnya terbaca'],
];
const edgeFields = (hint = '') => [
  select('imageEdge', 'Efek tepi gambar', EDGES, undefined, `Cara tepi gambar ditampilkan. ${hint}`.trim(), false),
  select('edgeIntensity', 'Intensitas efek', [['soft', 'Halus'], ['medium', 'Sedang'], ['strong', 'Kuat']], 'medium', 'Seberapa kuat efek tepi. Tidak berpengaruh bila Efek tepi = Tanpa efek atau Bingkai.', false),
];

const base = (variants, def, hint) => [bool('enabled', 'Tampilkan', true, 'Matikan untuk menyembunyikan section tanpa menghapusnya.'), select('variant', 'Gaya tampilan', variants, def, hint)];
const imageAlt = () => optString('imageAlt', 'Deskripsi gambar (alt)', 'Jelaskan isi gambar untuk pembaca layar & Google. Wajib bila ada gambar. Maks. 160 karakter', { max: 160 });

// ---------- section (dipakai ulang di Beranda, About, Halaman Custom) ----------
export const sectionTypes = [
  {
    name: 'hero',
    label: 'Hero (pembuka besar)',
    summary: '{{headline}}',
    fields: [
      ...base(
        [
          ['split', 'Split: teks kiri, foto kanan'],
          ['centered', 'Tengah: tipografi besar di tengah'],
          ['fullbleed', 'Layar penuh: foto/video penuh dengan teks di atasnya'],
          ['spotlight', 'Spotlight: foto muncul dari gelap, nama raksasa di bawahnya'],
          ['showcase', 'Showcase: kartu gelap besar, teks kiri, foto kanan, panel kaca'],
          ['cutout', 'Cutout: subjek tanpa latar di depan nama raksasa'],
        ],
        'split',
        'Tata letak hero.',
      ),
      optString('eyebrow', 'Teks kecil di atas judul', 'Contoh: "Desainer · Yogyakarta". Maks. 40 karakter (Showcase: 32)', { max: 40 }),
      optString('headline', 'Judul besar', 'Kalimat utama. Maks. 80 karakter (Showcase: 60). Tidak dipakai Spotlight & Cutout, yang menampilkan nama raksasa.', { max: 80 }),
      text('subheadline', 'Sub-judul', 'Penjelasan singkat di bawah judul. Maks. 160 karakter', { max: 160, required: false }),
      image('image', 'Gambar', 'Rasio 16:9 (Split: 4:5). Untuk Layar penuh, teks otomatis diberi overlay gelap supaya tetap terbaca.', false),
      imageAlt(),
      { name: 'videoMp4', label: 'Video latar MP4 (opsional)', widget: 'file', required: false, hint: 'Hanya untuk gaya Layar penuh. Maks. 10 MB, tanpa suara. Gambar di atas wajib diisi sebagai poster.' },
      ...edgeFields('Layar penuh: default Tanpa efek, Bingkai diabaikan. Gaya lain: default Bingkai.'),
      cta('primaryCta', 'Tombol utama', 'Tombol berwarna aksen.'),
      cta('secondaryCta', 'Tombol kedua', 'Tombol bergaris. Showcase: dipakai bila Link video hero kosong.'),
      optString('displayName', 'Nama raksasa', 'Hanya dipakai varian Spotlight & Cutout. Kosong = nama di Pengaturan Situs. Maks. 40 karakter', { max: 40 }),
      list(
        'serviceColumns',
        'Kolom layanan',
        'Hanya dipakai varian Spotlight & Showcase. Maks. 3 kolom.',
        [optString('label', 'Label kecil', 'Opsional, mis. "01". Maks. 24 karakter', { max: 24 }), string('title', 'Judul', 'Maks. 40 karakter', { max: 40 }), text('description', 'Deskripsi', 'Maks. 90 karakter (2 baris)', { max: 90 })],
        { max: 3, summary: '{{title}}' },
      ),
      number('focusX', 'Titik fokus foto (horizontal)', 'Hanya dipakai varian Showcase. 0 = kiri, 100 = kanan.', { min: 0, max: 100, default: 70, required: false }),
      optString('heroVideoUrl', 'Link video hero', 'Hanya dipakai varian Showcase. Link YouTube untuk tombol "Tonton Video".', { pattern: [YOUTUBE, 'Harus link YouTube'] }),
      image('cutoutImage', 'Foto Cutout', 'Hanya dipakai varian Cutout. Pakai foto tanpa latar (PNG transparan). Bisa dibuat gratis lewat fitur hapus latar di Canva atau remove.bg. Potong rapat di sekitar subjek supaya kepala menimpa nama.', false),
      text('intro', 'Intro singkat', 'Hanya dipakai varian Cutout. Maks. 120 karakter', { max: 120, required: false }),
      cta('textCta', 'Ajakan teks', 'Hanya dipakai varian Cutout. Contoh: "// HIRE ME".'),
      { name: 'rotatingServices', label: 'Layanan bergantian', widget: 'list', required: false, max: 6, hint: 'Hanya dipakai varian Cutout. 3–6 item, maks. 28 karakter per item.', field: string('service', 'Layanan', '', { max: 28 }) },
      optString('watermarkText', 'Teks watermark', 'Hanya dipakai varian Cutout. Kosong = kata pertama nama. Maks. 16 karakter', { max: 16 }),
      select('nameLayer', 'Posisi nama', [['behind', 'Di belakang subjek'], ['front', 'Di depan subjek']], 'behind', 'Hanya dipakai varian Cutout.', false),
    ],
  },
  {
    name: 'featuredProjects',
    label: 'Proyek Unggulan',
    summary: '{{title}}',
    fields: [
      ...base([['grid', 'Grid: kartu 2–3 kolom'], ['list', 'Daftar: baris besar, preview gambar saat hover'], ['masonry', 'Masonry: kartu bertumpuk mengikuti rasio gambar']], 'grid', 'Tata letak daftar proyek.'),
      optString('eyebrow', 'Teks kecil di atas judul', 'Maks. 40 karakter', { max: 40 }),
      optString('title', 'Judul section', 'Maks. 80 karakter', { max: 80 }),
      number('count', 'Jumlah proyek', 'Antara 3 sampai 9', { min: 3, max: 9, default: 6 }),
      select('source', 'Sumber proyek', [['featured', 'Yang ditandai Unggulan'], ['latest', 'Terbaru'], ['category', 'Kategori tertentu']], 'featured', 'Proyek mana yang ditampilkan.'),
      select('category', 'Kategori', CATEGORIES.map((c) => [c, c]), undefined, 'Isi bila Sumber = Kategori tertentu.', false),
    ],
  },
  {
    name: 'richText',
    label: 'Teks',
    summary: '{{title}}',
    fields: [
      ...base([['narrow', 'Sempit: lebar baca nyaman'], ['two-column', 'Dua kolom: judul kiri, isi kanan']], 'narrow', 'Tata letak teks.'),
      optString('title', 'Judul', 'Opsional. Maks. 80 karakter', { max: 80 }),
      md('body', 'Isi', 'Bisa memakai sub-judul, list, kutipan, gambar, dan link.'),
    ],
  },
  {
    name: 'video',
    label: 'Video YouTube',
    summary: '{{title}}',
    fields: [
      ...base([['wide', 'Lebar penuh'], ['framed', 'Di dalam kotak']], 'framed', 'Tata letak video.'),
      string('youtubeUrl', 'Link YouTube', 'Tempel link apa pun dari YouTube (watch, youtu.be, shorts, embed). Video harus Public atau Unlisted.', { pattern: [YOUTUBE, 'Harus link YouTube'] }),
      string('title', 'Judul video', 'Maks. 100 karakter', { max: 100 }),
      text('caption', 'Keterangan', 'Opsional. Maks. 200 karakter', { max: 200, required: false }),
    ],
  },
  {
    name: 'aboutShort',
    label: 'About Singkat',
    summary: '{{title}}',
    fields: [
      ...base([['split', 'Split: foto di samping teks'], ['stacked', 'Bertumpuk: foto di atas teks']], 'split', 'Tata letak.'),
      optString('eyebrow', 'Teks kecil di atas judul', 'Maks. 40 karakter', { max: 40 }),
      optString('title', 'Judul', 'Maks. 80 karakter', { max: 80 }),
      md('text', 'Teks', 'Perkenalan singkat, 2–3 paragraf.'),
      image('image', 'Foto', 'Rasio 4:5 (potret).', false),
      imageAlt(),
      ...edgeFields('Default: Bingkai.'),
      cta('cta', 'Tombol', 'Contoh: "Kenalan lebih jauh" ke halaman About.'),
    ],
  },
  {
    name: 'stats',
    label: 'Statistik',
    summary: '{{title}}',
    fields: [
      ...base([['inline', 'Sebaris dengan garis pemisah'], ['cards', 'Kartu (angka dihitung naik)']], 'inline', 'Tata letak angka.'),
      optString('title', 'Judul', 'Opsional. Maks. 80 karakter', { max: 80 }),
      list('items', 'Angka', 'Maks. 4 angka.', [string('value', 'Angka', 'Contoh: 60, 7+, 98%. Maks. 10 karakter', { max: 10 }), string('label', 'Keterangan', 'Maks. 40 karakter', { max: 40 })], { min: 1, max: 4, required: true, summary: '{{value}} {{label}}' }),
    ],
  },
  {
    name: 'logos',
    label: 'Klien / Logo',
    summary: '{{title}}',
    fields: [
      ...base([['row', 'Baris statis'], ['marquee', 'Berjalan terus (berhenti saat disentuh)'], ['tiles', 'Tile: kotak abu bersudut membulat']], 'row', 'Cara logo ditampilkan.'),
      optString('title', 'Judul', 'Contoh: "Dipercaya oleh". Maks. 80 karakter', { max: 80 }),
      select('logoTone', 'Warna logo', [['mono', 'Monokrom (berwarna saat disentuh)'], ['color', 'Warna asli']], 'mono', 'Monokrom membuat logo yang beragam terlihat seragam.', false),
      list('items', 'Logo', 'Pakai SVG atau PNG transparan. Logo otomatis dibuat abu-abu.', [image('logo', 'Logo', 'SVG atau PNG transparan'), string('name', 'Nama klien', 'Dipakai sebagai alt text. Maks. 60 karakter', { max: 60 })], { min: 1, required: true, summary: '{{name}}' }),
    ],
  },
  {
    name: 'testimonials',
    label: 'Testimoni',
    summary: '{{title}}',
    fields: [
      ...base([['carousel', 'Carousel: geser ke samping'], ['grid', 'Grid kartu']], 'grid', 'Tata letak testimoni.'),
      optString('title', 'Judul', 'Maks. 80 karakter', { max: 80 }),
      list('items', 'Testimoni', '', [text('quote', 'Kutipan', 'Maks. 400 karakter', { max: 400 }), string('name', 'Nama', 'Maks. 60 karakter', { max: 60 }), optString('role', 'Jabatan / perusahaan', 'Maks. 80 karakter', { max: 80 }), image('photo', 'Foto', 'Rasio 1:1 (persegi).', false)], { min: 1, required: true, summary: '{{name}}' }),
    ],
  },
  {
    name: 'services',
    label: 'Layanan',
    summary: '{{title}}',
    fields: [
      ...base([['cards', 'Kartu'], ['numbered', 'Daftar bernomor (cocok untuk proses kerja)']], 'cards', 'Tata letak layanan.'),
      optString('eyebrow', 'Teks kecil di atas judul', 'Maks. 40 karakter', { max: 40 }),
      optString('title', 'Judul', 'Maks. 80 karakter', { max: 80 }),
      text('intro', 'Pengantar', 'Opsional. Maks. 240 karakter', { max: 240, required: false }),
      list('items', 'Daftar layanan', '', [string('title', 'Nama layanan', 'Maks. 60 karakter', { max: 60 }), text('description', 'Deskripsi', 'Maks. 300 karakter', { max: 300 }), optString('price', 'Harga', 'Opsional. Contoh: "Mulai Rp5 juta". Maks. 40 karakter', { max: 40 }), cta('cta', 'Tombol', 'Opsional.')], { min: 1, required: true, summary: '{{title}}' }),
    ],
  },
  {
    name: 'faq',
    label: 'FAQ',
    summary: '{{title}}',
    fields: [
      ...base([['accordion', 'Akordeon: klik untuk buka jawaban'], ['two-column', 'Dua kolom: semua jawaban terlihat']], 'accordion', 'Tata letak FAQ. Otomatis tampil sebagai FAQ di hasil Google.'),
      string('title', 'Judul', 'Maks. 80 karakter', { max: 80 }),
      list('items', 'Pertanyaan', '', [string('question', 'Pertanyaan', 'Maks. 160 karakter', { max: 160 }), md('answer', 'Jawaban', 'Boleh pakai teks tebal, list, dan link.')], { min: 1, required: true, summary: '{{question}}' }),
    ],
  },
  {
    name: 'gallery',
    label: 'Galeri',
    summary: '{{title}}',
    fields: [
      ...base([['grid', 'Grid rapi (rasio 4:3)'], ['masonry', 'Masonry (rasio asli tiap gambar)']], 'grid', 'Tata letak galeri. Gambar bisa diklik untuk diperbesar.'),
      optString('title', 'Judul', 'Maks. 80 karakter', { max: 80 }),
      list('items', 'Gambar', '', [image('image', 'Gambar', ''), string('alt', 'Deskripsi gambar (alt)', 'Jelaskan isi gambar. Maks. 160 karakter', { max: 160 }), optString('caption', 'Keterangan', 'Opsional. Maks. 160 karakter', { max: 160 })], { min: 1, required: true, summary: '{{alt}}' }),
    ],
  },
  {
    name: 'map',
    label: 'Peta',
    summary: '{{title}}',
    fields: [
      ...base([['full', 'Peta lebar penuh'], ['split', 'Info kiri, peta kanan']], 'split', 'Tata letak peta.'),
      optString('title', 'Judul', 'Maks. 80 karakter', { max: 80 }),
      string('embedUrl', 'Link embed Google Maps', 'Di Google Maps: Bagikan → Sematkan peta → salin link di dalam src="...".', { pattern: [MAPS, 'Harus link embed Google Maps'] }),
      text('address', 'Alamat', 'Maks. 240 karakter', { max: 240, required: false }),
      text('hours', 'Jam buka', 'Maks. 240 karakter', { max: 240, required: false }),
    ],
  },
  {
    name: 'ctaBanner',
    label: 'Banner Ajakan (CTA)',
    summary: '{{headline}}',
    fields: [
      ...base([['default', 'Banner berwarna aksen']], 'default', 'Hanya satu gaya.'),
      string('headline', 'Kalimat ajakan', 'Maks. 100 karakter', { max: 100 }),
      object('button', 'Tombol', 'Wajib diisi.', [string('label', 'Teks tombol', 'Maks. 30 karakter', { max: 30 }), ...linkFields()], true),
    ],
  },
  {
    name: 'contact',
    label: 'Kontak',
    summary: '{{title}}',
    fields: [
      ...base([['simple', 'Sederhana: rata tengah'], ['split', 'Split: teks kiri, form kanan']], 'split', 'Tata letak kontak.'),
      string('title', 'Judul', 'Maks. 80 karakter', { max: 80 }),
      text('text', 'Teks', 'Opsional. Maks. 300 karakter', { max: 300, required: false }),
      bool('showForm', 'Tampilkan form', true, 'Pesan masuk ke email lewat Netlify Forms.'),
      bool('showDirect', 'Tampilkan email & WhatsApp', true, 'Diambil dari Pengaturan Situs.'),
    ],
  },
];

const sections = (required) => ({
  name: 'sections',
  label: 'Section',
  label_singular: 'Section',
  widget: 'list',
  hint: 'Tambah, hapus, dan seret untuk mengubah urutan. Matikan "Tampilkan" untuk menyembunyikan sementara.',
  required,
  ...(required && { min: 1 }),
  types: sectionTypes,
});

const seoFields = (pageLevel) =>
  pageLevel
    ? object('seo', 'SEO', 'Tampilan di Google & saat link dibagikan.', [
        text('description', 'Deskripsi', 'Maks. 160 karakter. Kosongkan untuk memakai deskripsi situs.', { max: 160, required: false }),
        image('ogImage', 'Gambar preview link', '1200×630 px. Kosongkan untuk memakai gambar situs.', false),
        bool('noindex', 'Sembunyikan dari Google', false, 'Nyalakan untuk halaman seperti "Terima kasih".'),
      ])
    : object('seo', 'SEO', 'Tampilan di Google & saat link dibagikan.', [text('description', 'Deskripsi situs', 'Muncul di Google. Maks. 160 karakter', { max: 160 }), image('ogImage', 'Gambar preview link', '1200×630 px. Muncul saat link dibagikan di WhatsApp/LinkedIn.')], true);

export const collections = [
  {
    name: 'settings',
    label: 'Pengaturan Situs',
    editor: { preview: false },
    files: [
      {
        name: 'site',
        label: 'Identitas & Kontak',
        file: 'src/content/settings/site.json',
        fields: [
          string('ownerName', 'Nama', 'Tampil di navbar & judul halaman. Maks. 60 karakter', { max: 60 }),
          string('role', 'Profesi', 'Contoh: "UI/UX Designer". Maks. 40 karakter', { max: 40 }),
          image('logo', 'Logo', 'Opsional. Kalau kosong, nama tampil sebagai teks.', false),
          image('favicon', 'Favicon', 'PNG persegi minimal 512 px.', false),
          string('email', 'Email', 'Dipakai di section Kontak & tombol salin email.', { type: 'email' }),
          optString('whatsapp', 'Nomor WhatsApp', 'Format 62xxx tanpa + atau spasi. Contoh: 6281234567890', { pattern: ['^62\\d{8,14}$', 'Format: 62 diikuti nomor, tanpa spasi'] }),
          list('socials', 'Sosial media', '', [select('platform', 'Platform', SOCIALS.map((s) => [s, s]), undefined, ''), string('url', 'Link profil', 'Link lengkap, diawali https://', { type: 'url' })], { summary: '{{platform}}' }),
          { name: 'cvFile', label: 'File CV (PDF)', widget: 'file', required: false, accept: 'application/pdf', hint: 'Opsional. Memunculkan tombol "Download CV" di footer.' },
          seoFields(false),
          optString('footerText', 'Teks footer', 'Maks. 160 karakter', { max: 160 }),
          select('language', 'Bahasa situs', [['id', 'Bahasa Indonesia'], ['en', 'English']], 'id', 'Bahasa teks tombol, label form, dan menu bawaan di situs. Konten tetap Anda tulis sendiri.', false),
          text('address', 'Alamat', 'Tampil di footer. Maks. 200 karakter', { max: 200, required: false }),
          select('nameSuffix', 'Simbol di belakang nama', [['none', 'Tanpa simbol'], ['®', '®'], ['™', '™'], ['*', '*']], 'none', 'Tampil kecil di belakang nama (navbar Pill, hero Spotlight & Cutout).', false),
          object('availability', 'Status ketersediaan', 'Badge berisi titik hijau, mis. "Available" atau "Terima proyek".', [bool('enabled', 'Tampilkan', false), optString('label', 'Teks status', 'Maks. 24 karakter', { max: 24 })], true),
        ],
      },
      {
        name: 'theme',
        label: 'Tema & Animasi',
        file: 'src/content/settings/theme.json',
        fields: [
          select('preset', 'Preset tema', [['editorial', 'Editorial: majalah, hangat, elegan'], ['mono', 'Minimal Mono: bersih, banyak ruang'], ['midnight', 'Dark Studio: gelap, kontras, teknis'], ['soft', 'Soft Pastel: lembut, ramah'], ['brutal', 'Bold Brutalist: berani, grafis'], ['nusantara', 'Jakarta Modern: modern, lokal'], ['noir', 'Noir Spotlight: hitam pekat, foto dari kegelapan'], ['rouge', 'Rouge: putih bersih, aksen merah tua']], 'editorial', 'Menentukan font, sudut, bayangan, dan warna awal.'),
          { name: 'backgroundColor', label: 'Warna latar (opsional)', widget: 'color', allowInput: true, required: false, pattern: [HEX, 'Format hex, contoh #F5F1EA'], hint: 'Kosongkan untuk memakai warna preset. Warna bisa digeser sedikit otomatis demi keterbacaan.' },
          { name: 'textColor', label: 'Warna teks (opsional)', widget: 'color', allowInput: true, required: false, pattern: [HEX, 'Format hex, contoh #1A1A1A'], hint: 'Kosongkan untuk memakai warna preset. Bila kurang kontras dengan latar, otomatis digelapkan/diterangkan.' },
          { name: 'accentColor', label: 'Warna aksen (opsional)', widget: 'color', allowInput: true, required: false, pattern: ['^(#[0-9a-fA-F]{6}|auto)$', 'Format hex (contoh #C2410C) atau ketik auto'], hint: 'Warna tombol & link. Kosongkan untuk memakai warna preset. Ketik "auto" untuk mengambil warna dari foto hero Beranda. Bisa digeser sedikit demi keterbacaan.' },
          select('motion', 'Animasi', [['full', 'Penuh'], ['subtle', 'Halus (fade saja)'], ['off', 'Mati']], 'full', 'Level animasi seluruh situs.'),
        ],
      },
      {
        name: 'navigation',
        label: 'Navigasi (Menu)',
        file: 'src/content/settings/navigation.json',
        fields: [
          select('navStyle', 'Gaya navbar', [['default', 'Standar: nama, menu, tombol'], ['pill', 'Pill: nama + status, tombol Menu'], ['glass-center', 'Kaca tengah: menu di pill kaca (cocok dengan hero Showcase)']], 'default', 'Tampilan navbar di semua halaman.', false),
          list('mainMenu', 'Menu navbar', 'Maks. 6 item. Seret untuk mengubah urutan. Halaman custom harus dibuat dulu sebelum bisa ditautkan.', [string('label', 'Teks menu', 'Maks. 30 karakter', { max: 30 }), ...linkFields(), bool('openNewTab', 'Buka di tab baru', false), list('children', 'Submenu (dropdown)', 'Opsional. Bila diisi, item ini membuka daftar dropdown. Maks. 12 item.', [string('label', 'Teks submenu', 'Maks. 40 karakter', { max: 40 }), ...linkFields()], { max: 12, summary: '{{label}}' })], { max: 6, summary: '{{label}}' }),
          object('ctaButton', 'Tombol CTA navbar', 'Tombol menonjol di kanan navbar, contoh "Hubungi Saya".', [bool('enabled', 'Tampilkan', false), optString('label', 'Teks tombol', 'Maks. 30 karakter', { max: 30 }), ...linkFields()], true),
          list('footerMenu', 'Menu footer', 'Maks. 10 item, untuk halaman sekunder seperti FAQ.', [string('label', 'Teks menu', 'Maks. 30 karakter', { max: 30 }), ...linkFields()], { max: 10, summary: '{{label}}' }),
        ],
      },
    ],
  },
  {
    name: 'pages',
    label: 'Halaman',
    files: [
      { name: 'home', label: 'Beranda', file: 'src/content/pages/home.json', fields: [sections(false)] },
      {
        name: 'about',
        label: 'About',
        file: 'src/content/pages/about.json',
        fields: [
          image('photo', 'Foto', 'Rasio 4:5 (potret).'),
          string('photoAlt', 'Deskripsi foto (alt)', 'Maks. 160 karakter', { max: 160 }),
          ...edgeFields('Default: Bingkai.'),
          string('headline', 'Judul', 'Maks. 80 karakter', { max: 80 }),
          md('bio', 'Bio', 'Cerita tentang Anda.'),
          list('experience', 'Pengalaman', 'Ditampilkan sebagai timeline.', [string('period', 'Periode', 'Contoh: 2020 — 2023', { max: 40 }), string('title', 'Posisi', 'Maks. 80 karakter', { max: 80 }), string('org', 'Organisasi', 'Maks. 80 karakter', { max: 80 }), text('description', 'Deskripsi', 'Opsional. Maks. 300 karakter', { max: 300, required: false })], { summary: '{{period}} · {{title}}' }),
          { name: 'skills', label: 'Keahlian', widget: 'list', required: false, hint: 'Ditampilkan sebagai badge. Maks. 40 karakter per item.', field: string('skill', 'Keahlian', '', { max: 40 }) },
          sections(false),
        ],
      },
    ],
  },
  {
    name: 'custom_pages',
    label: 'Halaman custom',
    label_singular: 'Halaman',
    description: 'Halaman tambahan seperti Layanan, Harga, atau FAQ. Setelah dibuat, tambahkan ke menu di Pengaturan Situs → Navigasi.',
    folder: 'src/content/custom-pages',
    format: 'json',
    extension: 'json',
    create: true,
    delete: true,
    identifier_field: 'title',
    slug: '{{fields.slug}}',
    summary: '{{title}} — /{{fields.slug}}',
    sortable_fields: ['title'],
    fields: [
      string('title', 'Judul halaman', 'Tampil di tab browser dan sebagai judul besar. Maks. 80 karakter', { max: 80 }),
      string('slug', 'Alamat URL', 'Huruf kecil, angka, dan tanda hubung. Contoh: layanan → namaweb.com/layanan. Tidak boleh: admin, projects, about, dev, uploads, 404.', { pattern: [SLUG, 'Huruf kecil, angka, dan tanda hubung saja'] }),
      object('pageHeader', 'Header halaman', 'Judul + sub-judul di atas konten. Matikan bila section pertama adalah Hero.', [bool('enabled', 'Tampilkan', true), optString('eyebrow', 'Teks kecil di atas judul', 'Maks. 40 karakter', { max: 40 }), text('subtitle', 'Sub-judul', 'Maks. 200 karakter', { max: 200, required: false }), image('image', 'Gambar', 'Opsional. Rasio 12:5 (lebar).', false), imageAlt(), ...edgeFields('Default: Bingkai.')]),
      sections(true),
      seoFields(true),
      bool('draft', 'Sembunyikan (draft)', false, 'Halaman draft tidak diterbitkan. Hapus dulu dari menu sebelum menjadikannya draft, kalau tidak build akan gagal.'),
    ],
  },
  {
    name: 'projects',
    label: 'Proyek',
    label_singular: 'Proyek',
    folder: 'src/content/projects',
    extension: 'md',
    format: 'frontmatter',
    create: true,
    delete: true,
    slug: '{{slug}}',
    identifier_field: 'title',
    summary: '{{title}} — {{year}}',
    sortable_fields: ['order', 'year', 'title'],
    fields: [
      string('title', 'Judul', 'Alamat halaman dibuat otomatis dari judul. Maks. 80 karakter', { max: 80 }),
      select('category', 'Kategori', CATEGORIES.map((c) => [c, c]), undefined, ''),
      number('year', 'Tahun', 'Contoh: 2026', { min: 1990, max: 2100 }),
      image('cover', 'Gambar cover', 'Rasio 4:3. Tampil di kartu proyek.'),
      string('coverAlt', 'Deskripsi cover (alt)', 'Maks. 160 karakter', { max: 160 }),
      text('summary', 'Ringkasan', 'Tampil di kartu proyek, maks. 160 karakter', { max: 160 }),
      optString('role', 'Peran saya', 'Maks. 80 karakter', { max: 80 }),
      optString('client', 'Klien', 'Maks. 80 karakter', { max: 80 }),
      { name: 'tools', label: 'Tools', widget: 'list', required: false, hint: 'Contoh: Figma, Illustrator. Ditampilkan sebagai badge.', field: string('tool', 'Tool', '', { max: 30 }) },
      bool('featured', 'Unggulan', false, 'Muncul di section Proyek Unggulan.'),
      number('order', 'Urutan', 'Opsional. Angka kecil tampil lebih dulu; kosong = urut tahun terbaru.', { required: false }),
      list('gallery', 'Galeri', 'Bisa diklik untuk diperbesar.', [image('image', 'Gambar', ''), string('alt', 'Deskripsi (alt)', 'Maks. 160 karakter', { max: 160 }), optString('caption', 'Keterangan', 'Maks. 160 karakter', { max: 160 })], { summary: '{{alt}}' }),
      list('videos', 'Video YouTube', 'Tempel link YouTube apa pun.', [string('youtubeUrl', 'Link YouTube', 'Video harus Public atau Unlisted.', { pattern: [YOUTUBE, 'Harus link YouTube'] }), string('title', 'Judul video', 'Maks. 100 karakter', { max: 100 })], { summary: '{{title}}' }),
      optString('externalUrl', 'Link live', 'Opsional. Memunculkan tombol "Lihat live".', { type: 'url' }),
      bool('draft', 'Sembunyikan (draft)', false, 'Proyek draft tidak diterbitkan.'),
      md('body', 'Isi studi kasus', 'Ceritakan masalah, proses, dan hasil.', false),
    ],
  },
];

