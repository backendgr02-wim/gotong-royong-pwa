# KONSOLIDASI PRIORITAS — Gotong Royong PWA (24 Jun 2026)

> **Masalah:** Ada ~40+ task dari 6 dokumen (PERENCANAAN_V1, CATATAN_PEMBANGUNAN,
> RESPON_ATASAN, TEMUAN_DOCS_WA, AUDIT_UX, sesi chat) tanpa urutan jelas.
> **Akibat:** AI dan user kerja random → struktur hancur, fitur setengah jadi.
>
> **Solusi:** Satu prioritas piramida — level BAWAH harus selesai dulu sebelum level ATAS.

---

## PRIORITAS PIRAMIDA (kerjakan URUT dari bawah)

```
         ┌─────────────┐
         │   CUSTOM    │  Level 5 — setelah semua stabil
         │   DOMAIN    │
         ├─────────────┤
         │  LANDING    │  Level 4 — after navigation works
         │  MASJID/RT  │
         ├─────────────┤
         │  MVP GAP    │  Level 3 — after labels align
         │  3 FITUR    │
         ├─────────────┤
         │  LABEL UI   │  Level 2 — after navigation works
         │  ALIGNMENT  │
         ├─────────────┤
         │    NAV +    │  Level 1 — WAJIB, FOUNDATION
         │  UX BROKEN  │
         ├─────────────┤
         │  SUDAH OK   │  ✅ Foundation kode: 21 tabel, RLS, PWA, auth
         │  (skip)     │  ✅ Deployed ke Workers, Google OAuth live
         └─────────────┘
```

---

## LEVEL 0 — SUDAH BERES (JANGAN DIUTAK-ATIK, SKIP)

Dari semua dokumen, ini SUDAH SELESAI dan TIDAK PERLU disentuh lagi:

| Item | Dokumen Asal | Status |
|------|-------------|--------|
| 21 tabel + RLS (54 policy) | PERENCANAAN M1 | ✅ |
| Auth magic link + callback fix | PERENCANAAN M2 | ✅ |
| Beranda data nyata (kas, sholat, kegiatan, mutabaah) | PERENCANAAN M3 | ✅ |
| Feed komunitas (post, like, komentar) | PERENCANAAN M4 | ✅ |
| Lapor RT/RW, Polling, Notifikasi | PERENCANAAN M5 | ✅ |
| Donasi manual + upload bukti | PERENCANAAN M6 | ✅ |
| PWA offline (Serwist, IndexedDB) | PERENCANAAN M7 | ✅ |
| Deploy Cloudflare Workers | PERENCANAAN M8 | ✅ |
| UX Polish (skeleton, toast, error boundary, konfirmasi hapus, logo) | PERENCANAAN P2 | ✅ |
| PWA Performance (animasi transisi, manifest modern) | PERENCANAAN P3 | ✅ |
| Search bar + /cari page | PERENCANAAN P5 #3 | ✅ |
| Keep-alive workflow | PERENCANAAN P5 #5 | ✅ |
| Google OAuth (deployed, tinggal retes) | Sesi chat | ✅ |
| C4 Diagram + Event Flow + ERD | RESPON_ATASAN | ✅ |
| Turnstile + CSP | CATATAN §10 | ✅ |
| Rate limiting di 13 ActionState | Sesi chat | ✅ |
| VAPID keys | Sesi chat | ✅ |
| env.ts + assertEnv() | Sesi chat | ✅ |

---

## LEVEL 1 — 🔴 FOUNDATION: NAVIGASI BROKEN (KERJAKAN DULU)

**Aturan:** Semua task level 2-5 **DILARANG** dikerjakan sebelum level 1 selesai.
Tanpa level 1, struktur navigasi rusak → fitur baru berdiri di atas fondasi retak.

### 1A — Hapus auto-redirect ke pilih-peran (5 menit)
**File:** `src/components/features/guest-beranda.tsx:8-12`
**Akar:** `useEffect` redirect ke `/pilih-peran` saat tidak ada `selectedRoles`
**Akibat:** User tidak pernah lihat landing page → TikTok mode mati
**Fix:** Hapus `useEffect` block. Simpan role selector sebagai opsional di Profil.
**Sumber:** AUDIT_UX #2

