# AUDIT UX FULL — Gotong Royong PWA (24 Jun 2026)

> **Metode:** Browsing langsung via browser-act (chrome-direct) ke
> `https://gotong-royong-pwa.wimxgooo.workers.dev` sebagai **guest (belum login)**.
> Semua screenshot di `docs/audit-screenshots/`.

---

## RINGKASAN EKSEKUTIF

| Item | Temuan |
|------|--------|
| Total masalah UX | **10 masalah** (3 critical, 4 high, 2 medium, 1 low) |
| halaman diaudit | `/`, `/masuk`, `/beranda`, `/komunitas`, `/aksi`, `/pesan`, `/profil`, `/k/wafi-96vl`, `/pilih-peran`, `/onboarding`, `/cari` |
| Pola dominan | **Tombol "Masuk" duplikat di mana-mana**, navigasi bawah sebagian besar rusak untuk guest, alur onboarding kontradiktif dengan "TikTok mode" |

---

## MASALAH #1 (CRITICAL) — Guest landing page punya 2 tombol "Masuk"

**Lokasi:** `/` (GuestBeranda) — `src/components/features/guest-beranda.tsx:30-35` dan `:79-84`

**Akar masalah:** Dua komponen berbeda yang sama-sama nge-link ke `/masuk`:

| Tombol | Baris | Teks | Style |
|--------|-------|------|-------|
| Navbar kanan atas | 30-35 | `Masuk` (dengan icon LogIn) | rounded-full bg-white/15 |
| CTA card tengah | 79-84 | `Masuk` (dengan icon LogIn) | rounded-full bg-primary, putih |

**Dampak UX:**
- Pengunjung bingung mana yang harus diklik
- "Sudah punya akun?" card seolah mengatakan "kalau belum punya akun, jangan klik" — menambah friction
- Dua tombol identik di halaman yang sama = pelanggaran prinsip "satu primary action per halaman"

**Rekomendasi:**
- Hanya 1 tombol "Masuk" — pilih navbar (konsisten di semua halaman) ATAU CTA card
- Kalau navbar dipilih → hilangkan card "Sudah punya akun?" karena sudah diwakili navbar
- Atau: navbar "Masuk" tetap, card diganti jadi ajakan daftar/manfaat

---

## MASALAH #2 (CRITICAL) — Auto-redirect ke `/pilih-peran` rusak TikTok mode

**Lokasi:** `src/components/features/guest-beranda.tsx:8-12`

```tsx
useEffect(() => {
  const roles = localStorage.getItem("selectedRoles");
  if (!roles) {
    router.replace("/pilih-peran");
  }
}, [router]);
```

**Akar masalah:**
- Saat halaman `/` dimuat, `useEffect` langsung cek localStorage
- Kalau belum pernah milih peran → redirect ke `/pilih-peran`
- User **tidak sempat membaca** konten landing page (judul, fitur, value prop)
- Langsung dilempar ke halaman role selection

**Dampak UX:**
- Kontradiksi dengan TikTok mode (content first, role optional)
- User harus milih 1+ role sebelum bisa liat apa pun
- Bounce risk tinggi: user landing → redirect → "wah ribet" → tutup

**Rekomendasi:**
- **Hapus** `useEffect` redirect ini (TikTok mode = langsung lihat konten)
- Simpan role selection sebagai **opsional**, bisa diakses dari menu Profil
- Atau tunda redirect sampai user mencoba aksi yang butuh role (mis. buat postingan)

---

## MASALAH #3 (CRITICAL) — 2 tombol "Masuk" di halaman publik komunitas + tidak ada auth check

**Lokasi:** `/k/[slug]` — `src/app/k/\[slug\]/page.tsx:124-129` dan `:279-284`

**Akar masalah:**
Halaman `/k/[slug]` adalah **RSC Server Component** yang tidak ngecek `getUser()`. Bandingkan
dengan beranda (`page.tsx:60-64`) yang punya:

