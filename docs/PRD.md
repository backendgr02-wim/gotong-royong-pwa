# PRD — Gotong Royong v1 (Web-App / PWA)

> Status: **DRAFT untuk di-ACC pemilik** · 19 Jun 2026 · Bahasa awam.
> Sumber kebenaran scope ada di `~/.claude/plans/joyful-dancing-dijkstra.md` (rencana 8 minggu).

## 1. Tujuan
Mengubah `gotong_royong_app` (yang masih mockup kosong) menjadi **aplikasi web ringan (PWA)
yang benar-benar berfungsi** untuk komunitas RT/RW + Masjid: transparansi kas, info & pengumuman,
lapor warga, donasi/iuran, jadwal sholat & kegiatan. Gratis dijalankan (klien cuma bayar domain),
ringan untuk HP murah + sinyal 3G, dan **multi-tenant** (satu aplikasi melayani banyak komunitas →
bisa dijual-ulang).

## 2. Persona pengguna
- **Warga** — lihat kas transparan, jadwal sholat, feed/pengumuman, lapor masalah, donasi/iuran.
- **Pengurus RT/RW** — input kas, verifikasi donasi, buat pengumuman/polling, kelola anggota, ubah status laporan.
- **DKM Masjid** — input kas masjid, jadwal kajian, pengumuman, profil masjid publik.
- **Pengunjung publik** — lihat halaman publik komunitas (`/k/[slug]`) tanpa login (tanpa data sensitif).

## 3. Ruang lingkup v1 (yang DIBANGUN) — 6 layar
1. **Onboarding + Login** — Auth email (OTP/magic link, gratis), pilih peran, pilih/gabung komunitas.
2. **Beranda** — Transparansi Kas, Jadwal Sholat (Aladhan), Jadwal Kajian/Kegiatan, pengumuman ter-pin, Mutabaah Harian (checklist ringan).
3. **Komunitas** — feed pengumuman + postingan warga (teks + 1 foto), daftar & gabung komunitas.
4. **Buat Aksi** — Buat Postingan, Buat Kegiatan, Donasi (transfer+bukti), Lapor RT/RW (foto+kategori+GPS), Polling/Voting.
5. **Pesan** — kotak masuk notifikasi/pengumuman (chat realtime = v2).
6. **Profil** — profil + peran, Donasi Saya, riwayat, pengaturan, keluar; halaman publik Masjid/RT.

## 4. Non-goals (DIPARKIR ke v2+ — JANGAN dibangun v1)
Payment gateway/QRIS, marketplace UMKM, BMT/keuangan syariah, e-government/Dukcapil, telemedicine,
pendidikan Islam 300 fitur (produk terpisah), blockchain Hyperledger, SSO Keycloak, WhatsApp API,
hirarki organisasi 11 tingkat, chat realtime, IoT/analytics. (Detail: `ROADMAP.md`.)
> Ini sengaja diparkir karena justru fitur-fitur inilah yang dulu membuat versi web "kebanyakan & mahal".

## 5. Kriteria sukses (acceptance) per fitur inti
- **Auth/onboarding:** user baru bisa daftar email → masuk → pilih peran → gabung komunitas; data tersimpan.
- **Transparansi kas:** saldo = Σ pemasukan − Σ penyaluran per komunitas; pengurus input, warga read-only.
- **Donasi:** warga upload bukti → status "menunggu" → pengurus verifikasi → kas otomatis bertambah → donatur dapat notifikasi.
- **Lapor RT:** warga kirim foto+kategori(+lokasi) → pengurus ubah status (baru/diproses/selesai).
- **Jadwal sholat:** tampil benar per koordinat komunitas, tahan saat offline (pakai cache).
- **Multi-tenant:** user komunitas A TIDAK bisa melihat/mengubah data komunitas B (diuji via RLS).
- **PWA:** bisa di-install ke layar HP, halaman inti tetap kebuka saat offline.

## 6. Prinsip biaya (terkunci)
Rp 0/bulan kecuali domain. Stack gratis: Supabase free + Cloudflare Workers (OpenNext) + Aladhan +
Web Push + Turnstile. Tanpa layanan berbayar bulanan. Donasi = transfer manual + foto bukti (tanpa izin OJK).

## 7. Privasi & keamanan (terkunci)
**Tanpa NIK / data sensitif** (perbaikan cacat web lama NF-02). PII minimal: nama, no HP (opsional),
peran, komunitas. RLS WAJIB ON semua tabel. Validasi zod tiap Server Action. Consent untuk lokasi & notifikasi.
Kebijakan privasi + hak hapus akun (UU PDP).

## 8. Risiko & mitigasi
| Risiko | Mitigasi |
|--------|----------|
| Supabase free "tidur" setelah 7 hari sepi | Keep-alive gratis (cron-job.org / GitHub Action ping harian) |
| HP murah + 3G lambat | PWA ringan, RSC, skeleton, lazy image, target LCP<3s |
| Kebocoran data (spt web lama) | Tanpa NIK, RLS ketat, tak ada endpoint publik tanpa auth, gate keamanan + bukti/ |
| Operasi akun asli salah | Semua lewat kaki-tangan (chrome-direct headed) + konfirmasi aksi sensitif + waspada prompt-injection |
| Scope melebar lagi (jebakan SuperApp) | Scope lock di PRD; fitur baru hanya dari ROADMAP setelah v1 stabil |

## 9. Status proyek
Portofolio/gabungan → dibangun **multi-tenant** sejak awal agar bisa dijual-ulang ke banyak RT/RW.
Tanpa gerbang DP/lunas keras; kejar kualitas demo siap-jual.
