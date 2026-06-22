<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 🤖 AGENTS.md — PROTOKOL WAJIB SEBELUM NGODING

> Berlaku untuk **AI apa pun**: Claude Code, OpenCode, Hermes, Cursor, dll.
> **Masalah yang dicegah dokumen ini:** AI sering bilang *"iya paham"* lalu menulis kode Next.js gaya
> lama / melanggar aturan proyek → **error semua / keamanan jebol**. Ikuti protokol ini, jangan dilewati.

## 0) ⛔ URUTAN BACA (wajib, SEBELUM menyentuh kode)
1. **`docs/CATATAN_PEMBANGUNAN.md`** — status terkini, arsitektur, 10 Keputusan (ADR), titik lanjut. **MULAI DI SINI.**
2. `docs/PRD.md` (kebutuhan & scope) · `docs/RENCANA_DATA.md` (jembatan UI↔DB per layar) · `docs/DESIGN.md` (token) · `docs/ROADMAP.md` (fitur yang DIPARKIR).
3. Untuk **setiap fitur Next.js** yang akan kamu pakai (font, metadata, caching, route handler, dll) → baca dulu `node_modules/next/dist/docs/01-app/...`. Ini Next 16, banyak yang berubah.
4. **Kerjakan "Uji Paham" (§7).** Kalau belum bisa menjawab → baca ulang, JANGAN ngoding.

## 1) APA PROYEK INI (satu paragraf)
PWA komunitas RT/RW & Masjid ("Gotong Royong"): transparansi kas, jadwal sholat, pengumuman/feed, lapor
warga, donasi/iuran (transfer manual + foto bukti). **Multi-tenant** (banyak komunitas dalam satu aplikasi,
di-scope `community_id`). **Gratis dijalankan** (klien hanya bayar domain). Ringan untuk HP murah + 3G.
Stack: **Next.js 16 (App Router) + Tailwind v4 + Supabase (Postgres+Auth+Storage+RLS) + Cloudflare Workers**.

## 2) 🚦 ATURAN KERAS — melanggar = error atau lubang keamanan

### A. Next.js 16 (penyebab error AI #1 — HAFALKAN tabel ini)
| ❌ Gaya lama (jangan) | ✅ Proyek ini (benar) |
|---|---|
| `middleware.ts` | **`src/proxy.ts`** (fungsi `proxy`, Next 16 ganti nama) |
| `const c = cookies()` | **`const c = await cookies()`** (async) |
| form via `app/api/.../route.ts` | **Server Action** (`"use server"`) di `src/actions/` |
| `framer-motion` | **`motion`** |
| `@cloudflare/next-on-pages` | **`@opennextjs/cloudflare`** (Workers) |
| Supabase `anon`/`service` key | **`publishable`/`secret` key** |
| `params`/`searchParams` sinkron | **`await params` / `await searchParams`** |
| `export const metadata` utk themeColor | **`export const viewport`** |
| halaman ber-data tanpa penanda | **`export const dynamic = "force-dynamic"`** pada halaman ber-auth/ber-data |

### B. Keamanan & data (WAJIB)
- **RLS adalah otorisasi.** Akses "siapa boleh lihat/ubah apa" ditegakkan di Postgres (RLS), BUKAN di kode app. Tabel baru → WAJIB `ENABLE RLS` + policy (pakai `is_member()`/`is_pengurus()`). Lihat `src/db/migrations/0001_auth_and_rls.sql`.
- **TANPA NIK / data sensitif.** Jangan tambah kolom NIK, agama wajib, atau data anak. PII minimal saja.
- **`community_id` di semua tabel data** (termasuk tabel anak: komentar/reaksi/rsvp/vote) → multi-tenant.
- **Validasi `zod` di SETIAP Server Action** (lihat `src/lib/validation.ts`). Form publik: + honeypot + Turnstile + rate-limit.
- **JANGAN buat endpoint publik yang mengembalikan data pengguna tanpa auth** (kesalahan fatal web lama: NIK bocor).
- Akses data runtime **lewat klien Supabase** (`@supabase/ssr`), JANGAN query Postgres langsung dari app (itu bypass RLS).

### C. Biaya & scope (WAJIB)
- **Gratis total.** DILARANG menambah layanan berbayar: Bubble, Xendit/payment gateway, WhatsApp Business API, Firebase Blaze, Google Maps berbayar, Keycloak, blockchain. Donasi = **transfer manual + foto bukti**.
- **Scope lock.** Kalau diminta bikin marketplace, BMT, e-gov, blockchain, pendidikan-300-fitur, chat realtime → itu **DIPARKIR** di `ROADMAP.md`. **Jangan dibangun**; konfirmasi ke pemilik dulu.
- **Operasi akun asli** (GitHub/Supabase/Cloudflare) HANYA via skill `kaki-tangan` (browser-act chrome-direct, terlihat) + konfirmasi pemilik. Jangan pakai CLI terminal (beda akun).

## 3) 🗂️ PETA FOLDER (taruh kode di tempat yang benar)
```
src/app/            → halaman & route (RSC default). Form auth/onboarding/dll.
src/actions/        → Server Actions ("use server") — semua mutasi data lewat sini
src/components/ui/  → komponen presentasional (Button, Card, dll)
src/components/layout, /features → shell & fitur
src/lib/            → supabase/{server,client}, auth, validation (zod), prayer, utils
src/db/             → schema.ts (Drizzle) + migrations/*.sql (DDL + RLS)
src/proxy.ts        → refresh sesi Supabase (pengganti middleware)
docs/               → SEMUA dokumen (baca dulu!)
```

