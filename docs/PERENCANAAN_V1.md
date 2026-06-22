# 📋 PERENCANAAN V1 — Gotong Royong PWA
**Jembatan antar sesi AI** · 22 Jun 2026 · M1–M7 ✅ selesai · M8 🟠 direncanakan

> Dokumen ini adalah **peta jalan untuk sesi AI berikutnya**. Kalau kamu (AI) membaca ini,
> berarti sesi sebelumnya menulis status proyek di sini supaya kamu bisa lanjut tanpa
> kehilangan konteks. **Baca juga** `docs/CATATAN_PEMBANGUNAN.md` (build log),
> `docs/PRD.md` (kebutuhan), `AGENTS.md` (aturan keras).
>
> **Update 22 Jun sesi 11:** P1 uji runtime >80% selesai. Dua bug ditemukan & difix (NetworkStatus hydration + pgcrypto search_path). M7 sudah di-commit dari sesi sebelumnya.

---

## 0. TL;DR — APA YANG HARUS DIKERJAKAN

```
┌──────────────────────────────────────────────────────────────┐
│ PRIORITAS (kerjakan URUT):                                    │
│                                                              │
│ 🔴 P1 — UJI RUNTIME (>80% ✅)                               │
│   M7 sudah di-commit. Uji baca & tulis sebagian besar        │
│   fitur berfungsi (kas, feed, post, like, komentar). Sisa:   │
│   auth callback, upload foto, RSVP, polling vote, notif.     │
│                                                              │
│ 🟡 P2 — UX POLISH (2-3 jam)                                 │
│   Skeleton, toast, error boundary, konfirmasi hapus, logo    │
│                                                              │
│ 🟡 P3 — PWA & PERFORMANCE (1-2 jam)                         │
│   Lighthouse, installable test, offline queue integration    │
│                                                              │
│ 🟠 P4 — M8 DEPLOY CLOUDFLARE (1 hari)                       │
│   OpenNext + wrangler + deploy via kaki-tangan               │
│                                                              │
│ 🔵 P5 — ADMIN FEATURES (opsional, 1-2 hari)                 │
│   Manajemen anggota, search, pagination, keep-alive, privasi │
└──────────────────────────────────────────────────────────────┘
```

---

## 1. ✅ SUDAH SELESAI (dari sesi sebelumnya)

### M1 — Fondasi ✅ 100%
- Seluruh dokumen perencanaan (`PRD.md`, `RENCANA_DATA.md`, `DESIGN.md`, `ROADMAP.md`, `CATATAN_PEMBANGUNAN.md`)
- Scaffold Next.js 16.2.9 + Tailwind v4 + TypeScript strict
- Design system: token `@theme` warna hijau (`#10B981`), font Plus Jakarta Sans
- Skema Drizzle: **21 tabel** (`src/db/schema.ts`)
- Migrasi SQL: **6 file** (`0000`–`0006`) — DDL + RLS + trigger + fungsi + policy Storage
- Supabase **provisioned & live**: project `gotong-royong` (ref `nqlazrjcywyltewsxgmx`, org `backendgr02-wim`, Singapore)
- `.env.local` **TERISI** (URL + publishable key + secret key + DATABASE_URL + PAT)
- Supabase CLI terpasang, login, linked → scripts `db:query/migrate/pull/dump`
- Git remote: push ke `backendgr02-wim/gotong-royong-pwa` (Private)

### M2 — Auth & Onboarding ✅ TUNTAS & TERUJI E2E
- `/masuk` — form login email OTP/magic link + `?error=auth` handling
- `/onboarding` — buat/gabung komunitas + pilih peran
- `/auth/callback/route.ts` — tukar code → sesi (**FIX**: cookie inline pattern, bukan `cookies()` dari `next/headers`)
- `src/actions/auth.ts` — signIn + signOut
- `src/actions/community.ts` — createCommunity + joinCommunity
- `src/lib/auth.ts` — getUser, getActiveCommunity, getMemberships
- `src/lib/supabase/server.ts` + `client.ts`
- `src/proxy.ts` — refresh sesi (pengganti middleware Next 16)
- **UJI E2E LULUS** (19 Jun): login → onboarding → buat komunitas "wafi" → beranda
- **UJI RLS LINTAS-KOMUNITAS LULUS**: non-anggota = 0 data sensitif

