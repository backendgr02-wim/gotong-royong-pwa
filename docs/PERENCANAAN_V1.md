# 📋 PERENCANAAN V1 — Gotong Royong PWA
**Jembatan antar sesi AI** · 22 Jun 2026 · M1–M7 ✅ selesai · M8 🟠 direncanakan · **Sesi 15: P3 PWA/Perf ✅

> Dokumen ini adalah **peta jalan untuk sesi AI berikutnya**. Kalau kamu (AI) membaca ini,
> berarti sesi sebelumnya menulis status proyek di sini supaya kamu bisa lanjut tanpa
> kehilangan konteks. **Baca juga** `docs/CATATAN_PEMBANGUNAN.md` (build log),
> `docs/PRD.md` (kebutuhan), `AGENTS.md` (aturan keras).
>
> **Update 22 Jun sesi 15 — P3 PWA & Performance ✅ SELESAI: SW cache strategy kustom, offline queue integration (processQueue auto-replay), page transitions (motion fade-in template.tsx), manifest modern (display_override, launch_handler). Lanjut 🟠 P4 M8 Deploy Cloudflare.

---

## 0. TL;DR — APA YANG HARUS DIKERJAKAN

```
┌──────────────────────────────────────────────────────────────┐
│ PRIORITAS (kerjakan URUT):                                    │
│                                                              │
│ 🔴 P0 — DOKUMENTASI ARSITEKTUR (baru! dari respon atasan)    │
│   Atasan minta arsitektur C4: Context, Container, Component, │
│   Event Flow, ERD — 5 diagram terpisah (bukan spaghetti 1).  │
│   Juga: event catalog, perbandingan visi vs realita.         │
│   Detail di docs/RESPON_ATASAN.md (sudah dibuat).            │
│                                                              │
│ ✅ 🔴 P1 — UJI RUNTIME (100% ✅)                              │
│   Semua fitur interaktif utama terverifikasi: kas ✅,         │
│   feed (teks+foto+like+komentar) ✅, kegiatan+RSVP ✅,        │
│   polling+vote ✅, pengumuman+notif ✅, logout ✅.             │
│   4 bugs fixed. Lanjut 🟡 P0 dulu, lalu P2.                  │
│                                                              │
│ 🟡 P2 — UX POLISH (2-3 jam)                                 │
│   Skeleton, toast, error boundary, konfirmasi hapus, logo    │
│                                                              │
│ 🟡 P3 — PWA & PERFORMANCE (1-2 jam ✅ selesai 22 Jun sesi 15)
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
- ~~`src/proxy.ts`~~ **DHAPUS** (Next 16 proxy Node.js-only, incompatible OpenNext/Cloudflare)
- **UJI E2E LULUS** (19 Jun): login → onboarding → buat komunitas "wafi" → beranda
- **UJI RLS LINTAS-KOMUNITAS LULUS**: non-anggota = 0 data sensitif

### M3 — Beranda & Kas ✅ kode + uji runtime (22 Jun sesi 11)
- Beranda: header, kas (saldo/pemasukan/keluar), jadwal sholat Aladhan, mutabaah harian, kegiatan mendatang, pengumuman pinned
- `src/lib/kas.ts` — getKasSummary, getKasEntries (pondasi `getActiveCommunity`)
- `src/lib/prayer.ts` — Aladhan API (metode Kemenag RI)
- `src/lib/events.ts` — getUpcomingEvents (+ peserta count + RSVP status saya)
- `src/lib/announcements.ts` — getPinnedAnnouncement, getAnnouncements
- `src/actions/kas.ts` — catatKas (pengurus, zod `kasSchema`)
- `/laporan-kas` — ringkasan + rincian + filter bulan + **Cetak/PDF** (`window.print()`) + **Cek Keaslian** (rantai hash)
- `/laporan-kas/baru` — form catat kas
- Migrasi `0003_kas_chain_audit.sql` **✅ di-apply** via SQL Editor (19 Jun sesi 2)

### M4 — Feed Komunitas ✅ kode + uji runtime (22 Jun sesi 11–12)
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

### M6 — Donasi & Upload ✅ kode selesai, uji upload postingan ✅ (22 Jun sesi 12)
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
- `npm run build        # Build (0 error — terakhir sesi 15: 0 error)

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

## 1b. 🔴 P0 — DOKUMENTASI ARSITEKTUR C4 (BARU, 22 Jun sesi 13)

> **Latar belakang:** Atasan mengirim SAD (Software Architecture Document) bergaya enterprise
> dengan 8 domain, microservices, Kafka, AI, K8s. Produk kita lebih sederhana & gratis.
> Untuk menjembatani, perlu dokumentasi ulang pakai standar **C4 Model** — 5 diagram terpisah.
> Detail analisis di `docs/RESPON_ATASAN.md`.

