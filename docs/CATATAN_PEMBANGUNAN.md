# 📒 CATATAN PEMBANGUNAN — Gotong Royong PWA
**Engineering & Architecture Build Log** · v2 · Diperbarui: 20 Jun 2026 (sesi 7 — fix auth callback)

> Dokumen ini adalah "buku catatan insinyur" gaya perusahaan besar: status proyek, arsitektur,
> keputusan beserta alasannya (ADR), model data & keamanan, inventaris berkas, dan **titik lanjut**
> supaya siapa pun (atau AI mana pun) bisa meneruskan tanpa kehilangan konteks.
> Pasangan dokumen: `PRD.md` (kebutuhan), `RENCANA_DATA.md` (alignment UI↔DB), `DESIGN.md` (token),
> `ROADMAP.md` (fitur diparkir), dan rencana 8 minggu di `~/.claude/plans/joyful-dancing-dijkstra.md`.

---

## 0. TL;DR — Berhenti di mana, lanjut dari mana
- **Sudah jadi & lolos build:** seluruh pondasi non-akun — dokumen perencanaan, scaffold Next.js 16 PWA,
  design system, **skema 21 tabel + RLS lengkap**, validasi zod, util (auth/jadwal sholat), dan **kode M2**
  (login email, onboarding, buat/gabung komunitas).
- **✅ Supabase SUDAH diprovisioning (19 Jun 2026):** project `gotong-royong` (org `backendgr02-wim`,
  region Singapura `ap-southeast-1`, bebas-Vercel). `.env.local` terisi (URL + publishable + secret + DATABASE_URL).
  **Migrasi 0000 + 0001 sudah dijalankan** via SQL Editor → terverifikasi: 21 tabel, RLS aktif di 21/21,
  54 policy, 3 fungsi helper, 1 trigger auth. Auth Email aktif + Site URL `localhost:3000` + redirect allowlist
  (`localhost:3000/**`, `localhost:3001/**`). 4 bucket Storage (private): `avatars`, `post-images`,
  `report-images`, `donation-proofs`. Smoke test `npm run dev` (port 3001): beranda & `/masuk` 200, tanpa error.