### M3 — Beranda & Kas ✅ kode selesai, perlu uji runtime
- Beranda: header, kas (saldo/pemasukan/keluar), jadwal sholat Aladhan, mutabaah harian, kegiatan mendatang, pengumuman pinned
- `src/lib/kas.ts` — getKasSummary, getKasEntries (pondasi `getActiveCommunity`)
- `src/lib/prayer.ts` — Aladhan API (metode Kemenag RI)
- `src/lib/events.ts` — getUpcomingEvents (+ peserta count + RSVP status saya)
- `src/lib/announcements.ts` — getPinnedAnnouncement, getAnnouncements
- `src/actions/kas.ts` — catatKas (pengurus, zod `kasSchema`)
- `/laporan-kas` — ringkasan + rincian + filter bulan + **Cetak/PDF** (`window.print()`) + **Cek Keaslian** (rantai hash)
- `/laporan-kas/baru` — form catat kas
- Migrasi `0003_kas_chain_audit.sql` **✅ di-apply** via SQL Editor (19 Jun sesi 2)

### M4 — Feed Komunitas ✅ kode selesai, perlu uji runtime
- `src/lib/posts.ts` — getFeed, getPost
- `src/actions/posts.ts` — buatPost (+honeypot), toggleSuka, tambahKomentar, hapusPost
- `/komunitas` — feed nyata (suka/komentar/tulis)
- `/komunitas/baru` — form post
- `/komunitas/[id]` — detail post + komentar `KomentarForm` + hapus
- Upload foto postingan ✅ (bucket publik `post-images`)

### M5 — Buat Aksi ✅ kode selesai, perlu uji runtime
- **Lapor RT/RW**: `lib/reports.ts`, `actions/reports.ts` (buatLapor + honeypot + GPS opsional, ubahStatusLapor pengurus)
- **Lapor**: `/lapor`, `/lapor/baru` (LaporForm GPS, foto bucket privat `report-images`, signed URL 30h)
- **Polling**: `lib/polls.ts`, `actions/polls.ts` (buatPolling pengurus, vote 1×/user + tolak tenggat)
- **Polling**: `/polling`, `/polling/baru` (opsi dinamis, hasil bar%)
- **Pesan/notifikasi**: `lib/notifications.ts` (getNotifications + countUnread), `actions/notifications.ts` (tandaiDibaca + buka link internal, tandaiSemuaDibaca)
- **Pesan**: `/pesan` inbox + badge bell di Beranda
- Menu Aksi tersambung (12 item, disaring peran)
- Migrasi `0004_notification_triggers.sql` **✅ di-apply** (trigger notifikasi)
- Migrasi `0005_storage_policies.sql` **✅ di-apply** (5 policy, bucket publik/privat)

### M6 — Donasi & Upload ✅ kode selesai, perlu uji runtime
- **Donasi/Iuran**: `lib/donations.ts`, `actions/donations.ts` (upload bukti, rekening tujuan)
- `/donasi` (riwayat saya) + `/donasi/baru` (form + file input + preview)
- Upload bukti → bucket privat `donation-proofs` (signed URL 7 hari)
- Migrasi `0006` **✅ di-apply** via CLI (trigger notif verifikasi + auto kas_entry)
- **Upload avatar** → bucket publik `avatars` (upsert, `AvatarForm`)
- **Upload foto postingan** → bucket publik `post-images`
- **Upload foto laporan** → bucket privat `report-images` (signed URL 30 hari)
- Profil "Donasi Saya" link
- `src/lib/storage.ts` — fungsi upload + signed URL

