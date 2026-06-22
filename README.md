# 🤝 Gotong Royong PWA

Platform komunitas **RT/RW & Masjid** untuk transparansi keuangan, kegiatan sosial, dan komunikasi warga — dalam satu aplikasi web (PWA) yang ringan, gratis, dan bisa dipasang di HP.

> **Produksi:** [Coming Soon] · **Demo/Development:** Aktif
> **Biaya operasional: Rp 0/bulan** (klien hanya bayar domain)

---

## ✨ Fitur yang SUDAH Berjalan

### 📊 Manajemen Komunitas
- **Multi-tenant** — satu aplikasi melayani banyak komunitas (RT, RW, Masjid, dll)
- **Onboarding** — daftar email → buat/gabung komunitas → langsung akses
- **Peran & izin** — warga biasa vs pengurus/DKM (berbasis RLS PostgreSQL)
- **Halaman publik** — `/k/[slug]` untuk profil komunitas yang bisa diakses tanpa login

### 💰 Transparansi Keuangan (Kas)
- **Catat pemasukan & pengeluaran** — real-time saldo di beranda
- **Rantai-hash SHA-256** — setiap transaksi di-hash dan dikaitkan dengan transaksi sebelumnya (anti-utak-atik, audit tanpa blockchain mahal)
- **Tombol "Cek Keaslian"** — verifikasi integritas data kas
- **Filter bulan + Cetak/PDF** — laporan keuangan siap cetak
- **Donasi & Iuran** — transfer manual + upload foto bukti → verifikasi pengurus → otomatis masuk kas

### 📰 Feed & Komunikasi
- **Postingan teks + foto** — feed komunitas dengan like dan komentar
- **Pengumuman** — pengurus bisa terbitkan pengumuman penting (ter-pin di beranda)
- **Kegiatan + RSVP** — buat kegiatan, undang warga, tracking kehadiran
- **Polling** — voting 1× per orang, hasil real-time dalam persentase
- **Notifikasi in-app** — badge bell, notifikasi untuk kegiatan/pengumuman/donasi

### 📍 Laporan Warga
- **Lapor RT/RW** — laporan warga + foto + lokasi GPS opsional
- **Status tracking** — reported → diproses → selesai

### 🕌 Fitur Islami (diferensiasi)
- **Jadwal Sholat** — otomatis dari Aladhan API (metode Kemenag RI) per lokasi komunitas
- **Mutabaah Harian** — tracking ibadah harian (Subuh, Tilawah, Dzikir, Sedekah, Dhuha)

### 📱 PWA (Progressive Web App)
- **Installable** — bisa dipasang di layar utama HP seperti aplikasi native
- **Offline support** — IndexedDB antrian aksi saat offline, service worker cache
- **Ringan** — bundle ~800 kB (vs Flutter 7 MB+), cocok untuk HP murah + jaringan 3G
- **Banner online/offline** — status koneksi real-time di bagian atas layar

---

## 🗺️ Status Pengerjaan (22 Juni 2026)

| Area | Status | Keterangan |
|---|---|---|
| **Fondasi & Auth** (login, daftar, komunitas) | ✅ **100%** | Magic link email, multi-tenant, RLS aktif |
| **Beranda & Kas** (transparansi keuangan) | ✅ **100%** | Catat kas, rantai-hash, cetak PDF, donasi+verifikasi |
| **Feed & Kegiatan** (postingan, pengumuman, event) | ✅ **100%** | Teks, foto, like, komentar, RSVP, polling |
| **Laporan & Notifikasi** | ✅ **100%** | Lapor warga, notifikasi trigger, badge bell |
| **Upload Foto** (avatar, feed, lapor, bukti donasi) | ✅ **100%** | Storage publik/privat, signed URL |
| **PWA Offline** | ✅ **100%** | Service worker, IndexedDB queue, manifest, icons |
| **Dokumentasi Arsitektur C4** | ✅ **100%** | 5 level diagram (Context, Container, Component, Event Flow, ERD) |
| **UX Polish** (skeleton, toast, error boundary) | 🟡 **0%** | Prioritas berikutnya |
| **Deploy Cloudflare** | 🟠 **0%** | OpenNext + wrangler |
| **Admin Dashboard** | 🔵 **0%** | Opsional, setelah deploy |
| **QRIS / Payment Gateway** | 📋 **Fase 2** | Persiapan sudah ada, eksekusi setelah v1 stabil |

