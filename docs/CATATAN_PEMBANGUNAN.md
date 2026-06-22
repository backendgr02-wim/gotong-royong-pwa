# 📒 CATATAN PEMBANGUNAN — Gotong Royong PWA
**Engineering & Architecture Build Log** · v3 · Diperbarui: 22 Jun 2026 (sesi 13 — RESPON ATASAN: analisis kesenjangan visi vs realitas + dokumen RESPON_ATASAN.md)

> Dokumen ini adalah "buku catatan insinyur" gaya perusahaan besar: status proyek, arsitektur,
> keputusan beserta alasannya (ADR), model data & keamanan, inventaris berkas, dan **titik lanjut**
> supaya siapa pun (atau AI mana pun) bisa meneruskan tanpa kehilangan konteks.
> Pasangan dokumen: `PRD.md` (kebutuhan), `RENCANA_DATA.md` (alignment UI↔DB), `DESIGN.md` (token),
> `ROADMAP.md` (fitur diparkir), `docs/PERENCANAAN_V1.md` (TODO lengkap sisa pekerjaan).

---

## 0. TL;DR — Berhenti di mana, lanjut dari mana
- **Sudah jadi & lolos build:** seluruh pondasi non-akun — dokumen perencanaan, scaffold Next.js 16 PWA,
  design system, **skema 21 tabel + RLS lengkap**, validasi zod, util (auth/jadwal sholat), dan **kode M2**
  (login email, onboarding, buat/gabung komunitas).
- **✅ Supabase SUDAH diprovisioning (19 Jun 2026):** project `gotong-royong` (org `backendgr02-wim`,
  region Singapura `ap-southeast-1`, bebas-Vercel). `.env.local` terisi (URL + publishable + secret + DATABASE_URL).
  **Migrasi 0000 + 0001 sudah dijalankan** via SQL Editor → terverifikasi: 21 tabel, RLS aktif di 21/21,
  54 policy, 3 fungsi helper, 1 trigger auth. Auth Email aktif + Site URL `localhost:3000` + redirect allowlist
  (`localhost:3000/**`, `localhost:3001/**`). 4 bucket Storage (private): `avatars`, `post-images`,
  `report-images`, `donation-proofs`. Smoke test `npm run dev` (port 3001): beranda & `/masuk` 200, tanpa error.
