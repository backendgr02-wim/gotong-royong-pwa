# Gotong Royong PWA

Aplikasi web (PWA) komunitas **RT/RW & Masjid**: transparansi kas, jadwal sholat, pengumuman/feed,
lapor warga, dan donasi/iuran (transfer manual + foto bukti). Multi-tenant, gratis dijalankan
(klien hanya bayar domain), ringan untuk HP murah + 3G.

## 🤖 AI / developer: BACA INI DULU
1. **[`AGENTS.md`](./AGENTS.md)** — protokol wajib sebelum ngoding (aturan Next 16, keamanan, scope). **JANGAN skip.**
2. **[`docs/CATATAN_PEMBANGUNAN.md`](./docs/CATATAN_PEMBANGUNAN.md)** — status, arsitektur, keputusan (ADR), titik lanjut.
3. `docs/PRD.md` · `docs/RENCANA_DATA.md` · `docs/DESIGN.md` · `docs/ROADMAP.md`.

> ⚠️ Ini **Next.js 16** (banyak breaking change) — `middleware`→`proxy`, `cookies()` async, form pakai
> Server Action (bukan `/api`), animasi pakai `motion`. Detail di `AGENTS.md`.

## Stack
Next.js 16 (App Router) · Tailwind v4 · TypeScript · Supabase (Postgres + Auth + Storage + **RLS**) ·
Drizzle (skema/migrasi) · zod · Serwist (PWA) · **deploy: Cloudflare Workers via `@opennextjs/cloudflare`**
(BUKAN Vercel). Font: Plus Jakarta Sans.

## Jalankan lokal
```bash
npm run dev      # http://localhost:3000  (UI tampil walau Supabase belum disetel)
npm run build    # wajib 0 error sebelum dianggap selesai
```
> `.env` masih placeholder. Login & data baru aktif setelah Supabase diprovisioning + migrasi dijalankan
> (langkah lengkap: `docs/CATATAN_PEMBANGUNAN.md` §10).

## Biaya
Target **Rp 0/bulan** kecuali domain. Tanpa layanan berbayar (lihat aturan di `AGENTS.md`).