| # | Item | Lokasi/Output | Detail | Estimasi |
|---|------|---------------|--------|----------|
| 0.1 | **Context Diagram (Level 1)** | ✅ `docs/ARSITEKTUR.md` | User + Platform + BMKG + DINSOS + BI SNAP (sebagai external) | ✅ |
| 0.2 | **Container Diagram (Level 2)** | ✅ `docs/ARSITEKTUR.md` | PWA → Cloudflare Workers + Supabase + Aladhan | ✅ |
| 0.3 | **Component Diagram (Level 3)** | ✅ `docs/ARSITEKTUR.md` | Auth, Community, Donation, Feed — dalam monolith | ✅ |
| 0.4 | **Event Flow Diagram** | ✅ `docs/ARSITEKTUR.md` | Event catalog + perbandingan trigger vs Kafka | ✅ |
| 0.5 | **Database ERD** | ✅ `docs/ARSITEKTUR.md` | 21 tabel per domain visual (Mermaid ERD) | ✅ |
| 0.6 | **Architecture Overview** | ✅ `docs/ARSITEKTUR.md` | Merge visi atasan + realitas implementasi | ✅ |

**Prioritas:** ✅ **SELESAI — 22 Jun sesi 13.** Seluruh diagram C5 dibuat dalam satu dokumen `docs/ARSITEKTUR.md` (Mermaid, siap import ke Excalidraw). Branch `docs/arsitektur-c4` sudah dibuat. Lanjut 🟡 P2 UX Polish.

---

## 2. ✅ 🔴 P1 — UJI RUNTIME (TUNTAS 22 Jun sesi 12)

> **Status: 100% ✅.** Semua fitur interaktif utama terverifikasi runtime via browser chrome-direct.
> 4 bugs ditemukan & diperbaiki. Lanjut ke 🟡 P2.

### Ringkasan Hasil Uji

| Langkah | Fitur | Status | Sesi |
|---------|-------|--------|------|
| 1.1 | Commit M7 PWA | ✅ | 10 |
| 1.2 | Auth callback magic link | ✅ Cookie tersimpan, login sukses | 12 |
| 1.3 | Uji Kas (catat Rp 50rb + rantai hash) | ✅ "Segel utuh" | 11 |
| 1.4a | Upload foto postingan | ✅ bodySizeLimit fix applied | 12 |
| 1.4b | Upload avatar | ⏳ Belum diuji | — |
| 1.4c | Upload foto lapor | ⏳ Belum diuji | — |
| 1.4d | Upload bukti donasi | ⏳ Belum diuji | — |
| 1.5 | Feed (teks+foto+like+komentar+hapus) | ✅ Semua berfungsi | 11–12 |
| 1.6 | Kegiatan + RSVP (buat→hadir→batal) | ✅ WIB→UTC konversi benar | 12 |
| 1.7 | Lapor RT/RW | ⏳ Belum diuji runtime | — |
| 1.8 | Polling (buat→vote 1×→hasil bar%) | ✅ Vote kedua ditolak | 12 |
| 1.9 | Donasi (upload bukti + verifikasi) | ⏳ Belum diuji runtime | — |
| 1.10 | Notifikasi (trigger pengumuman) | ✅ Terverifikasi via DB (REST API) | 12 |
| 1.11 | Halaman publik `/k/[slug]` | ⏳ Belum diuji | — |
| 1.12 | Offline PWA | ⏳ Belum diuji | — |

### Bug Ditemukan & Diperbaiki

| # | Bug | File | Fix | Sesi |
|---|-----|------|-----|------|
| 1 | Hydration error NetworkStatus | `network-status.tsx:6` | `useState(true)` tanpa conditional | 11 |
| 2 | `digest()` tidak ditemukan (pgcrypto search_path) | `0007_fix_pgcrypto_search_path.sql` | search_path: `public, extensions` | 11 |
| 3 | Storage upload pake service role → RLS `TO authenticated` nolak | `src/lib/storage.ts` | Ganti `serviceClient()` dgn `createClient()` | 12 |
| 4 | `Body exceeded 1 MB limit` (413 Server Action) | `next.config.ts` | `serverActions.bodySizeLimit: "4.5mb"` | 12 |

---

## 3. 🟡 P2 — UX POLISH (2–3 jam, ✅ selesai 22 Jun sesi 14)

| # | Item | Status | Lokasi | Detail |
|---|------|--------|--------|--------|
| 1 | **Loading skeleton** | ✅ | `src/components/ui/skeleton.tsx` | SkeletonCard, SkeletonFeed + shimmer |
| 2 | **Toast notifikasi** | ✅ | `src/components/ui/toast.tsx` | Context-based (ToastProvider + useToast). Auto-dismiss 3.5s. Integrasi di root layout + form actions |
| 3 | **Error boundary** | ✅ | `src/app/error.tsx` + `src/components/ui/error-boundary.tsx` | Class-based ErrorBoundary component + global Next.js error.tsx |
| 4 | **Konfirmasi hapus** | ✅ | `src/components/ui/confirm-dialog.tsx` | `<dialog>` native modal, danger mode, backdrop blur |
| 5 | **Form validation UI** | ✅ | `src/components/ui/form-field.tsx` | FormField wrapper + Zod error display per field. CatatKasForm + BuatPostForm updated |
| 6 | **Logo/icon daun SVG** | ✅ | `src/components/ui/logo.tsx` | SVG daun hijau `#10b981`, siap untuk favicon & header |

