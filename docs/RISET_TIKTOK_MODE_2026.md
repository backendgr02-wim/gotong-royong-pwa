# Riset TikTok Mode — Onboarding & UX 2026

> **Tujuan:** Mendokumentasikan 3 ronde riset internet tentang tren onboarding 2026, kompetitor
> aplikasi RT/RW Indonesia, dan best practice guest-mode/content-first. Hasil ini dipakai untuk
> redesign GuestBeranda menjadi TikTok-like: konten dulu, login cuma saat aksi.

---

## Ringkasan Eksekutif

| Item | Temuan Utama |
|------|-------------|
| Tren 2026 | **Content-first onboarding** mendominasi — TikTok, Pinterest, Threads, ChatGPT semuanya tanpa gate. Guest mode default. |
| Kompetitor RI | **Tidak ada** aplikasi RT/RW PWA yang pakai content-first. Semua masih gate (role / login dulu). Ini **kesempatan first-mover**. |
| Risiko gate | Base44 gate (role selection first) bertentangan dengan 3/5 top onboarding best practices 2026. |
| Rekomendasi | **Guest mode murni**: prayer times + public feed + donasi publik langsung dari landing page. Role selector jadi setting opsional (di profil). |

---

## Ronde 1 — 2026 UX Trends (3 Pola Dominan)

> **Sumber:** NN/g, UX Collective, Google I/O 2025/2026

### Pola A: Content-First / No-Gate Onboarding
- **TikTok, Pinterest, Threads, ChatGPT, Instagram (2025+):** tidak ada "pilih minat" sebelum lihat konten.
- Algoritma belajar dari **perilaku aktual** (scroll, tap, durasi), bukan pilihan awal yang sering salah.
- **Bukti:** Pinterest dulu punya gate 35-minat → dihapus → signup naik 15%.
- **Untuk Gotong Royong:** Role selector sebaiknya tidak jadi gate. Konten publik (sholat, feed, donasi) harus tampil dulu.

### Pola B: Progressive Engagement
- Fitur ditampilkan bertahap, bukan semua sekaligus.
- "TikTok tahu kapan harus minta login" — setelah user mencoba like, comment, atau upload.
- **Untuk Gotong Royong:** Fitur yang butuh login (post, donasi, RSVP) tampilkan sebagai CTA login, bukan blokir halaman.

### Pola C: Bottom Navigation + Contextual CTA
- Guest road: konten publik → CTA login saat aksi → redirect back ke konten.
- **Untuk Gotong Royong:** Pindahkan navigasi role selector ke halaman profil (setelah login), bukan sebagai gate awal.

---

## Ronde 2 — Kompetitor Aplikasi RT/RW Indonesia

> **Metode:** Pencarian Google Play Store, web search, PWA directory. Tanggal: 22-23 Jun 2026.

### Aplikasi yang Ditemukan (5 pesaing langsung)

| Aplikasi | Platform | Gate? | PWA? | Content-first? | Catatan |
|----------|----------|-------|------|----------------|---------|
| **Lokawarga** | Hybrid | Login wajib ❌ | ❌ | ❌ | Gate ketat — buka app langsung minta login. Mirip Base44 gate. |
| **eWarga** | Native | Login wajib ❌ | ❌ | ❌ | Bisa pilih kelurahan setelah login. Email/Google auth. |
| **RukunKita** | Native | Login wajib ❌ | ❌ | ❌ | WA OTP login dulu, baru lihat fitur. |
| **Aplikasi RT** | PWA ⚡ | Login wajib ❌ | ✅ | ❌ | PWA tapi masih gate login. Fitur terbatas (surat, iuran). |
| **RT RW Digital** | Web | Login wajib ❌ | ❌ | ❌ | WA OTP login. Dashboard setelah login. |

### Temuan Penting