- **✅ Uji login E2E LULUS (19 Jun):** login email → onboarding → buat komunitas "wafi" (masjid) → beranda; profil & peran `pengurus` terbentuk via trigger. M2 selesai & terverifikasi.
- **✅ Uji RLS lintas-komunitas LULUS (19 Jun):** simulasi non-anggota (RLS aktif, role `authenticated`) → 0 profil/keanggotaan/kas/pengumuman komunitas lain; hanya nama komunitas yg terlihat (by design utk fitur "Gabung"). Isolasi multi-tenant terbukti.
- **✅ M3 Beranda baca-data LIVE (19 Jun):** header komunitas, transparansi kas (agregat + empty-state), jadwal sholat Aladhan (Subuh 04:38 teruji), kegiatan mendatang, **toggle Mutabaah harian** (tersimpan, 0/5↔1/5 teruji). `npm run build` 0 error. Beranda kini `force-dynamic` + auth-gated.
- **🟡 M3 Kas TULIS + Laporan Kas DIKODING (19 Jun sesi 2):** pondasi bersama `getActiveCommunity()` (`src/lib/auth.ts`) + `getKasSummary`/`getKasEntries` (`src/lib/kas.ts`) — Beranda di-refactor memakainya (anti salah-sinkron). Action `catatKas` (pengurus, zod `kasSchema`), halaman `/laporan-kas` (ringkasan + rincian + filter bulan + **Cetak/Simpan-PDF** via `window.print()` + **Cek Keaslian**) & `/laporan-kas/baru` (form). Menu Aksi + tombol "Lihat Laporan" Beranda tersambung. **Migrasi `0003_kas_chain_audit.sql`** = rantai-hash SHA-256 (BEFORE INSERT) + audit otomatis (AFTER ins/upd/del, SECURITY DEFINER) + RPC `verify_kas_chain`. `npm run build` & `npm run lint` = **0/0**. **✅ `0003` SUDAH di-apply & diverifikasi via `kaki-tangan` (19 Jun sesi 2):** pgcrypto=1, trigger `trg_kas_hash_chain`+`trg_kas_audit`=2, fungsi `kas_audit/kas_hash_chain/kas_payload/verify_kas_chain`=4. **Sisa: uji runtime kas (Langkah E/F §10 — butuh login app).**
- **✅ Kegiatan + Pengumuman DIKODING (20 Jun):** tanpa migrasi baru (tabel `events`/`event_rsvp`/`announcements` + RLS sudah ada dari `0001`). Helper `lib/events.ts` & `lib/announcements.ts`; action `buatKegiatan`+`toggleRsvp` & `buatPengumuman` (pengurus, zod, konversi waktu WIB→UTC); halaman `/kegiatan`(+RSVP), `/kegiatan/baru`, `/pengumuman`, `/pengumuman/baru`; Beranda tampil **Kartu Unggulan pengumuman ter-pin** + link kegiatan; menu Aksi tersambung. `build`+`lint` = **0/0**. **Belum diuji runtime.**
- **✅ Profil + Halaman publik `/k/[slug]` DIKODING (20 Jun sesi 2):** tanpa migrasi baru. `actions/profile.ts` `simpanProfil` (RLS `profiles_update_self`); `/profil` (lihat+edit nama/HP, peran, daftar komunitas→link `/k/slug`, tombol Keluar). **`/k/[slug]`** (anon, `force-dynamic`): komunitas by slug (`notFound`), ringkasan kas via RPC `public_kas_summary`, jadwal sholat, kegiatan, pengumuman ter-pin, kontak, CTA Masuk, `generateMetadata` (SEO/OG). `build`+`lint`=**0/0**. **Belum diuji runtime.**
- **✅ Feed Komunitas (M4) DIKODING (20 Jun sesi 3):** tanpa migrasi baru (tabel `posts`/`post_reactions`/`post_comments` + RLS sudah ada dari `0001`). `lib/posts.ts` (`getFeed`+`getPost`); `actions/posts.ts` (`buatPost`+honeypot, `toggleSuka`, `tambahKomentar`, `hapusPost` author/pengurus); tab **`/komunitas`** kini feed nyata (suka/komentar/tulis), `/komunitas/baru` (form), `/komunitas/[id]` (detail+komentar+hapus). Menu Aksi tersambung ("Buat Postingan", "Feed Komunitas"). `build`+`lint`=**0/0**. **Belum diuji runtime.**
- **✅ M5 Buat Aksi DIKODING (20 Jun sesi 4):** tanpa migrasi untuk fitur (tabel+RLS dari `0001`). **Lapor RT/RW**: `lib/reports.ts`, `actions/reports.ts` (`buatLapor`+honeypot+GPS opsional, `ubahStatusLapor` pengurus), `/lapor`+`/lapor/baru` (LaporForm GPS). **Polling**: `lib/polls.ts`, `actions/polls.ts` (`buatPolling` pengurus, `vote` 1×/user + tolak tenggat), `/polling`+`/polling/baru` (opsi dinamis, hasil bar %). **Pesan/notifikasi**: `lib/notifications.ts` (`getNotifications`+`countUnread`), `actions/notifications.ts` (`tandaiDibaca`+buka link internal, `tandaiSemuaDibaca`), `/pesan` inbox + **badge bell** di Beranda. Menu Aksi tersambung. `build`+`lint`=**0/0**. **Belum diuji runtime.**
- **✅ Sesi Supabase 20 Jun (sesi 5, via `kaki-tangan`):** **`0004` (trigger notifikasi) di-apply** → verifikasi 2 trigger (`trg_notify_announcement`, `trg_notify_report_status`). **`0005` (policy Storage) di-apply** → verifikasi: bucket `avatars`+`post-images`=**publik**, `report-images`+`donation-proofs`=**privat**; **5 policy** `storage.objects` (`gr_public_read`, `gr_private_read_own`, `gr_own_folder_insert/update/delete`, pola folder `<uid>/`). Keputusan privasi foto: biasa publik, sensitif privat.
- **⏸️ DITUNDA — kode upload foto (infra Storage SUDAH siap):** UI/aksi upload belum dibuat. Pola: unggah ke folder `<uid>/...`; avatar/post pakai `getPublicUrl`; report/donation pakai **signed URL sisi server (SECRET key)**. Bangun saat: avatar (Profil), foto postingan (Feed), lalu bukti donasi (M6).
- **🛠️ AUTH CALLBACK DIPERBAIKI (20 Jun sesi 7):** magic link redirect ke `/masuk` lagi, bukan login — akar masalah: di Route Handler Next 16, cookie sesi tidak tersimpan karena `cookies().set()` dari `next/headers` tidak termuat ke `NextResponse.redirect()`. **Fix:** callback route handler ditulis ulang — klien Supabase dibuat INLINE dengan `request.cookies.getAll()` (baca) + `response.cookies.set()` (tulis) di objek `NextResponse` langsung, pola identik `proxy.ts`. `npm run build` = 0 error. **Belum diuji runtime.** Halaman `/masuk` juga ditingkatkan: tampilkan `?error=auth` dari callback.
- **✅ Supabase CLI terpasang & terlink (21 Jun):** `npm run db:query "SQL"` untuk query langsung, `npm run db:migrate <file>` untuk migrasi. Tidak perlu browser lagi untuk operasi DB rutin.
- **▶️ Lanjut dari sini:** (1) **Uji runtime auth login** (npm run dev → magic link). (2) **Donasi & Iuran** (M6). (3) Kode upload avatar+foto post.
- **✅ Supabase CLI TERPASANG & TERLINK (21 Jun sesi 8):** login pakai PAT `sbp_47bea…754e` (exp 21 Jul 2026), link ke project `gotong-royong`. Kini migrasi cukup `npm run db:migrate src/db/migrations/0006_xxx.sql` tanpa browser. Script: `db:query`, `db:migrate`, `db:pull`, `db:dump`.
- **Status git:** ada 1 commit awal dari `create-next-app`; semua pekerjaan setelahnya **belum di-commit**.