### M7 — PWA Offline ✅ kode + build selesai, **SUDAH di-commit & di-push**
- `serwist.config.js` — configurator mode (`require("@serwist/next/config")`, CommonJS)
- `src/app/sw.ts` — service worker (precache, navigation preload, offline fallback, runtimeCaching)
- `public/manifest.json` — standalone, portrait, `#059669`
- `public/icons/icon-192x192.png` + `icon-512x512.png`
- `src/app/~offline/page.tsx` — offline page (client component, reload button)
- `src/lib/idb.ts` — IndexedDB queue (queueAction, getPendingActions, processQueue, dll)
- `src/components/features/network-status.tsx` — banner online/offline
- `src/app/layout.tsx` — SerwistProvider + PWA metadata + viewport
- `package.json` scripts: `dev` = `concurrently 'serwist build --watch' 'next dev -p 6789'`
- `npm run build` = 0 error, SW precache 39 URL (~800 kB)

**File yang berubah (M7, BELUM di-commit):**
```
M .gitignore          (tambah public/sw*, public/swe-worker*)
M eslint.config.mjs   (ignore public/sw*)
M next.config.ts      (config bersih, tanpa serwist wrapper)
M package-lock.json   (serwist/cli, esbuild, concurrently)
M package.json        (scripts + devDeps)
M src/app/layout.tsx  (SerwistProvider, NetworkStatus, metadata PWA)
M tsconfig.json       (tambah path serwist)
?? public/icons/
?? public/manifest.json
?? serwist.config.js
?? src/app/sw.ts
?? src/app/~offline/
?? src/components/features/network-status.tsx
?? src/lib/idb.ts
```

---

## 2. 🔴 P1 — UJI RUNTIME (prioritas TERTINGGI, 4–6 jam)

> Semua fitur lolos `npm run build` (0 error) tapi **BELUM PERNAH diuji runtime**
> kecuali M2. Ini bottleneck terbesar proyek.

### Langkah 1.1 — Commit M7 PWA
```bash
git add -A && git commit -m "feat: M7 PWA offline — Serwist, IndexedDB queue, offline page, manifest"
git push
```

### Langkah 1.2 — Uji Auth Callback (fix sesi 7)
1. `npm run dev` (port 6789)
2. Buka `http://localhost:6789/masuk`
3. Masukin email → magic link terkirim
4. Klik link → Supabase verify → redirect ke `/auth/callback?code=xxx`
5. Cookie tersimpan? → redirect ke `/onboarding` (bukan balik ke `/masuk`)
6. Kalau gagal: cek console error, cek `.env.local` masih valid

### Langkah 1.3 — Uji Kas
1. Login sebagai **pengurus** komunitas
2. Menu Aksi → **Catat Kas** → input *masuk* Rp 50.000 → submit
3. Buka `/laporan-kas` → transaksi tampil
4. Beranda → saldo naik Rp 50.000
5. Tombol **Cek Keaslian** → "Segel utuh"
6. Catat kas *keluar* → cek rantai hash berantai

### Langkah 1.4 — Uji Upload Foto
1. **Avatar**: Profil → ganti foto → pilih file → terupload?
2. **Postingan**: Komunitas → Buat Postingan → teks + foto → muncul di feed?
3. **Lapor**: Lapor RT/RW → foto + kategori + (opsional GPS) → muncul di daftar lapor?
4. **Donasi**: Donasi → upload bukti transfer → status "menunggu"?

### Langkah 1.5 — Uji Feed
1. Buat post (teks + foto) → muncul di `/komunitas`
2. Suka post → hitung naik?
3. Komentar post → muncul di detail `/komunitas/[id]`?
4. Hapus post (sebagai author) → hilang dari feed?

### Langkah 1.6 — Uji Kegiatan & RSVP
1. Pengurus buat kegiatan di `/kegiatan/baru` (WIB → UTC konversi benar?)
2. Warga lihat di `/kegiatan` → klik "Saya Hadir"
3. Hitung peserta naik
4. Klik lagi → batal RSVP

