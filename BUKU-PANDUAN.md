# Buku Panduan Portobuilder

Panduan ini untuk orang yang belum pernah membuat website. Ikuti dari atas ke bawah. Di akhir, Anda punya website portfolio yang online, punya alamat sendiri, dan bisa diedit lewat browser tanpa menyentuh kode.

Perkiraan waktu pemasangan pertama: 45–60 menit. Setelah itu, mengubah isi situs cukup beberapa menit.

## Daftar isi

1. [Apa itu Portobuilder](#1-apa-itu-portobuilder)
2. [Yang perlu disiapkan](#2-yang-perlu-disiapkan)
3. [Netlify atau VPS?](#3-netlify-atau-vps)
4. [Pemasangan langkah demi langkah](#4-pemasangan-langkah-demi-langkah)
5. [Mengoperasikan editor](#5-mengoperasikan-editor)
6. [Mengganti konten contoh](#6-mengganti-konten-contoh)
7. [Formulir kontak, domain, dan tim](#7-formulir-kontak-domain-dan-tim)
8. [Biaya](#8-biaya)
9. [Kalau ada masalah](#9-kalau-ada-masalah)
10. [Perawatan dan keamanan](#10-perawatan-dan-keamanan)
11. [Untuk developer](#11-untuk-developer)
12. [Istilah](#12-istilah)

---

## 1. Apa itu Portobuilder

Portobuilder adalah template website portfolio: untuk desainer, pengajar, fotografer, konsultan, atau siapa saja yang ingin memamerkan karya dan dihubungi klien.

Yang Anda dapat:

- **Halaman bawaan**: Beranda, About, daftar Proyek, dan detail tiap proyek.
- **Halaman tambahan sesuka Anda**, misalnya Layanan, FAQ, atau Pameran.
- **14 jenis section** yang bisa disusun bebas: Hero (pembuka besar), Proyek Unggulan, Teks, Video YouTube, About Singkat, Statistik, Klien/Logo, Testimoni, Layanan, FAQ, Galeri, Peta, Banner Ajakan, Kontak.
- **8 preset tema**: Editorial, Minimal Mono, Dark Studio, Soft Pastel, Bold Brutalist, Jakarta Modern, Noir Spotlight, Rouge. Warna dicek otomatis supaya teks selalu terbaca.
- **Editor visual di `/edit`**: klik teks di halaman lalu ketik, mirip Google Sites.
- **Formulir kontak** yang masuk ke email Anda, tanpa server tambahan.
- **Bahasa situs** Indonesia atau Inggris untuk teks tombol dan label.
- **Cepat dan ramah Google**: halaman sudah jadi sebelum dikunjungi, gambar dikompres, ada sitemap dan tampilan pratinjau saat link dibagikan.

### Cara kerjanya (sekali baca, supaya tidak bingung nanti)

Ada tiga layanan yang bekerja sama:

```
  Anda (browser)                GitHub                       Netlify
 ─────────────────          ─────────────────           ───────────────────
  buka situs/edit   ──►     menyimpan semua isi   ──►   membangun & menayangkan
  klik Publikasikan          situs (teks, gambar)         situs ke internet
                             sebagai "repo"               (1–3 menit)
```

- **GitHub** adalah lemari arsip. Semua teks, gambar, dan pengaturan situs disimpan di sana, lengkap dengan riwayat setiap perubahan.
- **Netlify** adalah percetakan sekaligus etalase. Setiap kali isi di GitHub berubah, Netlify membangun ulang situs dan menayangkannya.
- **Editor `/edit`** adalah meja kerja Anda. Saat Anda klik **Publikasikan**, editor menyimpan perubahan ke GitHub, lalu Netlify otomatis memperbarui situs.

---

## 2. Yang perlu disiapkan

| Kebutuhan | Keterangan |
| --- | --- |
| Komputer/laptop dan browser | Chrome, Edge, atau Firefox versi terbaru. Mengedit lewat HP bisa, tapi laptop jauh lebih nyaman. |
| Email aktif | Untuk mendaftar GitHub dan Netlify. |
| Akun GitHub | Gratis, daftar di github.com. |
| Akun Netlify | Gratis, daftar di netlify.com (paling mudah: "Sign up with GitHub"). |
| Bahan isi | Nama, profesi, foto diri, 3–8 proyek terbaik beserta fotonya, email, nomor WhatsApp, link sosial media. Bisa menyusul; situs tetap jalan dengan konten contoh. |
| (Opsional) Domain sendiri | Misalnya `namaanda.com`, dibeli di Niagahoster, Rumahweb, Namecheap, dsb. Tanpa ini, situs memakai alamat gratis `namaanda.netlify.app`. |

Anda **tidak** perlu memasang program apa pun di laptop, tidak perlu menyewa hosting, dan tidak perlu bisa coding.

---

## 3. Netlify atau VPS?

**Jawaban singkat: pakai Netlify.** Portobuilder dirancang untuk Netlify, dan tiga fitur pentingnya bergantung pada Netlify.

| Fitur | Netlify | VPS / hosting biasa (cPanel) |
| --- | --- | --- |
| Situs tampil online | ✅ | ✅ (hanya file hasil build) |
| Editor `/edit` online (klik-ketik di browser) | ✅ | ❌ |
| Login editor lewat GitHub | ✅ | ❌ |
| Formulir kontak masuk ke email | ✅ | ❌ |
| Situs otomatis ter-update setelah Publikasikan | ✅ | ❌ (upload manual) |
| HTTPS (gembok) | ✅ otomatis | Perlu dipasang sendiri |
| Biaya untuk portfolio pribadi | Gratis | Rp50–150 ribu/bulan |
| Perawatan server | Tidak ada | Update sistem, keamanan, backup sendiri |

Kenapa VPS tidak disarankan:

- Kanvas editor `/edit` berjalan sebagai **Netlify Function** (program kecil yang dijalankan Netlify).
- Login GitHub di editor memakai **OAuth Netlify**.
- Formulir kontak memakai **Netlify Forms**.

Di VPS, ketiganya tidak ada. Yang tersisa hanyalah situs statis yang isinya harus Anda ubah di laptop lalu di-upload ulang setiap kali. Memindahkan semua fitur ke VPS mungkin, tapi itu pekerjaan developer (lihat [bagian 11](#menjalankan-di-vps)).

Pilih VPS hanya kalau ada alasan kuat, misalnya kantor mewajibkan server sendiri. Untuk portfolio pribadi atau usaha kecil, Netlify lebih murah, lebih cepat, dan tanpa perawatan.

---

## 4. Pemasangan langkah demi langkah

Kerjakan berurutan. Tiap langkah punya tanda "berhasil kalau…" supaya Anda tahu sudah benar sebelum lanjut.

### Langkah 1 — Buat akun GitHub

1. Buka **github.com** → **Sign up**.
2. Isi email, password, dan username. Username ini akan terlihat di alamat repo, misalnya `github.com/username/portfolio`.
3. Verifikasi email.
4. Sangat disarankan: aktifkan **2FA** (verifikasi dua langkah) di Settings akun → Password and authentication.

✅ Berhasil kalau Anda bisa login dan melihat foto profil di pojok kanan atas.

### Langkah 2 — Salin template ke akun Anda

1. Buka halaman repo Portobuilder (repo tempat buku panduan ini berada).
2. Klik tombol hijau **Use this template** → **Create a new repository**.
   - Kalau tombol itu tidak ada, pakai **Fork** di kanan atas. Hasilnya sama untuk keperluan ini.
3. Isi:
   - **Owner**: akun Anda.
   - **Repository name**: bebas, misalnya `portfolio` atau `namaanda`.
   - **Private** disarankan. Situs tetap bisa dilihat publik; yang privat hanya arsipnya.
4. Klik **Create repository**.

✅ Berhasil kalau Anda melihat repo baru di akun Anda, berisi folder `src`, `public`, dan file `BUKU-PANDUAN.md`.

### Langkah 3 — Hubungkan repo ke Netlify (situs online pertama kali)

1. Buka **netlify.com** → **Sign up** → **Sign up with GitHub**, lalu izinkan.
2. Di dashboard Netlify: **Add new project** → **Import an existing project** → **GitHub**.
3. Netlify meminta izin membaca repo. Pilih **Only select repositories**, pilih repo dari langkah 2, lalu **Install/Save**.
4. Pilih repo tersebut. Halaman pengaturan build muncul. **Jangan ubah apa pun**; semuanya sudah diatur oleh file `netlify.toml` di repo (perintah `npm run build`, folder `dist`, Node 22).
5. Klik **Deploy**.
6. Tunggu 2–4 menit. Status berubah menjadi **Published** dan muncul alamat seperti `random-name-123.netlify.app`.
7. Ganti nama alamatnya: **Project configuration → General → Project details → Change project name**, misalnya `namaanda` → situs menjadi `namaanda.netlify.app`.

✅ Berhasil kalau alamat `namaanda.netlify.app` menampilkan situs dengan konten contoh.

### Langkah 4 — Jadikan situs publik

Project Netlify baru kadang dibuat **Private**: Anda bisa membukanya karena sedang login ke Netlify, tetapi orang lain diarahkan ke halaman login Netlify. Tandanya: di bawah situs ada toolbar Netlify bertuliskan **🔒 Private**.

1. Di Netlify buka project Anda → **Manage** → **Project configuration** → **General** → bagian **Who can see it** (Visitor access).
2. Klik **Edit visibility**.
3. Pilih **Customize this project's visibility** → **Public** → **Save**.

✅ Berhasil kalau situs bisa dibuka dari HP yang **tidak** login Netlify (atau jendela Incognito).

### Langkah 5 — Buat "kunci login" editor (GitHub OAuth App)

Langkah ini membuat editor `/edit` bisa login dengan akun GitHub dan menyimpan perubahan.

> ⚠️ **Yang sering keliru:** menu **Developer settings** ada di pengaturan **akun** GitHub, **bukan** pengaturan repo. Tab ⚙ Settings di halaman repo tidak punya menu ini.

1. Login GitHub, buka **github.com/settings/developers**.
   Lewat menu: klik **foto profil** (kanan atas) → **Settings** → gulir sidebar kiri sampai **paling bawah** → **Developer settings**. Di layar sempit, sidebar tersembunyi di balik ikon ☰.
2. Pilih **OAuth Apps** → **New OAuth App**.
3. Isi:
   | Kolom | Isi |
   | --- | --- |
   | Application name | Bebas, misalnya `Editor Namaanda` |
   | Homepage URL | `https://namaanda.netlify.app` (alamat dari langkah 3) |
   | Authorization callback URL | `https://api.netlify.com/auth/done` (persis, jangan diubah) |
4. **Hilangkan centang "Expire user access tokens"**. Kalau dicentang, login editor putus setiap 8 jam.
5. Klik **Register application**.
6. Di halaman berikutnya:
   - Salin **Client ID** (kode pendek di bawah judul "Client ID").
   - Klik **Generate a new client secret**, konfirmasi password/2FA bila diminta, lalu salin kodenya. **Kode ini hanya tampil sekali.** Jangan tutup halaman sebelum langkah 6 selesai.

✅ Berhasil kalau Anda memegang dua kode: Client ID dan Client Secret.

> 🔒 Client Secret itu rahasia. Jangan kirim lewat chat, email, atau screenshot. Kalau terlanjur tersebar, buat secret baru (lihat [bagian 10](#10-perawatan-dan-keamanan)).

### Langkah 6 — Pasang kunci itu di Netlify

1. Di Netlify buka project Anda → **Project configuration** → **Security** → gulir ke **OAuth** (atau klik tombol **OAuth** di atas halaman Security).
2. Di **Authentication providers**, klik **Install provider**.
3. Provider: **GitHub**. Tempel **Client ID** dan **Secret** (pakai Ctrl+V, jangan diketik).
4. Klik **Install**.

✅ Berhasil kalau GitHub muncul di daftar Authentication providers.

Kalau muncul tulisan merah **"can't be blank"** padahal kedua kolom sudah terisi, itu sisa klik sebelumnya. Klik **Install** sekali lagi, atau **Cancel** lalu ulangi dari **Install provider**.

### Langkah 7 — Coba login ke editor

1. Buka `https://namaanda.netlify.app/edit`.
2. Klik **Masuk dengan GitHub**. Jendela kecil (popup) GitHub terbuka.
   - Tidak ada popup? Chrome memblokirnya. Klik ikon popup diblokir di ujung kanan address bar → **Always allow** → klik tombolnya lagi.
3. Di popup, klik **Authorize**. Popup tertutup sendiri.
4. Editor terbuka: halaman Beranda di tengah, panel di kanan.

✅ Berhasil kalau Anda melihat situs Anda di dalam editor dan panel bertab **Sisipkan, Halaman, Menu, Tema, Situs**.

### Langkah 8 — Publikasi pertama (uji coba)

1. Di editor, klik judul besar di halaman, ubah satu kata.
2. Klik **Publikasikan** di kanan atas → periksa daftar perubahan → **Publikasikan**.
3. Tunggu 1–3 menit, lalu buka situs (bukan `/edit`) dan muat ulang.

✅ Berhasil kalau perubahan muncul di situs. Di GitHub, repo Anda punya commit baru, dan di Netlify tab **Deploys** ada deploy baru.

**Selamat, situs Anda sudah online dan bisa diedit.** Lanjutkan ke bagian 6 untuk mengganti konten contoh dengan milik Anda.

---

## 5. Mengoperasikan editor

### Tampilan editor

```
┌───────────────────────────────────────────────────────────────────┐
│ [Beranda ▾]   ↶ ↷   🖥 📱   ● Tersimpan   Lihat situs [Publikasikan]│  ← bar atas
├──────────────────────────────────────────────┬────────────────────┤
│                                              │ Sisipkan Halaman   │
│        Situs Anda, persis seperti            │ Menu  Tema  Situs  │
│        yang dilihat pengunjung               │                    │
│        (klik teks untuk mengetik,            │  pengaturan        │
│         klik section untuk mengatur)         │  section/halaman   │
│                                              │                    │
└──────────────────────────────────────────────┴────────────────────┘
        kanvas                                       panel
```

| Tab panel | Isinya |
| --- | --- |
| **Sisipkan** | Daftar 14 jenis section. Klik untuk menambahkan ke halaman. |
| **Halaman** | Semua halaman dan proyek. Tambah halaman/proyek baru di sini. |
| **Menu** | Gaya navbar, isi menu navbar (maks. 6), tombol CTA navbar, menu footer. |
| **Tema** | Preset tema, warna, level animasi. |
| **Situs** | Nama, profesi, logo, favicon, email, WhatsApp, sosial media, CV, SEO, bahasa situs, alamat, status ketersediaan. |

### Gerakan dasar

| Ingin… | Caranya |
| --- | --- |
| Mengubah teks | Klik teksnya di halaman, ketik. Angka kecil menunjukkan sisa karakter. Enter atau klik di luar untuk selesai. |
| Mengubah gambar, gaya, tombol, daftar item | Klik section-nya. Pengaturannya muncul di panel kanan. |
| Menambah section | Tombol **+** biru di antara section, atau tab **Sisipkan**. |
| Memindah section | Arahkan kursor ke section → seret ikon ⠿ di toolbar hitam, atau tombol ↑ ↓. |
| Menyembunyikan section sementara | Ikon mata di toolbar section. Tampil bergaris di editor, tidak tampil di situs. |
| Menduplikat section | Ikon salin di toolbar section. |
| Menghapus section | Ikon tempat sampah di toolbar section (bisa dibatalkan dengan ↶). |
| Membatalkan / mengulang | ↶ ↷ di bar atas, atau Ctrl+Z / Ctrl+Shift+Z. Sampai 100 langkah. |
| Melihat versi HP/tablet | Ikon layar di bar atas. |
| Pindah halaman | Pilihan halaman di kiri atas, atau tab **Halaman**. |
| Mengatur halaman (judul, URL, SEO, draft, hapus) | Tombol **Pengaturan halaman** saat halaman dibuka. |

Panel hanya menampilkan isian yang dipakai gaya section yang sedang dipilih. Ganti **Gaya tampilan** dan isian lain akan muncul.

### Draft dan publikasi

- Setiap perubahan **tersimpan otomatis sebagai draft di browser ini**. Kalau tab tertutup atau laptop mati, draft muncul lagi saat editor dibuka.
- Draft **tidak** pindah antar-perangkat. Kalau mulai di laptop kantor, selesaikan dan publikasikan di laptop yang sama.
- Kalau editor menemukan draft lama yang dibuat sebelum ada publikasi lebih baru, ia bertanya: **Pulihkan draft** atau **Buang draft**. Pilih Buang kalau tidak yakin; draft lama bisa menimpa isi yang lebih baru.
- **Publikasikan** menyimpan semua perubahan sekaligus ke GitHub. Sebelum itu editor memeriksa isian. Kalau ada yang belum benar (judul terlalu panjang, link ke halaman yang sudah dihapus), daftarnya ditampilkan; klik salah satu untuk langsung menuju tempatnya.
- **Buang perubahan** menghapus semua draft dan kembali ke versi yang sedang online.

### Resep yang sering dipakai

**Mengganti foto dan judul hero (pembuka besar)**
1. Klik judul besar, ketik judul baru.
2. Klik area hero → panel kanan → **Ganti gambar** → pilih foto. Foto otomatis dikecilkan dan dikompres.
3. Isi **Deskripsi gambar (alt)**, misalnya "Rina sedang memotret produk di studio". Ini membantu Google dan pengunjung tunanetra.
4. Coba **Gaya tampilan** lain: Split, Tengah, Layar penuh, Spotlight, Showcase, Cutout.

**Menambah proyek**
1. Tab **Halaman** → bagian Proyek → **+ Proyek baru**. Proyek baru berstatus draft (tersembunyi).
2. Isi judul, ringkasan, kategori, tahun, gambar cover. Nyalakan **Unggulan** agar tampil di beranda.
3. **Galeri**: tambah foto-foto proyek, isi deskripsinya.
4. **Video YouTube** (opsional): tempel link. Semua bentuk link diterima.
5. Tulis cerita proyek di **Isi studi kasus**. Tombol B, I, H2, • Daftar, Link membantu format.
6. Matikan **Sembunyikan (draft)** → **Publikasikan**.

**Membuat halaman baru dan memasukkannya ke menu**
1. Tab **Halaman** → **+ Halaman baru** → ketik judul (misalnya "Layanan") → **Buat**. Alamatnya dibuat otomatis: `/layanan`.
2. Tambah section dari tab **Sisipkan**.
3. **Pengaturan halaman** → **Masukkan ke menu navbar**.
4. **Publikasikan**.

Mengganti alamat URL halaman ikut memperbarui link di menu. Men-draft atau menghapus halaman otomatis mengeluarkannya dari menu.

**Mengatur menu**
Tab **Menu**. Tiap item menu memilih tujuan dari satu daftar: halaman bawaan, halaman custom, atau link luar. Item menu boleh punya **submenu** (dropdown), dan item yang hanya membuka dropdown pilih jenis link **Tanpa link**.

**Mengganti tema dan warna**
Tab **Tema** → klik salah satu preset. Warna latar, teks, dan aksen boleh diganti. Kalau kurang kontras, warna digeser sedikit otomatis dan panel memberi tahu hasil akhirnya. Aksen **auto** mengambil warna dari foto hero beranda. Animasi tidak diputar di editor; lihat di situs setelah dipublikasikan.

**Video YouTube di halaman**
Tab **Sisipkan** → **Video YouTube** → tempel link. Video harus Public atau Unlisted, dan izin sematan (embed) di YouTube Studio harus aktif.

**Batas karakter**
Setiap kolom teks punya batas (judul hero 80, ringkasan proyek 160, teks tombol 30, dsb.). Sisa karakter tampil saat mengetik, jadi desain tidak pernah rusak karena teks terlalu panjang.

### Editor cadangan: `/admin`

`namaanda.netlify.app/admin` adalah panel berbasis formulir (Sveltia CMS) dengan isian yang sama. Pakai kalau editor visual bermasalah. Loginnya juga dengan GitHub.

---

## 6. Mengganti konten contoh

Situs baru berisi konten contoh: nama fiktif, 8 proyek contoh, halaman FAQ, Layanan, dan Pameran 2026, serta gambar abstrak. Ganti semuanya sebelum situs dibagikan. Checklist:

- [ ] **Situs**: nama, profesi, email, nomor WhatsApp (format `62812…`, tanpa + dan spasi), sosial media, alamat, teks footer.
- [ ] **Situs → Favicon**: ikon kecil di tab browser. PNG persegi minimal 512 px.
- [ ] **Situs → Logo** (opsional). Kalau kosong, nama tampil sebagai teks.
- [ ] **Situs → SEO**: judul dan deskripsi untuk Google, dan **gambar OG** yang tampil saat link dibagikan di WhatsApp/LinkedIn (1200×630 px).
- [ ] **Situs → File CV** (opsional): memunculkan tombol Download CV.
- [ ] **Situs → Bahasa situs**: Indonesia atau English.
- [ ] **Beranda**: hero, About Singkat, Statistik, Testimoni, Klien. Hapus section yang tidak Anda perlukan.
- [ ] **About**: foto (rasio 4:5) dan cerita Anda.
- [ ] **Proyek**: hapus 8 proyek contoh, tambahkan proyek Anda.
- [ ] **Halaman custom** (FAQ, Layanan, Pameran): ubah atau hapus.
- [ ] **Menu**: cek item navbar dan footer.
- [ ] **Tema**: pilih preset yang paling cocok.
- [ ] **Publikasikan**, lalu buka situs di HP dan laptop untuk dicek.

Tips foto:

| Tempat | Rasio | Ukuran yang disarankan |
| --- | --- | --- |
| Hero | 16:9 (Split 4:5) | Minimal 1920 px lebar |
| Cover proyek | 4:3 | Minimal 1600 px lebar |
| Foto About | 4:5 | Minimal 1200 px lebar |
| Avatar testimoni | 1:1 | Minimal 400 px |
| Header halaman | 12:5 | Minimal 1920 px lebar |
| Foto Cutout (hero Cutout) | Bebas, latar transparan | PNG/WebP; hapus latar gratis di Canva atau remove.bg |

Foto dikompres otomatis di browser saat diunggah (maks. 2400 px, format WebP), jadi foto langsung dari kamera HP aman.

---

## 7. Formulir kontak, domain, dan tim

### Menerima pesan formulir kontak di email

Section **Kontak** memakai Netlify Forms. Pesan sudah otomatis tersimpan di Netlify, tapi supaya masuk ke email:

1. Netlify → project Anda → **Forms**. Kalau diminta, klik **Enable form detection**, lalu **Publikasikan** sekali lagi dari editor supaya formulirnya terdeteksi.
2. Formulir bernama **kontak** muncul di daftar.
3. **Project configuration → Notifications → Emails and webhooks → Form submission notifications** → **Add notification** → **Email notification** → pilih form `kontak` → isi email Anda → Save. (Nama menu Netlify kadang berubah; kalau tidak ketemu, ketik "form notification" di kotak **Find a setting**.)
4. Uji: isi formulir di situs Anda sendiri, cek email (dan folder spam).

Spam bot difilter otomatis dengan kolom jebakan tersembunyi.

### Memakai domain sendiri

1. Beli domain di registrar mana saja.
2. Netlify → project → **Domain management** → **Add a domain** → ketik `namaanda.com` → ikuti petunjuknya.
3. Netlify memberi pilihan:
   - **Netlify DNS** (paling mudah): ganti *nameserver* di panel registrar dengan 4 alamat dari Netlify.
   - **DNS eksternal**: tambahkan record yang ditunjukkan Netlify (A record ke Netlify load balancer dan CNAME `www` ke `namaanda.netlify.app`).
4. Tunggu 15 menit sampai 24 jam. HTTPS (gembok) dipasang otomatis.
5. Netlify → **Project configuration → Environment variables** → **Add a variable**: `SITE_URL` = `https://namaanda.com`.
6. Netlify → **Deploys** → **Trigger deploy → Deploy project**. Ini supaya sitemap, link kanonik, dan gambar pratinjau memakai domain baru.
7. GitHub → OAuth App dari langkah 5 → ubah **Homepage URL** ke domain baru (callback URL tetap `https://api.netlify.com/auth/done`).

### Menambah orang yang boleh mengedit

Siapa pun yang ingin login ke `/edit` butuh akun GitHub yang punya akses **Write** ke repo.

1. GitHub → repo Anda → **Settings** (tab ⚙ di halaman repo) → **Collaborators** → **Add people**.
2. Ketik username GitHub orangnya → pilih akses **Write** → kirim undangan.
3. Orang itu menerima undangan dari email atau github.com/notifications, lalu login di `/edit`.

Untuk mencabut akses, hapus orangnya dari daftar Collaborators.

Kalau dua orang mengedit bersamaan, yang kedua mendapat pesan "Ada perubahan lain sejak editor dibuka" saat publikasi. Ini mencegah saling menimpa. Muat ulang editor, ulangi perubahan, lalu publikasikan.

---

## 8. Biaya

| Layanan | Biaya |
| --- | --- |
| GitHub | Gratis (repo privat juga gratis). |
| Netlify paket Free | Gratis untuk portfolio pribadi dengan pengunjung wajar. Ada batas bulanan untuk build, bandwidth, fungsi, dan formulir. Cek angka terbaru di netlify.com/pricing. Netlify mengirim email bila mendekati batas; situs tidak tiba-tiba ditagih tanpa Anda memilih paket berbayar. |
| Domain | Sekitar Rp150–250 ribu per tahun untuk `.com`, `.id`, `.my.id` lebih murah. Opsional. |

**Badge "Powered by Netlify".** Project Netlify paket Free yang dibuat sejak 19 Agustus 2026 menampilkan badge kecil "Powered by Netlify" di halaman publik. Badge ini disisipkan Netlify, bukan bagian dari template, dan tidak bergantung pada cara deploy. Mematikannya butuh paket Personal atau Pro: **Project configuration → General → Powered by Netlify badge**. Pengunjung bisa menutupnya sendiri lewat "Hide this badge", tapi hanya untuk browser mereka. Detail: docs.netlify.com/manage/projects/powered-by-netlify-badge.

Setiap klik **Publikasikan** memicu satu build di Netlify. Kumpulkan beberapa perubahan lalu publikasikan sekaligus, jangan per kata.

---

## 9. Kalau ada masalah

### Saat pemasangan

| Gejala | Penyebab dan solusi |
| --- | --- |
| Situs hanya bisa dibuka saya, orang lain diminta login Netlify (error 401) | Project masih Private. Lihat [langkah 4](#langkah-4--jadikan-situs-publik). |
| Tidak menemukan **Developer settings** | Anda membuka Settings repo. Buka Settings **akun** (foto profil → Settings), atau langsung github.com/settings/developers. |
| "can't be blank" saat Install provider | Klik Install sekali lagi, atau Cancel dan ulangi. Tempel kode dengan Ctrl+V. |
| Deploy gagal (merah) di Netlify | Buka deploy itu → **Deploy log**, gulir ke baris merah. Pesan berbahasa Indonesia biasanya langsung menyebut file dan isian yang salah. Kalau tidak paham, kirim log itu ke developer. |
| Klik "Masuk dengan GitHub" tidak terjadi apa-apa | Popup diblokir. Izinkan popup untuk situs ini. |
| Login gagal: "Pastikan akun Anda punya akses ke repo" | Akun GitHub belum jadi collaborator dengan akses Write, atau undangan belum diterima. |
| Login berhasil tapi putus setelah beberapa jam | Opsi "Expire user access tokens" di OAuth App masih tercentang. Hilangkan centangnya. |
| Login gagal dengan pesan soal redirect/callback | Authorization callback URL di OAuth App harus persis `https://api.netlify.com/auth/done`. |

### Saat mengedit

| Gejala | Penyebab dan solusi |
| --- | --- |
| Kotak merah "Tampilan belum diperbarui" | Ada isian yang belum valid. Baca pesannya, perbaiki di panel kanan. |
| Perubahan tidak muncul setelah 5 menit | Muat ulang paksa: Ctrl+Shift+R. Cek Netlify → Deploys apakah deploy terakhir berhasil. |
| "Ada perubahan lain di … sejak editor dibuka" | Orang lain baru mempublikasikan. Catat perubahan Anda, muat ulang editor, ulangi. |
| Video tidak bisa diputar | Video harus Public/Unlisted dan izin embed aktif di YouTube Studio. |
| Field yang dicari tidak ada di panel | Field itu khusus gaya tertentu. Ganti **Gaya tampilan** section-nya. |
| Halaman tidak bisa dimasukkan ke menu | Halaman custom harus dibuat (dan tidak draft) sebelum bisa ditautkan. |
| Situs tampil berantakan setelah publikasi | Kembalikan ke versi sebelumnya (lihat bagian 10), lalu hubungi developer. |

---

## 10. Perawatan dan keamanan

**Mengembalikan situs ke versi sebelumnya (darurat)**
Netlify → project → **Deploys** → klik deploy lama yang masih bagus → **Publish deploy**. Situs langsung kembali. Catatan: publikasi berikutnya dari editor akan menayangkan isi terbaru lagi, jadi perbaiki isinya di editor dulu.

**Riwayat lengkap**
Setiap publikasi adalah satu *commit* di GitHub. Di repo → **Commits** Anda bisa melihat siapa mengubah apa dan kapan. Developer bisa mengembalikan file apa pun ke versi lama.

**Backup**
GitHub adalah backup-nya. Untuk salinan tambahan: repo → tombol hijau **Code** → **Download ZIP**, simpan di Google Drive, misalnya sebulan sekali.

**Mengganti Client Secret** (kalau tersebar atau secara berkala)
1. GitHub → github.com/settings/developers → OAuth App Anda → **Generate a new client secret** → salin.
2. Netlify → Security → OAuth → GitHub → **Edit** → tempel secret baru → Save.
3. Kembali ke GitHub → hapus secret lama.

**Kebiasaan aman**
- Aktifkan 2FA di GitHub dan Netlify.
- Beri akses Write hanya ke orang yang memang mengedit, dan cabut saat tidak lagi perlu.
- Jangan pernah membagikan Client Secret, password, atau kode 2FA.
- Jangan unggah dokumen pribadi (KTP, kontrak) ke situs; semua yang diunggah bisa dilihat publik.

**Pembaruan template**
Template ini tidak memperbarui dirinya sendiri. Kalau ada versi baru Portobuilder, minta developer memindahkan perubahannya ke repo Anda.

---

## 11. Untuk developer

### Menjalankan di laptop

Butuh Node.js 22.12 atau lebih baru dan Git.

```bash
git clone https://github.com/<username>/<repo>.git
cd <repo>
npm install
npm run dev      # http://localhost:4321, editor: /edit, katalog QA: /dev/sections
```

Di mode lokal, editor tidak perlu login. Tombol **Simpan ke file** menulis langsung ke `src/content` dan `public/uploads`; commit dan push hasilnya dengan git, lalu Netlify deploy otomatis.

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Validasi konten + type check + build ke `dist/` |
| `npm test` | Tes otomatis (kontras warna, parser YouTube, sinkron skema CMS) |
| `npm run preview` | Menyajikan hasil build |
| `npm run example <spotlight\|showcase\|cutout>` | Mengganti beranda dengan contoh hero alternatif |
| `npm run samples` | Membuat ulang gambar contoh |

Windows: jalankan `npm run dev` dan `npm test` dari path dengan huruf drive asli (biasanya `C:\`, bukan `c:\`), atau biarkan `scripts/real-cwd.mjs` yang mengurusnya. Detail teknis lain ada di `CLAUDE.md` dan spesifikasi di `PRD.md`.

### Menjalankan di VPS

Situs publik bisa disajikan dari VPS sebagai file statis:

```bash
npm ci
SITE_URL=https://namaanda.com npm run build
# salin isi dist/ ke web root, misalnya /var/www/namaanda (nginx/Apache)
```

Yang tidak berfungsi tanpa pekerjaan tambahan:

| Fitur | Bergantung pada | Pengganti di VPS |
| --- | --- | --- |
| Kanvas editor `/edit/render` | Netlify Function (`@astrojs/netlify`) | Ganti adapter ke `@astrojs/node` dan jalankan sebagai proses Node (pm2/systemd) di belakang nginx |
| Login editor | OAuth Netlify (`api.netlify.com/auth`) | Server OAuth GitHub sendiri yang mengembalikan token dengan protokol pesan yang sama |
| Formulir kontak | Netlify Forms | Endpoint form sendiri atau layanan seperti Formspree; ubah `Contact.astro` |
| Deploy otomatis | Netlify build | GitHub Actions yang build lalu rsync ke VPS |
| Header cache & keamanan | `netlify.toml` | Salin ke konfigurasi nginx |

Tanpa semua itu, alur kerja di VPS adalah: edit lewat `npm run dev` di laptop → `npm run build` → upload `dist/`.

---

## 12. Istilah

| Istilah | Artinya |
| --- | --- |
| **Repo** (repository) | Folder proyek di GitHub, berisi semua file situs dan riwayat perubahannya. |
| **Commit** | Satu catatan perubahan di repo. Setiap Publikasikan = satu commit. |
| **Deploy / build** | Proses Netlify mengubah isi repo menjadi situs yang tayang. |
| **Collaborator** | Akun GitHub lain yang diberi akses ke repo Anda. |
| **OAuth App** | "Kunci" yang mengizinkan editor login dengan akun GitHub. |
| **Client ID / Client Secret** | Pasangan kode OAuth App. ID boleh dilihat orang, Secret rahasia. |
| **Section** | Satu blok di halaman, misalnya Hero, Galeri, atau Kontak. |
| **Preset tema** | Paket gaya siap pakai: font, warna, sudut, bayangan. |
| **Draft** | Perubahan yang belum dipublikasikan, atau halaman/proyek yang disembunyikan. |
| **SEO** | Pengaturan agar situs tampil baik di Google. |
| **OG image** | Gambar yang muncul saat link situs dibagikan di WhatsApp/LinkedIn. |
| **DNS / nameserver** | Pengaturan yang menghubungkan nama domain ke Netlify. |
| **VPS** | Server sewaan yang Anda kelola sendiri. |