---

## 1. RINGKASAN EKSEKUTIF & PROGRES vs RENCANA 8 MINGGU

| Fase rencana | Status | Catatan |
|---|---|---|
| **M1** Fondasi (docs, setup, scaffold, design, PRD/RENCANA_DATA) | ✅ **100%** | Supabase diprovisioning + migrasi live (19 Jun). GitHub/Cloudflare = nanti |
| **M2** Auth + onboarding + multi-tenant + RLS | ✅ **TUNTAS & terverifikasi** | Uji login E2E lolos + **uji RLS lintas-komunitas LULUS** (19 Jun). 20 Jun: **Profil (lihat+edit+keluar) & Halaman publik `/k/[slug]` dikoding** (sisa M2 beres, kecuali avatar upload yg ditunda) |
| **M3** Beranda data nyata | 🟢 **Fitur lengkap (perlu uji runtime)** | Beranda kas/sholat/mutabaah/kegiatan/pengumuman-pinned = data nyata. **Kas TULIS** + migrasi `0003` ✅. **Kegiatan+RSVP** & **Pengumuman** dikoding. build+lint 0/0. **Auth callback fix di-apply sesi 7 — tunggu uji runtime** |
| **M4** Komunitas / Feed | 🟢 **Dikoding (auth callback fix di-apply)** | 20 Jun: `/komunitas` feed (post+suka+komentar+hapus). build+lint 0/0. Foto postingan ditunda |
| **M5** Buat Aksi (Lapor/Polling/Pesan) | 🟢 **Dikoding (auth callback fix di-apply)** | 20 Jun: Lapor RT/RW (+GPS), Polling (+vote+hasil), Pesan/notif (+badge bell). Trigger `0004` + Storage `0005` ✅ di-apply. Foto lapor ditunda |
| **M6–M8** donasi, PWA offline, deploy | ⬜ Belum | — |
| **Lapisan DB (skema + RLS)** lintas-fase | ✅ **100% ditulis** | Belum di-apply ke DB |
| **Lapisan validasi (zod)** | ✅ **100%** | Semua form |

**Kesimpulan:** seluruh pekerjaan yang *bisa* dikerjakan tanpa akun asli **sudah dikerjakan & terverifikasi
build**. Bottleneck tunggal sekarang = provisioning Supabase (butuh kehadiran Anda).

---

## 2. ARSITEKTUR SISTEM

```
                    ┌─────────────────────────────────────────────┐
   Warga / Pengurus │   PWA (Next.js 16, installable di HP)        │
   (HP murah, 3G)   │   - RSC + Server Actions (form, no /api)     │
                    │   - Serwist (offline + IndexedDB) [M7]       │
                    └───────────────┬─────────────────────────────┘
                                    │  cookie sesi (di-refresh oleh proxy.ts)
                                    │  @supabase/ssr (publishable key)
                    ┌───────────────▼─────────────────────────────┐
                    │   SUPABASE (1 layanan, semua gratis)         │
                    │   - Auth (email OTP / magic link)            │
                    │   - Postgres + RLS  ← OTORISASI di sini       │
                    │   - Storage (foto: avatar/post/lapor/bukti)  │
                    └───────────────┬─────────────────────────────┘
                                    │ (jadwal sholat)
                    ┌───────────────▼──────────┐   ┌───────────────────────┐
                    │ Aladhan API (gratis,     │   │ Web Push VAPID [M7]   │
                    │ metode Kemenag RI)       │   │ Cloudflare Turnstile  │
                    └──────────────────────────┘   └───────────────────────┘

   Deploy: GitHub → Cloudflare Workers (OpenNext) — auto-deploy on push [M8]
```