### Langkah 1.7 — Uji Lapor
1. Warga lapor (foto + kategori + GPS) di `/lapor/baru`
2. Pengurus buka `/lapor` → ubah status (baru → diproses → selesai)
3. Pelapor dapat notif? Cek `/pesan`

### Langkah 1.8 — Uji Polling
1. Pengurus buat polling dengan 3 opsi + tenggat waktu
2. Warga vote 1× → hasil bar% tampil
3. Coba vote lagi → ditolak (1 suara/user)

### Langkah 1.9 — Uji Donasi
1. Warga donasi → upload bukti transfer
2. Donasi muncul dengan status "menunggu"
3. Pengurus verifikasi → status jadi "terverifikasi"
4. Kas entries otomatis bertambah

### Langkah 1.10 — Uji Notifikasi
1. Pengurus buat pengumuman
2. Cek `/pesan` di akun warga → notif masuk?
3. Badge bell di Beranda berubah?
4. Trigger `0004` jalan?

### Langkah 1.11 — Uji Halaman Publik `/k/[slug]`
1. Buka di tab incognito (tanpa login): `http://localhost:6789/k/[slug-komunitas]`
2. Ringkasan kas muncul? (RPC `public_kas_summary`)
3. Jadwal sholat, kegiatan, kontak muncul?
4. **TIDAK** ada PII / data warga bocor

### Langkah 1.12 — Uji Offline
1. DevTools → Network → offline
2. Navigasi ke halaman yang sudah dikunjungi → muncul `/~offline`?
3. Kembalikan koneksi → banner "Koneksi tersambung kembali"

---

## 3. 🟡 P2 — UX POLISH (2–3 jam, kerjakan SETELAH P1)

| # | Item | Lokasi | Detail |
|---|------|--------|--------|
| 1 | **Loading skeleton** | Semua halaman RSC | Suspense fallback + shimmer (DESIGN.md §4) |
| 2 | **Toast notifikasi** | Setelah submit form | Feedback sukses/gagal (skrg redirect doang) |
| 3 | **Error boundary** | Root + tiap halaman data | Kalau RLS nolak → pesan ramah, bukan crash |
| 4 | **Konfirmasi hapus** | Post, lapor | Confirm dialog sebelum destructive action |
| 5 | **Form validation UI** | Semua form | Zod error ditampilkan di field (bkn console) |
| 6 | **Logo/icon daun SVG** | `public/` | Ganti icon generik dengan logo hijau "daun" |

---

## 4. 🟡 P3 — PWA & PERFORMANCE (1–2 jam, SETELAH P2)

| # | Item | Detail |
|---|------|--------|
| 1 | **Lighthouse audit** | Target LCP < 3s, TBT < 200ms, CLS < 0.1, PWA score ≥ 90 |
| 2 | **Test installable** | Chrome DevTools → Application → Manifest → "PWA installable"? |
| 3 | **Cache strategy review** | defaultCache Serwist optimal untuk RSC + Server Action? |
| 4 | **Offline queue integration** | Hubungkan `src/lib/idb.ts` ke form actions. User offline → simpan ke IndexedDB → replay saat online via `processQueue()` |
| 5 | **Animasi transisi** | `motion` spring lembut antar halaman |

---

## 5. 🟠 P4 — M8 DEPLOY CLOUDFLARE WORKERS (1 hari, SETELAH semua hijau)

### Prasyarat
- [ ] P1 uji runtime LULUS semua
- [ ] Akun Cloudflare aktif (via `kaki-tangan`)
- [ ] Nama Worker: `gotong-royong` (atau sesuai domain nanti)

### Langkah 5.1 — Install packages
```bash
npm install @opennextjs/cloudflare@latest
npm install -D wrangler@latest
```

### Langkah 5.2 — Buat `wrangler.jsonc`
```jsonc
{
  "name": "gotong-royong",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-06-22",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets"
  }
}
```

