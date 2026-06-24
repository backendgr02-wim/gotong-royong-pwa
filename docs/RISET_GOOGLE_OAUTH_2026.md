# Riset Google OAuth — Tambah "Masuk dengan Google" + Perbaikan Auth

> **Tujuan:** Menambahkan Google OAuth sebagai metode login utama dan menggantikan ketergantungan
> penuh pada email magic link yang dibatasi **2 email per jam oleh Supabase free plan**.
>
> **Pemicu langsung:** Supabase free tier hanya mengizinkan **2 email auth per jam project-wide**
> dengan built-in email provider. Setelah 2 kali kirim magic link, user tidak bisa login selama
> 1 jam penuh. Ini bukan error kode — ini batasan platform.
>
> **Dokumen ini berisi:** analisis masalah, perbandingan solusi, data demografis, arsitektur,
> estimasi biaya, dan rekomendasi final.

---

## Ringkasan Eksekutif

| Item | Temuan |
|------|--------|
| **Masalah inti** | Supabase free plan: **2 email/jam project-wide** untuk magic link. Error "Email rate limit exceeded" setelah 2 percobaan. |
| **Solusi utama** | **Tambah Google OAuth** — 1 klik, tanpa email, tanpa rate limit, konversi lebih tinggi. |
| **Solusi pendukung** | **Custom SMTP** (Resend/SendGrid) agar magic link tidak terbatas 2/jam untuk user yang tidak punya Google. |
| **Biaya Google OAuth** | **Gratis** — tidak ada biaya tambahan dari Supabase atau Google Cloud Console. |
| **Biaya custom SMTP** | **Gratis** — Resend: 100 email/hari gratis. SendGrid: 100 email/hari gratis. |
| **Keuntungan ganda** | Google OAuth = 80% user login 1 klik. Magic link + SMTP = 20% sisanya tetap terlayani. |

---

## Bab 1 — Masalah: Rate Limit Supabase 2 Email/Jam

### Fakta dari Dokumentasi Supabase

> **Sumber:** `supabase.com/docs/guides/auth/rate-limits` (2026)

| Operasi | Limit | Customizable? |
|---------|-------|---------------|
| Endpoints that trigger email sends (`/auth/v1/signup`, `/auth/v1/recover`) | **2 emails per hour** (built-in provider) | Hanya dengan custom SMTP |
| OTP request per email | 1 per 60 detik | Ya |
| Anonymous sign-ins per IP | 30 per jam | Tidak |
| Token refresh per IP | 30 per jam (burst 30) | Tidak |

### Dampak Langsung ke Gotong Royong

```
Skenario:
1. User A minta magic link jam 10:00 → ✅ terkirim
2. User A tidak cek email, minta lagi jam 10:05 → ❌ RATE LIMITED
3. User B, C, D coba login jam 10:00-11:00 → ❌ SEMUA kena rate limit
   (limit 2/jam = PROJECT-WIDE, bukan per user)

Akibat: Aplikasi mati total untuk login selama ~1 jam.
```

### Masalah Tambahan Built-in Email Provider

1. **Hanya untuk anggota organisasi Supabase** — email selain team members dapat error "Email address not authorized"
2. **Tidak ada SLA** — email bisa masuk spam atau tidak terkirim
3. **Tidak bisa dikustomisasi** — template email terbatas, sender name = noreply@supabase.co
4. **Tidak ada deliverability guarantee** — user menunggu >30 detik → tutup tab

---

## Bab 2 — Google OAuth sebagai Solusi Utama

### Bagaimana Google OAuth Menyelesaikan Masalah

```
Flow Google OAuth:
  User klik "Masuk dengan Google"
    → Redirect ke accounts.google.com (Chrome Custom Tab)
    → User pilih akun (atau otomatis jika sudah login)
    → Google redirect ke Supabase Callback
    → Supabase redirect ke /auth/callback?code=...
    → Kode tukar jadi session ✅

✅ Tidak sentuh email → tidak kena rate limit 2/jam
✅ 1 klik (tidak perlu ketik email, buka inbox, klik link)
✅ Tidak tergantung email deliverability
✅ Tidak perlu setup SMTP untuk login
```

### Data Demografis — Google Account di Indonesia

