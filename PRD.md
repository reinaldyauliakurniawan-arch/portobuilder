# PRD — Website Portfolio Editable (Astro + Sveltia CMS)

Nov 24, 2026 · @Just Speak

## 1. Ringkasan

Website portfolio multi-halaman yang seluruh kontennya, termasuk pembuatan halaman baru dan menu navigasi, diedit lewat panel admin (`/admin`) oleh orang non-tech. Desain, tipografi, dan animasi dikunci supaya tetap estetik siapa pun yang mengedit. Website dibangun dengan Astro, kontennya diedit lewat Sveltia CMS, dan di-host di Netlify.

**Tujuan**

- Editor non-tech bisa mengganti teks, gambar, video YouTube, urutan section, dan preset tema tanpa menyentuh kode.
- Editor bisa membuat halaman baru sebanyak yang dibutuhkan (misalnya Layanan, Pameran, Harga, FAQ), menyusun isinya dari section yang tersedia, lalu memasukkannya ke menu navbar atau footer.
- Tampilan tetap konsisten dan rapi apa pun isi kontennya.
- Skor Lighthouse mobile minimal 90 di keempat kategori.
- Biaya hosting Rp0 (Netlify free tier).

**Di luar cakupan v1**

- Drag & drop bebas ala Webflow. Yang tersedia: pilih, urutkan, dan nyalakan/matikan section.
- Color picker yang tidak dijaga kontrasnya, dan pilihan font bebas. Warna bisa dikustom tapi selalu dikoreksi otomatis ke WCAG AA (Bagian 7).
- Sub-halaman bertingkat dan menu dropdown. Semua halaman custom berada satu level di bawah root (`/nama-halaman`).
- Blog, e-commerce, multi-bahasa, dan peran editor yang berbeda-beda. Blog bisa ditambahkan di v2 dengan pola koleksi yang sama seperti Proyek.

## 2. Pengguna & peran

Ada tiga pengguna. Keputusan desain selalu mengutamakan editor non-tech.

| Peran | Siapa | Kebutuhan utama |
| --- | --- | --- |
| Editor | Pemilik portfolio, non-tech | Edit konten lewat form berbahasa Indonesia, upload gambar, tempel link YouTube, atur section, bisa dari HP |
| Developer | Pemilik repo + Claude Code | Ubah desain, tambah section atau varian, maintain dependency |
| Pengunjung | Rekruter, calon klien | Halaman cepat terbuka, karya mudah dilihat, kontak mudah dihubungi, nyaman di HP |

## 3. Tech stack

Semua library memakai versi stabil terbaru. Claude Code wajib mengecek dokumentasi resmi bila ragu soal API.

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| Framework | Astro + TypeScript, `output: static` | HTML statis yang ringan, plus content collections dengan validasi Zod |
| Styling | Tailwind CSS + CSS variables | Token desain terpusat, dan preset tema cukup ditukar lewat `data-theme` |
| CMS | Sveltia CMS (dimuat dari CDN di `/admin`) | Berbasis Git, gratis, UI modern, ramah HP, kompres gambar otomatis |
| Repo & auth | GitHub, login editor via OAuth GitHub | Tanpa server; riwayat versi gratis untuk rollback |
| Hosting | Netlify | Gratis, auto-deploy setiap commit, Image CDN, Forms |
| Motion | GSAP + ScrollTrigger, Lenis | Animasi scroll yang halus dan stabil |
| Transisi halaman | Astro View Transitions (`ClientRouter`) | Transisi antarhalaman bawaan |
| Video | `lite-youtube-embed` | Iframe YouTube baru dimuat saat diklik |
| Font | Fontsource (self-host) | Tanpa request ke Google Fonts, lebih cepat dan privat |
| Form | Netlify Forms + honeypot | Form kontak tanpa backend |
| SEO | `@astrojs/sitemap`, JSON-LD | Sitemap dan structured data otomatis |

## 4. Struktur project

Konten (`src/content`) dipisah dari tampilan (`src/components`). Dengan begitu editor hanya menyentuh file konten lewat CMS.

```
portfolio/
├─ public/
│  ├─ admin/
│  │  ├─ index.html            # memuat Sveltia CMS
│  │  └─ config.yml            # skema CMS (sinkron dengan content.config.ts)
│  └─ uploads/                 # media yang di-upload lewat CMS
├─ src/
│  ├─ content/
│  │  ├─ settings/site.json    # identitas, kontak, sosial, SEO
│  │  ├─ settings/theme.json   # preset tema & level animasi
│  │  ├─ settings/navigation.json  # menu navbar & footer
│  │  ├─ pages/home.json       # daftar section beranda
│  │  ├─ pages/about.json
│  │  ├─ custom-pages/*.json   # satu file per halaman custom
│  │  └─ projects/*.md         # satu file per proyek
│  ├─ content.config.ts        # skema Zod semua koleksi
│  ├─ components/
│  │  ├─ sections/             # Hero, ProjectGrid, Video, RichText, FAQ, ...
│  │  ├─ ui/                   # Button, Card, YouTube, Lightbox, Accordion, ...
│  │  ├─ Navbar.astro, Footer.astro
│  │  └─ SectionRenderer.astro
│  ├─ layouts/BaseLayout.astro
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ about.astro
│  │  ├─ projects/index.astro
│  │  ├─ projects/[slug].astro
│  │  ├─ [slug].astro          # semua halaman custom
│  │  ├─ dev/sections.astro    # katalog semua section × varian × preset (noindex)
│  │  └─ 404.astro
│  ├─ styles/global.css, themes.css
│  ├─ scripts/motion.ts
│  └─ lib/youtube.ts, seo.ts, navigation.ts
├─ astro.config.mjs
├─ netlify.toml
├─ CLAUDE.md
├─ PRD.md                      # dokumen ini
└─ PANDUAN-EDITOR.md           # panduan untuk editor non-tech
```