### 1B — 1 tombol "Masuk" di landing page (15 menit)
**File:** `src/components/features/guest-beranda.tsx:30-35` dan `:79-84`
**Akar:** 2 link ke `/masuk` (navbar + CTA card)
**Fix:** Pilih salah satu. Rekomendasi: simpan di navbar (konsisten), hapus CTA card.
**Sumber:** AUDIT_UX #1

### 1C — Auth check + 1 tombol di /k/[slug] (30 menit)
**File:** `src/app/k/\[slug\]/page.tsx`
**Akar:** RSC tidak ngecek `getUser()` → 2 tombol Masuk + user login lihat tombol
**Fix:** Tambah `getUser()`, conditional render (user login → "Buka Beranda", guest → 1 tombol)
**Sumber:** AUDIT_UX #3, temuan sebelumnya

### 1D — Bottom nav adaptif untuk guest (1 jam)
**File:** `src/components/layout/bottom-nav.tsx` + `app-frame.tsx`
**Akar:** 4/5 link tidak berguna untuk guest
**Fix:** Sembunyikan bottom nav untuk guest ATAU ganti link: [Beranda] [Jelajahi] [Masuk]
**Sumber:** AUDIT_UX #4

### 1E — /beranda redirect (5 menit)
**File:** perlu buat route `/beranda` → redirect ke `/`
**Fix:** Tambah `src/app/beranda/page.tsx` → `redirect("/")`
**Sumber:** AUDIT_UX #5

### 1F — Filter role pilih-peran (1 jam)
**File:** `src/app/pilih-peran/page.tsx`
**Akar:** 8 role, 4 tanpa fitur (Pesantren, UMKM, Belajar, Ojek Online)
**Fix:** Hapus UMKM (dilarang), Ojek Online (tidak relevan), Pesantren + Belajar → disable "Menyusul"
**Sumber:** AUDIT_UX #7, TEMUAN_DOCS_WA

### 1G — Aksi button label (5 menit)
**File:** `src/components/layout/bottom-nav.tsx:27-37`
**Fix:** Tambah teks "Aksi" di tombol tengah
**Sumber:** AUDIT_UX #10

**Total Level 1:** ~3 jam → SEMUA navigasi berfungsi untuk guest & user

---

## LEVEL 2 — 🟡 LABEL UI + KATEGORI (setelah navigasi OK)

### 2A — Kategori section: hapus Pasar, link sisanya (2 jam)
**File:** `src/app/page.tsx:32` dan `:229-248`
**Akar:** 5/6 kategori pakai `#`, Pasar dilarang
**Fix:** 
- Hapus Pasar (dilarang marketplace)
- Keluarga → link ke `/` (mutabaah)
- Masjid + RT/RW → tetap `#` sampai landing page dibangun (Level 4)
- B&B → disable "Menyusul"
- Kasih icon berbeda per kategori
**Sumber:** AUDIT_UX #6, TEMUAN_DOCS_WA

### 2B — Ganti label UI sesuai Docs-wa (1-2 jam)
**Akar:** Istilah teknis vs bahasa komunitas
**Fix (label saja, jangan ubah kode):**
- "Postingan" → "Info Warga"
- "Kas" → "Kas Komunitas"
- "Pesan" → "Kotak Masuk" (atau Notifikasi)
- Judul halaman diselaraskan
**Sumber:** TEMUAN_DOCS_WA §6

**Total Level 2:** ~3-4 jam → UI konsisten, kategori berfungsi

---

## LEVEL 3 — 🟢 MVP GAP: 3 FITUR RINGAN (setelah label OK)

### 3A — QR Code Masjid (Fitur #4) (1-2 jam)
Generate QR dari slug komunitas → tampilkan di halaman publik / admin
**Sumber:** TEMUAN_DOCS_WA §4

### 3B — Direktori Warga RT (Fitur #36) (2-3 jam)
Tabel + halaman daftar warga (nama, peran, kontak) — hanya untuk anggota
**Sumber:** TEMUAN_DOCS_WA §4