**Prinsip arsitektur kunci:**
1. **Database = API.** Tidak ada server/Bubble di tengah. App bicara langsung ke Supabase; **RLS** yang
   menegakkan "siapa boleh lihat/ubah apa". Ini memangkas biaya & kerumitan ~90%.
2. **Server-first (Donut).** Default React Server Components; `'use client'` hanya di komponen daun
   interaktif (form, bottom-nav). Form pakai **Server Actions**, bukan route `/api`.
3. **Multi-tenant.** Semua data di-scope `community_id`; satu deployment melayani banyak RT/RW.
4. **Gratis & legal.** Cloudflare Workers (komersial diizinkan), Supabase free, Aladhan, Web Push, Turnstile.

---

## 3. TUMPUKAN TEKNOLOGI (versi terpasang)

| Lapis | Teknologi | Versi | Alasan singkat |
|---|---|---|---|
| Framework | Next.js (App Router, Turbopack) | **16.2.9** | RSC + Server Actions |
| UI runtime | React / React DOM | 19.2.4 | `useActionState` dll |
| Styling | Tailwind v4 (`@theme`) | ^4 | Token Social Synergy |
| Bahasa | TypeScript (strict) | ^5 | |
| Backend SDK | `@supabase/ssr` + `@supabase/supabase-js` | terbaru | Auth + data + RLS, cookie SSR |
| ORM/Migrasi | `drizzle-orm` + `drizzle-kit` | terbaru | Definisi skema + generate SQL |
| Validasi | `zod` | terbaru | Validasi tiap Server Action |
| Animasi | `motion` + `lenis` | terbaru | Spring + smooth scroll |
| Ikon | `lucide-react` | terbaru | |
| Form | `react-hook-form` | terbaru | (dipakai mulai M3) |
| PWA | `@serwist/next` + `serwist` + `idb` | terbaru | Offline + IndexedDB (M7) |
| Deploy (M8) | `@opennextjs/cloudflare` → Cloudflare Workers | — | `next-on-pages` sudah usang |

> Catatan Next 16 (breaking changes yang sudah diakomodasi):
> - **`middleware` → `proxy`** (file `src/proxy.ts`).
> - **`cookies()` async** → `await cookies()` di klien server Supabase.
> - **kunci Supabase**: pakai `publishable`/`secret` (legacy anon/service usang akhir 2026).

---

## 4. KEPUTUSAN ARSITEKTUR (ADR)

> Format: Konteks → Keputusan → Konsekuensi.

**ADR-001 — Platform = Web-App/PWA (bukan Flutter).**
Konteks: target warga pakai HP murah + 3G; model bisnis "klien cuma bayar domain"; playbook agensi
berbasis web. Riset: bundle Flutter-web ~7MB+ vs PWA <1MB. Keputusan: bangun ulang scope minimal sebagai
**Next.js PWA**. Konsekuensi: ringan, gratis di Cloudflare, sejalan playbook; mockup Flutter dipakai sebagai
acuan desain (IA + token), bukan dilanjutkan.

**ADR-002 — Backend = Supabase langsung + RLS (tanpa Bubble/server-tengah).**
Konteks: rancangan klien menyebut Bubble (berbayar) + FlutterFlow + API custom. Riset: `@supabase/ssr`
+ RLS = pola resmi 2026; DB jadi "API" yang aman. Keputusan: app → Supabase langsung; otorisasi di RLS.
Konsekuensi: hemat biaya & kode; **wajib RLS benar** (lihat §6).

**ADR-003 — Host = Cloudflare Workers via OpenNext (bukan Vercel).**
Konteks: Vercel Hobby melanggar ToS untuk komersial (audit NF-01); `next-on-pages` usang. Keputusan:
deploy via `@opennextjs/cloudflare` ke Workers. Konsekuensi: legal, gratis, dukung SSR/ISR; setup CI via
Cloudflare Workers Builds (M8).