```tsx
const user = await getUser();
if (!user) { return <GuestBeranda />; }
```

**Dampak UX:**
- User YANG SUDAH LOGIN tetap lihat 2 tombol "Masuk" → bingung
- Guest lihat 2 tombol duplikat

**Rekomendasi:**
1. Tambah `getUser()` di awal halaman
2. Kalau user sudah login → redirect ke beranda **ATAU** ganti tombol jadi "Buka Beranda"
3. Untuk halaman publik guest → cukup 1 tombol "Masuk" di navbar saja (hapus CTA card)

---

## MASALAH #4 (HIGH) — 4/5 bottom nav link rusak untuk guest

**Lokasi:** `src/components/layout/bottom-nav.tsx`

| Link | Guest click → | Halaman |
|------|--------------|---------|
| Beranda (`/`) | ✅ OK | Landing page |
| Komunitas (`/komunitas`) | ❌ | Diarahkan ke halaman login (sama seperti `/masuk`) |
| Aksi (`/aksi`) | ⚠️ | Halaman konten terbaca, tapi semua action link butuh login |
| Pesan (`/pesan`) | ❌ | Diarahkan ke halaman login |
| Profil (`/profil`) | ❌ | Diarahkan ke halaman login |

**Akar masalah:**
- Bottom nav dirender oleh `AppFrame` untuk SEMUA route kecuali `/masuk`, `/onboarding`, `/k/`, dll
- Guest bisa lihat bottom nav tapi 4/5 link tidak berguna

**Rekomendasi:**
- Sembunyikan bottom nav untuk guest (AppFrame cek `user`)
- ATAU ganti bottom nav guest: [Explore] [Cari Komunitas] [Masuk]
- `/komunitas` seharusnya bisa nampilin daftar komunitas publik meski guest

---

## MASALAH #5 (HIGH) — `/beranda` return 404

**URL:** `https://gotong-royong-pwa.wimxgooo.workers.dev/beranda`
**Response:** Halaman 404 "Halaman tidak ditemukan"

**Akar masalah:**
Route `/` = landing page/beranda, tapi `/beranda` sebagai path terpisah tidak ada.

**Dampak UX:**
- Kalau ada user yang bookmark atau klik link "Beranda" dari luar, dapat 404
- Inkonsisten: bottom nav tulis "Beranda" tapi URL-nya `/`

**Rekomendasi:**
- Buat redirect `/beranda` → `/` di `src/proxy.ts` ATAU di root layout
- Atau buat halaman `/beranda` yang isinya sama dengan `/`

---

## MASALAH #6 (HIGH) — Kategori section: 5/6 kategori mati, semua icon sama

**Lokasi:** `src/app/page.tsx:32` dan `:229-248`

```tsx
const kategori = ["Donasi", "Keluarga", "Masjid", "Pasar", "B & B", "RT/RW"];
// ...
const href = i === 0 ? "/donasi" : "#";  // hanya Donasi yang punya link
```

| Kategori | Link | Icon | Masalah |
|----------|------|------|---------|
| Donasi | ✅ `/donasi` | HeartHandshake | OK |
| Keluarga | ❌ `#` | HeartHandshake | mati semua |
| Masjid | ❌ `#` | HeartHandshake | mati semua |
| Pasar | ❌ `#` | HeartHandshake | mati + dilarang (marketplace) |
| B & B | ❌ `#` | HeartHandshake | mati semua |
| RT/RW | ❌ `#` | HeartHandshake | mati semua |

**Dampak UX:**
- User klik kategori → tidak terjadi apa-apa → frustrasi
- Pasar seharusnya dihapus (marketplace dilarang per aturan proyek)
- Semua icon sama, tidak ada pembeda visual

**Rekomendasi:**
- Hapus Pasar (dilarang), ganti Keluarga & B&B jadi link ke Mutabaah (label "Menyusul")
- Masjid → landing page aggregasi fitur masjid (baru dibangun)
- RT/RW → landing page aggregasi fitur RT/RW (baru dibangun)
- Kasih icon berbeda per kategori

