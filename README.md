# Portobuilder

Website portfolio statis (Astro + Netlify). Konten diedit di **`/edit`** (editor visual) atau `/admin` (Sveltia CMS, cadangan).

- Spesifikasi: [PRD.md](PRD.md)
- Untuk developer / Claude Code: [CLAUDE.md](CLAUDE.md)
- Untuk editor: [PANDUAN-EDITOR.md](PANDUAN-EDITOR.md)

```bash
npm install
npm run dev     # http://localhost:4321  ·  editor: /edit  ·  katalog QA: /dev/sections
npm test
npm run build
```

## Checklist deploy (sekali, ±30 menit)

- [ ] Push repo ke GitHub (boleh private), branch `main`.
- [ ] Netlify → **Add new site → Import from GitHub**. Build command dan publish directory sudah diisi `netlify.toml` (`npm run build`, `dist`).
- [ ] GitHub → Settings → Developer settings → **OAuth Apps → New**. Homepage: URL situs. Callback URL: `https://api.netlify.com/auth/done`.
- [ ] Netlify → Project configuration → **Security → OAuth → Install provider → GitHub**, isi Client ID dan Secret dari langkah sebelumnya.
- [ ] `backend.repo` di config CMS terisi otomatis dari `REPOSITORY_URL` Netlify. Cek `https://<situs>/admin/config.yml` setelah deploy pertama; kalau masih `USERNAME/portfolio`, set env var `CMS_REPO=owner/repo` di Netlify lalu deploy ulang.
- [ ] Buka `https://<situs>/edit`, login GitHub, ubah satu teks, Publikasikan, dan pastikan commit muncul di repo. Kanvas editor berjalan sebagai Netlify Function (`/edit/render`), jadi tidak perlu setup tambahan.
- [ ] Undang akun GitHub editor sebagai collaborator repo (akses **Write**).
- [ ] Netlify → **Forms**: aktifkan form detection, lalu tambahkan notifikasi email untuk form `kontak`.
- [ ] Pasang domain custom (HTTPS otomatis), lalu set env var `SITE_URL=https://domainanda.com` supaya canonical, sitemap, dan OG image memakai domain tersebut. Deploy ulang.
- [ ] Ganti konten contoh: Pengaturan Situs (nama, email, WhatsApp, sosial, OG image, favicon), foto About, dan proyek. Hapus `public/uploads/sample/` setelah tidak dipakai.
- [ ] Jalankan Lighthouse mobile untuk `/`, `/projects`, satu detail proyek, dan `/layanan`.
- [ ] Bagikan link situs di WhatsApp/LinkedIn untuk mengecek preview OG image.
- [ ] Login ke `/admin` dengan akun editor, lalu coba ubah satu teks dan Save.
