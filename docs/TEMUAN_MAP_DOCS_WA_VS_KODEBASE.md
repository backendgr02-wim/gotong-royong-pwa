# TEMUAN: Pemetaan Docs-wa (300 Fitur) vs Kodebase Existing

> **Tujuan:** Menyelaraskan terminologi & scope Docs-wa dengan fondasi yang sudah terlanjur dibangun,
> tanpa mengubah total kode yang sudah ada. Dokumen ini adalah jembatan antara "visi SuperApp Nusantara"
> dan "realitas Next.js PWA multi-tenant".

---

## 1. PERBEDAAN BAHASA (Terminologi Gap)

Docs-wa dan kodebase sering bicara soal **hal yang sama** tapi dengan **nama berbeda**. Ini sumber
kebingungan utama. Berikut pemetaannya:

| Docs-wa (300 Fitur) | Kodebase (sudah dibangun) | Keterangan |
|---------------------|---------------------------|------------|
| "Input Kas Masjid" + "Kas RT Transparan" | `catatKas()` → `/laporan-kas/baru` + beranda summary | Satu sistem kas untuk multi-jenis komunitas |
| "SSO Komunitas" | Magic link + Google OAuth (Supabase Auth) | Docs bayangin Keycloak; realita pakai Supabase Auth |
| "Push Notification" | Web Push (VAPID keys) | Docs bayangin FCM; realita Web Push gratis |
| "Audit Trail" | SHA-256 hash chain di `kas_entries` trigger | Sama persis konsepnya, beda implementasi (docs: blockchain/Hyperledger) |
| "Enkripsi Data Privat" | RLS policies + HTTPS + zod validation | Docs bayangin end-to-end encryption; realita RLS di Postgres |
| "Feed Komunitas Terpadu" | `/komunitas` + feed with likes/comments | Sama |
| "Donasi Infaq Digital" | `/donasi` + upload bukti transfer | Docs bayangin Xendit/payment gateway; realita transfer manual |
| "Profil Pengguna" | `/profil` + edit avatar | Sama |
| "Laporan Keamanan Lingkungan" | `/lapor` RT/RW + foto + GPS | Sama |
| "Voting & Polling Warga" | `/polling` + hasil bar% | Sama |
| "Jadwal Taklim & Kajian" | `/kegiatan` + RSVP | Sama |
| "Pengumuman Masjid" + "Pengumuman RT/RW" | `/pengumuman` | Sama, beda filter peran |
| "Pencarian Global" | `/cari` + Search bar | Sama |
| "Mode Offline" | Serwist SW + IndexedDB offline queue | Sama |
| "Aplikasi Android" | PWA installable (manifest + SW) | Docs bayangin Flutter native; realita PWA |
| "Progressive Web App" | Serwist 9.x + `~offline` page | Sama |
| "Iuran RT/RW Digital" | Donasi dengan `jenis: "iuran"` | Bisa dipakai untuk iuran, tapi belum ada dashboard per-warga |
| "Status Iuran per Warga" | ❌ Belum dibangun | Fitur gap |
| "QR Code Masjid" | ❌ Belum dibangun | Fitur gap |
| "Profil Masjid Digital" | Parsial lewat `/k/[slug]` | Belum ada halaman Masjid khusus |
| "Direktori Warga RT" | ❌ Belum dibangun | Fitur gap |
| "Kalender Islam" | ❌ Belum dibangun | Fitur gap |
| "Peta Komunitas Terdekat" | ❌ Belum dibangun | Fitur gap |
| "Direktori Kontak Penting" | ❌ Belum dibangun | Fitur gap |
| "Broadcast Pengumuman" | Parsial (per-komunitas, belum multi-community) | Fitur gap |
| "Discovery Komunitas" | ❌ Belum dibangun | Fitur gap |
| "Follow Komunitas" | ❌ Belum dibangun | Fitur gap |

---

## 2. PEMETAAN 18 DOMAIN → KODEBASE