### Langkah 5.3 — Buat `open-next.config.ts`
```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

export default defineCloudflareConfig({});
```

### Langkah 5.4 — Update `package.json`
```json
"scripts": {
  "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
  "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
}
```

### Langkah 5.5 — Buat `public/_headers`
```
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
```

### Langkah 5.6 — Update `.gitignore`
Tambah:
```
.open-next/
.dev.vars
```

### Langkah 5.7 — Buat `.dev.vars`
```
NEXTJS_ENV=development
```

### Langkah 5.8 — Deploy via `kaki-tangan`
1. Load skill `kaki-tangan` + skill `browser-act`
2. Buka chrome-direct (`chrome-kontrol`) `--headed`
3. Login ke Cloudflare dashboard (verifikasi akun)
4. `wrangler deploy` ATAU buat manual di dashboard
5. Set **environment variables** (dashboard):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
6. Set **secrets** (dashboard, tidak bisa dibaca balik):
   - `SUPABASE_SECRET_KEY`
7. Set **build variables** (kalau pakai Workers Builds CI/CD):
   - Semua env di atas + `NEXTJS_ENV=production`
8. Update **Supabase Auth → Site URL** → include URL Workers
9. Test production URL

### ⚠️ Catatan M8
| Risiko | Mitigasi |
|--------|----------|
| Worker size limit (3 MB free) | Bundle gzip bisa tembus → perlu paid plan ($5/bln) atau optimasi |
| Serwist SW di Workers | `public/sw.js` harus terdeploy sebagai aset statis |
| Supabase free "tidur" 7 hari | Keep-alive (cron-job.org / GitHub Action ping tiap 10 menit) |
| `proxy.ts` (middleware) kompatibilitas | OpenNext dukung middleware ✅ |

---

## 6. 🔵 P5 — ADMIN & POWER FEATURES (opsional, 1–2 hari)

Hanya kerjakan kalau P1–P4 sudah hijau semua:

| # | Fitur | Detail |
|---|-------|--------|
| 1 | **Manajemen anggota** | Pengurus lihat daftar anggota, promosi/pecat |
| 2 | **Edit/hapus konten** | Pengurus hapus postingan/laporan/poll kadaluwarsa |
| 3 | **Search global** | Kolom search di beranda (masih statis) |
| 4 | **Pagination feed** | Infinite scroll / load more (feed makin panjang) |
| 5 | **Keep-alive Supabase** | cron-job.org / GitHub Action ping tiap 10 menit |
| 6 | **Kebijakan privasi** | Halaman privasi + hak hapus akun (UU PDP) |
| 7 | **Flash RAM aktivitas** | Animasi transisi antar halaman |

---

## 7. 🗺️ PETA FILE LENGKAP (untuk AI sesi berikutnya)

### Routes (`src/app/`) — 20 entries
```
/~offline/page.tsx        — Offline fallback PWA
/aksi/page.tsx            — Menu Buat Aksi (12 item, filter peran)
/auth/callback/route.ts   — Route handler: code → sesi (FIX: cookie inline)
/donasi/page.tsx          — Riwayat donasi saya
/donasi/baru/page.tsx     — Form donasi + upload bukti
/k/[slug]/page.tsx        — Halaman publik komunitas (anon, force-dynamic)
/kegiatan/page.tsx        — Daftar kegiatan + RSVP toggle
/kegiatan/baru/page.tsx   — Form buat kegiatan (pengurus)
/komunitas/page.tsx       — Feed komunitas
/komunitas/baru/page.tsx  — Form buat post
/komunitas/[id]/page.tsx  — Detail post + komentar
/lapor/page.tsx           — Daftar laporan
/lapor/baru/page.tsx      — Form lapor + GPS + foto
/laporan-kas/page.tsx     — Laporan kas ringkasan + rincian + filter + cetak
/laporan-kas/baru/page.tsx — Form catat kas (pengurus)
/masuk/page.tsx           — Login email OTP
/onboarding/page.tsx      — Buat/gabung komunitas
/pengumuman/page.tsx      — Daftar pengumuman
/pengumuman/baru/page.tsx — Form buat pengumuman (pengurus)
/pesan/page.tsx           — Inbox notifikasi
/polling/page.tsx         — Daftar polling + hasil
/polling/baru/page.tsx    — Form buat polling (pengurus)
/profil/page.tsx          — Profil + edit + keluar
```