---

## MASALAH #7 (HIGH) — 8 roles di `/pilih-peran`, 4 tanpa fitur

**Lokasi:** `src/app/pilih-peran/page.tsx`

| Role | Fitur tersedia | Status |
|------|---------------|--------|
| Masjid | Jadwal, Kas, Kegiatan, Donasi | ✅ Partial |
| Keluarga | Mutabaah | ⚠️ Minimal |
| Pesantren | Tidak ada | ❌ 0 fitur |
| RT/RW | Kas, Iuran, Lapor, Polling | ✅ Partial |
| UMKM Pasar | Tidak ada | ❌ Dilarang (marketplace) |
| Belajar & Bertumbuh | Tidak ada | ❌ 0 fitur |
| Bersedekah & Berdonasi | Donasi manual | ✅ Ada |
| Ojek Online | Tidak ada | ❌ 0 fitur |

**Dampak UX:**
- User milih "Pesantren" atau "Ojek Online" → masuk app → tidak ada konten → kecewa
- UMKM tetap muncul meski dilarang

**Rekomendasi:**
- Hapus UMKM Pasar (dilarang)
- Hapus Ojek Online (tidak relevan dengan core value masjid/rt/rw)
- Hapus Pesantren (tidak ada fitur, parkir ke fase berikutnya)
- Atau disable + label "Segera hadir"

---

## MASALAH #8 (MEDIUM) — Alur flow kontradiktif

**Flow saat ini (broken):**

```
Visitor → `/` (GuestBeranda render 100ms)
        → useEffect redirect ke `/pilih-peran` (auto!)
        → Pilih 1+ role → klik Lanjutkan
        → Kembali ke `/` (GuestBeranda, tapi kali ini localStorage ada "selectedRoles")
        → Masih guest — landing page muncul dengan 2 tombol Masuk + fitur card
```

**Masalah:**
- User dipaksa pilih role sebelum lihat apa pun
- Setelah milih role, landing page tetap sama (selectedRoles tidak dipakai di GuestBeranda untuk apa pun selain cek di useEffect)
- Loop: kalau user HAPUS localStorage → redirect lagi

**Rekomendasi:**
- TikTok mode: landing page langsung konten + hanya 1 tombol "Masuk" di navbar
- Role selector: pindah ke menu Profil → Pengaturan → Peran Saya (opsional)
- Atau munculin role selector setelah user login (bukan sebelum)

---

## MASALAH #9 (MEDIUM) — Tidak ada guest-accessible content

**Yang bisa diakses guest tanpa login:**
- `/` → Landing page (fitur card, 2 tombol Masuk)
- `/k/[slug]` → Halaman publik komunitas (kalau tahu slug)
- `/pilih-peran` → Role selection
- `/masuk` → Login page

**Yang TIDAK bisa diakses guest:**
- Feed postingan komunitas → tidak bisa lihat
- Jadwal sholat komunitas → hanya di halaman publik /k/[slug]
- Daftar komunitas publik → tidak ada
- Donasi → tidak bisa lihat

**Rekomendasi:**
- Landing page bisa jadi "jendela" ke konten publik: tampilkan jadwal sholat global, atau feed publik
- Buat `/jelajahi` (explore) page yang menampilkan komunitas publik tanpa login
- Guest harus bisa merasakan value sebelum daftar

---

## MASALAH #10 (LOW) — `/aksi` center button tanpa label teks

**Lokasi:** `src/components/layout/bottom-nav.tsx:27-37`

Bottom nav item "Aksi" (index [7]) adalah tombol tengah yang lebih besar, bulat, warna primary,
dengan icon `Plus`. Di state browser, item ini muncul sebagai:
```
[7]<a aria-label=Aksi />
```

Tanpa teks label (berbeda dengan Beranda, Komunitas, Pesan, Profil yang punya teks).