### 2.1 Masjid Digital (30 fitur) — 🟡 Parsial
| Status | Fitur dari Docs-wa | Kodebase |
|--------|-------------------|----------|
| ✅ Built | Input Kas Masjid | `catatKas()`, `/laporan-kas/baru` |
| ✅ Built | Dashboard Kas Publik | Beranda kas summary, `/laporan-kas` |
| ✅ Built | Laporan Kas Otomatis (PDF) | `/laporan-kas` + `window.print()` |
| ❌ Gap | QR Code Masjid | — |
| ✅ Built | Jadwal Sholat Otomatis | `prayer.ts` (Aladhan API Kemenag) |
| ✅ Built | Jadwal Taklim & Kajian | Events system + RSVP |
| ❌ Gap | Kalender Islam | — |
| ❌ Gap | Profil Masjid Digital | Parsial: `/k/[slug]` publik |
| ❌ Gap | Direktori Pengurus DKM | — |
| ✅ Built | Pengumuman Masjid | Announcements system |
| ✅ Built | Donasi Infaq Digital | Donasi + upload bukti |
| ❌ Gap | Booking Fasilitas Masjid | Fase 2, belum |
| ❌ Gap | Zakat Fitrah Digital | Fase 2, belum |
| ❌ Gap | Zakat Mal Kalkulator | Fase 2, belum |
| ❌ Gap | Sisanya (13 fitur) | Fase 3-5, parkir |

### 2.2 RT/RW Digital (25 fitur) — 🟡 Parsial
| Status | Fitur dari Docs-wa | Kodebase |
|--------|-------------------|----------|
| ✅ Built | Iuran RT/RW Digital | Donasi jenis `iuran` |
| ❌ Gap | Status Iuran per Warga | — |
| ❌ Gap | Reminder Iuran Otomatis | — |
| ✅ Built | Kas RT Transparan | Kas system (sama dgn Masjid) |
| ❌ Gap | Direktori Warga RT | — |
| ✅ Built | Pengumuman RT/RW | Announcements system |
| ❌ Gap | Program Sosial RT | — |
| ✅ Built | Laporan Keamanan Lingkungan | Lapor system |
| ✅ Built | Voting & Polling Warga | Polling system |
| ❌ Gap | Surat Pengantar Digital | Fase 2 |
| ❌ Gap | Sisanya (15 fitur) | Fase 3-5 |

### 2.3 Digital Platform (20 fitur) — 🟢 Mostly Built
| Status | Fitur | Kodebase |
|--------|-------|----------|
| ✅ Built | SSO Komunitas | Supabase Auth (magic link + Google) |
| ✅ Built | Push Notification | Web Push (VAPID) |
| ✅ Built | Enkripsi Data Privat | RLS + HTTPS + zod |
| ✅ Built | Audit Trail | SHA-256 hash chain |
| ✅ Built | Pencarian Global | `/cari` + Search bar |
| ❌ Gap | Peta Komunitas Terdekat | — |
| ✅ Built | Aplikasi Android (PWA) | Manifest + Service Worker |
| ✅ Built | Progressive Web App | Serwist 9.x |
| ✅ Built | Mode Offline | IndexedDB offline queue |
| ❌ Gap | WhatsApp Integration | Fase 2 |
| ❌ Gap | Verifikasi Identitas | Fase 2 |
| ❌ Gap | Dashboard Analytics | Fase 2 |
| ❌ Gap | Aplikasi iOS | Fase 2 (PWA sudah cukup) |
| ❌ Gap | API Publik | Fase 3 |
| ❌ Gap | Integrasi BAZNAS | Fase 3 |
| ❌ Gap | AI Asisten | Fase 4 |

### 2.4 Cross Domain (40 fitur) — 🟡 Parsial
| Status | Fitur | Kodebase |
|--------|-------|----------|
| ✅ Built | Feed Komunitas Terpadu | `/komunitas` feed |
| ✅ Built | Profil Pengguna | `/profil` |
| ❌ Gap | Direktori Kontak Penting | — |
| ❌ Gap | Broadcast Pengumuman | Parsial |
| ❌ Gap | Discovery Komunitas | — |
| ❌ Gap | Follow Komunitas | — |
| ❌ Gap | Panduan Pengurus Baru | — |
| ❌ Gap | Template Komunitas | — |
| ❌ Gap | Pelatihan Pengurus | — |
| ❌ Gap | Galang Dana Komunitas | Fase 2 |
| ❌ Gap | Chat Komunitas | Fase 2 |
| ❌ Gap | Galeri Foto Kegiatan | Fase 2 |