---

## 💳 Kenapa QRIS Belum Dikerjakan?

QRIS / BI SNAP adalah **payment gateway** yang memungkinkan donasi via scan QR.

**Alasan belum dikerjakan:**
1. **Lisensi OJK/PJSP** — untuk menampung uang dari banyak orang, aplikasi wajib punya izin Penyelenggara Jasa Pembayaran (PJP) atau bekerja sama dengan PJP tersertifikasi. Prosesnya berbulan-bulan.
2. **Biaya per transaksi** — setiap donasi kena fee 1-2% ke pihak payment gateway. Untuk skala RT/RW dengan donasi kecil (Rp 10-50rb), fee ini memberatkan.
3. **Prinsip "Gratis Total"** — platform ini dirancang tanpa biaya berulang. Transfer manual + foto bukti sudah cukup untuk transparansi.

**Tapi kenapa sudah disiapkan?** Struktur database dan kode donasi sudah dibuat modular. Kolom `status` (PENDING → PAID → VERIFIED) dan alur verifikasi pengurus sudah siap. Kalau nanti:
- Klien punya izin PJP sendiri, ATAU
- Volume donasi sudah besar dan fee transaksi terjustifikasi, ATAU
- Ada permintaan eksplisit + budget klien

...maka integrasi QRIS tinggal nambah modul di `Server Action` donasi + webhook callback. Tanpa rewrite besar.

---

## 🏗️ Arsitektur

```text
PWA (Next.js 16 + Serwist)
    ↕ HTTPS + JWT
Cloudflare Workers (OpenNext adapter)
    ↕ RLS + Auth
Supabase (Postgres + Storage + Auth)
```

- **Monolith** — 1 kodebase, 1 deploy (cepat, gratis)
- **Database = API** — otorisasi di RLS PostgreSQL (bukan di kode app)
- **Event via Trigger** — Postgres trigger gantikan Kafka (cukup untuk skala RT/RW)
- **Biaya $0** — Cloudflare Workers + Supabase free + Aladhan API gratis

Detail lengkap: [`docs/ARSITEKTUR.md`](./docs/ARSITEKTUR.md)

---

## 🧰 Stack Teknologi

| Lapisan | Teknologi |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI** | React 19 + Tailwind v4 + shadcn/ui |
| **Font** | Plus Jakarta Sans |
| **Animasi** | Motion (ex-framer-motion) |
| **Backend/Auth** | Supabase (RLS, Auth, Storage, Postgres) |
| **Database Schema** | Drizzle ORM |
| **Validasi** | Zod |
| **PWA** | Serwist + idb (IndexedDB) |
| **Deploy** | Cloudflare Workers via @opennextjs/cloudflare |
| **CI/CD** | GitHub → Cloudflare Workers Builds |

---

## ⚡ Jalankan Lokal

```bash
npm install
npm run dev        # http://localhost:6789
npm run build      # 0 error wajib
```

> `.env.local` berisi kredensial Supabase (tidak di-commit). Untuk development tanpa DB, UI tetap tampil.

---

## 📚 Dokumentasi Lengkap

| Dokumen | Isi |
|---|---|
| [`docs/ARSITEKTUR.md`](./docs/ARSITEKTUR.md) | Arsitektur C4 (5 diagram) — untuk technical stakeholder |
| [`docs/RESPON_ATASAN.md`](./docs/RESPON_ATASAN.md) | Analisis kesenjangan visi vs realitas — untuk atasan |
| [`docs/PRD.md`](./docs/PRD.md) | Kebutuhan fitur & scope |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md) | Fitur yang diparkir ke fase berikutnya |
| [`docs/CATATAN_PEMBANGUNAN.md`](./docs/CATATAN_PEMBANGUNAN.md) | Build log & ADR (technical) |

---

## 📬 Kontak & Lisensi

Dibangun oleh Tim Gotong Royong — agensi `/~`  
Untuk klien: komunitas RT/RW, Masjid, yayasan sosial  
**Model bisnis:** Klien hanya bayar domain. Semua biaya infrastruktur ditanggung tim (gratis).