## 5. Model konten

Ada tujuh sumber konten. Setiap field punya label dan hint berbahasa Indonesia di CMS, dan field wajib divalidasi di CMS maupun di Zod.

**Pengaturan situs** (`settings/site.json`)

| Field | Tipe | Wajib | Catatan |
| --- | --- | --- | --- |
| ownerName | string | Ya | Nama yang tampil di navbar dan judul |
| role | string | Ya | Contoh: “UI/UX Designer”, maks. 40 karakter |
| logo | image | Tidak | Kalau kosong, tampil nama dalam bentuk teks |
| favicon | image | Tidak | PNG persegi minimal 512 px |
| email | string (email) | Ya | Dipakai di section kontak dan tombol salin email |
| whatsapp | string | Tidak | Format 62xxx, otomatis jadi link wa.me |
| socials | list {platform (select), url} | Tidak | Platform: LinkedIn, Instagram, Behance, Dribbble, GitHub, YouTube, TikTok, X |
| cvFile | file (PDF) | Tidak | Memunculkan tombol “Download CV” |
| seo.description | text | Ya | Maks. 160 karakter |
| seo.ogImage | image | Ya | 1200×630 px |
| footerText | string | Tidak |  |

**Tema** (`settings/theme.json`)

| Field | Tipe | Default | Catatan |
| --- | --- | --- | --- |
| preset | select | editorial | Salah satu dari 6 preset di Bagian 7; menentukan font, radius, gaya shadow, dan warna awal |
| backgroundColor | color (opsional) | kosong | Mengganti warna latar preset |
| textColor | color (opsional) | kosong | Mengganti warna teks preset |
| accentColor | color (opsional) | kosong | Mengganti warna aksen preset |
| motion | select: full / subtle / off | full | Level animasi seluruh situs |

Warna yang dikosongkan memakai nilai preset. Semua warna, custom maupun bawaan, melewati engine kontras di Bagian 7.

**Navigasi** (`settings/navigation.json`)

| Field | Tipe | Catatan |
| --- | --- | --- |
| mainMenu | list {label, linkType, builtinPage, customPage, url, openNewTab} | Menu navbar, maks. 6 item, urutan bisa di-drag |
| ctaButton | {enabled, label, linkType, builtinPage, customPage, url} | Tombol menonjol di kanan navbar, contoh “Hubungi Saya” |
| footerMenu | list {label, linkType, builtinPage, customPage, url} | Maks. 10 item, untuk halaman sekunder seperti FAQ atau Kebijakan Privasi |

`linkType` menentukan field mana yang dipakai: `builtin` memakai `builtinPage` (select: Beranda, Proyek, About, atau anchor `#kontak`), `custom` memakai `customPage` (widget relation ke koleksi Halaman Custom, draft tidak ditampilkan), dan `external` memakai `url`. Field yang tidak relevan disembunyikan atau diabaikan.

**Beranda** (`pages/home.json`)

| Field | Tipe | Catatan |
| --- | --- | --- |
| sections | list bertipe (variable types) | Tiap item adalah satu jenis section dari Bagian 6. Setiap item punya `enabled` (boolean), `variant` (select), dan field khusus section tersebut. Editor bisa menambah, menghapus, dan menyusun ulang urutannya. |

**About** (`pages/about.json`)

| Field | Tipe | Catatan |
| --- | --- | --- |
| photo, photoAlt | image, string | Rasio 4:5 |
| headline | string | Maks. 80 karakter |
| bio | markdown |  |
| experience | list {period, title, org, description} | Ditampilkan sebagai timeline |
| skills | list string | Ditampilkan sebagai badge |
| sections | list bertipe | Opsional, memakai jenis section yang sama dengan Beranda |

**Halaman custom** (`custom-pages/*.json`, satu file per halaman)

| Field | Tipe | Wajib | Catatan |
| --- | --- | --- | --- |
| title | string | Ya | Judul halaman, tampil di tab browser dan sebagai H1 bila tidak ada Hero |
| slug | string | Ya | Dibuat otomatis dari judul, bisa diedit. Hanya huruf kecil, angka, dan tanda hubung |
| pageHeader | {enabled, eyebrow, subtitle, image, imageEdge, edgeIntensity} | Tidak | Header sederhana di atas konten, untuk halaman yang tidak memakai section Hero |
| sections | list bertipe | Ya | Jenis section yang sama dengan Beranda (Bagian 6), minimal 1 section |
| seo.description | text | Tidak | Maks. 160 karakter; kalau kosong memakai deskripsi situs |
| seo.ogImage | image | Tidak | Kalau kosong memakai OG image situs |
| seo.noindex | boolean | Tidak | Sembunyikan dari Google, misalnya untuk halaman terima kasih |
| draft | boolean | Tidak | Kalau `true`, halaman tidak di-build dan tidak muncul di pilihan menu |

Slug yang dicadangkan dan ditolak: `admin`, `projects`, `about`, `dev`, `uploads`, `404`, dan slug yang sudah dipakai halaman lain. Slug yang bentrok menggagalkan build dengan pesan yang jelas.

**Proyek** (`projects/*.md`, satu file per proyek)