1. **SEMUA kompetitor masih pakai login gate** — tidak ada yang menerapkan content-first.
2. **Aplikasi RT (PWA)** adalah satu-satunya kompetitor berbasis PWA. Fiturnya terbatas: surat pengantar, info iuran. Tidak ada jadwal sholat, feed, atau fitur keagamaan.
3. **Tidak ada yang gratis** — semua native apps berukuran 50-200 MB. PWA Gotong Royong akan jauh lebih ringan.
4. **Rata-rata rating Play Store:** 3.8 - 4.2. Keluhan terbanyak = "ribet daftar" dan "jarang dipakai".

### PWA Indonesia Adoption Data (2026)

| Metrik | Data | Sumber |
|--------|------|--------|
| Pengguna smartphone RI | 210M+ | We Are Social 2026 |
| PWA sebagai alternatif native | Tren naik 40% sejak 2024 | Google I/O 2025 |
| PWA untuk tier-3 kota | 78% prefer PWA (karena storage) | Survey Google 2025 |
| Biaya data per MB | $0.03/MB (salah satu termahal ASEAN) | Cable.co.uk 2025 |

**Insight:** PWA Gotong Royong dengan ukuran << 5MB sangat cocok untuk tier-3 kota dan daerah dengan koneksi 3G.

---

## Ronde 3 — Onboarding Best Practices 2026 (Deep Dive)

> **Sumber:** UX studio, Growth.Design, Appcues, Userpilot, 6+ artikel + 200+ flow analysis.

### 5 Best Practice yang Paling Relevan

#### 1. Delay the Sign-Up Wall (Guest Mode Strategy)
- **Sumber:** SemNexus Mar 2026, Appcues 2026
- **Inti:** Jangan minta register sebelum user lihat value. Guest mode dulu → value demonstrated → signup prompt.
- **Data:** Forbes melaporkan signup walls dapat menurunkan tingkat konversi hingga 85-90%.
- **Implementasi:** Duolingo, Headspace, Pinterest, Spotify — semua allow browse first.

#### 2. Contextual Permission Requests
- **Sumber:** NN/g, SemNexus 2026
- **Inti:** Minta permission saat user *butuh* fitur itu, bukan saat buka app pertama kali.
- **Contoh:** Minta lokasi saat user tap "Jadwal Sholat" → bukan di splash screen.
- **Contoh:** Minta notifikasi saat user tap "Like" atau "Komentar" → evidence: opt-in rates skyrocket.

#### 3. Progressive Profiling
- **Sumber:** UX studio, SemNexus 2026
- **Inti:** Jangan tanya 10 field di form onboarding. Tanya 1-3 field dulu, lanjut lagi nanti.
- **Kasus Gotong Royong:** Role selector 8 pilihan + "pilih min 1" = progressive profiling violation. User overload.

#### 4. Accelerate the "Aha!" Moment
- **Sumber:** Growth.Design, Appcues, SemNexus 2026
- **Inti:** Setiap app punya "Aha!" moment — detik user menyadari value produk. FTUE harus di-engineer untuk sampai ke momen itu secepat mungkin.
- **Kasus Gotong Royong:** Aha! untuk warga = "Saya bisa lihat kas RT transparan" / "Saya tahu jadwal sholat".
  - Dengan gate: user harus pilih role (8 pilihan → kognitif overload) → klik lanjutkan → lihat halaman → baru aha! (atau enggak)
  - Tanpa gate: user langsung lihat jadwal sholat + kas publik di landing page → aha! dalam 3 detik.

#### 5. Gamify the Setup Process
- **Sumber:** SemNexus 2026
- **Inti:** Onboarding inherently boring. Progress bar, reward, celebratory animation untuk setup steps.
- **Kasus Gotong Royong:** Ini hanya relevan jika ada setup yang wajib. Kalau role selector jadi opsional (di profil), tidak perlu gamifikasi.

### Yang Tidak Relevan untuk Gotong Royong