### 2.5 HarmoniFamily (25 fitur) — 🔴 NOT BUILT
Semua fitur Fase 2-5. **Satu-satunya di kodebase:** Mutabaah Harian (✅), tapi ini tidak tercantum
di 300 Fitur Roadmap — fitur bonus dari perencanaan v1. Kategori "Keluarga" di beranda saat ini
tidak punya halaman.

### 2.6 ZISWAF Hub (20 fitur) — 🔴 Parsial
Hanya **Donasi Infaq Digital** (fitur #15) yang dibangun. Sisanya (Zakat Fitrah, Zakat Mal, Wakaf,
LAZ, Mustahiq, dll) Fase 2-5.

### 2.7 Sisa Domain (11 domain) — 🔴 NOT BUILT
HarmoniPay, Marketplace, Rides, Delivery, Ekonomi Syariah, e-Government, HarmoniEnergy,
Lingkungan, Infrastruktur, Ormas Digital, Pendidikan — semua Fase 2-5, **sebagian besar parkir**.

---

## 3. 6 KATEGORI DI BERANDA — MAP KE DOMAIN

| Kategori Beranda | Domain Docs-wa | Fitur # | Status Sekarang | Rekomendasi |
|-----------------|----------------|---------|-----------------|-------------|
| **Donasi** | ZISWAF Hub | #15 Donasi Infaq Digital | ✅ Halaman `/donasi` lengkap (riwayat + form + verifikasi) | Tetap, tambah statistik |
| **Keluarga** | HarmoniFamily (25 fitur) | #56-80 | 🔴 Tidak ada halaman | Label "Menyusul" atau redirect ke beranda |
| **Masjid** | Masjid Digital (30 fitur) | #1-30 | ⚠️ Parsial: Kas ✅, Jadwal ✅, Pengumuman ✅, Kegiatan ✅ — tapi terpencar | **Prioritas: buat `/masjid` page** yang aggregation dashboard |
| **Pasar** | Marketplace (8 fitur) | #141-148 | 🚫 **Dilarang** (parkir, ROADMAP.md) | **Hapus dari kategori** atau ganti "Segera" |
| **B & B** | Pendidikan (25 fitur) | #81-105 | 🔴 Tidak ada halaman (parkir, produk terpisah) | Label "Menyusul" atau redirect |
| **RT/RW** | RT/RW Digital (25 fitur) | #31-55 | ⚠️ Parsial: Kas ✅, Iuran ✅, Lapor ✅, Polling ✅, Pengumuman ✅ — terpencar | **Prioritas: buat `/rt-rw` page** yang aggregation dashboard |

---

## 4. MVP (Fase 1) FITUR — STATUS REALITA

Dari 32 fitur MVP di Docs-wa, **~18 fitur sudah fully/partially built**. Berikut detailnya:

### ✅ Built (12 fitur)
| # | Fitur | Prioritas | Kompleksitas |
|---|-------|-----------|-------------|
| 1 | Input Kas Masjid | P1 | Rendah |
| 2 | Dashboard Kas Publik | P1 | Rendah |
| 3 | Laporan Kas Otomatis PDF | P1 | Rendah |
| 5 | Jadwal Sholat Otomatis | P1 | Rendah |
| 6 | Jadwal Taklim & Kajian | P1 | Rendah |
| 10 | Pengumuman Masjid | P1 | Rendah |
| 31 | Iuran RT/RW Digital | P1 | Rendah |
| 34 | Kas RT Transparan | P1 | Rendah |
| 39 | Pengumuman RT/RW | P1 | Rendah |
| 221 | SSO Komunitas | P1 | Sedang |
| 222 | Push Notification | P1 | Rendah |
| 268 | Feed Komunitas Terpadu | P1 | Sedang |