### 3C — Direktori Kontak Penting (Fitur #262) (1-2 jam)
Tabel kontak darurat (sudah ada di halaman publik, tinggal UI manage)
**Sumber:** TEMUAN_DOCS_WA §4

**Total Level 3:** ~4-7 jam → 3 fitur MVP nyata

---

## LEVEL 4 — 🟠 LANDING PAGE MASJID & RT/RW (setelah gaps terisi)

### 4A — Landing page Masjid (4-6 jam)
Halaman aggregation fitur masjid: Kas Masjid, Jadwal Sholat, Kajian, Pengumuman, Donasi Masjid
(Fitur existing tinggal di-group)
**Sumber:** TEMUAN_DOCS_WA §6

### 4B — Landing page RT/RW (4-6 jam)
Halaman aggregation fitur RT/RW: Kas RT, Iuran, Lapor, Polling, Pengumuman, Warga
**Sumber:** TEMUAN_DOCS_WA §6

### 4C — Landing page Keluarga (2-3 jam)
Link ke Mutabaah + konten edukasi. Label "Lainnya menyusul"
**Sumber:** TEMUAN_DOCS_WA §6

**Total Level 4:** ~10-15 jam → landing pages siap

---

## LEVEL 5 — 🔵 CUSTOM DOMAIN + PRODUCTION (paling akhir)

### 5A — Beli domain + DNS (1 hari, butuh kaki-tangan)
- Beli domain
- Atur DNS Cloudflare
- Update wrangler routes
- Update Supabase redirect URIs
- Update Google OAuth redirect URIs
**Sumber:** CATATAN_PEMBANGUNAN §10, sesi chat

### 5B — Setup Resend SMTP (opsional, 1-2 jam)
Untuk magic link fallback kalau rate limit Supabase 2 email/jam kena
**Sumber:** sesi chat

---

## DILARANG DIKERJAKAN (parkir, jangan sentuh)

Dari 6 dokumen, ini yang **dilarang** dikerjakan agar struktur tidak hancur:

| Item | Kenapa Dilarang |
|------|-----------------|
| Pasar/UMKM marketplace | Melanggar aturan proyek (marketplace dilarang) |
| Ojek Online role | 0 fitur, tidak relevan |
| Pesantren role | 0 fitur, parkir fase berikutnya |
| Chat realtime (Fitur #261) | Butuh WebSocket, parkir ROADMAP Fase 2 |
| Payment gateway/QRIS | Butuh biaya & lisensi OJK |
| Blockchain/Hyperledger | Biaya Rp 105-470 M, cukup hash chain sekarang |
| AI Service | Butuh budget bulanan |
| Flutter Mobile | Produk baru, biaya besar |

---

## CHECKLIST EKSEKUSI (cetak & centang)

```
[ ] LEVEL 1A — Hapus auto-redirect (5 menit)
[ ] LEVEL 1B — 1 tombol Masuk di landing (15 menit)
[ ] LEVEL 1C — Auth check + 1 tombol di /k/[slug] (30 menit)
[ ] LEVEL 1D — Bottom nav adaptif guest (1 jam)
[ ] LEVEL 1E — /beranda redirect (5 menit)
[ ] LEVEL 1F — Filter role pilih-peran (1 jam)
[ ] LEVEL 1G — Aksi label (5 menit)
    → npm run build = 0 error ✅
=== GERBANG: LEVEL 1 SELESAI → navigasi aman ===

[ ] LEVEL 2A — Kategori section (2 jam)
[ ] LEVEL 2B — Label UI alignment (1-2 jam)
    → npm run build = 0 error ✅

[ ] LEVEL 3A — QR Code Masjid (1-2 jam)
[ ] LEVEL 3B — Direktori Warga (2-3 jam)
[ ] LEVEL 3C — Kontak Penting (1-2 jam)
    → npm run build = 0 error ✅

[ ] LEVEL 4A — Landing Masjid (4-6 jam)
[ ] LEVEL 4B — Landing RT/RW (4-6 jam)
[ ] LEVEL 4C — Landing Keluarga (2-3 jam)
    → npm run build = 0 error ✅

[ ] LEVEL 5A — Custom domain
[ ] LEVEL 5B — Resend SMTP
    → npm run build = 0 error ✅
```