**Dampak:** Pengguna baru mungkin tidak langsung paham tombol plus di tengah itu untuk apa.

**Rekomendasi:** Tambah teks "Aksi" di bawah icon seperti item lain, atau pastikan label jelas.

---

## RELEVANSI DENGAN SKILLS YANG ADA

### Skills lokal (bisa dimuat langsung):
| Skill | Untuk apa |
|-------|-----------|
| **cro** | Optimasi konversi: 2 tombol "Masuk" jadi 1, hapus friction |
| **signup** | Perbaiki alur masuk/daftar biar ga bingung |
| **onboarding** | Desain ulang alur guest → registered user (TikTok mode) |
| **ui-ux-pro-max** | Redesign kategori section, bottom nav, navigasi umum |
| **design-taste-frontend** | Konsistensi UI, hapus duplikasi, polish visual |
| **brainstorming** | Sebelum ngoding, brainstorm solusi per masalah |
| **frontend-design** | Implementasi redesign komponen |

### Riset internet (referensi):
| Artikel | Link |
|---------|------|
| SaaS UX Audit Step by Step (2026) | https://www.925studios.co/blog/how-to-run-a-ux-audit-for-your-saas-product |
| SaaS Login Page UX Best Practices | https://edana.ch/en/saas-login-page-ux-best-practices-to-minimize-friction |
| CTA Button Best Practices (2026) | https://www.designstudiouiux.com/blog/cta-button-design-best-practices |
| SaaS Onboarding UX Patterns (2026) | https://www.designstudiouiux.com/blog/saas-onboarding-ux |
| How Many CTAs Per Page | https://vwo.com/blog/call-to-action-buttons-ultimate-guide |
| SaaS Navigation Menu Design | https://lollypop.design/blog/saas-navigation-menu-design |

---

## PRIORITAS PERBAIKAN

| Priority | Masalah | Effort | Dampak |
|----------|---------|--------|--------|
| 🔴 P0 | #2 Auto-redirect rusak TikTok mode | 5 menit (hapus useEffect) | Sangat tinggi |
| 🔴 P0 | #1 + #3 2 tombol Masuk di 2 halaman | 30 menit | Sangat tinggi |
| 🔴 P0 | #6 Kategori 5/6 mati | 2 jam (redesign section) | Tinggi |
| 🟡 P1 | #4 Bottom nav 4/5 broken untuk guest | 1 jam | Tinggi |
| 🟡 P1 | #5 `/beranda` 404 | 5 menit (redirect) | Rendah |
| 🟡 P1 | #7 Role tanpa fitur | 1 jam (filter roles) | Sedang |
| 🟢 P2 | #8 Alur flow kontradiktif | 3 jam (restruktur) | Tinggi |
| 🟢 P2 | #9 Tidak ada guest content | 4+ jam (fitur baru) | Sedang |
| 🔵 P3 | #10 Aksi tanpa label | 5 menit | Rendah |

---

## LAMPIRAN: Screenshot

Semua screenshot ada di `docs/audit-screenshots/`:

| File | Halaman | Catatan |
|------|---------|---------|
| `01-beranda-guest.png` | `/` landing page guest | 2 tombol Masuk, bottom nav |
| `02-halaman-masuk.png` | `/masuk` | Clean (1 Google + 1 email) |
| `03-halaman-beranda.png` | `/beranda` | **404!** |
| `04-halaman-komunitas.png` | `/komunitas` | Redirect ke login |
| `05-halaman-profil.png` | `/profil` | Redirect ke login |
| `06-halaman-pesan.png` | `/pesan` | Redirect ke login |
| `07-halaman-komunitas-wafi.png` | `/k/wafi-96vl` | 2 tombol Masuk (navbar + CTA) |
| `08-halaman-pilih-peran.png` | `/pilih-peran` | 8 roles, banyak tanpa fitur |
| `09-halaman-cari.png` | `/cari` | Redirect ke login |