| Metrik | Angka | Sumber |
|--------|-------|--------|
| Populasi Indonesia | 286 juta | UN 2025 |
| Pengguna internet | 230 juta (80.5%) | DataReportal 2026 |
| Smartphone penetration | ~68% (187 juta) | Newzoo 2022, naik 2026 |
| Android market share RI | **86.8%** | DemandSage 2026 |
| Gmail users global | 1.8 miliar (50.9% share) | SellCell 2026 |
| Google traffic RI | **#4 dunia** (4-5B kunjungan/bulan) | World Population Review |
| Rata-rata kelola akun email | 1.86 akun/orang | Clean Email 2026 |
| Pengguna Google RI | ~200 juta+ (estimasi) | Ekstrapolasi dari data di atas |

**Kesimpulan demografis:** 9 dari 10 pengguna internet Indonesia punya Google account. Hampir semuanya menggunakan Android. Google OAuth adalah metode yang paling alami dan familiar.

### Perbandingan UX: Magic Link vs Google OAuth

| Langkah | Magic Link (saat ini) | Google OAuth |
|---------|----------------------|--------------|
| 1 | Ketik email (10-30 detik) ✅ | Klik 1 tombol ✅ |
| 2 | Klik "Kirim Tautan" ✅ | Pilih akun Google ✅ |
| 3 | Buka inbox/mail app (switch context) ❌ | (otomatis redirect balik) |
| 4 | Cari email dari spam/promotions ❌ | - |
| 5 | Klik link (bisa beda browser → gagal) ❌ | - |
| 6 | Balik ke browser ✅ | - |
| **Total waktu** | **30-120 detik** | **2-5 detik** |
| **Risiko gagal** | Tinggi (spam, delay, beda browser) | Rendah |

### Data Konversi dari Riset

| Studi | Peningkatan |
|-------|------------|
| Pablo Diaz (OpenMyPro) A/B test | **+34% signup** dengan Google OAuth utama |
| Baymard Institute | Signup wall turunkan konversi **85-90%** |
| Stytch benchmark | Social login 2-3x lebih tinggi dari email form |
| KAYAK passkey | **50% reduksi** waktu sign-in |

---

## Bab 3 — Alternatif: Custom SMTP + Magic Link

### Opsi Provider SMTP Gratis

| Provider | Free Tier | Kelebihan | Kekurangan |
|----------|-----------|-----------|------------|
| **Resend** | 100 email/hari | ✅ Integrasi Supabase native, SDK bagus | Perlu setup domain verification |
| **SendGrid** | 100 email/hari | ✅ Stabil, banyak dipakai | Dashboard agak kompleks |
| **Mailgun** | 1000 email/hari* | ✅ Kuota besar | Perlu kartu kredit untuk trial |
| **Brevo (Sendinblue)** | 300 email/hari | ✅ No CC required | Branding di footer (gratis) |

*\*Mailgun: 1000 email/hari untuk 30 hari pertama, lalu turun.*

### Efek Custom SMTP pada Rate Limit

> Dengan custom SMTP, rate limit email auth Supabase bisa diatur lebih tinggi.
> Resend integration default: **30 emails per hour** (bisa dinaikkan di dashboard Supabase).
> Bandingkan dengan 2/jam tanpa SMTP.

**Yang tetap tidak bisa diatasi SMTP:**
- Masih perlu ketik email
- Masih perlu buka inbox
- Masih perlu switching apps di HP
- Masih risiko spam filter

---

## Bab 4 — Arsitektur & Implementasi

### Diagram Flow Baru

```
Halaman /masuk
├───► [Masuk dengan Google] ← PRIORITAS UTAMA
│       supabase.auth.signInWithOAuth({ provider: 'google' })
│       → Google OAuth consent screen
│       → Supabase callback → /auth/callback → session ✅
│
└───► [Atau masukkan email] ← FALLBACK
        form email (seperti sekarang)
        → supabase.auth.signInWithOtp({ email })
        → magic link via custom SMTP → login ✅
```

### Yang Perlu Diubah

| File | Perubahan |
|------|-----------|
| **Google Cloud Console** (baru) | Buat OAuth 2.0 Client ID (Web app) — **sekali setup, gratis** |
| **Supabase Dashboard** | Enable Google provider, paste Client ID + Secret |
| `src/actions/auth.ts` | Tambah `signInWithGoogle()` server action |
| `src/app/masuk/page.tsx` | Tambah tombol "Masuk dengan Google" (primary CTA), divider, email / magic link collapse di bawah sebagai fallback. Hapus card wrapper agar layout lebih lapang. |
| **Supabase Dashboard → SMTP** | **WAJIB** setup custom SMTP (Resend/SendGrid) agar magic link tidak mati |
| `.env.local` | Tambah variabel (tidak ada — semua dari Supabase dashboard) |

### Detail Implementasi Google OAuth

#### a. Google Cloud Console (sekali, ~10 menit)