**ADR-004 — Donasi = transfer manual + foto bukti (bukan payment gateway).**
Konteks: payment gateway (Xendit/QRIS) = biaya per transaksi + **wajib lisензi OJK/PJSP** (menampung uang).
Keputusan: warga transfer ke rekening → unggah bukti → pengurus verifikasi → kas naik. Konsekuensi: gratis,
tanpa lisensi, cukup untuk transparansi. (Gateway = roadmap jauh.)

**ADR-005 — Tanpa NIK / data sensitif (data minimal).**
Konteks: web lama membocorkan NIK+PII via endpoint publik tanpa auth (audit NF-02); UU PDP. Keputusan:
**tidak menyimpan NIK**; PII minimal (nama, no HP opsional). Konsekuensi: risiko hukum nyaris nol secara
desain; fitur yang butuh NIK = diparkir.

**ADR-006 — Multi-tenant via `community_id` + RLS sejak awal.**
Konteks: status proyek "portofolio/gabungan" → harus bisa dijual-ulang ke banyak RT/RW. Keputusan: semua
tabel scope `community_id`; isolasi via RLS. Konsekuensi: satu deployment = banyak komunitas; demo = produk.

**ADR-007 — PWA via Serwist (penerus next-pwa).** [M7]
Keputusan: `@serwist/next` (`app/sw.ts`→`public/sw.js`) untuk offline + installable; IndexedDB antrian aksi
offline. Konsekuensi: tahan jaringan buruk (sesuai target pengguna).

**ADR-008 — Scope lock: parkir "SuperApp".**
Konteks: dokumen klien = 300 fitur, blockchain (Rp 105–470 M di dokumennya), BMT, e-gov, dll — penyebab
versi web dulu "mahal". Keputusan: v1 = ~12 fitur (6 layar) saja; sisanya di `ROADMAP.md`. Konsekuensi:
cepat, murah, fokus; hindari mengulang kegagalan.

**ADR-009 — Transparansi via rantai-hash SHA-256 di Postgres (bukan blockchain).** [opsional M3]
Keputusan: kolom `hash_prev`/`hash_self` + trigger pgcrypto untuk anti-utak-atik kas. Konsekuensi: "rasa
blockchain" (immutability) dengan biaya nol; migrasi ke blockchain nyata hanya jika diwajibkan.

**ADR-010 — Akses akun asli HANYA via `kaki-tangan` (browser-act chrome-direct, headed).**
Konteks: CLI terminal beda akun; Chrome sudah login. Keputusan: semua operasi GitHub/Supabase/Cloudflare
lewat skill kaki-tangan, mode terlihat, dengan konfirmasi tiap aksi sensitif + waspada prompt-injection.
Konsekuensi: aman & auditable; butuh kehadiran Anda untuk langkah infra.

---

## 5. MODEL DATA (21 tabel — ringkas)

Detail kolom di `src/db/schema.ts` & alignment per-layar di `RENCANA_DATA.md`.

- **Fondasi:** `communities`, `profiles` (=auth.uid, tanpa NIK), `memberships` (peran+status, basis RLS).
- **Keuangan:** `kas_entries` (+rantai-hash opsional), `donations` (donasi/iuran, transfer+bukti+verifikasi).
- **Feed:** `announcements`, `posts`, `post_reactions`, `post_comments`.
- **Kegiatan:** `events` (kajian/kegiatan), `event_rsvp`.
- **Aspirasi:** `reports` (lapor+foto+GPS), `polls`, `poll_votes`.
- **Direktori/Ibadah:** `contacts`, `mutabaah_items`, `mutabaah_logs`, `prayer_cache`.
- **Sistem:** `notifications`, `push_subscriptions`, `audit_log`.

Prinsip: `community_id` di-denormalisasi ke tabel anak (komentar/reaksi/rsvp/vote) agar RLS lugas;
uang = `bigint` Rupiah utuh; waktu = `timestamptz`.

---

## 6. MODEL KEAMANAN (RLS) — jantung sistem

Berkas: `src/db/migrations/0001_auth_and_rls.sql`.

**Pilar:**
1. **Deny-by-default.** RLS ON di 21 tabel; tanpa policy = tanpa akses.
2. **Fungsi helper SECURITY DEFINER** (anti-rekursi RLS): `is_member(c)`, `is_pengurus(c)`,
   `shares_community(target)`.