### ✅ Parsial (6 fitur — ada dasar, kurang polish)
| # | Fitur | Yang Kurang |
|---|-------|------------|
| 3 | Laporan Kas PDF | `window.print()` ada, tapi belum PDF export native |
| 7 | Kalender Islam | Jadwal sholat ada, belum integrasi kalender Hijriah |
| 8 | Profil Masjid Digital | `/k/[slug]` minimal, belum halaman Masjid khusus |
| 15 | Donasi Infaq Digital | Donasi manual sudah, belum dashboard publik donasi |
| 229 | Enkripsi Data Privat | RLS ada, belum enkripsi end-to-end (cukup untuk v1) |
| 232 | Aplikasi Android | PWA sudah, belum native Android (cukup untuk v1) |

### ❌ Gap — MVP Fase 1 belum dibangun (4 fitur)
| # | Fitur | Prioritas | Estimasi Bangun |
|---|-------|-----------|----------------|
| 4 | QR Code Masjid | P1 Rendah | 1-2 jam (generate QR dari slug komunitas) |
| 36 | Direktori Warga RT | P2 Rendah | 2-3 jam (tabel + halaman) |
| 262 | Direktori Kontak Penting | P2 Rendah | 1-2 jam |
| 284 | Panduan Pengurus Baru | P1 Rendah | 2-4 jam |

### ❌ Gap — MVP Fase 1 P2 belum dibangun (6 fitur)
| # | Fitur | Prioritas | Estimasi |
|---|-------|-----------|----------|
| 33 | Reminder Iuran Otomatis | P2 Rendah | 4 jam (notif + cron) |
| 225 | Peta Komunitas Terdekat | P2 Sedang | 6-8 jam (PostGIS + map) |
| 263 | Broadcast Pengumuman | P2 Rendah | 2 jam |
| 269 | Discovery Komunitas | P2 Sedang | 4-6 jam |
| 270 | Follow Komunitas | P2 Rendah | 2 jam |
| 285 | Template Komunitas | P2 Rendah | 3-4 jam |

---

## 5. GAP BAHASA PALING KRITIS (Sumber Kebingungan)

Inilah perbedaan fundamental antara Docs-wa dan realitas kodebase yang **tidak boleh dipaksa
sama**, karena akan merusak fondasi yang sudah dibangun:

| Aspek | Docs-wa (SuperApp) | Kodebase (Realita) | Dampak jika dipaksa |
|-------|-------------------|--------------------|---------------------|
| **Tech Stack** | Flutter + Go + Kafka + MongoDB + Elasticsearch + Redis + Hyperledger | Next.js + Supabase (Postgres) + Tailwind | Harus ganti total stack |
| **Auth** | Keycloak enterprise + MFA | Supabase Auth (built-in) + Google OAuth | Break semua RLS & session |
| **Pembayaran** | Xendit + QRIS + dompet digital | Transfer manual + foto bukti | Butuh izin OJK, bayar bulanan |
| **Blockchain** | Hyperledger Fabric, Rp 105-470 M | SHA-256 hash chain di Postgres | Gratis vs miliaran |
| **Mobile** | Flutter native Android + iOS | PWA (Serwist) | Bangun ulang dari nol |
| **Tim** | 1-3 dev (MVP) → 20+ dev (Fase 5) | 1 AI + 1 pemilik | Skala berbeda |
| **Database** | 6 jenis database | 1 Postgres (Supabase) | Over-engineering |
| **Organisasi** | 11 tingkat, gaji inverted | Tanggung jawab teknis sederhana | Over-engineering |
| **Biaya/tahun** | Rp 1,35 T (Pilot) → Rp 69,89 T (Saturasi) | Rp 0 (kecuali domain) | Beda 13+ digit |

### Prinsip yang TETAP SAMA (jangan diubah):
- **Multi-tenant dengan `community_id`** → ✅ sudah benar
- **RLS sebagai otorisasi utama** → ✅ sudah benar
- **TANPA NIK/data sensitif** → ✅ sudah benar
- **Transparansi kas dengan rantai hash** → ✅ sudah benar
- **Upload bukti donasi** → ✅ sudah benar
- **Mobile-first + offline** → ✅ sudah benar
- **Gratis total** → ✅ sudah benar