## 4) 📍 STATUS & LINGKUNGAN (baca sebelum kaget)
- **Supabase SUDAH diprovisioning (19 Jun 2026).** `.env.local` sudah terisi (jangan commit). 
  Project `gotong-royong` (ref `nqlazrjcywyltewsxgmx`). Migrasi `0000`–`0006` sudah di-apply.
- **Semua fitur M1–M7 selesai dikoding & lolos build.** Tapi **hampir tidak ada yang pernah diuji runtime**
  (kecuali M2 auth). Prioritas tunggal = uji runtime (lihat `docs/PERENCANAAN_V1.md`).
- **M7 PWA Offline selesai & SUDAH di-commit & push**.
- **`npm run dev`** = port 6789 (bukan 3000).
- **Untuk perencanaan lengkap** → baca `docs/PERENCANAAN_V1.md` (urutan TODO dari 🔴 P1 sampai 🔵 P5).
- Build log & ADR → `docs/CATATAN_PEMBANGUNAN.md`.

## 5) 🔁 ALUR KERJA TIAP FITUR (ikuti urutan ini)
`RENCANA_DATA.md` (tulis baris alignment) → migrasi tabel + **RLS** → Server Action + **zod** → UI (skeleton/empty/error) → **uji RLS lintas-komunitas** (user komunitas A tak boleh lihat data B) → `npm run build`.

## 6) ✅ CHECKLIST
**Sebelum ngoding:** sudah baca §0; sudah lulus §7; tahu fitur ini ada di scope (bukan ROADMAP).
**Sebelum bilang "selesai":**
- [ ] `npm run build` = **0 error / 0 warning** (kalau error, BELUM selesai).
- [ ] Tabel baru punya **RLS + policy**; Server Action punya **zod**.
- [ ] Tidak ada **NIK**/data sensitif; tidak ada endpoint publik bocor.
- [ ] Tidak menambah **layanan berbayar**; tidak membangun fitur **ROADMAP**.
- [ ] Pakai konvensi Next 16 (tabel §2A).

## 7) ❓ UJI PAHAM — jawab dulu dari docs (kalau ragu, baca lagi; JANGAN ngoding sambil menebak)
1. File untuk "middleware"? → **`src/proxy.ts`** (Next 16).
2. `cookies()` sinkron atau async? → **async** (`await cookies()`).
3. Kirim data form pakai apa? → **Server Action** (`"use server"`), BUKAN `app/api`.
4. Library animasi? → **`motion`** (bukan framer-motion).
5. Deploy ke mana + adapter apa? → **Cloudflare Workers** via **`@opennextjs/cloudflare`**.
6. Boleh menyimpan NIK? → **Tidak.**
7. Otorisasi "siapa boleh apa" ditegakkan di mana? → **RLS di Postgres** (bukan di kode app).
8. Donasi pakai payment gateway? → **Tidak**, transfer manual + foto bukti.
9. Kolom kunci multi-tenant? → **`community_id`** (ada di semua tabel data).
10. Perintah wajib sebelum bilang selesai? → **`npm run build`** (harus 0 error).
11. Diminta bikin marketplace/blockchain/BMT/chat realtime? → **Tolak/konfirmasi** — itu DIPARKIR di `ROADMAP.md`.
12. `npm run dev` lalu login error "supabaseUrl is required" — kenapa? → **Supabase belum diprovisioning** (`.env` kosong). Wajar. Lihat `CATATAN_PEMBANGUNAN.md` §10.

## 8) ⌨️ PERINTAH PENTING
```bash
npm run dev          # jalan lokal (UI tampil walau Supabase belum ada)
npm run build        # WAJIB lolos sebelum selesai (0 error)
npm run lint
npx drizzle-kit generate --name <nama>   # generate SQL dari perubahan schema.ts (tak butuh DB)
# Migrasi DB: paste isi src/db/migrations/0000_*.sql lalu 0001_*.sql di Supabase SQL Editor
```

## 9) 🛠️ KALAU ERROR (diagnosa cepat)
| Gejala | Sebab | Solusi |
|---|---|---|
| `supabaseUrl is required` saat login/data | `.env` belum diisi (pra-Supabase) | Wajar sebelum provisioning. Isi `.env.local` + migrasi (CATATAN §10) |
| `relation "..." does not exist` | Migrasi belum dijalankan di Supabase | Jalankan `0000` lalu `0001` di SQL Editor |
| "middleware tidak jalan" | File salah nama | Harus `src/proxy.ts` dgn `export function proxy` |
| Error `cookies()` / Promise | Lupa `await` | `const c = await cookies()` |
| RLS menolak query yang seharusnya boleh | Policy/peran salah | Cek `is_member`/`is_pengurus` & keanggotaan user di `memberships` |
| Build gagal di prerender halaman ber-data | Halaman dieksekusi saat build | Tambah `export const dynamic = "force-dynamic"` |

---
*Pemilik tidak bisa baca kode — semua penjelasan ke pemilik pakai bahasa awam. Update `docs/CATATAN_PEMBANGUNAN.md` §1 & §10 setiap akhir sesi.*