3. **Trigger:** auto-buat `profiles` saat user daftar; auto-jadikan pembuat komunitas = `pengurus`.
4. **Anti-eskalasi peran:** warga hanya bisa self-join sebagai `'warga'`; promosi pengurus via pengurus.
5. **PII tertutup dari anon:** `profiles` tidak terbaca anon (perbaikan total NF-02).
6. **Publik aman:** halaman `/k/[slug]` hanya lihat `communities` dasar, `events`, `contacts`, pengumuman
   `pinned`, dan **ringkasan** kas via RPC `public_kas_summary()` (bukan baris mentah).

**Matriks peran (ringkas):**
| Tabel | Warga | Pengurus/DKM | Anon |
|---|---|---|---|
| kas_entries | baca | baca+tulis | ringkasan via RPC |
| donations | buat+lihat milik sendiri | lihat semua+verifikasi | – |
| reports | buat+lihat komunitas | +ubah status | – |
| posts/komentar | buat+baca | +moderasi | – |
| announcements | baca | buat/pin | hanya pinned |
| profiles | diri+se-komunitas | sda | – |

**Perbaikan temuan audit yang sudah tertanam:** NF-01 (Cloudflare, bukan Vercel), NF-02 (tanpa NIK + tanpa
endpoint bocor), NF-03 (RLS ON semua tabel), NF-04 (zod + honeypot + Turnstile rencananya), NF-07 (security
headers di `next.config.ts`).

---

## 7. INVENTARIS BERKAS (apa fungsi tiap file)

**Dokumen** (`docs/`): `PRD.md`, `RENCANA_DATA.md`, `DESIGN.md`, `ROADMAP.md`, `CATATAN_PEMBANGUNAN.md` (ini).

**Config:** `next.config.ts` (security headers), `drizzle.config.ts`, `.env.example`/`.env.local` (placeholder),
`tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`.

**App routes** (`src/app/`):
- `layout.tsx` (font Plus Jakarta Sans + AppFrame), `globals.css` (token `@theme`).
- `page.tsx` Beranda (statis, data contoh — disambung M3), `komunitas/`, `aksi/`, `pesan/`, `profil/` (placeholder).
- `masuk/page.tsx` (form login OTP, client), `onboarding/page.tsx` (server, force-dynamic),
  `auth/callback/route.ts` (tukar code→sesi).

**Komponen** (`src/components/`): `layout/app-frame.tsx` (sembunyikan nav di halaman tertentu),
`layout/bottom-nav.tsx` (5 tab + FAB), `ui/button.tsx`, `ui/card.tsx`, `ui/screen-header.tsx`,
`features/onboarding-client.tsx`.

**Lib** (`src/lib/`): `supabase/server.ts` & `client.ts`, `auth.ts` (getUser/getMemberships),
`validation.ts` (zod semua form), `prayer.ts` (Aladhan), `utils.ts` (cn + format Rupiah).

**Aksi server** (`src/actions/`): `auth.ts` (signIn OTP, signOut), `community.ts` (createCommunity, joinCommunity).

**Database** (`src/db/`): `schema.ts` (21 tabel Drizzle), `migrations/0000_init_schema.sql` (DDL),
`migrations/0001_auth_and_rls.sql` (RLS + trigger + RPC).

**Infra runtime:** `src/proxy.ts` (refresh sesi Supabase — pengganti middleware Next 16).

---

## 8. STATUS BUILD & VERIFIKASI
- `npm run build` = **0 error / 0 warning** (sudah dijalankan 3×: setelah scaffold, setelah skema+lib, setelah M2).
- `drizzle-kit generate` = sukses (21 tabel terbaca, DDL ter-generate).
- Route map: statis (`/`, `/komunitas`, `/aksi`, `/pesan`, `/profil`, `/masuk`); dinamis (`/onboarding`,
  `/auth/callback`); Proxy aktif.
- ⚠️ Belum diuji runtime karena `.env` Supabase masih kosong (placeholder).

---