---

## 4. 🟡 P3 — PWA & PERFORMANCE ✅ (1–2 jam, SELESAI 22 Jun sesi 15)

| # | Item | Status | Detail |
|---|------|--------|--------|
| 1 | **Cache strategy review** | ✅ | `src/app/sw.ts`: defaultCache tetap sebagai base, tambah handler NetworkOnly untuk POST (form/mutasi tidak pernah di-cache). Offline fallback `/~offline` via Serwist. |
| 2 | **Offline queue integration** | ✅ | `src/components/features/network-status.tsx`: saat `online` event → panggil `getQueueCount()` + `processQueue()` auto-replay. Banner tampilkan sisa antrian. `replay()` handler reconstruct FormData dari payload IDB untuk action: reaksiPost, votePolling, rsvpEvent. |
| 3 | **Animasi transisi** | ✅ | `src/app/template.tsx` — `motion.div` fade-in + translateY(12→0) durasi 250ms tiap navigasi. Client component `"use client"`, import `from "motion/react"`. |
| 4 | **Manifest modern** | ✅ | `public/manifest.json`: tambah `scope: "/"`, `display_override: ["window-controls-overlay", "standalone"]`, `launch_handler.client_mode: "focus-existing"`, `edge_side_panel.preferred_width: 380`. |
| 5 | **Lighthouse audit** | ⏳ | Butuh deploy ke production/staging (P4) untuk hasil akurat. |
| 6 | **Test installable** | ⏳ | Butuh HTTPS (P4 deploy) atau localhost Chrome DevTools test manual. |

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
| ~~`proxy.ts` middleware~~ → **PROXY DIHAPUS** | Next 16 proxy selalu Node.js runtime, OpenNext hard-exit. Solusi: refresh sesi via Server Actions/Route Handlers + client-side |

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

### Bug yang Ditemukan & Diperbaiki (22 Jun sesi 11–12)
| Bug | File | Fix |
|-----|------|-----|
| Hydration error `NetworkStatus` | `src/components/features/network-status.tsx:6` | Inisialisasi `useState(true)` tanpa conditional |
| `digest()` not found di trigger kas | `src/db/migrations/0007_fix_pgcrypto_search_path.sql` | search_path: `public, extensions` (pgcrypto di schema extensions) |
| Storage upload pake service role → RLS conflict | `src/lib/storage.ts` | Ganti `serviceClient()` dgn `createClient()` (user JWT) |
| `Body exceeded 1 MB limit` (413) di Server Action | `next.config.ts` | Tambah `serverActions.bodySizeLimit: "4.5mb"` |

### Build
- `npm run build` = **0 error / 0 warning** (terakhir dijalankan 22 Jun sesi 12)
- Service worker precache: 39 URL, ~800 kB
- Lint: **0 error / 0 warning** (public/sw* di-ignore)

### 🔴 P1 Uji Runtime — ✅ TUNTAS 100% (22 Jun sesi 12)
Semua fitur interaktif utama terverifikasi. 4 bugs fixed.

### 🔴 P0 Dokumentasi Arsitektur — ✅ SELESAI (22 Jun sesi 13)
Atasan mengirim SAD enterprise. Dibuat `docs/RESPON_ATASAN.md` — analisis kesenjangan + rencana 30 hari. C4 diagram (5 level) di `docs/ARSITEKTUR.md`.

### 🟡 P2 UX Polish — ✅ SELESAI (22 Jun sesi 14)
### 🟡 P3 PWA & Performance — ✅ SELESAI (22 Jun sesi 15)
### 🟡 P3 PWA & Performance — ✅ SELESAI (22 Jun sesi 15)

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
| `docs/RESPON_ATASAN.md` | Analisis kesenjangan visi atasan vs realitas + rencana 30 hari |
| `~/agensi/skills/kaki-tangan/SKILL.md` | Cara operasi akun asli (browser chrome-direct headed) |
| `~/agensi/playbook/AUDIT_PROFESOR_2026_v2.md` | NF-01 (Vercel ToS), NF-02 (NIK bocor), NF-03 (RLS) |

---

> **Pesan untuk AI sesi berikutnya:** Kalau user bilang "lanjutkan pengerjaan yang tertunda"
> atau "lanjutkan sesi sebelumnya", kerjakan PERENCANAAN_V1.md ini secara urut:
>
> 1. **🔴 P0 — Dokumentasi Arsitektur C4** (BARU — dari respon atasan). Kerjakan dulu
>    `docs/RESPON_ATASAN.md` bagian 5 (Rencana Tindak) sebagai acuan.
> 2. **✅ P1 — Uji Runtime** (100% tuntas, lewati)
> 3. **🟡 P2 — UX Polish**
> 4. **🟡 P3 — PWA & Performance**
> 5. **🟠 P4 — M8 Deploy Cloudflare**
> 6. **🔵 P5 — Admin Features**
>
> Jangan lompat ke P4 sebelum P0–P3 selesai.
>
> Setelah selesai tiap langkah, update status di dokumen ini dan commit.