---

## 6. REKOMENDASI ALIGNMENT

### Jangan diubah (foundation sudah benar):
1. Stack: Next.js 16 + Supabase + Tailwind → tetap
2. Auth: Supabase Auth (magic link + Google OAuth) → tetap, tambah Resend nanti
3. Pembayaran: transfer manual + foto bukti → tetap (parkir payment gateway)
4. Database: 1 Postgres via Supabase → tetap (tambah indexing jika perlu)
5. Blockchain: SHA-256 hash chain di Postgres → tetap (Hyperledger = Fase 5)
6. Mobile: PWA → tetap (native Flutter = Fase 2-3)

### Yang perlu ditambah (alignment ringan):
1. **Terminologi halaman** — ganti judul/jargon di UI dari bahasa teknis ke "bahasa komunitas"
   (mis: "Postingan" → "Info Warga", "Kas" → "Kas Komunitas")
2. **Mapping kategori** — 6 kategori beranda bisa dipertahankan tapi:
   - **Masjid** → landing page yang aggregation fitur Masjid (Kas Masjid, Jadwal, Kajian, Pengumuman)
   - **RT/RW** → landing page yang aggregation fitur RT/RW (Kas RT, Iuran, Lapor, Warga)
   - **Donasi** → sudah ada, tetap
   - **Keluarga** → link ke Mutabaah (satu-satunya fitur yang cocok) + label "Lainnya menyusul"
   - **Pasar** → **HAPUS** (marketplace dilarang) atau ganti ikon jadi "Lapak" dengan coming soon
   - **B & B** → ganti label jadi "Belajar" → link ke Mutabaah + coming soon

### Yang perlu dibangun (MVP gap):
1. **QR Code Masjid** (Fitur #4) — 1-2 jam, generate QR dari slug komunitas
2. **Direktori Warga RT** (Fitur #36) — 2-3 jam
3. **Direktori Kontak Penting** (Fitur #262) — 1-2 jam
4. **Panduan Pengurus Baru** (Fitur #284) — 2-4 jam

### Yang DILARANG dibangun:
1. Marketplace/Pasar (Fitur #141-148) — parkir, butuh payment gateway
2. HarmoniPay (Fitur #131-140) — parkir, butuh izin OJK
3. Blockchain/Hyperledger (docs passim) — parkir, biaya Rp 470 M
4. Pendidikan/B&B (Fitur #81-105) — parkir, produk terpisah
5. Chat realtime (Fitur #261) — parkir, butuh WebSocket/Realtime

---

## 7. RINGKASAN EKSEKUTIF

**Dasar yang sudah dibangun SUDAH SESUAI** dengan arsitektur inti Docs-wa:
✅ Multi-tenant, ✅ RLS, ✅ Transparansi kas, ✅ Audit hash chain, ✅ PWA offline,
✅ Auth aman, ✅ Donasi manual, ✅ Feed komunitas.

**Perbedaan utama** bukan di "apa yang dibangun" tapi di "bagaimana":
- Docs-wa membayangkan **SuperApp nasional dengan dana triliunan + blockchain + Flutter + 20 dev**
- Realita membangun **PWA gratis dengan 1 AI + 1 pemilik di Next.js + Supabase**

**Alignment yang perlu:**
1. Ubah **label/judul fitur** di UI supaya cocok dengan bahasa Docs-wa
2. Tambah **3 fitur MVP ringan** (QR Masjid, Direktori Warga, Kontak Penting)
3. Buat **halaman landing Masjid dan RT/RW** yang aggregation fitur existing
4. Rapihkan **navigasi kategori** — hapus/disable yang parkir

**Ini TIDAK perlu diubah:**
Semua kode yang sudah ada. Alignment hanya di label, navigasi, dan penambahan fitur ringan.
Foundation 21 tabel, 6 migrasi, RLS, auth, PWA — semua sudah benar.