```
1. Buka https://console.cloud.google.com
2. Buat project baru → "Gotong Royong Auth"
3. APIs & Services → OAuth consent screen
   - User Type: External
   - App name: "Gotong Royong"
   - Support email: [email pemilik]
   - Authorized domains: gotong-royong-pwa.wimxgooo.workers.dev
4. Scopes: email, profile, openid
5. Credentials → Create OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs:
     https://nqlazrjcywyltewsxgmx.supabase.co/auth/v1/callback
6. Copy Client ID + Client Secret
```

#### b. Supabase Dashboard (~2 menit)

```
Authentication → Providers → Google
  → Enable: ON
  → Client ID: [dari Google Cloud Console]
  → Client Secret: [dari Google Cloud Console]
  → Save
```

#### c. Kode Server Action (baru)

```typescript
// src/actions/auth.ts — tambah

export async function signInWithGoogle(): Promise<ActionState> {
  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host") ?? ""}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline", // Dapat refresh token (session >60 menit)
        prompt: "consent",      // Paksa consent screen tiap kali
      },
    },
  });

  if (error) return { error: error.message };

  redirect(data.url);
}
```

#### d. Perubahan Halaman Masuk

```tsx
// src/app/masuk/page.tsx

// Tambah tombol Google:
<button onClick={handleGoogleSignIn} className="...">
  <GoogleIcon /> Masuk dengan Google
</button>

<Divider text="atau" />

// Link collapse untuk email magic link:
<details>
  <summary>Masukkan email</summary>
  <form>... (seperti sekarang) </form>
</details>
```

### Catatan: PWA & Chrome Custom Tabs

- **Android:** Google OAuth otomatis pakai Chrome Custom Tab (bukan browser penuh). User tidak "meninggalkan" app.
- **PWA standalone:** Test perlu dilakukan, tapi umumnya tidak masalah karena CCT adalah overlay Chrome.
- **iOS:** Sama — pakai Safari View Controller.
- **Jika CCT bermasalah:** Bisa fallback ke redirect browser penuh dengan `{ redirectTo }`.

---

## Bab 5 — Biaya & Gratis Total

### Verifikasi "Gratis Total" Policy

| Komponen | Biaya | Status |
|----------|-------|--------|
| Google Cloud Console OAuth | **Gratis** | ✅ Sesuai policy |
| Supabase Google provider | **Termasuk plan** (tidak ada biaya tambahan) | ✅ |
| Resend (SMTP) 100 email/hari | **Gratis** | ✅ 100/hari cukup untuk skala awal |
| SendGrid 100 email/hari | **Gratis** | ✅ Alternatif |

**Tidak ada layanan berbayar yang ditambah.** Google OAuth adalah fitur bawaan Supabase Auth — tidak perlu upgrade plan.

### Perbandingan: Sekarang vs Sesudah

| Skenario | Sekarang (email saja) | Sesudah (+ Google OAuth) |
|----------|-----------------------|--------------------------|
| 1 user login, 09:00 | ✅ | ✅ |
| 2 user login, 09:30 | ✅ | ✅ |
| 3 user login, 09:45 | ❌ Rate limit | ✅ Google OAuth tanpa email |
| 50 user login, 10:00 | ❌ Semua gagal | ✅ Google OAuth |
| User lansia tanpa Google | ✅ (tapi rate limited) | ✅ Magic link via SMTP (30/jam) |

---

## Bab 6 — Risiko & Mitigasi (Setelah Audit 24 Jun)

 | Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Google OAuth tidak work di PWA standalone | Sedang | Test real device. Fallback ke email magic link. |
| Built-in SMTP tolak kirim ke non-team member | Tinggi | Magic link tanpa SMTP **sama sekali tidak bisa dipakai production**. Hanya bisa ke email anggota organisasi Supabase. Wajib setup custom SMTP. |
| Google Workspace account gagal login | Rendah | Pastikan scope `https://www.googleapis.com/auth/userinfo.email` explicit di Google Cloud Console. |
| Resend butuh verifikasi domain (MX + TXT/DKIM) | Sedang | Bukan plug-and-play. Butuh akses DNS domain. Integrasi langsung dari dashboard Resend ke Supabase. |
| User tidak punya Google account (lansia, anak-anak) | Rendah | Fallback magic link tetap ada. Lansia biasanya pakai smartphone Android → sebenarnya punya Google account. |
| Google OAuth redirect URL tidak match | Tinggi | Verifikasi URL di Supabase dashboard & Google Cloud Console. Dev dan production punya redirect URL berbeda. |
| Google Play Services tidak ada (HP China) | Rendah | HP China (Xiaomi, Oppo, Vivo) tetap punya Google Play Services. Cuma Huawei HMS yang tidak. Fallback tetap ada. |
| 100 email/hari tidak cukup | Sedang | Pantau usage. Kalau melebihi, upgrade SMTP (biaya ~$20/bulan) atau batasi magic link ke user tertentu. |
| OAuth consent screen butuh verifikasi Google | Rendah | Untuk "External" dengan hanya scope email/profile/ openid, biasanya tidak perlu verifikasi selama <100 pengguna. |