### Server Actions (`src/actions/`) — 12 files
```
announcements.ts  — buatPengumuman
auth.ts           — signIn, signOut
community.ts      — createCommunity, joinCommunity
donations.ts      — buatDonasi, verifikasiDonasi
events.ts         — buatKegiatan, toggleRsvp
kas.ts            — catatKas
mutabaah.ts       — toggleMutabaah
notifications.ts  — tandaiDibaca, tandaiSemuaDibaca
polls.ts          — buatPolling, vote
posts.ts          — buatPost, toggleSuka, tambahKomentar, hapusPost
profile.ts        — simpanProfil, simpanAvatar
reports.ts        — buatLapor, ubahStatusLapor
```

### Library (`src/lib/`) — 15 files + folder
```
announcements.ts  — getPinnedAnnouncement, getAnnouncements
auth.ts           — getUser, getActiveCommunity, getMemberships
donations.ts      — getDonations
events.ts         — getUpcomingEvents
idb.ts            — queueAction, getPendingActions, processQueue (PWA offline)
kas.ts            — getKasSummary, getKasEntries
notifications.ts  — getNotifications, countUnread
polls.ts          — getPolls, getPollResults
posts.ts          — getFeed, getPost
prayer.ts         — getPrayerTimes (Aladhan API)
reports.ts        — getReports
storage.ts        — uploadAvatar, uploadPostImage, uploadReportImage, uploadDonationProof, getSignedUrl
supabase/         — server.ts, client.ts
utils.ts          — cn, formatRupiah
validation.ts     — semua schema zod (kasSchema, postSchema, dll)
```

### Database Migrations (`src/db/migrations/`) — 6 file
```
0000_init_schema.sql                    — 21 tabel DDL
0001_auth_and_rls.sql                   — 54 policy RLS + helper functions
0002_seed_mutabaah.sql                  — Seed mutabaah_items default
0003_kas_chain_audit.sql                — Rantai hash SHA-256 + audit trigger
0004_notification_triggers.sql          — Trigger notif (pengumuman + status laporan)
0005_storage_policies.sql               — 5 policy storage.objects
0006_donation_notification_triggers.sql — Trigger verifikasi donasi + auto kas_entry
```

---

## 8. 📌 STATUS TERAKHIR (22 Jun 2026)

### Lingkungan
- Next.js 16.2.9 (Turbopack default bundler — webpack-only plugin RUSAK)
- Port dev: 6789 (karena 3000 dipakai proyek lain)
- Supabase project: `gotong-royong` (ref: `nqlazrjcywyltewsxgmx`)
- Supabase CLI: login sebagai `backendgr02-wim`, linked
- Git remote: `origin` → `git@github.com:backendgr02-wim/gotong-royong-pwa.git`
- `.env.local` terisi (jangan commit)
- **M7 SUDAH di-commit & di-push** dari sesi sebelumnya

### Bug yang Ditemukan & Diperbaiki (22 Jun sesi 11)
| Bug | File | Fix |
|-----|------|-----|
| Hydration error `NetworkStatus` | `src/components/features/network-status.tsx:6` | Inisialisasi `useState(true)` tanpa conditional |
| `digest()` not found di trigger kas | `src/db/migrations/0007_fix_pgcrypto_search_path.sql` | search_path: `public, extensions` (pgcrypto di schema extensions) |

### Build
- `npm run build` = **0 error / 0 warning** (terakhir dijalankan 22 Jun sesi 11)
- Service worker precache: 39 URL, ~800 kB
- Lint: **0 error / 0 warning** (public/sw* di-ignore)