| Field | Tipe | Wajib | Catatan |
| --- | --- | --- | --- |
| title | string | Ya | Slug dibuat otomatis dari judul |
| category | select | Ya | Daftar kategori diatur di config CMS |
| year | number | Ya |  |
| cover, coverAlt | image, string | Ya | Rasio 4:3 |
| summary | text | Ya | Maks. 160 karakter, tampil di kartu |
| role, client | string | Tidak |  |
| tools | list string | Tidak | Ditampilkan sebagai badge |
| featured | boolean | Tidak | Muncul di section “Proyek Unggulan” |
| order | number | Tidak | Urutan manual; kalau kosong diurutkan berdasarkan tahun |
| gallery | list {image, alt, caption} | Tidak | Bisa dibuka di lightbox |
| videos | list {youtubeUrl, title} | Tidak | Lihat Bagian 9 |
| externalUrl | string (url) | Tidak | Tombol “Lihat live” |
| draft | boolean | Tidak | Kalau `true`, proyek tidak ikut di-build |
| body | markdown | Tidak | Isi studi kasus: masalah, proses, hasil |

## 6. Halaman & section

Ada lima halaman bawaan, halaman custom tanpa batas jumlah, dan empat belas jenis section. Setiap varian wajib tetap rapi saat field opsionalnya kosong.

**Halaman**

| Halaman | URL | Isi |
| --- | --- | --- |
| Beranda | `/` | Section dinamis dari `pages/home.json` |
| Daftar proyek | `/projects` | Grid semua proyek, filter kategori di sisi klien, urut `order` lalu `year` |
| Detail proyek | `/projects/[slug]` | Cover, meta (tahun, peran, klien, tools), body, galeri + lightbox, video, tombol proyek sebelum/berikutnya |
| About | `/about` | Foto, bio, timeline pengalaman, skills, section tambahan |
| Halaman custom | `/[slug]` | Dibuat editor dari CMS: page header opsional + section bebas dari daftar di bawah. Contoh: `/layanan`, `/harga`, `/faq`, `/pameran-2026` |
| 404 | `/404` | Pesan singkat + tombol kembali, mengikuti preset tema |

Navbar dan footer dibangun dari `settings/navigation.json`, bukan di-hard-code. Navbar berisi logo/nama, item `mainMenu`, dan `ctaButton`; item untuk halaman yang sedang dibuka ditandai aktif. Di HP, menu berubah jadi menu layar penuh. Footer berisi `footerMenu`, link sosial, email, teks footer, dan tombol kembali ke atas. Link ke halaman yang tidak ada atau berstatus draft menggagalkan build.

**Section untuk Beranda, About & halaman custom**

| Section | Field utama | Varian |
| --- | --- | --- |
| Hero | eyebrow, headline (maks. 80), subheadline (maks. 160), media (gambar atau MP4), perlakuan tepi gambar + intensitas (Bagian 9), 2 CTA | `split` teks kiri dan foto kanan · `centered` tipografi besar di tengah · `fullbleed` media layar penuh dengan overlay teks |
| Proyek unggulan | judul, jumlah (3–9), sumber (featured / terbaru / kategori tertentu) | `grid` 2–3 kolom · `list` baris besar dengan preview gambar saat hover · `masonry` |
| Teks (rich text) | judul opsional, isi markdown (heading H2–H3, paragraf, list, kutipan, gambar, link) | `narrow` lebar baca 680 px · `two-column` judul kiri, isi kanan |
| Video | link YouTube, judul, caption | `wide` lebar penuh · `framed` di dalam kontainer |
| About singkat | foto, teks, CTA | `split` · `stacked` |
| Statistik | maks. 4 × {angka, label} | `inline` · `cards` (angka dianimasikan menghitung naik) |
| Klien / logo | list logo + nama | `row` statis · `marquee` berjalan |
| Testimoni | list {kutipan, nama, jabatan, foto} | `carousel` · `grid` |
| Layanan | list {judul, deskripsi, harga opsional, CTA opsional} | `cards` · `numbered` |
| FAQ | judul, list {pertanyaan, jawaban markdown} | `accordion` · `two-column` (+ JSON-LD `FAQPage`) |
| Galeri | list {gambar, alt, caption} | `grid` · `masonry` |
| Peta | link Google Maps embed, alamat, jam buka | `full` · `split` peta dan info |
| Banner CTA | headline, tombol (link ke halaman atau URL) | satu varian |
| Kontak | judul, teks, tampilkan form (bool), tampilkan email/WA (bool) | `simple` · `split` |

`SectionRenderer.astro` memetakan `type` dan `variant` ke komponen yang tepat. Section dengan `enabled: false` dilewati. Jenis section yang tidak dikenal menggagalkan build dengan pesan yang jelas.

## 7. Sistem desain & preset tema

Editor memilih satu dari enam preset sebagai titik awal, lalu boleh mengganti warna latar, teks, dan aksen dengan bebas. Kontras WCAG dijamin otomatis oleh sistem, sedangkan font tetap mengikuti preset.

| ID | Nama | Vibe | Background | Teks | Aksen | Font heading / body |
| --- | --- | --- | --- | --- | --- | --- |
| `editorial` | Editorial | Majalah, hangat, elegan | #F5F1EA | #1A1A1A | #C2410C | Instrument Serif / Inter |
| `mono` | Minimal Mono | Bersih, banyak whitespace | #FFFFFF | #0A0A0A | #0A0A0A | Inter Tight / Inter |
| `midnight` | Dark Studio | Gelap, kontras, teknis | #0B0B0F | #EDEDED | #A3E635 | Space Grotesk / Inter |
| `soft` | Soft Pastel | Lembut, ramah | #FDF6F0 | #2B2B2B | #E07A5F | Fraunces / DM Sans |
| `brutal` | Bold Brutalist | Berani, grafis | #FFFFFF | #000000 | #FF3B00 | Syne / Manrope |
| `nusantara` | Jakarta Modern | Modern, lokal | #F7F7F2 | #14213D | #2A9D8F | Plus Jakarta Sans / Plus Jakarta Sans |