## 9. ENVIRONMENT & RAHASIA YANG DIBUTUHKAN
Lihat `.env.example`. Yang wajib diisi saat sore:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`.
- (M7) `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.
- (form publik) `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
> Simpan nilai asli di Bitwarden + `.env.local` (jangan commit). Aturan token: least-privilege, ada expiry.

---

## 10. ▶️ TITIK LANJUT (mulai dari sini saat sore)

> **✅ STATUS 19 Jun 2026:** Langkah **A** (provisioning Supabase + kunci) dan **B** (migrasi + Auth + Storage)
> **SELESAI**. Project ref `nqlazrjcywyltewsxgmx` · URL `https://nqlazrjcywyltewsxgmx.supabase.co`. Nilai rahasia
> ada di `.env.local` (jangan commit). Langkah **C (uji login E2E) ✅ LULUS** — login→onboarding→buat
> komunitas "wafi"→beranda; peran `pengurus` via trigger. **Uji RLS lintas-komunitas ✅ LULUS** (non-anggota
> lihat 0 data sensitif komunitas lain). **M2 TUNTAS — lanjut M3.**
> Catatan port: dev server jatuh ke **:3001** karena :3000 dipakai proyek lain — kedua port sudah di allowlist.

> **▶️ BERIKUTNYA (19 Jun sesi 2 — Kas TULIS + Laporan Kas sudah dikoding, perlu di-apply & diuji):**
> **Langkah D — apply migrasi `0003` [✅ SELESAI 19 Jun sesi 2, via `kaki-tangan`]:** dijalankan di
> Supabase SQL Editor (project `gotong-royong`, org `backendgr02-wim`) → "Success. No rows returned".
> Verifikasi lulus: `pgcrypto`=1, trigger `trg_kas_hash_chain`+`trg_kas_audit`=2, fungsi
> `kas_audit/kas_hash_chain/kas_payload/verify_kas_chain` (4) ada.
> **Langkah E — uji runtime kas:** `npm run dev` → login pengurus komunitas "wafi" →
> menu **Aksi → Catat Kas** (atau Beranda → Lihat Laporan → +Catat Kas) → input *masuk* Rp 50.000 →
> cek `/laporan-kas` (transaksi tampil) & Beranda (saldo naik). Lalu input *keluar*. Cek baris baru di
> `audit_log` (siapa/kapan), kolom `hash_self` terisi, tombol **Cek Keaslian** = "Segel utuh".
> **Langkah F — uji RLS:** akun **warga** komunitas sama → bisa baca `/laporan-kas` tapi TANPA tombol
> "+Catat Kas" & `catatKas` ditolak; akun komunitas **lain** → 0 data kas "wafi".

**Langkah A — Sesi `kaki-tangan` (butuh Chrome Anda, jangan dipakai manual selama proses): ✅ SELESAI**
1. `browser-act get-skills core` → `browser list` → buka sesi di chrome-direct (`chrome-kontrol`) `--headed`.
2. Verifikasi login Supabase → **buat project** `gotong-royong` (region Singapore). [konfirmasi dulu]
3. Ambil **Project URL**, **publishable key**, **secret key**, dan **DATABASE_URL** (Connection string → Pooler).
4. (opsional) Buat **repo GitHub** `gotong-royong-pwa` + **Turnstile** keys.

**Langkah B — Migrasi & konfigurasi DB: ✅ SELESAI** (migrasi 0000+0001 via SQL Editor; Email aktif; Site URL + redirect; 4 bucket private. Seed mutabaah_items belum — opsional.)
5. Isi `.env.local` dengan nilai dari langkah 3.
6. Di Supabase **SQL Editor**: jalankan isi `src/db/migrations/0000_init_schema.sql`, lalu `0001_auth_and_rls.sql`.
7. Auth → aktifkan **Email** provider (magic link). Atur Site URL = `http://localhost:3000` (dev) untuk redirect.
8. Storage → buat bucket: `avatars`, `post-images`, `report-images`, `donation-proofs` (+ policy menyusul M4/M6).
9. (opsional) seed `mutabaah_items` default (Shalat Subuh, Tilawah, Dzikir Pagi, Sedekah, Shalat Dhuha).

**Langkah C — Uji jalan:**
10. `cd ~/agensi/proyek/gotong-royong-pwa && npm run dev` → buka `http://localhost:3000`.
11. Alur: `/masuk` (email) → cek email → `/auth/callback` → `/onboarding` → buat komunitas → `/`.
12. **Uji RLS:** akun ke-2 di komunitas berbeda TIDAK boleh melihat kas/feed komunitas pertama.

**Setelah hijau → lanjut M3** (Beranda data nyata: transparansi kas + jadwal sholat + kegiatan), ikut
rencana 8 minggu. Update tabel progres di §1 dan status baris di `RENCANA_DATA.md`.