---

## Bab 7 — Rekomendasi Final

### Kesimpulan

```
MASALAH:        Magic link kena rate limit 2 email/jam → app mati untuk login
                dalam 1 jam setelah 2 percobaan.

AKAR MASALAH:   Supabase built-in email provider (bukan kode kita).

SOLUSI TEPAT:   Google OAuth sebagai primary login — 1 klik, tidak sentuh email,
                tidak kena rate limit, konversi lebih tinggi.

SOLUSI CADANGAN: Custom SMTP (Resend/SendGrid) untuk magic link — naik dari 2/jam
                ke 30/jam. Melayani user tanpa Google account.

KEDUANYA:       Gratis. Tidak melanggar policy "gratis total".
```

### Prioritas Pengerjaan

| No | Item | Estimasi | Urgensi |
|----|------|----------|---------|
| P0 | **Setup Google Cloud Console + Supabase Google provider** | 15 menit | 🔴 Masalah login ada sekarang |
| P1 | **Kode: tambah `signInWithGoogle()` action + tombol di `/masuk`** | 30 menit | 🔴 |
| P2 | **Test Google OAuth di worker + PWA** | 30 menit | 🟡 |
| P3 | **Setup Resend/SendGrid SMTP** | 15 menit | 🟡 WAJIB — built-in SMTP tolak kirim ke non-team member. Tanpa SMTP, magic link tidak bisa dipakai production. |
| P4 | **Test end-to-end: Google OAuth + magic link + session persistence** | 30 menit | 🟢 |

### Total Biaya Implementasi

| Resource | Biaya |
|----------|-------|
| Google Cloud Console | **Rp 0** |
| Supabase (free plan) | **Rp 0** |
| Resend (100 email/hari) | **Rp 0** |
| Developer time | ~2 jam |

---

## Bab 8 — Temuan Audit Lanjutan (24 Jun 2026)

> Setelah riset awal selesai, dilakukan audit lanjutan yang mengungkap 7 temuan kritis
> yang memengaruhi rencana implementasi. Temuan-temuan ini telah diintegrasikan ke bagian
> risiko (Bab 6) dan prioritas (Bab 7) di atas. Bab ini mendokumentasikan detailnya.

### Temuan 1: Built-in SMTP Juga Tolak Non-Team Member

**Apa yang terlewat di riset awal:** Riset awal hanya fokus pada rate limit 2/jam. Ternyata
ada masalah **lebih parah** — Supabase built-in email provider hanya mengirim ke email yang
terdaftar sebagai anggota organisasi di dashboard Supabase.

```
Error yang muncul:
"Email address not authorized" — untuk semua user di luar team organisation.
```

**Dampak:** Magic link **sama sekali tidak bisa dipakai production** tanpa custom SMTP.
Bukan cuma lambat — benar-benar tidak berfungsi untuk publik.

**Implikasi:** Setup custom SMTP (Resend/SendGrid) bukan opsional — ini **wajib** bahkan
sebelum Google OAuth jika ingin magic link sebagai fallback.

### Temuan 2: Resend Butuh Verifikasi Domain

**Apa yang terlewat:** Resend bukan plug-and-play. Untuk mengirim email dari domain sendiri,
perlu:
1. **Verifikasi domain ownership** (TXT record)
2. **Setup DKIM** (TXT record kedua)
3. **Setup MX record** (untuk inbound, opsional)
4. **Setup SPF** (TXT record ketiga)

Ini semua butuh akses ke DNS domain. Kalau domain belum dibeli/diarahkan ke Cloudflare,
proses ini terhambat. Tapi ada opsi lebih cepat: **integrasi langsung dari dashboard Resend
ke Supabase** (tanpa SMTP manual).

### Temuan 3: OAuth Refresh Token Butuh Parameter Khusus

**Apa yang terlewat:** Default Google OAuth di Supabase hanya memberi **access token
berlaku 60 menit**. Tanpa refresh token, user akan logout setelah 1 jam.