**Aturan implementasi**

- Setiap preset mendefinisikan token CSS: `--bg`, `--surface`, `--text`, `--muted`, `--accent`, `--accent-contrast`, `--border`, `--radius`, `--font-heading`, dan `--font-body`. Preset diterapkan lewat `<html data-theme="...">`.
- Tailwind membaca semua warna dari token tersebut. Tidak boleh ada warna hard-coded di komponen.
- Setiap kombinasi teks/latar wajib lolos kontras WCAG AA. Kalau nilai di tabel gagal, sesuaikan sedikit lalu catat perubahannya.
- Tipografi fluid dengan `clamp()`: body 16–18 px, H1 40–96 px, line-height body 1.6.
- Spacing kelipatan 8 px. Lebar kontainer maks. 1280 px dengan padding samping 20 px (HP) sampai 48 px (desktop).
- Rasio gambar dikunci per slot dengan `object-fit: cover`, jadi foto apa pun tetap rapi.
- Panjang teks dibatasi di CMS (lihat Bagian 5–6) supaya layout tidak pecah.

**Warna custom dengan kontras yang dijamin**

Editor boleh memilih warna apa pun. Sistem menghitung semua warna turunan, lalu menggeser lightness-nya seminimal mungkin sampai setiap pasangan lolos target kontras, jadi hasil akhirnya selalu lolos WCAG 2.2 AA.

Kontras dihitung dengan rumus WCAG 2.x. Setiap kanal sRGB c (0–1) dilinearkan, lalu dihitung luminans relatif L dan rasio kontrasnya:

```latex
c_{lin} = \begin{cases} c / 12.92 & c \le 0.04045 \\ \left(\frac{c + 0.055}{1.055}\right)^{2.4} & c > 0.04045 \end{cases}
```

```latex
L = 0.2126\,R_{lin} + 0.7152\,G_{lin} + 0.0722\,B_{lin} \qquad \text{kontras} = \frac{L_{terang} + 0.05}{L_{gelap} + 0.05}
```

| Pasangan warna | Target minimum | Yang digeser bila gagal |
| --- | --- | --- |
| Teks vs latar, teks vs surface kartu | 4,5:1 | Teks |
| Teks muted (caption, meta) vs latar dan surface | 4,5:1 | Teks muted |
| Aksen sebagai link vs latar dan surface | 4,5:1 | Aksen |
| Teks di atas tombol aksen (`--accent-contrast`) | 4,5:1 | Pilih hitam atau putih; kalau dua-duanya gagal, aksen yang digeser |
| Focus ring, border input form vs latar dan surface | 3:1 | Warna ring/border |
| Teks di atas foto (hero `fullbleed`, page header) | 4,5:1 | Opacity overlay gelap |

**Algoritma** (`lib/color.ts`, dijalankan saat build oleh integrasi Astro)

1. Latar adalah jangkar dan tidak pernah diubah. Ini selalu aman karena untuk latar apa pun, hitam atau putih pasti mencapai kontras minimal 4,58:1.
2. Semua warna dikonversi ke OKLCH (library `culori`), supaya yang digeser hanya lightness sementara hue dan chroma dipertahankan. Chroma di-clamp ke gamut sRGB.
3. Untuk tiap warna yang gagal, cari lightness terdekat lewat binary search ke arah yang menjauh dari luminans latar, sampai target + margin 0,1 tercapai. Kalau arah itu mentok, coba arah sebaliknya. Fallback terakhir adalah hitam atau putih, yang dijamin lolos.
4. Warna turunan dihitung dari input: `--surface` (latar digeser lightness 3–5%), `--muted`, `--border`, `--accent-hover`, dan `--accent-contrast`. Semua turunan ikut diperiksa dengan tabel di atas.
5. Mode shadow kartu ditentukan dari luminans latar: kalau L < 0,18, kartu memakai shadow gelap ditambah border tipis 1 px (seperti preset `midnight`); kalau tidak, memakai shadow lembut preset.
6. Untuk teks di atas foto, `sharp` menghitung luminans persentil ke-95 area teks pada gambar saat build. Opacity overlay gelap dihitung dari angka itu sampai kontras teks mencapai 4,5:1.
7. Build log menampilkan tabel penyesuaian (warna asli → warna hasil → rasio kontras), dan hint di CMS menjelaskan bahwa warna bisa digeser sedikit demi keterbacaan.

**Pengujian wajib**