> **🛠️ AUTH CALLBACK DIPERBAIKI (20 Jun sesi 7):**
> **Langkah G — apply migrasi `0004` & `0005` [✅ SELESAI 20 Jun, via `kaki-tangan`]:** trigger notifikasi
> di-apply via SQL Editor + policy Storage publik/privat di-apply. Verifikasi lulus.
> **Langkah H — AUTH ERROR [🔧 DIPERBAIKI, PERLU UJI RUNTIME]:**
> `npm run dev` di port 3001. Buka `http://127.0.0.1:3001/masuk` di browser `gotongroyong-dev` (chrome biasa).
> Masukin email → magic link terkirim → klik link → Supabase verify → redirect ke `http://127.0.0.1:3001/auth/callback?code=xxx` → tapi balik ke `/masuk` (tidak login).
> **Diagnosis (20 Jun sesi 7):** Cookie sesi tidak tersimpan. Di Route Handler Next 16, `cookies().set()` dari `next/headers` tidak termuat ke objek `NextResponse.redirect()` — jadi sesi hasil `exchangeCodeForSession()` hilang saat browser mengikuti redirect ke `/onboarding`.
> **Fix:** `src/app/auth/callback/route.ts` ditulis ulang — klien Supabase dibuat INLINE dengan pola `request.cookies.getAll()` (baca dari request) + `response.cookies.set()` (tulis ke response langsung), identik dengan `proxy.ts`. Alih-alih:
> ```typescript
> // ❌ LAMA — cookie lewat cookies() dari next/headers
> const supabase = await createClient(); // server.ts
> ```
> sekarang:
> ```typescript
> // ✅ BARU — cookie baca dari request, tulis ke response langsung
> const response = NextResponse.redirect(`${origin}${next}`);
> const supabase = createServerClient(URL, KEY, {
>   cookies: {
>     getAll: () => request.cookies.getAll(),
>     setAll: (cookiesToSet) => cookiesToSet.forEach(
>       ({ name, value, options }) => response.cookies.set(name, value, options)
>     ),
>   },
> });
> ```
> Halaman `/masuk` juga ditingkatkan: bungkus `useSearchParams` dalam `<Suspense>` + tampilkan `?error=auth` sebagai pesan error.
> `npm run build` = **0 error**. **Perlu uji runtime untuk verifikasi fix.**

---

## 11. RISIKO & CATATAN TERBUKA
- **Supabase free "tidur" 7 hari sepi** → siapkan keep-alive gratis (cron-job.org / GitHub Action ping) di M8.
- **drizzle-kit push** butuh driver `postgres` + DATABASE_URL; alternatif aman = paste SQL di Supabase Editor (disarankan untuk file RLS).
- **`prayer_cache` write**: saat ini policy izinkan anggota menulis cache; bila ingin lebih ketat, pindah ke service-role server-only.
- **Web lama `gotongroyong-web`** (bocor NIK + Vercel) = keputusan Anda "nanti" — jangan sambungkan DB produksi ke sana sampai diperbaiki/dimatikan.
- **shadcn/ui** belum di-init (pakai komponen tangan ringan); bisa ditambah kapan saja tanpa mengganggu.

---

## 12. POSTUR BIAYA
Target **Rp 0/bulan** kecuali domain. Semua: Cloudflare Workers (gratis, komersial OK), Supabase free,
Aladhan (gratis), Web Push (gratis), Turnstile (gratis). Donasi tanpa gateway → tanpa biaya transaksi/lisensi.

---

## 13. REFERENSI
- Internal: `PRD.md`, `RENCANA_DATA.md`, `DESIGN.md`, `ROADMAP.md`, `~/.claude/plans/joyful-dancing-dijkstra.md`,
  `~/agensi/skills/kaki-tangan/SKILL.md`, `~/agensi/playbook/docs/00_SOP_EKSEKUSI_AI.md` & `29_standar_keamanan_kode.md`,
  `~/agensi/playbook/AUDIT_PROFESOR_2026_v2.md` (NF-01/02/03/04/07).
- Riset 2026: OpenNext (`@opennextjs/cloudflare`), Serwist PWA, `@supabase/ssr` + RLS, Supabase free tier,
  Flutter-web vs PWA, Aladhan API (metode 20 = Kemenag).
```
*Akhir catatan. Perbarui §1 (progres) & §10 (titik lanjut) setiap akhir sesi.*
```
