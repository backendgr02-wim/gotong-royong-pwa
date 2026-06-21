# ROADMAP — Fitur DIPARKIR (jangan dibangun di v1)

> Status: 19 Jun 2026. Daftar ini menjaga **scope lock**. Semua di bawah ini ada di dokumen
> klien (`Docs-wa`) tapi **sengaja ditunda** — karena justru fitur-fitur inilah yang dulu
> membuat versi web "kebanyakan & mahal". Bangun HANYA setelah v1 stabil & ada permintaan nyata.

## Kenapa diparkir
Dokumen klien membayangkan "SuperApp Nusantara": 300 fitur, 7 fondasi + 40 plugin, skala nasional
281 juta orang, blockchain (ditaksir Rp 105–470 MILIAR di dokumennya). v1 kita justru kebalikannya:
kecil, gratis, satu/beberapa RT/RW. Roadmap ini = "gudang ide", bukan komitmen.

## Fase 2 (kalau v1 sukses & diminta)
- Chat realtime antar warga (v1 cukup kotak masuk notifikasi).
- Marketplace UMKM "Warung Tetangga" (katalog + pesan via WA, tanpa payment gateway).
- Direktori UMKM + peta (pakai data Pesanggrahan: ~1.200 usaha).
- Verifikasi identitas ringan (TANPA menyimpan NIK mentah; pakai foto/komitmen pengurus).
- iOS/PWA polish + streaming kajian (embed YouTube gratis).

## Fase 3+
- ZIS digital + integrasi BAZNAS, wakaf.
- Pendidikan Islam (kurikulum 300 fitur "Belajar Islam") → **produk TERPISAH**, bukan di app ini.
- Telemedicine (booking saja, bukan rekam medis).
- Manajemen TPQ, tracking hafalan, PPDB.

## Fase 4–5 (sangat jauh, butuh biaya/lisensi/regulasi)
- Payment gateway QRIS/Xendit (butuh lisensi OJK/PJSP — hindari selama bisa transfer manual).
- BMT/keuangan syariah, sukuk komunitas, koperasi.
- e-Government / integrasi Dukcapil.
- Blockchain Hyperledger (v1 cukup rantai-hash SHA-256 di Postgres untuk transparansi).
- SSO Keycloak (v1 cukup Supabase Auth), WhatsApp Business API (v1 cukup Web Push).
- Hirarki organisasi 11 tingkat, analytics B2B, IoT.

## Catatan transparansi keuangan (alternatif gratis blockchain)
Untuk "transparansi mutlak" tanpa blockchain: tabel `kas_entries` + trigger **rantai-hash SHA-256**
(`hash_prev`/`hash_self`, pgcrypto) → kalau satu baris diutak-atik, rantai putus & ketahuan. Gratis,
cukup untuk kepercayaan warga. Migrasi ke blockchain nyata HANYA jika pemerintah mewajibkan.