### P1 Uji Runtime (22 Jun sesi 11)
| Fitur | Status | Catatan |
|-------|--------|---------|
| Beranda dashboard | ✅ | Loading, saldo realtime dari kas |
| Masuk (login) | ✅ | Form magic link loading |
| Onboarding | ✅ | Pilih/gabung komunitas |
| Komunitas feed | ✅ Baca & Tulis | Post buat, like, komentar semua berfungsi |
| Profil | ✅ | Lihat + edit form profile |
| Donasi | ✅ | Riwayat + form donasi loading |
| Kegiatan | ✅ | Daftar + form buat kegiatan loading |
| Laporan Kas | ✅ Baca & Tulis | Catat kas (Rp 50.000), cek keaslian segel utuh |
| Pesan | ✅ | Inbox notifikasi loading |
| Lapor RT/RW | ✅ | Daftar + form lapor loading |
| Polling | ✅ | Daftar + form buat polling loading |
| Offline page | ✅ | Tampil dengan tombol "Coba Lagi" |
| Hydration error NetworkStatus | ✅ FIXED | `useState(true)` tanpa conditional |
| `digest()` not found di kas trigger | ✅ FIXED | search_path `public, extensions` |
| Auth callback magic link | ⏳ | Perlu email asli untuk uji |
| Upload foto (avatar/posting/lapor/donasi) | ⏳ | Perlu file input via browser |
| RSVP kegiatan | ⏳ | Perlu buat kegiatan dulu |
| Polling vote | ⏳ | Perlu buat polling dulu |
| Notifikasi realtime | ⏳ | Perlu trigger dari aksi pengurus lain |

### Akun GitHub
- Login aktif: `wimxwim` (email `wimxgooo@gmail.com`)
- Repo di bawah: `backendgr02-wim/gotong-royong-pwa` (Private)
- Git config global: `wimxwim` / `wimxgooo@gmail.com`

---

## 9. 🚀 PERINTAH CEPAT UNTUK SESI BERIKUTNYA

```bash
npm run dev          # Dev server port 6789 + serwist watch
npm run build        # Build (wajib 0 error sebelum selesai)
npm run lint         # Lint check
git status           # Cek perubahan belum di-commit
npx drizzle-kit generate --name <nama>  # Generate SQL dari perubahan schema.ts
npm run db:migrate src/db/migrations/0007_xxx.sql  # Apply migrasi via CLI
```

---

## 10. 📖 DOKUMEN REFERENSI

| Dokumen | Isi |
|---------|-----|
| `AGENTS.md` | Aturan keras proyek, Next.js 16 breaking changes, checklist |
| `docs/CATATAN_PEMBANGUNAN.md` | Build log, ADR, arsitektur, model keamanan, titik lanjut |
| `docs/PRD.md` | Kebutuhan fitur, persona, scope, kriteria sukses |
| `docs/RENCANA_DATA.md` | Alignment UI ↔ DB per layar, matriks peran RLS |
| `docs/DESIGN.md` | Token warna, tipografi, komponen, navigasi |
| `docs/ROADMAP.md` | Fitur diparkir (jangan dibangun di v1) |
| `~/agensi/skills/kaki-tangan/SKILL.md` | Cara operasi akun asli (browser chrome-direct headed) |
| `~/agensi/playbook/AUDIT_PROFESOR_2026_v2.md` | NF-01 (Vercel ToS), NF-02 (NIK bocor), NF-03 (RLS) |

---

> **Pesan untuk AI sesi berikutnya:** Kalau user bilang "lanjutkan pengerjaan yang tertunda"
> atau "lanjutkan sesi sebelumnya", kerjakan PERENCANAAN_V1.md ini secara urut dari 🔴 P1
> (Uji Runtime) sampai selesai. Jangan lompat ke P4 (Deploy) sebelum P1–P3 hijau.
>
> Setelah selesai tiap langkah, update §1 status di dokumen ini dan commit.