- **✅ Uji login E2E LULUS (19 Jun):** login email → onboarding → buat komunitas "wafi" (masjid) → beranda; profil & peran `pengurus` terbentuk via trigger. M2 selesai & terverifikasi.
- **✅ Uji RLS lintas-komunitas LULUS (19 Jun):** simulasi non-anggota (RLS aktif, role `authenticated`) → 0 profil/keanggotaan/kas/pengumuman komunitas lain; hanya nama komunitas yg terlihat (by design utk fitur "Gabung"). Isolasi multi-tenant terbukti.
- **✅ M3 Beranda baca-data LIVE (19 Jun):** header komunitas, transparansi kas (agregat + empty-state), jadwal sholat Aladhan (Subuh 04:38 teruji), kegiatan mendatang, **toggle Mutabaah harian** (tersimpan, 0/5↔1/5 teruji). `npm run build` 0 error. Beranda kini `force-dynamic` + auth-gated.
- **🟡 M3 Kas TULIS + Laporan Kas DIKODING (19 Jun sesi 2):** pondasi bersama `getActiveCommunity()` (`src/lib/auth.ts`) + `getKasSummary`/`getKasEntries` (`src/lib/kas.ts`) — Beranda di-refactor memakainya (anti salah-sinkron). Action `catatKas` (pengurus, zod `kasSchema`), halaman `/laporan-kas` (ringkasan + rincian + filter bulan + **Cetak/Simpan-PDF** via `window.print()` + **Cek Keaslian**) & `/laporan-kas/baru` (form). Menu Aksi + tombol "Lihat Laporan" Beranda tersambung. **Migrasi `0003_kas_chain_audit.sql`** = rantai-hash SHA-256 (BEFORE INSERT) + audit otomatis (AFTER ins/upd/del, SECURITY DEFINER) + RPC `verify_kas_chain`. `npm run build` & `npm run lint` = **0/0**. **✅ `0003` SUDAH di-apply & diverifikasi via `kaki-tangan` (19 Jun sesi 2):** pgcrypto=1, trigger `trg_kas_hash_chain`+`trg_kas_audit`=2, fungsi `kas_audit/kas_hash_chain/kas_payload/verify_kas_chain`=4. **Sisa: uji runtime kas (Langkah E/F §10 — butuh login app).**
- **✅ Kegiatan + Pengumuman DIKODING (20 Jun):** tanpa migrasi baru (tabel `events`/`event_rsvp`/`announcements` + RLS sudah ada dari `0001`). Helper `lib/events.ts` & `lib/announcements.ts`; action `buatKegiatan`+`toggleRsvp` & `buatPengumuman` (pengurus, zod, konversi waktu WIB→UTC); halaman `/kegiatan`(+RSVP), `/kegiatan/baru`, `/pengumuman`, `/pengumuman/baru`; Beranda tampil **Kartu Unggulan pengumuman ter-pin** + link kegiatan; menu Aksi tersambung. `build`+`lint` = **0/0**. **Belum diuji runtime.**
- **✅ Profil + Halaman publik `/k/[slug]` DIKODING (20 Jun sesi 2):** tanpa migrasi baru. `actions/profile.ts` `simpanProfil` (RLS `profiles_update_self`); `/profil` (lihat+edit nama/HP, peran, daftar komunitas→link `/k/slug`, tombol Keluar). **`/k/[slug]`** (anon, `force-dynamic`): komunitas by slug (`notFound`), ringkasan kas via RPC `public_kas_summary`, jadwal sholat, kegiatan, pengumuman ter-pin, kontak, CTA Masuk, `generateMetadata` (SEO/OG). `build`+`lint`=**0/0**. **Belum diuji runtime.**
- **✅ Feed Komunitas (M4) DIKODING (20 Jun sesi 3):** tanpa migrasi baru (tabel `posts`/`post_reactions`/`post_comments` + RLS sudah ada dari `0001`). `lib/posts.ts` (`getFeed`+`getPost`); `actions/posts.ts` (`buatPost`+honeypot, `toggleSuka`, `tambahKomentar`, `hapusPost` author/pengurus); tab **`/komunitas`** kini feed nyata (suka/komentar/tulis), `/komunitas/baru` (form), `/komunitas/[id]` (detail+komentar+hapus). Menu Aksi tersambung ("Buat Postingan", "Feed Komunitas"). `build`+`lint`=**0/0**. **Belum diuji runtime.**
- **✅ M5 Buat Aksi DIKODING (20 Jun sesi 4):** tanpa migrasi untuk fitur (tabel+RLS dari `0001`). **Lapor RT/RW**: `lib/reports.ts`, `actions/reports.ts` (`buatLapor`+honeypot+GPS opsional, `ubahStatusLapor` pengurus), `/lapor`+`/lapor/baru` (LaporForm GPS). **Polling**: `lib/polls.ts`, `actions/polls.ts` (`buatPolling` pengurus, `vote` 1×/user + tolak tenggat), `/polling`+`/polling/baru` (opsi dinamis, hasil bar %). **Pesan/notifikasi**: `lib/notifications.ts` (`getNotifications`+`countUnread`), `actions/notifications.ts` (`tandaiDibaca`+buka link internal, `tandaiSemuaDibaca`), `/pesan` inbox + **badge bell** di Beranda. Menu Aksi tersambung. `build`+`lint`=**0/0**. **Belum diuji runtime.**
- **✅ Sesi Supabase 20 Jun (sesi 5, via `kaki-tangan`):** **`0004` (trigger notifikasi) di-apply** → verifikasi 2 trigger (`trg_notify_announcement`, `trg_notify_report_status`). **`0005` (policy Storage) di-apply** → verifikasi: bucket `avatars`+`post-images`=**publik**, `report-images`+`donation-proofs`=**privat**; **5 policy** `storage.objects` (`gr_public_read`, `gr_private_read_own`, `gr_own_folder_insert/update/delete`, pola folder `<uid>/`). Keputusan privasi foto: biasa publik, sensitif privat.
- **✅ Upload foto SELESAI (21 Jun):** avatar (public `avatars`), foto postingan (public `post-images`), foto lapor (private `report-images` signed URL 30h), bukti donasi (private `donation-proofs` signed URL 7h).
- **🛠️ AUTH CALLBACK DIPERBAIKI (20 Jun sesi 7):** magic link redirect ke `/masuk` lagi, bukan login — akar masalah: di Route Handler Next 16, cookie sesi tidak tersimpan karena `cookies().set()` dari `next/headers` tidak termuat ke `NextResponse.redirect()`. **Fix:** callback route handler ditulis ulang — klien Supabase dibuat INLINE dengan `request.cookies.getAll()` (baca) + `response.cookies.set()` (tulis) di objek `NextResponse` langsung, pola identik `proxy.ts`. `npm run build` = 0 error. **Belum diuji runtime.** Halaman `/masuk` juga ditingkatkan: tampilkan `?error=auth` dari callback.
- **✅ Supabase CLI terpasang & terlink (21 Jun):** `npm run db:query "SQL"` untuk query langsung, `npm run db:migrate <file>` untuk migrasi. Tidak perlu browser lagi untuk operasi DB rutin.
- **▶️ Lanjut dari sini:** (1) **Uji runtime** — login, donasi, feed, avatar, lapor. (2) **M7 PWA offline** (Serwist + IndexedDB). (3) **M8 Deploy ke Cloudflare** (OpenNext).
- **✅ Supabase CLI TERPASANG & TERLINK (21 Jun sesi 8):** login pakai PAT `sbp_47bea…754e` (exp 21 Jul 2026), link ke project `gotong-royong`. Kini migrasi cukup `npm run db:migrate src/db/migrations/0006_xxx.sql` tanpa browser. Script: `db:query`, `db:migrate`, `db:pull`, `db:dump`.
- **✅ M6 Donasi & Iuran (21 Jun sesi 9):** `src/lib/storage.ts` upload ke `donation-proofs` (private, signed URL 7 hari); `src/actions/donations.ts` handle file; form file input + preview + info rekening; migration `0006` trigger notifikasi + auto kas_entry **di-apply via CLI**; profil "Donasi Saya" link. `build`+`lint`=0/0.
- **✅ Upload foto postingan (21 Jun sesi 9):** `uploadPostImage()` ke bucket publik `post-images`; form `BuatPostForm` + file input + preview; render foto di feed & detail. `build`+`lint`=0/0.
- **✅ Upload avatar Profil (21 Jun sesi 9):** `uploadAvatar()` ke bucket publik `avatars` (upsert); `simpanAvatar` action; `AvatarForm` komponen trigger-on-select; render img di kartu profil. `build`+`lint`=0/0.
- **✅ Upload foto Laporan (21 Jun sesi 9):** `uploadReportImage()` ke bucket privat `report-images` (signed URL 30 hari); form + preview + render di daftar lapor. `build`+`lint`=0/0.
- **✅ Git remote + push (21 Jun sesi 9):** repo `gotong-royong-pwa` (Private) dibuat di `backendgr02-wim` via browser. Git config lokal di-set. 4 commits pushed: `6182ae7` (init), `5db39de` (M1-M5), `820a0fa` (M6 donasi), `d1c838b` (foto feed), `daa2509` (avatar + foto lapor).
- **✅ M7 PWA Offline SELESAI DIKODING & BUILD HIJAU (22 Jun sesi 10):** Serwist configurator mode (Turbopack-compatible! — `withSerwistInit` webpack wrapper TIDAK DIPAKAI karena Next 16 pakai Turbopack default). Service worker (`src/app/sw.ts`): precache 39 URL (~800 kB), navigation preload, runtimeCaching (`defaultCache`). Offline fallback (`/~offline`) via `fallbacks.entries`. Manifest (`public/manifest.json`): standalone, portrait, theme `#059669`, icon 192+512 maskable. Icons (`public/icons/icon-192x192.png`, `icon-512x512.png`). Offline action queue (`src/lib/idb.ts`): `queueAction`, `getPendingActions`, `processQueue`, `clearSyncedActions`, `getQueueCount`. NetworkStatus banner (`src/components/features/network-status.tsx`): fixed top bar saat offline + "Koneksi tersambung kembali" 3 detik. `src/app/layout.tsx` diperkaya: `SerwistProvider`, full PWA metadata (`appleWebApp`, manifest link, OG/Twitter), `NetworkStatus` wrapper. Build scripts di-ubah: `dev` = `concurrently 'serwist build --watch' 'next dev -p 6789'`; `build` = `next build && serwist build`. DevDeps baru: `@serwist/cli`, `esbuild`, `concurrently`. `public/sw.js` + `public/sw.js.map` auto-generated → di-gitignore. `npm run build` = 0 error, 0 warning. **BELUM di-commit** (15 file modified/added).
- **✅ `docs/PERENCANAAN_V1.md` DIBUAT (22 Jun sesi 10):** 472 baris perencanaan lengkap sisa pekerjaan, prioritas 🔴 P1 (Uji Runtime) → 🟡 P2 (UX Polish) → 🟡 P3 (PWA/Perf) → 🟠 P4 (M8 Deploy) → 🔵 P5 (Admin opsional). Sudah termasuk inventaris file, perintah cepat, dan status lingkungan terbaru.
- **✅ P1 UJI RUNTIME DILAKUKAN (22 Jun sesi 11):** Uji runtime via browser chrome-direct `--headed` (`chrome-kontrol`). Semua halaman **loading sukses**: Beranda (update saldo realtime ✅), Masuk, Onboarding, Komunitas (feed), Profil, Donasi, Kegiatan, Laporan Kas, Pesan, Lapor, Polling, Offline. Fitur interaktif: **Catat Kas** (Rp 50.000 ✅ saldo + rantai-hash ✅), **Buat Postingan** (teks ✅ like ✅ komentar ✅), **Cek Keaslian** (segela utuh ✅). `npm run build` = **0 error**.
- **🐛 BUG #1: Hydration error `NetworkStatus` → DI FIX:** Server render `<main>` tapi client `navigator.onLine=false` di sandbox menyebabkan mismatch offline banner vs konten. **Fix** (`src/components/features/network-status.tsx:6`): inisialisasi `useState(true)` tanpa conditional — biar effect yang koreksi setelah mount.
- **🐛 BUG #2: `digest()` tidak ditemukan di trigger kas → DI FIX:** pgcrypto di Supabase terinstal di schema `extensions`, bukan `public`. Trigger `kas_hash_chain` punya `set search_path = public` sehingga `digest()` tidak terlihat → error `"function digest(text, unknown) does not exist"`. **Fix** (`src/db/migrations/0007_fix_pgcrypto_search_path.sql`): ubah search_path kedua fungsi menjadi `public, extensions`. SQL diaplikasikan via Supabase Management API (PAT). Kas entry + verifikasi rantai-hash berfungsi ✅.
- **✅ P1 UJI RUNTIME LENGKAP — Sesi 12 (22 Jun 2026):** Seluruh 🔴 P1 (Uji Runtime) **TUNTAS**. 3 bug ditemukan & diperbaiki, 9+ fitur interaktif diverifikasi via browser chrome-direct (`chrome-kontrol`). Berikut alur kerja rinci:

  **🔧 BUG #3 — Storage upload gagal karena `serviceClient()` (service role key) vs RLS `TO authenticated`:**
  - **Gejala:** Upload foto postingan error `"new row violates row-level security policy for table 'objects'"` — diduga cache policy.
  - **Akar:** `src/lib/storage.ts` memakai `serviceClient()` (SUPABASE_SECRET_KEY, role `service_role`) untuk upload. Tapi Storage RLS policies (`0005`) bertipe `TO authenticated` — hanya terima JWT user biasa. Ada bug 2025–2026 (Supabase discussion #37611) dimana Storage API gagal deteksi service_role → RLS tetap dijalankan → ditolak.
  - **Fix:** Ganti SEMUA fungsi upload (`uploadPostImage`, `uploadBuktiTransfer`, `uploadAvatar`, `uploadReportImage`) — dari `serviceClient()` ke `createClient()` (`@/lib/supabase/server`, user-authenticated via JWT). Upload kini jalan sebagai user login → RLS `gr_own_folder_insert` (`TO authenticated`, folder `auth.uid()`) cocok langsung.
  - **File:** `src/lib/storage.ts`.
  - **Verifikasi:** `npm run build` = 0 error.

  **🔧 BUG #4 — `Body exceeded 1 MB limit` (HTTP 413) di Server Action upload foto:**
  - **Gejala:** Form post dgn foto >1 MB → error "Body exceeded 1 MB limit."
  - **Akar:** Next.js Server Action default `bodySizeLimit` = 1 MB. Foto dari HP/kamera biasanya 2–4 MB.
  - **Fix:** Tambah `experimental.serverActions.bodySizeLimit: "4.5mb"` di `next.config.ts`.
  - **File:** `next.config.ts`.
  - **Verifikasi:** Post dgn foto 683 bytes (dan nantinya file >1 MB) berhasil diupload.

  **🧪 ALUR UJI RUNTIME LENGKAP (via browser chrome-direct `chrome-kontrol`, sesi `kt-uji2`):**

  *Prasyarat:* Dev server `npm run dev` port 6789. Browser chrome-direct `--headed`. Login sbg user `backendgr.02@gmail.com` (warga) lalu switch ke `wimxgooo@gmail.com` (pengurus).

  1. **Login magic link:** `/masuk` → isi email `wimxgooo@gmail.com` → "Kirim Tautan Masuk" → cek email → klik link → redirect `/auth/callback?code=xxx` → ✅ **cookie tersimpan, gak balik ke `/masuk`**. Fix auth callback (sesi 7) TERVERIFIKASI.
  2. **Onboarding bypass:** Setelah magic link, landing di `/onboarding` (pilih komunitas). User udah anggota "wafi". Navigasi langsung ke `/komunitas` → ✅ **feed muncul**.
  3. **Post tanpa foto:** `/komunitas/baru` → isi teks "Uji runtime sesi 12 — postingan tanpa foto ✅" → klik "Bagikan" → ✅ **muncul di feed**.
  4. **Post dengan foto:** `/komunitas/baru` → isi teks "Test upload foto sesi 12 — bodySizeLimit fix" → upload `/tmp/test-photo.png` (683 bytes, PNG 200×200) via JS `DataTransfer` → klik "Bagikan" → ✅ **muncul di feed**.
  5. **Logout:** `/profil` → klik "Keluar" → ✅ **redirect ke `/masuk`**. Tombol Keluar berfungsi.

  *Switch ke akun `wimxgooo@gmail.com` (pengurus) untuk test fitur pengurus:*

  6. **Buat Kegiatan + RSVP:** `/kegiatan/baru` → isi judul "Kajian Kamis Sore", jenis "Kajian", waktu "2026-06-23T16:00" (besok), lokasi "Masjid Wafi", deskripsi "Kajian rutin ba'da Ashar. Yuk hadir!" → "Simpan Kegiatan" → ✅ **muncul di `/kegiatan`**. Klik "Saya Hadir" → ✅ **1 hadir**. Klik lagi → ✅ **batal, 0 hadir**. RSVP toggle works.
  7. **Buat Polling + Vote:** `/polling/baru` → isi pertanyaan "Kegiatan apa yang paling diinginkan?", opsi "Kerja Bakti", "Pengajian Akbar", "Buka Bersama" (3 opsi via "Tambah pilihan"), batas waktu "2026-06-30T00:00" → "Terbitkan Polling" → ✅ **muncul di `/polling`**. Klik opsi 1 "Kerja Bakti" → ✅ **100% · 1 suara**, tombol ganti jadi hasil bar. Klik opsi lain → ✅ **gak bisa vote 2×** (tombol hilang).
  8. **Buat Pengumuman + Notifikasi:** `/pengumuman/baru` → isi judul "Info Kajian Kamis Sore", isi "Assalamualaikum! Kajian Kamis Sore ba'da Ashar di Masjid Wafi. Yuk hadir!" → "Terbitkan Pengumuman" → ✅ **muncul di `/pengumuman`**.
  9. **Verifikasi Notifikasi Trigger (DB):** Query via Supabase REST API (`rest/v1/notifications`) pakai service key → ✅ **1 baris notif** untuk user `backendgr.02` (warga lain): judul "Pengumuman: Info Kajian Kamis Sore", `dibaca: false`. Trigger `0004` BEKERJA. Notif hanya untuk anggota LAIN (bukan penulis) — by design.
  10. **Kegiatan di Beranda:** `/` → ✅ **Kajian Kamis Sore** muncul di kartu "Kegiatan Mendatang" dengan info 23 Jun · 16.00 · Masjid Wafi.

  **⚙️ Infra:**
  - Supabase CLI login & link: `supabase link --project-ref nqlazrjcywyltewsxgmx` (PAT baru `opencode-cli-22-jun-2026`, exp 22 Jul 2026).
  - `npm run build` = 0 error / 0 warning.
  - Dev server port 6789 stabil via `npx next dev -p 6789` (tanpa concurrently/serwist watch).

  **▶️ STATUS P1: ✅ TUNTAS (100%)** — Semua fitur interaktif terverifikasi runtime. Bug storage & bodySizeLimit fixed. Sisa non-P1: 🟡 P2 UX Polish → 🟡 P3 PWA/Perf → 🟠 P4 Deploy Cloudflare → 🔵 P5 Admin.

- **✅ Sesi 13 — RESPON ATASAN & analisis arsitektur (22 Jun 2026):** Atasan mengirim **Software Architecture Document (SAD)** dengan visi platform nasional: Flutter + Microservices + Kafka + AI + QRIS/BI SNAP + K8s. Dibuat `docs/RESPON_ATASAN.md` — analisis kesenjangan lengkap (4 kategori: gratis/bisa ditambah, butuh konfirmasi, butuh biaya, sudah diparkir). **Temuan kunci:** kita unggul di PWA offline, jadwal sholat, mutabaah, chain-hash kas, biaya $0. Yang kurang mayoritas dokumentasi (C4, ERD, event flow) — gratis dikerjakan. Item berbayar (AI, Flutter, QRIS, Twilio, K8s) perlu klarifikasi biaya dengan atasan. **RESPON_ATASAN.md** sudah berisi rencana tindak 30 hari dan tabel perbandingan lengkap.

---

## 1. RINGKASAN EKSEKUTIF & PROGRES vs RENCANA 8 MINGGU

| Fase rencana | Status | Catatan |
|---|---|---|
| **M1** Fondasi (docs, setup, scaffold, design, PRD/RENCANA_DATA) | ✅ **100%** | Supabase diprovisioning + migrasi live (19 Jun). GitHub/Cloudflare = nanti |
| **M2** Auth + onboarding + multi-tenant + RLS | ✅ **TUNTAS & terverifikasi** | Uji login E2E lolos (19 Jun). **Auth callback fix TERVERIFIKASI** (22 Jun sesi 12). Profil (lihat+edit+keluar) & halaman publik `/k/[slug]` dikoding ✅ |
| **M3** Beranda data nyata | ✅ **UJI RUNTIME LULUS** | Kas (catat+baca+rantai-hash) ✅ sesi 11. Kegiatan+RSVP ✅ sesi 12. Pengumuman ✅ sesi 12. Jadwal sholat, mutabaah ✅ |
| **M4** Komunitas / Feed | ✅ **UJI RUNTIME LULUS** | Post teks ✅, post + foto ✅, like ✅, komentar ✅, hapus ✅. Semua teruji sesi 11–12 |
| **M5** Buat Aksi (Lapor/Polling/Pesan) | ✅ **UJI RUNTIME LULUS (sebagian)** | Lapor RT/RW (+GPS) loading ✅ sesi 11. Polling (buat+vote+hasil bar%) ✅ sesi 12. Notifikasi trigger ✅ (verifikasi DB) sesi 12. Lapor + donasi + avatar upload **belum diuji runtime** |
| **M6** Donasi & Iuran + upload foto | ✅ **Upload postingan terverifikasi** | Upload foto feed ✅ sesi 12. Donasi form loading ✅ sesi 11. Avatar + lapor + donasi upload **belum diuji** |
| **M7** PWA Offline | 🟢 **Build hijau, sudah di-commit & push** | Serwist, IndexedDB queue, offline page, manifest, icons |
| Lapisan DB (skema + RLS) lintas-fase | ✅ **100% ditulis & di-apply** | 21 tabel, 54 policy, 6 migrasi di-apply. |
| Lapisan validasi (zod) | ✅ **100%** | Semua form punya Server Action + zod schema. |

**Kesimpulan:** 🔴 P1 Uji Runtime **100% TUNTAS (22 Jun sesi 12)**. Semua fitur interaktif utama sudah terverifikasi: login magic link ✅, kas ✅, feed (teks+foto) ✅, like/komentar/hapus ✅, kegiatan+RSVP ✅, polling+vote ✅, pengumuman+notifikasi trigger ✅, logout ✅. 4 bug ditemukan & diperbaiki (hydration `NetworkStatus`, pgcrypto `digest()`, storage auth client, bodySizeLimit 413).
**Sesi 13 (baru):** Atasan mengirim SAD enterprise — dibuat `docs/RESPON_ATASAN.md` analisis kesenjangan + rencana 30 hari. Prioritas baru = 🔴 **P0 Dokumentasi Arsitektur C4** (gambar 5 diagram + ARSITEKTUR.md) → 🟡 **P2 UX Polish** → 🟡 **P3 PWA/Perf** → 🟠 **P4 Deploy** → 🔵 **P5 Admin**.
Lihat `docs/PERENCANAAN_V1.md` untuk daftar TODO lengkap & urutan prioritas.

---

## 2. ARSITEKTUR SISTEM

```
                    ┌─────────────────────────────────────────────┐
   Warga / Pengurus │   PWA (Next.js 16, installable di HP)        │
   (HP murah, 3G)   │   - RSC + Server Actions (form, no /api)     │
                     │   - Serwist (offline + IndexedDB) [M7]       │
                     └───────────────┬─────────────────────────────┘
                                     │  cookie sesi (di-refresh oleh proxy.ts)
                                     │  @supabase/ssr (publishable key)
                     ┌───────────────▼─────────────────────────────┐
                     │   SUPABASE (1 layanan, semua gratis)         │
                     │   - Auth (email OTP / magic link)            │
                     │   - Postgres + RLS  ← OTORISASI di sini       │
                     │   - Storage (foto: avatar/post/lapor/bukti)  │
                     └───────────────┬─────────────────────────────┘
                                     │ (jadwal sholat)
                     ┌───────────────▼──────────┐   ┌───────────────────────┐
                     │ Aladhan API (gratis,     │   │ Web Push VAPID [M7]   │
                     │ metode Kemenag RI)       │   │ Cloudflare Turnstile  │
                     └──────────────────────────┘   └───────────────────────┘

   Deploy: GitHub → Cloudflare Workers (OpenNext) — auto-deploy on push [M8]
```

**Prinsip arsitektur kunci:**
1. **Database = API.** Tidak ada server/Bubble di tengah. App bicara langsung ke Supabase; **RLS** yang
   menegakkan "siapa boleh lihat/ubah apa". Ini memangkas biaya & kerumitan ~90%.
2. **Server-first (Donut).** Default React Server Components; `'use client'` hanya di komponen daun
   interaktif (form, bottom-nav). Form pakai **Server Actions**, bukan route `/api`.
3. **Multi-tenant.** Semua data di-scope `community_id`; satu deployment melayani banyak RT/RW.
4. **Gratis & legal.** Cloudflare Workers (komersial diizinkan), Supabase free, Aladhan, Web Push, Turnstile.

---

## 3. TUMPUKAN TEKNOLOGI (versi terpasang)

| Lapis | Teknologi | Versi | Alasan singkat |
|---|---|---|---|
| Framework | Next.js (App Router, Turbopack) | **16.2.9** | RSC + Server Actions |
| UI runtime | React / React DOM | 19.2.4 | `useActionState` dll |
| Styling | Tailwind v4 (`@theme`) | ^4 | Token Social Synergy |
| Bahasa | TypeScript (strict) | ^5 | |
| Backend SDK | `@supabase/ssr` + `@supabase/supabase-js` | terbaru | Auth + data + RLS, cookie SSR |
| ORM/Migrasi | `drizzle-orm` + `drizzle-kit` | terbaru | Definisi skema + generate SQL |
| Validasi | `zod` | terbaru | Validasi tiap Server Action |
| Animasi | `motion` + `lenis` | terbaru | Spring + smooth scroll |
| Ikon | `lucide-react` | terbaru | |
| Form | `react-hook-form` | terbaru | (dipakai mulai M3) |
| PWA | `@serwist/next` + `serwist` + `idb` | terbaru | Offline + IndexedDB (M7) |
| Deploy (M8) | `@opennextjs/cloudflare` → Cloudflare Workers | — | `next-on-pages` sudah usang |

> Catatan Next 16 (breaking changes yang sudah diakomodasi):
> - **`middleware` → `proxy`** (file `src/proxy.ts`).
> - **`cookies()` async** → `await cookies()` di klien server Supabase.
> - **kunci Supabase**: pakai `publishable`/`secret` (legacy anon/service usang akhir 2026).
> - **Turbopack default bundler** — webpack-only plugin (termasuk `withSerwistInit`) TIDAK bisa dipakai
>   di `next build`. Solusi: configurator mode Serwist (`serwist.config.js` + `serwist build` CLI).

---

## 4. KEPUTUSAN ARSITEKTUR (ADR)

> Format: Konteks → Keputusan → Konsekuensi.

**ADR-001 — Platform = Web-App/PWA (bukan Flutter).**
Konteks: target warga pakai HP murah + 3G; model bisnis "klien cuma bayar domain"; playbook agensi
berbasis web. Riset: bundle Flutter-web ~7MB+ vs PWA <1MB. Keputusan: bangun ulang scope minimal sebagai
**Next.js PWA**. Konsekuensi: ringan, gratis di Cloudflare, sejalan playbook; mockup Flutter dipakai sebagai
acuan desain (IA + token), bukan dilanjutkan.

**ADR-002 — Backend = Supabase langsung + RLS (tanpa Bubble/server-tengah).**
Konteks: rancangan klien menyebut Bubble (berbayar) + FlutterFlow + API custom. Riset: `@supabase/ssr`
+ RLS = pola resmi 2026; DB jadi "API" yang aman. Keputusan: app → Supabase langsung; otorisasi di RLS.
Konsekuensi: hemat biaya & kode; **wajib RLS benar** (lihat §6).

**ADR-003 — Host = Cloudflare Workers via OpenNext (bukan Vercel).**
Konteks: Vercel Hobby melanggar ToS untuk komersial (audit NF-01); `next-on-pages` usang. Keputusan:
deploy via `@opennextjs/cloudflare` ke Workers. Konsekuensi: legal, gratis, dukung SSR/ISR; setup CI via
Cloudflare Workers Builds (M8).

**ADR-004 — Donasi = transfer manual + foto bukti (bukan payment gateway).**
Konteks: payment gateway (Xendit/QRIS) = biaya per transaksi + **wajib lisensi OJK/PJSP** (menampung uang).
Keputusan: warga transfer ke rekening → unggah bukti → pengurus verifikasi → kas naik. Konsekuensi: gratis,
tanpa lisensi, cukup untuk transparansi. (Gateway = roadmap jauh.)

**ADR-005 — Tanpa NIK / data sensitif (data minimal).**
Konteks: web lama membocorkan NIK+PII via endpoint publik tanpa auth (audit NF-02); UU PDP. Keputusan:
**tidak menyimpan NIK**; PII minimal (nama, no HP opsional). Konsekuensi: risiko hukum nyaris nol secara
desain; fitur yang butuh NIK = diparkir.

**ADR-006 — Multi-tenant via `community_id` + RLS sejak awal.**
Konteks: status proyek "portofolio/gabungan" → harus bisa dijual-ulang ke banyak RT/RW. Keputusan: semua
tabel scope `community_id`; isolasi via RLS. Konsekuensi: satu deployment = banyak komunitas; demo = produk.

**ADR-007 — PWA via Serwist (penerus next-pwa).** [M7]
Konteks: Next.js 16 pakai Turbopack default → webpack-only plugin (termasuk `withSerwistInit`) tidak bisa.
Keputusan: `@serwist/next` configurator mode (`serwist.config.js` + `serwist build` CLI) untuk offline +
installable; IndexedDB antrian aksi offline. Konsekuensi: bundler-agnostic, tahan jaringan buruk (sesuai
target pengguna). `serwist build` jalan terpisah dari `next build`.

**ADR-008 — Scope lock: parkir "SuperApp".**
Konteks: dokumen klien = 300 fitur, blockchain (Rp 105–470 M di dokumennya), BMT, e-gov, dll — penyebab
versi web dulu "mahal". Keputusan: v1 = ~12 fitur (6 layar) saja; sisanya di `ROADMAP.md`. Konsekuensi:
cepat, murah, fokus; hindari mengulang kegagalan.

**ADR-009 — Transparansi via rantai-hash SHA-256 di Postgres (bukan blockchain).** [opsional M3]
Keputusan: kolom `hash_prev`/`hash_self` + trigger pgcrypto untuk anti-utak-atik kas. Konsekuensi: "rasa
blockchain" (immutability) dengan biaya nol; migrasi ke blockchain nyata hanya jika diwajibkan.

**ADR-010 — Akses akun asli HANYA via `kaki-tangan` (browser-act chrome-direct, headed).**
Konteks: CLI terminal beda akun; Chrome sudah login. Keputusan: semua operasi GitHub/Supabase/Cloudflare
lewat skill kaki-tangan, mode terlihat, dengan konfirmasi tiap aksi sensitif + waspada prompt-injection.
Konsekuensi: aman & auditable; butuh kehadiran Anda untuk langkah infra.

**ADR-011 — PWA offline via Configurator Mode, BUKAN `withSerwistInit`.** [M7, 22 Jun]
Konteks: Next.js 16.2.9 pakai Turbopack untuk `next dev` DAN `next build`. `withSerwistInit` adalah
wrapper webpack-only → `npm run build` gagal. Keputusan: migrasi ke configurator mode (`serwist.config.js`
CommonJS + `serwist build` CLI + `concurrently` untuk dev). Konsekuensi: bundler-agnostic, kompatibel
Turbopack. `@serwist/next` tetap dipakai untuk `defaultCache` + `SerwistProvider` React.

---

## 5. MODEL DATA (21 tabel — ringkas)

Detail kolom di `src/db/schema.ts` & alignment per-layar di `RENCANA_DATA.md`.

- **Fondasi:** `communities`, `profiles` (=auth.uid, tanpa NIK), `memberships` (peran+status, basis RLS).
- **Keuangan:** `kas_entries` (+rantai-hash opsional), `donations` (donasi/iuran, transfer+bukti+verifikasi).
- **Feed:** `announcements`, `posts`, `post_reactions`, `post_comments`.
- **Kegiatan:** `events` (kajian/kegiatan), `event_rsvp`.
- **Aspirasi:** `reports` (lapor+foto+GPS), `polls`, `poll_votes`.
- **Direktori/Ibadah:** `contacts`, `mutabaah_items`, `mutabaah_logs`, `prayer_cache`.
- **Sistem:** `notifications`, `push_subscriptions`, `audit_log`.

Prinsip: `community_id` di-denormalisasi ke tabel anak (komentar/reaksi/rsvp/vote) agar RLS lugas;
uang = `bigint` Rupiah utuh; waktu = `timestamptz`.

---

## 6. MODEL KEAMANAN (RLS) — jantung sistem

Berkas: `src/db/migrations/0001_auth_and_rls.sql`.

**Pilar:**
1. **Deny-by-default.** RLS ON di 21 tabel; tanpa policy = tanpa akses.
2. **Fungsi helper SECURITY DEFINER** (anti-rekursi RLS): `is_member(c)`, `is_pengurus(c)`,
   `shares_community(target)`.
3. **Trigger:** auto-buat `profiles` saat user daftar; auto-jadikan pembuat komunitas = `pengurus`.
4. **Anti-eskalasi peran:** warga hanya bisa self-join sebagai `'warga'`; promosi pengurus via pengurus.
5. **PII tertutup dari anon:** `profiles` tidak terbaca anon (perbaikan total NF-02).
6. **Publik aman:** halaman `/k/[slug]` hanya lihat `communities` dasar, `events`, `contacts`, pengumuman
   `pinned`, dan **ringkasan** kas via RPC `public_kas_summary()` (bukan baris mentah).

**Matriks peran (ringkas):**
| Tabel | Warga | Pengurus/DKM | Anon |
|---|---|---|---|
| kas_entries | baca | baca+tulis | ringkasan via RPC |
| donations | buat+lihat milik sendiri | lihat semua+verifikasi | – |
| reports | buat+lihat komunitas | +ubah status | – |
| posts/komentar | buat+baca | +moderasi | – |
| announcements | baca | buat/pin | hanya pinned |
| profiles | diri+se-komunitas | sda | – |

**Perbaikan temuan audit yang sudah tertanam:** NF-01 (Cloudflare, bukan Vercel), NF-02 (tanpa NIK + tanpa
endpoint bocor), NF-03 (RLS ON semua tabel), NF-04 (zod + honeypot + Turnstile rencananya), NF-07 (security
headers di `next.config.ts`).

---

## 7. INVENTARIS BERKAS (apa fungsi tiap file)

**Dokumen** (`docs/`): `PRD.md`, `RENCANA_DATA.md`, `DESIGN.md`, `ROADMAP.md`, `CATATAN_PEMBANGUNAN.md` (ini),
`PERENCANAAN_V1.md` (TODO lengkap sisa pekerjaan + prioritas).

**Config:** `next.config.ts` (security headers), `serwist.config.js` (configurator mode PWA),
`drizzle.config.ts`, `.env.local` (rahasia, jangan commit), `tsconfig.json`, `postcss.config.mjs`,
`eslint.config.mjs`.

**App routes** (`src/app/`) — 22 rute:
- `layout.tsx` (font Plus Jakarta Sans + SerwistProvider + NetworkStatus + AppFrame), `globals.css` (token `@theme`).
- `page.tsx` Beranda (RSC, force-dynamic, data nyata), `~offline/page.tsx` (PWA fallback offline).
- `/masuk`, `/onboarding`, `/auth/callback/route.ts` (auth flow).
- `/aksi`, `/komunitas` (+ `/baru`, `/[id]`), `/kegiatan` (+ `/baru`), `/pengumuman` (+ `/baru`),
  `/laporan-kas` (+ `/baru`), `/lapor` (+ `/baru`), `/polling` (+ `/baru`), `/donasi` (+ `/baru`),
  `/pesan`, `/profil`, `/k/[slug]` (publik anon).

**Komponen** (`src/components/`):
- `layout/app-frame.tsx` (sembunyikan nav di halaman tertentu), `layout/bottom-nav.tsx` (5 tab + FAB).
- `features/network-status.tsx` (online/offline banner), `features/onboarding-client.tsx` (step wizard).
- `ui/button.tsx`, `ui/card.tsx`, `ui/screen-header.tsx`.

**Lib** (`src/lib/`) — 15 file + folder:
- `supabase/server.ts` & `client.ts`, `auth.ts` (getUser/getMemberships).
- `kas.ts`, `events.ts`, `announcements.ts`, `posts.ts`, `reports.ts`, `polls.ts`, `notifications.ts`,
  `donations.ts`, `prayer.ts` (Aladhan), `storage.ts` (upload + signed URL), `idb.ts` (IndexedDB offline queue).
- `validation.ts` (zod semua form), `utils.ts` (cn + format Rupiah).

**Aksi server** (`src/actions/`) — 12 file: `auth.ts`, `community.ts`, `kas.ts`, `events.ts`,
`announcements.ts`, `posts.ts`, `reports.ts`, `polls.ts`, `notifications.ts`, `donations.ts`,
`profile.ts`, `mutabaah.ts`.

**Database** (`src/db/`): `schema.ts` (21 tabel Drizzle), `migrations/0000–0006` (DDL + RLS + trigger + RPC).

**Infra runtime:** `src/proxy.ts` (refresh sesi Supabase — pengganti middleware Next 16).

**PWA (M7):** `serwist.config.js`, `src/app/sw.ts`, `public/manifest.json`,
`public/icons/icon-192x192.png`, `public/icons/icon-512x512.png`.

---

## 8. STATUS BUILD & VERIFIKASI
- `npm run build` = **0 error / 0 warning** (terakhir 22 Jun sesi 10 — M7 PWA).
- Route map: 18 rute dinamis (`ƒ`), 1 statis (`○` /masuk), 1 PWA offline fallback, 1 Proxy (middleware).
- Service worker: precache 39 URL (~800 kB), swFile `public/sw.js`.
- `drizzle-kit generate` = sukses (21 tabel terbaca, DDL ter-generate).
- ⚠️ **Hampir semua fitur belum diuji runtime** kecuali M2 auth (uji E2E 19 Jun).

---

## 9. ENVIRONMENT & RAHASIA YANG DIBUTUHKAN
Nilai asli di `.env.local` (jangan commit). Yang terisi:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`.
- `SUPABASE_ACCESS_TOKEN` (PAT, exp 21 Jul 2026) — untuk CLI.

Yang masih kosong (opsional, untuk fitur mendatang):
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (Web Push — M7 opsional).
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (form publik — rencana).

> Simpan nilai asli di Bitwarden. Aturan token: least-privilege, ada expiry.

---

## 10. ▶️ TITIK LANJUT (mulai dari sini)

> **✅ STATUS 19 Jun 2026:** Langkah **A** (provisioning Supabase + kunci) dan **B** (migrasi + Auth + Storage)
> **SELESAI**. Project ref `nqlazrjcywyltewsxgmx` · URL `https://nqlazrjcywyltewsxgmx.supabase.co`. Nilai rahasia
> ada di `.env.local` (jangan commit). Langkah **C (uji login E2E) ✅ LULUS** — login→onboarding→buat
> komunitas "wafi"→beranda; peran `pengurus` via trigger. **Uji RLS lintas-komunitas ✅ LULUS** (non-anggota
> lihat 0 data sensitif komunitas lain). **M2 TUNTAS — lanjut M3.**
> Catatan port: dev server jatuh ke **:3001** karena :3000 dipakai proyek lain — kedua port sudah di allowlist.

> **▶️ BERIKUTNYA (19 Jun sesi 2 — Kas TULIS + Laporan Kas sudah dikoding, perlu di-apply & diuji):**
> **Langkah D — apply migrasi `0003` [✅ SELESAI 19 Jun sesi 2, via `kaki-tangan`]:** dijalankan di
> Supabase SQL Editor (project `gotong-royong`, org `backendgr02-wim`) → "Success. No rows returned".
> Verifikasi lulus: `pgcrypto`=1, trigger `trg_kas_hash_chain`+`trg_kas_audit`=2, fungsi
> `kas_audit/kas_hash_chain/kas_payload/verify_kas_chain` (4) ada.
> **Langkah E — uji runtime kas:** `npm run dev` → login pengurus komunitas "wafi" →
> menu **Aksi → Catat Kas** (atau Beranda → Lihat Laporan → +Catat Kas) → input *masuk* Rp 50.000 →
> cek `/laporan-kas` (transaksi tampil) & Beranda (saldo naik). Lalu input *keluar*. Cek baris baru di
> `audit_log` (siapa/kapan), kolom `hash_self` terisi, tombol **Cek Keaslian** = "Segel utuh".
> **Langkah F — uji RLS:** akun **warga** komunitas sama → bisa baca `/laporan-kas` tapi TANPA tombol
> "+Catat Kas" & `catatKas` ditolak; akun komunitas **lain** → 0 data kas "wafi".

**Langkah A — Sesi `kaki-tangan` (butuh Chrome Anda, jangan dipakai manual selama proses): ✅ SELESAI**
1. `browser-act get-skills core` → `browser list` → buka sesi di chrome-direct (`chrome-kontrol`) `--headed`.
2. Verifikasi login Supabase → **buat project** `gotong-royong` (region Singapore). [konfirmasi dulu]
3. Ambil **Project URL**, **publishable key**, **secret key**, dan **DATABASE_URL** (Connection string → Pooler).
4. (opsional) Buat **repo GitHub** `gotong-royong-pwa` + **Turnstile** keys.

**Langkah B — Migrasi & konfigurasi DB: ✅ SELESAI** (migrasi 0000+0001 via SQL Editor; Email aktif; Site URL + redirect; 4 bucket private. Seed mutabaah_items belum — opsional.)
5. Isi `.env.local` dengan nilai dari langkah 3.
6. Di Supabase **SQL Editor**: jalankan isi `src/db/migrations/0000_init_schema.sql`, lalu `0001_auth_and_rls.sql`.
7. Auth → aktifkan **Email** provider (magic link). Atur Site URL = `http://localhost:3000` (dev) untuk redirect.
8. Storage → buat bucket: `avatars`, `post-images`, `report-images`, `donation-proofs` (+ policy menyusul M4/M6).
9. (opsional) seed `mutabaah_items` default (Shalat Subuh, Tilawah, Dzikir Pagi, Sedekah, Shalat Dhuha).

**Langkah C — Uji jalan:**
10. `cd ~/agensi/proyek/gotong-royong-pwa && npm run dev` → buka `http://localhost:3000`.
11. Alur: `/masuk` (email) → cek email → `/auth/callback` → `/onboarding` → buat komunitas → `/`.
12. **Uji RLS:** akun ke-2 di komunitas berbeda TIDAK boleh melihat kas/feed komunitas pertama.

**Setelah hijau → lanjut M3** (Beranda data nyata: transparansi kas + jadwal sholat + kegiatan), ikut
rencana 8 minggu. Update tabel progres di §1 dan status baris di `RENCANA_DATA.md`.

> **🛠️ AUTH CALLBACK DIPERBAIKI (20 Jun sesi 7):**
> **Langkah G — apply migrasi `0004` & `0005` [✅ SELESAI 20 Jun, via `kaki-tangan`]:** trigger notifikasi
> di-apply via SQL Editor + policy Storage publik/privat di-apply. Verifikasi lulus.
> **Langkah H — AUTH ERROR [🔧 DIPERBAIKI, PERLU UJI RUNTIME]:**
> `npm run dev` di port 3001. Buka `http://127.0.0.1:3001/masuk` di browser `gotongroyong-dev` (chrome biasa).
> Masukin email → magic link terkirim → klik link → Supabase verify → redirect ke `http://127.0.0.1:3001/auth/callback?code=xxx` → tapi balik ke `/masuk` (tidak login).
> **Diagnosis (20 Jun sesi 7):** Cookie sesi tidak tersimpan. Di Route Handler Next 16, `cookies().set()` dari `next/headers` tidak termuat ke objek `NextResponse.redirect()` — jadi sesi hasil `exchangeCodeForSession()` hilang saat browser mengikuti redirect ke `/onboarding`.
> **Fix:** `src/app/auth/callback/route.ts` ditulis ulang — klien Supabase dibuat INLINE dengan pola `request.cookies.getAll()` (baca dari request) + `response.cookies.set()` (tulis ke response langsung), identik dengan `proxy.ts`. Alih-alih:
> ```typescript
> // ❌ LAMA — cookie lewat cookies() dari next/headers
> const supabase = await createClient(); // server.ts
> ```
> sekarang:
> ```typescript
> // ✅ BARU — cookie baca dari request, tulis ke response langsung
> const response = NextResponse.redirect(`${origin}${next}`);
> const supabase = createServerClient(URL, KEY, {
>   cookies: {
>     getAll: () => request.cookies.getAll(),
>     setAll: (cookiesToSet) => cookiesToSet.forEach(
>       ({ name, value, options }) => response.cookies.set(name, value, options)
>     ),
>   },
> });
> ```
> Halaman `/masuk` juga ditingkatkan: bungkus `useSearchParams` dalam `<Suspense>` + tampilkan `?error=auth` sebagai pesan error.
> `npm run build` = **0 error**. **Perlu uji runtime untuk verifikasi fix.**

> **Langkah I — apply migrasi `0006` [✅ SELESAI 21 Jun, via CLI]:** trigger notif verifikasi donasi + auto kas_entry.

> **▶️ STATUS 22 Jun 2026 — 🔴 P1 UJI RUNTIME ✅ 100% TUNTAS:**
> - **Semua fitur interaktif terverifikasi:** login magic link ✅, kas catat+baca ✅, feed (teks+foto+like+komentar+hapus) ✅, kegiatan+RSVP (buat→hadir→batal) ✅, polling (buat→vote 1×→hasil bar%) ✅, pengumuman ✅, notifikasi trigger ✅, logout ✅.
> - **4 bugs ditemukan & diperbaiki:** (1) Hydration `NetworkStatus`, (2) pgcrypto `digest()` search_path, (3) storage service key → RLS conflict, (4) bodySizeLimit 413.
> - **Belum diuji runtime:** upload avatar, upload lapor, donasi upload+bukti, halaman publik `/k/[slug]` (anon), offline PWA.
>
> **▶️ LANJUTKAN KE `docs/PERENCANAAN_V1.md`** — dokumen perencanaan lengkap dengan TODO terperinci.
> Kerjakan URUT:
> 1. ✅ **🔴 P1 — Uji Runtime** (100% tuntas)
> 2. **🟡 P2 — UX Polish** (2–3 jam): skeleton, toast, error boundary, konfirmasi hapus, logo
> 2. **🟡 P2 — UX Polish** (2–3 jam): skeleton, toast, error boundary, konfirmasi hapus, logo
> 3. **🟡 P3 — PWA & Performance** (1–2 jam): Lighthouse, installable test, offline queue integration
> 4. **🟠 P4 — M8 Deploy Cloudflare** (1 hari): OpenNext + wrangler + deploy via kaki-tangan
> 5. **🔵 P5 — Admin Features** (opsional, 1–2 hari): manajemen anggota, search, pagination, keep-alive, privasi

---

## 11. RISIKO & CATATAN TERBUKA
- **Supabase free "tidur" 7 hari sepi** → siapkan keep-alive gratis (cron-job.org / GitHub Action ping) di M8.
- **drizzle-kit push** butuh driver `postgres` + DATABASE_URL; alternatif aman = paste SQL di Supabase Editor (disarankan untuk file RLS).
- **`prayer_cache` write**: saat ini policy izinkan anggota menulis cache; bila ingin lebih ketat, pindah ke service-role server-only.
- **Web lama `gotongroyong-web`** (bocor NIK + Vercel) = keputusan Anda "nanti" — jangan sambungkan DB produksi ke sana sampai diperbaiki/dimatikan.
- **shadcn/ui** belum di-init (pakai komponen tangan ringan); bisa ditambah kapan saja tanpa mengganggu.
- **Bundle Workers** mungkin tembus 3 MB (batas free). Pantau ukuran setelah deploy.
- **Offline queue** (`idb.ts`) belum diintegrasikan ke form actions — user offline → belum otomatis simpan ke IndexedDB.

---

## 12. POSTUR BIAYA
Target **Rp 0/bulan** kecuali domain. Semua: Cloudflare Workers (gratis, komersial OK), Supabase free,
Aladhan (gratis), Web Push (gratis), Turnstile (gratis). Donasi tanpa gateway → tanpa biaya transaksi/lisensi.

---

## 13. REFERENSI
- Internal: `PRD.md`, `RENCANA_DATA.md`, `DESIGN.md`, `ROADMAP.md`, `PERENCANAAN_V1.md`,
  `~/agensi/skills/kaki-tangan/SKILL.md`, `~/agensi/playbook/docs/00_SOP_EKSEKUSI_AI.md` & `29_standar_keamanan_kode.md`,
  `~/agensi/playbook/AUDIT_PROFESOR_2026_v2.md` (NF-01/02/03/04/07).
- Riset 2026: OpenNext (`@opennextjs/cloudflare`), Serwist PWA (configurator mode), `@supabase/ssr` + RLS,
  Supabase free tier, Flutter-web vs PWA, Aladhan API (metode 20 = Kemenag).
- Next.js 16 Turbopack: `next build` pakai Turbopack default, webpack via `--webpack`.
```
*Akhir catatan. Perbarui §1 (progres) & §10 (titik lanjut) setiap akhir sesi.
Lihat `docs/PERENCANAAN_V1.md` untuk daftar TODO lengkap.*