| Best Practice | Kenapa Tidak Cocok |
|--------------|-------------------|
| Tooltip walkthrough | User tidak perlu tutorial untuk app komunitas — konsep sudah familiar |
| Video onboarding | Berat untuk PWA + 3G. User ga akan nonton. |
| Social signup | Kita sudah pakai magic link (email). Itu sudah cukup ringan. |

---

## Sintesis: TikTook Mode untuk Gotong Royong

### Flow Baru (Target)

```
Pengunjung pertama
  │
  ├──► / (Beranda guest)
  │     ├── Jadwal sholat (real time, public API)
  │     ├── Feed publik (pengumuman komunitas publik / featured)
  │     ├── Donasi publik (lihat progress, no login)
  │     └── Info aplikasi (lightweight, seperti sekarang)
  │
  ├──► User tap "Like" / "Komen" / "Donasi" / "Buat Post" / "RSVP"
  │     └──► Prompt login (modal / slide-up)
  │           ├──► Masuk (magic link)
  │           └──► Kembali (lanjut browsing)
  │
  ├──► Setelah login → masuk ke dashboard komunitas (seperti sekarang)
  │
  └──► Role selector → jadi setting di halaman profil (setelah login, opsional)
        (tidak perlu milih role untuk browsing)
```

### Perubahan yang Diperlukan

| File | Perubahan |
|------|-----------|
| `src/components/features/guest-beranda.tsx` | Hapus `useEffect` redirect. Hapus card "Mulai Sekarang". Hapus card redundant "Sudah punya akun? Masuk". Ganti dengan konten publik (sholat, feed, donasi). |
| `src/app/page.tsx` | Tidak perlu perubahan GuestBeranda — sudah import. Tapi mungkin perlu data publik untuk GuestBeranda. |
| `src/app/pilih-peran/page.tsx` | Tidak perlu diubah (masih bisa diakses dari profil setelah login). |
| Menu profil (belum ada) | Tambah link ke `/pilih-peran` sebagai setting setelah login. |

### Data Publik yang Bisa Ditampilkan ke Guest

| Data | Sumber | Auth? |
|------|--------|-------|
| Jadwal sholat | `fetchPrayerTimes()` + fallback lokasi (Cilandak) | ✅ Publik (API Aladhan) |
| Featured/pinned pengumuman publik | Tabel `announcements` dengan RLS `public_read` | ❌ Perlu RLS policy baru |
| Daftar komunitas (nama, jenis, lokasi) | Tabel `communities` dengan RLS `public_read` | ❌ Perlu RLS policy baru |
| Progress donasi publik | Tabel `donations` aggregate (tanpa data pengirim) | ❌ Perlu RLS policy baru |
| Kegiatan publik | Tabel `events` dengan RLS `public_read` | ❌ Perlu RLS policy baru |

**Catatan:** Saat ini RLS untuk tabel data utama (communities, announcements, events, donations) menolak anon. Untuk guest mode, perlu ditambah **RLS policy baru** yang memberikan akses read terbatas untuk `anon` role.

---

## Lampiran: Sumber Referensi

### Artikel Round 1
- NN/g UX Trends 2026 — content-first onboarding patterns
- UX Collective — progressive profiling & engagement
- Google I/O 2025 — PWA adoption data global + RI

### Artikel Round 2
- Google Play Store — 5 aplikasi kompetitor (screenshot + deskripsi)
- We Are Social 2026 — data pengguna smartphone RI
- Cable.co.uk 2025 — biaya data per negara

### Artikel Round 3
- SemNexus (Mar 2026) — "Top 5 App Onboarding Best Practices 2026" → guest mode delay signup wall
- Appcues 2026 — "FTUE Playbook" → progressive profiling
- Growth.Design — "Aha! Moment" case studies (Duolingo, Tinder, Spotify)
- NN/g — contextual permission requests
- UX studio — 200+ flow analysis report
- Userpilot — gamification in onboarding

---

*Dokumen ini disusun 23 Jun 2026. Siap untuk dipakai sebagai acuan implementasi TikTok mode.*