```
Solusi di kode:
signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: "...",
    queryParams: {
      access_type: "offline",   // ← DAPAT refresh token
      prompt: "consent",        // ← PAKSA consent screen
    },
  },
})
```

**Dampak:** Tanpa parameter ini, session user hanya bertahan 60 menit. Ini fatal untuk
pengguna yang ingin "tetap login" — terutama warga yang buka app sekali sehari.

### Temuan 4: Google Workspace Account Bisa Gagal

**Apa yang terlewat:** Jika user memakai Google Workspace (email kantor @perusahaan.com),
OAuth bisa gagal jika admin Workspace membatasi OAuth consent scope. Solusi:

1. Pastikan scope minimal: `email`, `profile`, `openid`, `https://www.googleapis.com/auth/userinfo.email`
2. Tambah scope `userinfo.email` explicit di Google Cloud Console
3. Workspace admin bisa memblokir third-party apps — ini di luar kendali kita

### Temuan 5: Semua Redirect URL Harus di Allowlist

**Apa yang terlewat:** Google Cloud Console dan Supabase sama-sama mewajibkan
**Authorized redirect URIs** eksplisit. Satu typo = auth gagal tanpa pesan jelas.

```
Yang harus ditambahkan:
Google Cloud Console → Authorized redirect URIs:
  1. https://nqlazrjcywyltewsxgmx.supabase.co/auth/v1/callback
  2. https://gotong-royong-pwa.wimxgooo.workers.dev/auth/callback   (untuk development)
  3. https://<custom-domain>/auth/callback                          (untuk production)

Supabase Dashboard → Authentication → Providers → Google:
  → Redirect URL otomatis terisi, tapi pastikan match.
```

### Temuan 6: Supabase Free Tier 0-Day Backup

**Apa yang terlewat:** Supabase free tier punya kebijakan **auto-pause setelah 7 hari
tidak ada aktivitas**. Semua data tetap ada (tidak hilang), tapi project perlu di-unpause
manual dari dashboard. Keep-alive cron (yang sudah di-commit) mitigasi ini.

**Risiko:** Kalau cron gagal beberapa kali berturut-turut (mis. GitHub Actions outage),
project bisa pause tanpa notifikasi. User yang coba login akan dapat error koneksi.

### Temuan 7: Supabase Auto-Identity Linking

**Apa yang terlewat:** Supabase secara otomatis menghubungkan (merge) identity Google
dengan user yang sudah ada jika **emailnya sama**. Ini penting:

```
Flow konkret:
1. User daftar dengan magic link (email@example.com)
2. User login dengan Google (email@example.com)
3. Supabase otomatis: Google identity → link ke user yang sudah ada
   (bukan bikin user baru)
```

**Dampak positif:** Tidak perlu kode khusus untuk merge akun. Tapi ada risiko keamanan:
kalau email Google user berubah (rename), identity baru tidak otomatis link.

### Implikasi Gabungan untuk Implementasi

```
Urutan implementasi yang benar setelah audit:

HARI 1 (P0):
  1. Setup Google Cloud Console OAuth Client ID
  2. Enable Google provider di Supabase dashboard
  3. Tambah signInWithGoogle() + tombol Google di /masuk
  4. ✅ User bisa login dengan Google (session 60 menit dulu)

HARI 1 (P1):
  5. Update callback handler: tambah access_type=offline
  6. ✅ User dapat refresh token → session permanen

HARI 2 (P2 - butuh domain):
  7. Setup Resend → verifikasi domain (TXT/DKIM/SPF)
  8. Hubungkan Resend ke Supabase (SMTP integration)
  9. ✅ Magic link fallback functional (30/jam, bukan 2/jam)

HARI 2 (P3):
  10. Test Google OAuth di worker + PWA standalone
  11. Test magic link via SMTP
  12. Test session persistence (refresh token)
```

---

## Lampiran: Sumber Referensi

- Supabase Auth Rate Limits: `supabase.com/docs/guides/auth/rate-limits`
- Supabase Google OAuth: `supabase.com/docs/guides/auth/social-login/auth-google`
- Resend + Supabase integration: `resend.com/docs/knowledge-base/getting-started-with-resend-and-supabase`
- DataReportal Digital 2026 Indonesia: `datareportal.com/reports/digital-2026-indonesia`
- DemandSage Android Statistics 2026: `demandsage.com/android-statistics`
- Baymard Institute signup wall research
- Pablo Diaz Google OAuth conversion data (OpenMyPro)
- Clean Email Industry Report 2026

---

*Disusun 23 Jun 2026. Audit lanjutan + update Bab 8: 24 Jun 2026. Siap untuk implementasi.*