- Unit test untuk rumus kontras dengan nilai acuan yang sudah diketahui (hitam/putih 21:1, #777 di atas putih ±4,48:1).
- Property-based test (`fast-check`) dengan 10.000 kombinasi acak latar, teks, dan aksen: semua pasangan hasil akhir harus lolos target.
- Kasus ekstrem: latar abu-abu tengah (#777), kuning di atas putih, merah murni, serta teks dan latar yang identik.

**Kartu (card)**

Semua kartu wajib bersudut membulat dan punya shadow. Gaya shadow mengikuti karakter preset, dan nilainya disimpan sebagai token `--radius-card`, `--shadow-card`, dan `--shadow-card-hover` di `themes.css`.

| Preset | Radius kartu | Shadow normal | Shadow saat hover |
| --- | --- | --- | --- |
| `editorial` | 16 px | `0 1px 2px rgb(26 26 26 / .06), 0 8px 24px rgb(26 26 26 / .08)` | `0 16px 40px rgb(26 26 26 / .14)` |
| `mono` | 12 px | `0 1px 3px rgb(0 0 0 / .06), 0 6px 20px rgb(0 0 0 / .06)` | `0 12px 32px rgb(0 0 0 / .12)` |
| `midnight` | 16 px | `0 8px 30px rgb(0 0 0 / .6)` + border 1 px `rgb(255 255 255 / .08)`, latar kartu `--surface` sedikit lebih terang | `0 16px 40px rgb(0 0 0 / .7)` + border berwarna aksen 30% |
| `soft` | 24 px | `0 10px 30px rgb(224 122 95 / .12)` (shadow bernuansa aksen) | `0 18px 44px rgb(224 122 95 / .20)` |
| `brutal` | 12 px | Shadow keras `6px 6px 0 #000` + border 2 px hitam | `10px 10px 0 #000` |
| `nusantara` | 16 px | `0 4px 16px rgb(20 33 61 / .08)` | `0 12px 32px rgb(20 33 61 / .16)` |

- Berlaku untuk kartu proyek, layanan, testimoni, statistik (varian `cards`), item FAQ, kotak form kontak, dan kartu di halaman custom.
- Gambar di dalam kartu ikut terpotong mengikuti radius (`overflow: hidden`). Opsi `imageEdge` tidak berlaku di dalam kartu.
- Tombol memakai radius yang sama dengan kartu, atau berbentuk pill (`9999px`) sesuai preset, tanpa shadow kecuali di preset `brutal`.
- Kartu yang bisa diklik punya focus ring yang jelas dan seluruh area kartunya bisa diklik.

## 8. Motion & interaksi

Animasi sudah tertanam di desain dan tidak diatur editor, kecuali level animasinya (`full`, `subtle`, atau `off`).

| Elemen | Animasi | Durasi / easing |
| --- | --- | --- |
| Hero saat load | Teks muncul per baris (y 24 px ke 0, opacity 0 ke 1), stagger 0,08 s | 0,8 s, `power3.out` |
| Section saat di-scroll | Fade-up sekali jalan, mulai di `top 85%` | 0,7 s |
| Kartu proyek (hover) | Kartu naik 4 px dan shadow berubah ke \`--shadow-card-hover\`, gambar di dalamnya membesar ke 1,04, dan judul mendapat garis bawah. Perpindahan shadow dibuat dengan pseudo-element \`::after\` yang di-fade opacity-nya, bukan dengan menganimasikan \`box-shadow\`, supaya tetap ringan | 0,5 s |
| Gambar di detail proyek | Reveal dengan clip-path saat masuk layar | 0,9 s |
| Statistik | Angka menghitung naik saat terlihat | 1,2 s |
| Logo klien (`marquee`) | Berjalan terus dengan CSS, berhenti saat hover | 30 s per putaran |
| Antarhalaman | Fade lewat View Transitions | 0,3 s |
| Scroll | Smooth scroll Lenis, disinkronkan dengan ScrollTrigger | lerp 0,1 |
| Tombol & link | Perubahan warna dan offset kecil | 0,2 s |

**Aturan**

- Hanya `transform` dan `opacity` yang dianimasikan, tidak ada animasi yang memicu layout.
- Level `subtle` hanya memakai fade tanpa pergeseran posisi, dan Lenis dimatikan. Level `off` atau `prefers-reduced-motion: reduce` mematikan semua animasi non-esensial.
- Tanpa preloader. Konten harus terlihat walaupun JavaScript gagal dimuat (progressive enhancement).
- Script motion di-init ulang pada event `astro:page-load` dan dibersihkan sebelum navigasi supaya tidak bocor.

## 9. Media: gambar & YouTube

Editor cukup upload gambar atau menempel link YouTube. Kompresi, ukuran responsif, dan embed diurus otomatis oleh sistem.

**Gambar**

- Upload lewat CMS ke `public/uploads`. Sveltia dikonfigurasi agar mengonversi gambar ke WebP dengan lebar maks. 2400 px saat upload.
- Frontend menyajikan ukuran responsif (`srcset`) lewat Netlify Image CDN, atau `astro:assets` kalau lebih sederhana. Pilih salah satu dan catat alasannya di CLAUDE.md.
- Gambar hero dimuat `eager` dengan `fetchpriority="high"`. Gambar lain memakai `loading="lazy"` dan `decoding="async"`.
- `width` dan `height` selalu diset untuk mencegah layout shift.
- Alt text wajib untuk semua gambar konten.
- Rasio tetap per slot: hero 16:9, cover proyek 4:3, foto About 4:5, avatar testimoni 1:1, galeri sesuai rasio asli di layout masonry.
- Galeri proyek bisa dibuka di lightbox yang aksesibel: navigasi keyboard, tombol Esc, swipe di HP, dan focus trap.

**Perlakuan tepi gambar (frame, vignette, fade)**

Editor memilih cara tepi gambar ditampilkan dari dropdown, bukan lewat slider bebas. Karena vignette dibuat dengan transparansi, tepi gambar otomatis menyatu dengan warna latar preset apa pun.

| Opsi (`imageEdge`) | Efek | Teknik | Cocok untuk |
| --- | --- | --- | --- |
| `none` | Gambar tampil penuh sesuai slot | — | Galeri, cover proyek |
| `frame` | Bingkai: sudut membulat `--radius` + border tipis `--border` | `border-radius`, `border` | Hero `split`, foto About |
| `vignette` | Tepi memudar halus ke warna latar, tanpa garis bingkai | `mask-image: radial-gradient(ellipse, #000 X%, transparent 100%)` | Hero `split` dan `centered`, foto About, page header |
| `fade-bottom` | Bagian bawah memudar ke latar | `mask-image: linear-gradient(to bottom, #000 X%, transparent)` | Hero `fullbleed`, page header |
| `dark-vignette` | Tepi menggelap seperti lensa kamera | Overlay `radial-gradient` hitam transparan di atas gambar | Hero `fullbleed` dengan teks di atas gambar |

- Intensitas (`edgeIntensity`): `soft`, `medium`, `strong`. Nilainya adalah posisi awal gradien (misalnya 70%, 55%, 40%), disimpan sebagai token di `themes.css`, bukan di komponen.
- Tersedia di Hero, About singkat, foto halaman About, dan page header halaman custom. Default: `none` untuk Hero `fullbleed`, `frame` untuk yang lain.
- Pakai `-webkit-mask-image` + `mask-image` untuk dukungan Safari. Kalau mask tidak didukung, gambar tampil biasa tanpa efek.
- Teks yang berada di atas gambar wajib tetap lolos kontras AA. Overlay gelap ditambah otomatis di belakang teks bila perlu.
- Opsi yang tidak cocok untuk varian tertentu disembunyikan atau diabaikan (misalnya `frame` pada `fullbleed`), dan hint di CMS menjelaskan efek tiap opsi.

**Video YouTube**

- Editor menempel link dalam format apa pun: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, atau `youtube.com/embed/`. Parameter `t=` atau `start=` ikut didukung.
- CMS menolak link yang bukan YouTube lewat validasi `pattern`.
- `lib/youtube.ts` mengekstrak ID dan waktu mulai. Fungsi ini wajib punya unit test untuk semua format di atas.
- Render memakai `<lite-youtube>` dari domain `youtube-nocookie.com` dengan `rel=0`. Thumbnail `maxresdefault` dipakai bila ada, dengan fallback ke `hqdefault`.
- Video Shorts otomatis memakai rasio 9:16, sedangkan video biasa 16:9.

Video diputar langsung di halaman: klik thumbnail, iframe YouTube dimuat, lalu video langsung berjalan tanpa klik kedua. Video berstatus public dan unlisted bisa diputar; video private tidak. Kalau pemilik video mematikan izin embed, atau video dibatasi usia atau hak cipta, YouTube menampilkan pesan error di player. Karena itu, di bawah setiap video selalu ada link kecil “Tonton di YouTube” sebagai cadangan.

**Video latar hero (opsional)**

- File MP4 maks. 10 MB, diputar `muted autoplay loop playsinline`, dengan poster wajib.
- Kalau `prefers-reduced-motion` aktif atau koneksi lambat (Save-Data), yang tampil hanya posternya.

## 10. Konfigurasi Sveltia CMS & pengalaman editor

Panel admin ada di `/admin`. Isinya empat menu: **Pengaturan Situs** (identitas, tema, navigasi), **Halaman** (Beranda, About), **Halaman Custom**, dan **Proyek**, dengan semua label dan hint berbahasa Indonesia.

**Alur editor**

1. Buka `namaweb.com/admin`, lalu login dengan GitHub.
2. Pilih menu, ubah isi form, upload gambar, atau tempel link YouTube.
3. Untuk halaman baru: buka Halaman Custom, klik Tambah, isi judul, lalu susun section-nya. Setelah itu buka Pengaturan Situs → Navigasi untuk memasukkannya ke navbar atau footer.
4. Klik Save. Perubahan langsung di-commit ke branch `main`.
5. Netlify build ulang otomatis, dan situs ter-update dalam sekitar 1–2 menit.
6. Kalau ada yang salah, developer bisa rollback dari riwayat commit atau dari daftar deploy di Netlify.

**Contoh potongan `config.yml`** (acuan awal saja; skema lengkap wajib sinkron dengan `content.config.ts`)

```yaml
backend:
  name: github
  repo: USERNAME/portfolio
  branch: main
media_folder: public/uploads
public_folder: /uploads

collections:
  - name: settings
    label: Pengaturan Situs
    files:
      - name: theme
        label: Tema
        file: src/content/settings/theme.json
        fields:
          - { name: preset, label: Preset Tema, widget: select, default: editorial,
              options: [editorial, mono, midnight, soft, brutal, nusantara] }
          - { name: motion, label: Animasi, widget: select, default: full,
              options: [full, subtle, off] }

  - name: pages
    label: Halaman
    files:
      - name: home
        label: Beranda
        file: src/content/pages/home.json
        fields:
          - name: sections
            label: Section
            widget: list
            types:
              - name: hero
                label: Hero
                fields:
                  - { name: enabled, label: Tampilkan, widget: boolean, default: true }
                  - { name: variant, label: Gaya, widget: select, options: [split, centered, fullbleed] }
                  - { name: headline, label: Judul Besar, widget: string,
                      hint: "Maks. 80 karakter" }
              - name: video
                label: Video YouTube
                fields:
                  - { name: enabled, label: Tampilkan, widget: boolean, default: true }
                  - { name: youtubeUrl, label: Link YouTube, widget: string,
                      pattern: ['^(https?://)?(www\.|m\.)?(youtube\.com|youtu\.be)/.+', 'Harus link YouTube'] }

  - name: projects
    label: Proyek
    label_singular: Proyek
    folder: src/content/projects
    create: true
    slug: "{{slug}}"
    sortable_fields: [order, year, title]
    summary: "{{title}} — {{year}}"
    fields:
      - { name: title, label: Judul, widget: string }
      # ... field lain sesuai Bagian 5
```

Tambahan untuk halaman custom dan navigasi:

```yaml
  - name: custom_pages
    label: Halaman Custom
    label_singular: Halaman
    folder: src/content/custom-pages
    format: json
    create: true
    slug: "{{slug}}"
    summary: "{{title}} — /{{slug}}"
    fields:
      - { name: title, label: Judul Halaman, widget: string }
      - { name: slug, label: Alamat URL, widget: string,
          pattern: ['^[a-z0-9]+(-[a-z0-9]+)*$', 'Huruf kecil, angka, dan tanda hubung saja'],
          hint: "Contoh: layanan → namaweb.com/layanan" }
      - { name: draft, label: Sembunyikan (draft), widget: boolean, default: false }
      - name: sections
        label: Section
        widget: list
        types: []   # pakai definisi types yang sama dengan Beranda

# di dalam collection settings → files:
      - name: navigation
        label: Navigasi
        file: src/content/settings/navigation.json
        fields:
          - name: mainMenu
            label: Menu Navbar
            widget: list
            max: 6
            fields:
              - { name: label, label: Teks Menu, widget: string }
              - { name: linkType, label: Jenis Link, widget: select,
                  options: [builtin, custom, external] }
              - { name: builtinPage, label: Halaman Bawaan, widget: select, required: false,
                  options: [home, projects, about, "#kontak"] }
              - { name: customPage, label: Halaman Custom, widget: relation, required: false,
                  collection: custom_pages, value_field: "{{slug}}", search_fields: [title],
                  display_fields: [title] }
              - { name: url, label: URL Eksternal, widget: string, required: false }
```

Definisi `types` section ditulis sekali lalu dipakai ulang oleh Beranda, About, dan Halaman Custom (pakai YAML anchor, atau generate `config.yml` dari satu sumber lewat script build). Jangan copy-paste manual.

**Wajib**

- Setiap field punya `hint` yang menjelaskan fungsi dan batasnya (contoh: “Tampil di kartu proyek, maks. 160 karakter”).
- Field wajib memakai `required: true`, dan teks dengan batas panjang memakai validasi panjang.
- Opsi image processing Sveltia (konversi WebP, lebar maks.) diaktifkan. Cek nama opsinya di dokumentasi Sveltia terbaru.
- `PANDUAN-EDITOR.md` berisi panduan langkah demi langkah dengan screenshot untuk tugas umum: ganti hero, tambah proyek, tambah video, ubah urutan section, ganti tema, atur vignette gambar, serta bikin halaman baru dan memasukkannya ke menu.

## 11. Performa, SEO, aksesibilitas

Targetnya Lighthouse mobile minimal 90 di keempat kategori untuk Beranda, Daftar proyek, dan Detail proyek.

**Performa**

- LCP < 2,5 s, CLS < 0,1, dan INP < 200 ms (simulasi 4G).
- JavaScript per halaman < 100 KB gzip, di luar iframe YouTube yang baru dimuat saat diklik.
- Maks. 2 keluarga font dan 4 file font. Font heading di-preload dengan `font-display: swap`.
- Header cache `immutable` untuk `/_astro/*` dan cache panjang untuk `/uploads/*` (di `netlify.toml`).

**SEO**

- Title dan meta description per halaman. Proyek memakai `summary`, halaman custom memakai `seo.description`, dan keduanya jatuh ke deskripsi situs bila kosong.
- Gambar Open Graph 1200×630: default dari Pengaturan Situs, cover proyek untuk halaman detail, dan `seo.ogImage` untuk halaman custom.
- `sitemap.xml`, `robots.txt`, dan URL canonical. Sitemap mencakup halaman custom; halaman `/dev/*`, draft, dan yang ber-`noindex` dikeluarkan.
- JSON-LD: `Person` di Beranda, `CreativeWork` di detail proyek, dan `FAQPage` di halaman yang memakai section FAQ.

**Aksesibilitas (WCAG 2.2 AA)**

- Kontras teks lolos AA di keenam preset.
- Bisa dinavigasi penuh pakai keyboard, dengan focus ring yang jelas dan skip link ke konten utama.
- Urutan heading semantik (satu H1 per halaman) dan landmark `header`, `nav`, `main`, `footer`.
- Menu HP dan lightbox memakai focus trap, bisa ditutup dengan Esc, dan punya label ARIA.
- Semua animasi menghormati `prefers-reduced-motion`.

## 12. Deploy & setup Netlify

Setup dilakukan sekali oleh developer, sekitar 30 menit. Setelah itu editor tidak perlu menyentuh Netlify sama sekali.

1. Push repo ke GitHub (boleh private).
2. Di Netlify, pilih Add new site lalu Import from GitHub. Isi build command `npm run build` dan publish directory `dist`.
3. Buat GitHub OAuth App dengan callback URL `https://api.netlify.com/auth/done`. Masukkan Client ID dan Secret-nya ke pengaturan OAuth provider GitHub di Netlify. Karena situs di-host di Netlify, Sveltia bisa memakai OAuth Netlify tanpa server auth tambahan. Cek langkah terbaru di dokumentasi Sveltia; alternatifnya Cloudflare Worker `sveltia-cms-auth`.
4. Undang akun GitHub editor sebagai collaborator repo dengan akses write.
5. Aktifkan Netlify Forms dan notifikasi email untuk form kontak. Form memakai `data-netlify="true"` dan field honeypot.
6. Pasang domain custom. HTTPS aktif otomatis.
7. Isi `netlify.toml` dengan build settings, header cache (Bagian 11), dan header keamanan dasar (`X-Content-Type-Options`, `Referrer-Policy`).

## 13. Kriteria penerimaan

Proyek dianggap selesai kalau semua poin di bawah ini lolos.

- [ ] Editor non-tech, tanpa bantuan, bisa mengganti headline hero, menambah proyek dengan 3 gambar dan 1 video YouTube, mengubah urutan section, dan mengganti preset tema dalam waktu kurang dari 15 menit.
- [ ] Editor non-tech bisa membuat halaman baru (misalnya `/layanan`) berisi minimal 3 section, lalu memasukkannya ke navbar, dalam waktu kurang dari 10 menit.
- [ ] Menghapus atau men-draft halaman yang masih ada di menu menggagalkan build dengan pesan yang jelas; slug yang bentrok atau dicadangkan juga ditolak.
- [ ] Perubahan dari CMS tampil live paling lambat 3 menit setelah Save.
- [ ] Keenam preset, dan warna custom apa pun yang dimasukkan editor, lolos kontras AA (dibuktikan oleh property-based test 10.000 kombinasi) dan tampil benar di semua section dan varian (dicek di `/dev/sections`).
- [ ] Semua kartu di semua section memakai `--radius-card` dan `--shadow-card` sesuai preset, dengan efek hover naik + shadow membesar, dan tidak ada kartu bersudut tajam atau tanpa shadow.
- [ ] Kelima opsi `imageEdge` × tiga intensitas tampil benar di keenam preset, termasuk di Safari, dan teks di atas gambar tetap lolos kontras AA.
- [ ] Setiap varian tetap rapi dengan teks sepanjang batas maksimum dan dengan semua field opsional kosong.
- [ ] Link YouTube format watch, youtu.be, shorts, embed, dan yang memakai `t=` ter-render dengan benar; link non-YouTube ditolak CMS.
- [ ] Lighthouse mobile minimal 90 di keempat kategori untuk Beranda, Daftar proyek, Detail proyek, dan satu halaman custom.
- [ ] Level animasi `off` dan `prefers-reduced-motion` mematikan semua animasi non-esensial.
- [ ] Konten tidak valid menggagalkan build dengan pesan error yang jelas, bukan menghasilkan halaman rusak.
- [ ] Responsif dari lebar 360 px sampai 1920 px tanpa scroll horizontal.
- [ ] Form kontak masuk ke Netlify Forms, dan honeypot memblokir bot sederhana.
- [ ] Halaman 404 custom dan sitemap tersedia, dan preview link di WhatsApp/LinkedIn menampilkan OG image.

## 14. Tahapan build & prompt untuk Claude Code

Build dibagi delapan fase. Setiap fase diakhiri dengan `npm run build` yang lolos dan satu commit, sebelum lanjut ke fase berikutnya.

1. **Fondasi.** Setup Astro + TypeScript + Tailwind, `BaseLayout`, token desain, enam preset tema, token intensitas vignette, engine kontras warna di lib/color.ts beserta seluruh test-nya, Fontsource, dan `CLAUDE.md`.
2. **Lapisan konten.** Skema Zod untuk semua koleksi (termasuk Navigasi dan Halaman Custom, beserta validasi slug dan link menu), plus konten contoh yang realistis untuk semua section dan varian.
3. **Section.** Semua komponen section dan variannya, komponen gambar dengan opsi `imageEdge`, `SectionRenderer`, navbar dan footer dari data navigasi, serta katalog `/dev/sections` untuk mengecek tiap section × varian × preset.
4. **Halaman.** Daftar dan detail proyek, galeri dengan lightbox, YouTube (termasuk unit test `lib/youtube.ts`), dan route `[slug].astro` untuk halaman custom dengan dua halaman contoh (Layanan dan FAQ).
5. **Motion.** GSAP, ScrollTrigger, Lenis, View Transitions, dan level animasi sesuai Bagian 8.
6. **CMS.** `public/admin` dengan `config.yml` yang sinkron dengan skema Zod, definisi section yang dipakai ulang di semua halaman, label dan hint berbahasa Indonesia, serta pengaturan image processing.
7. **Kualitas.** SEO, performa, aksesibilitas, `netlify.toml`, dan Netlify Forms.
8. **QA & serah terima.** Cek semua kriteria di Bagian 13, tulis `PANDUAN-EDITOR.md`, dan buat checklist deploy.

**Cara pakai:** export dokumen ini ke Markdown, simpan sebagai `PRD.md` di root folder project yang masih kosong, lalu jalankan Claude Code di folder itu dengan prompt berikut.

```text
Baca PRD.md di root repo ini. Bangun website sesuai PRD, fase demi fase mengikuti Bagian 14.

Aturan kerja:
- Sebelum menulis kode, buat CLAUDE.md berisi ringkasan stack, struktur folder, aturan desain (Bagian 7) dan motion (Bagian 8), serta perintah dev/build/test.
- Kerjakan satu fase saja. Di akhir fase, jalankan `npm run build` (dan test jika ada), pastikan tanpa error, lalu commit dengan pesan yang jelas.
- Skema Zod di src/content.config.ts dan public/admin/config.yml harus selalu sinkron. Setiap mengubah salah satu, ubah juga yang lain.
- Jangan pernah memakai warna atau font di luar preset tema. Semua warna lewat CSS variables.
- Pakai versi stabil terbaru setiap library. Kalau ragu soal API (Astro, Sveltia CMS, GSAP, Lenis, lite-youtube-embed, Netlify), cek dokumentasi resminya, jangan menebak.
- Pakai konten contoh yang realistis supaya desain bisa dinilai.
- Di akhir setiap fase, laporkan: apa yang selesai, keputusan teknis yang diambil, dan apa yang perlu saya cek manual. Lalu tunggu konfirmasi saya sebelum lanjut.

Mulai dari Fase 1.
```

**Pertanyaan terbuka** (bisa diputuskan sambil jalan): nama domain, jumlah editor, dan daftar kategori proyek. Selama belum diputuskan, Claude Code memakai placeholder: Branding, UI/UX, Ilustrasi, Video.
