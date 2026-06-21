# RENCANA_DATA — Jembatan Tampilan ↔ Database (Alignment)

> Status: **DRAFT untuk di-ACC pemilik** · 19 Jun 2026.
> Ini "kontrak" antara mockup (apa yang dilihat warga) dan database (apa yang disimpan).
> **Aturan:** tiap elemen UI dinamis WAJIB punya barisnya di sini SEBELUM dikoding (Gerbang 0 playbook).
> Diturunkan dari kode asli 6 layar `gotong_royong_app/lib/screens/*` + `DOKUMENTASI.md`.
> Semua data di-scope `community_id` (multi-tenant) & dilindungi RLS.

## A. Model data v1 (tabel Supabase/Postgres)

| Tabel | Kolom inti | Catatan |
|------|------------|---------|
| `communities` | id, nama, jenis(rt/rw/masjid), parent_id, kelurahan, lat, lng, deskripsi, slug_publik, rekening_tujuan, nominal_iuran_default | tenant |
| `profiles` | id(=auth.uid), nama, no_hp?, avatar_url, created_at | **TANPA NIK** |
| `memberships` | id, community_id, profile_id, peran(warga/pengurus/dkm/admin), status | basis multi-tenant + RLS |
| `announcements` | id, community_id, judul, isi, pinned, author_id, foto_url?, created_at | tulis=pengurus |
| `posts` | id, community_id, author_id, isi, foto_url?, created_at | tulis=anggota |
| `post_reactions` | id, post_id, profile_id, jenis | unik per (post,profile) |
| `post_comments` | id, post_id, profile_id, isi, created_at | |
| `events` | id, community_id, judul, mulai, lokasi, deskripsi, jenis(kajian/kegiatan) | tulis=pengurus |
| `event_rsvp` | id, event_id, profile_id, status | |
| `kas_entries` | id, community_id, jenis(masuk/keluar), nominal, keterangan, tgl, dibuat_oleh, hash_prev?, hash_self? | tulis=pengurus; sumber transparansi |
| `donations` | id, community_id, donatur_id, jenis(donasi/iuran), nominal, bukti_url, status(menunggu/terverifikasi/ditolak), verifikator_id?, catatan?, created_at | warga buat; pengurus verifikasi |
| `reports` | id, community_id, pelapor_id, kategori, deskripsi, foto_url?, lat?, lng?, status(baru/diproses/selesai), created_at | warga buat; pengurus ubah status |
| `polls` | id, community_id, pertanyaan, opsi(jsonb), berakhir, dibuat_oleh | tulis=pengurus |
| `poll_votes` | id, poll_id, profile_id, opsi_index | 1 suara/user (unik) |
| `contacts` | id, community_id, nama, peran, no_hp/wa | direktori darurat |
| `mutabaah_items` | id, community_id?, label, urutan | daftar checklist (default global) |
| `mutabaah_logs` | id, profile_id, item_id, tanggal, done | per-user harian |
| `prayer_cache` | community_id, tanggal, waktu(jsonb) | cache Aladhan |
| `notifications` | id, profile_id, judul, isi, link?, dibaca, created_at | kotak masuk Pesan |
| `push_subscriptions` | id, profile_id, endpoint, keys(jsonb) | Web Push |
| `audit_log` | id, community_id, aktor_id, aksi, entitas, entitas_id, waktu | transparansi |

## B. Matriks peran × aksi (ringkas, jadi dasar RLS)

| Tabel | Warga | Pengurus/DKM | Anon (publik) |
|------|-------|--------------|---------------|
| kas_entries | baca | baca+tulis | ringkas via halaman publik |
| donations | buat+baca milik sendiri | baca semua+verifikasi | – |
| reports | buat+baca milik sendiri/komunitas | baca+ubah status | – |
| announcements | baca | buat/pin | hanya yg `pinned & publik` |
| posts/komentar | buat+baca | +moderasi | – |
| polls/votes | vote+baca hasil | buat | – |
| profiles | baca diri+se-komunitas | sda | – |
| communities | baca yg diikuti | kelola miliknya | nama+slug publik |

---

## C. Alignment per LAYAR (Elemen UI → Sumber data → Akses/RLS)

### 0) Onboarding / Login / Pilih Peran  (`onboarding_screen.dart`)
| Elemen UI | Tipe | Sumber (tabel.kolom) | Aksi/Akses |
|-----------|------|----------------------|------------|
| Input email → kirim OTP/magic link | string | Supabase Auth | Server Action `signInWithOtp` |
| Pilih peran (8 kartu → v1: Warga/Pengurus/DKM) | enum | `memberships.peran` | insert saat onboarding |
| Pilih/cari komunitas | relasi | `communities` (select), `memberships` (insert) | `joinCommunity` (zod) |
| Buat komunitas (pengurus) | form | `communities` insert | `createCommunity` (pengurus only) |

### 1) Beranda  (`home_screen.dart`)
| Elemen UI (mockup) | Tipe | Sumber (tabel.kolom) | Aksi/Akses |
|--------------------|------|----------------------|------------|
| Header: lokasi "Cilandak Barat" | string | `communities.nama`/`kelurahan` (komunitas aktif) | baca |
| Header: ikon chat & notifikasi (titik merah) | badge | `notifications` (count belum dibaca) | baca |
| Search "Cari ilmu, ustadz, komunitas, warung…" | query | client search (posts/events/communities) | v1: cari sederhana |
| Kartu Unggulan "Perbaikan Diri Harian" | konten | `announcements` (pinned) atau statis | baca |
| **Transparansi**: total "Rp 22.6M" | uang | `Σ kas_entries(masuk) − Σ(keluar)` | agregat per community |
| Transparansi: Pemasukan "Rp 3.2M" | uang | `Σ kas_entries.nominal where jenis=masuk` | agregat |
| Transparansi: Disalurkan "Rp 2.9M" | uang | `Σ kas_entries.nominal where jenis=keluar` | agregat |
| "Update: 24 Mei 2026" | tanggal | `max(kas_entries.tgl)` | baca |
| Tombol "Lihat Laporan" | nav | → `/laporan-kas` | baca |
| Kategori (Donasi/Keluarga/Masjid/Pasar/B&B/RT-RW) | nav | statis → route | – |
| **Mutabaah Harian** (Shalat Subuh, Tilawah, Dzikir Pagi, Sedekah, Shalat Dhuha; "0/1") | checklist | `mutabaah_items` + `mutabaah_logs(done)` | toggle per user/hari |
| Tombol "Mulai Mutabaah Hari Ini" | aksi | upsert `mutabaah_logs` | per user |
| **Artikel** (tag, judul, author, likes) | konten | `posts`/`announcements` jenis artikel + reactions | baca; like=reaction |
| Jadwal Sholat (TAMBAHAN v1) | jam | `prayer_cache` (Aladhan by lat/lng) | baca + cache harian |
| Jadwal Kajian/Kegiatan (TAMBAHAN v1) | list | `events` mendatang | baca |

### 2) Komunitas  (`komunitas_screen.dart`)
| Elemen UI | Tipe | Sumber | Aksi/Akses |
|-----------|------|--------|------------|
| Form posting (teks + foto) | form | `posts` insert + Storage `post-images` | anggota; zod+Turnstile |
| Komunitas Populer (nama + jml anggota) | list | `communities` + count `memberships` | baca; gabung |
| Feed terbaru (gambar, like, komentar, share) | list | `posts` + `post_reactions` + `post_comments` | baca/interaksi |
| Pengumuman ter-pin | list | `announcements(pinned)` | pengurus tulis |

### 3) Buat Aksi  (`buat_aksi_screen.dart`)
| Aksi (mockup) | Sumber | Aksi/Akses |
|---------------|--------|------------|
| Buat Postingan | `posts` insert | → form Komunitas |
| Buat Kegiatan | `events` insert | pengurus |
| Donasi Cepat | `donations` insert (+bukti) | warga; status menunggu |
| Daftarkan Kajian | `events` insert (jenis=kajian) | pengurus |
| Tanya Ustadz | v1: `posts`/form sederhana | (atau parkir v2) |
| Lapor RT/RW | `reports` insert (+foto+GPS) | warga; zod |
| Polling/Voting (TAMBAHAN) | `polls`/`poll_votes` | pengurus buat, warga vote |

### 4) Pesan  (`pesan_screen.dart`)
| Elemen UI | Tipe | Sumber | Aksi/Akses |
|-----------|------|--------|------------|
| Search pesan | query | client filter | – |
| Daftar chat (nama, preview, waktu, unread) | list | **v1: `notifications`** (kotak masuk) | baca; tandai dibaca |
| Chat realtime antar warga | – | DIPARKIR v2 | – |

### 5) Profil  (`profil_screen.dart`)
| Elemen UI | Tipe | Sumber | Aksi/Akses |
|-----------|------|--------|------------|
| Kartu profil (foto, nama, lokasi, level, statistik) | objek | `profiles` + agregat aktivitas | baca; edit milik sendiri |
| Badge sosial (Donatur Aktif, dll) | derivasi | dihitung dari `donations`/`posts` | baca |
| Aktivitas terakhir | list | `audit_log where aktor=me` | baca |
| Menu: Donasi Saya | list | `donations where donatur=me` | baca |
| Menu: Kajian Saya / Bookmark / Riwayat | list | `event_rsvp`, dst | baca |
| Pengaturan (notifikasi) | toggle | `push_subscriptions` | subscribe/unsubscribe |
| Keluar | aksi | Supabase signOut | – |
| Halaman publik Masjid/RT `/k/[slug]` | halaman | `communities` + jadwal + kontak + pengumuman publik | anon; tanpa PII |

### 6) Laporan Kas  (`/laporan-kas`) — turunan tombol "Lihat Laporan" Beranda
| Elemen UI | Tipe | Sumber (tabel.kolom) | Aksi/Akses |
|-----------|------|----------------------|------------|
| Ringkasan (saldo, pemasukan, disalurkan, update terakhir) | uang | `getKasSummary()` ← `Σ kas_entries` | baca; anggota (RLS `kas_select`) |
| Filter bulan | query | `?bulan=YYYY-MM` → `getKasEntries({bulan})` | client → searchParams |
| Daftar transaksi (tgl, jenis masuk/keluar, nominal, keterangan, pencatat) | list | `kas_entries` + `profiles.nama` (pencatat) | baca; anggota |
| Tombol "+ Catat Kas" | nav | → `/laporan-kas/baru` | **hanya pengurus** (UI), RLS `kas_insert` |
| Tombol "Cetak / Simpan PDF" | aksi | `window.print()` + `@media print` | client |
| Tombol "Cek Keaslian" (opsional) | aksi | RPC `verify_kas_chain(community)` | anggota |

### 6b) Catat Kas  (`/laporan-kas/baru`) — form pengurus
| Elemen UI | Tipe | Sumber | Aksi/Akses |
|-----------|------|--------|------------|
| Jenis (masuk/keluar) | enum | `kas_entries.jenis` | `catatKas` (zod `kasSchema`) |
| Nominal (Rupiah) | uang | `kas_entries.nominal` (bigint) | validasi >0, wajar |
| Keterangan | string | `kas_entries.keterangan` | min 3, max 200 |
| Tanggal (default hari ini) | tanggal | `kas_entries.tgl` | YYYY-MM-DD |
| (otomatis) segel hash + audit | — | trigger `0003` (`hash_self`, `audit_log`) | DB, bukan app |

### 7) Kegiatan  (`/kegiatan`, `/kegiatan/baru`) — turunan "Kegiatan Mendatang" Beranda + menu Aksi
| Elemen UI | Tipe | Sumber (tabel.kolom) | Aksi/Akses |
|-----------|------|----------------------|------------|
| Daftar kegiatan mendatang (judul, waktu, lokasi, jenis) | list | `events` (mulai ≥ now) via `getUpcomingEvents()` | baca; anggota |
| Jumlah peserta | angka | `count(event_rsvp)` per event | baca; anggota |
| Tombol "Hadir / Batal" (RSVP) | toggle | `event_rsvp` insert/delete (unik per user+event) | `toggleRsvp` (anggota) |
| Form buat kegiatan (judul, jenis kajian/kegiatan, waktu, lokasi, deskripsi) | form | `events` insert | `buatKegiatan` (pengurus, zod `kegiatanSchema`) |
| (penting) waktu disimpan UTC dari input Asia/Jakarta | tgl | `events.mulai` (timestamptz) | konversi +07:00 di action |

### 8) Pengumuman  (`/pengumuman`, `/pengumuman/baru`) — Kartu Unggulan Beranda + layar Komunitas
| Elemen UI | Tipe | Sumber (tabel.kolom) | Aksi/Akses |
|-----------|------|----------------------|------------|
| Kartu Unggulan (pengumuman ter-pin) di Beranda | konten | `announcements(pinned=true)` via `getPinnedAnnouncement()` | baca; anggota (anon hanya pinned) |
| Daftar pengumuman | list | `announcements` (pinned dulu, lalu terbaru) | baca; anggota |
| Form buat pengumuman (judul, isi, sematkan?) | form | `announcements` insert | `buatPengumuman` (pengurus, zod `pengumumanSchema`) |

### 9) Profil  (`/profil`) — lihat & edit diri
| Elemen UI | Tipe | Sumber (tabel.kolom) | Aksi/Akses |
|-----------|------|----------------------|------------|
| Avatar (inisial dari nama; **foto ditunda**) | konten | `profiles.nama` | baca; (upload avatar = sub-langkah Storage) |
| Nama + No HP (edit) | form | `profiles.nama`, `profiles.no_hp` | `simpanProfil` (zod `profilSchema`, RLS `profiles_update_self`) |
| Peran + komunitas (link ke `/k/[slug]`) | list | `memberships.peran` + `communities` | baca (`getMemberships`) |
| Tombol Keluar | aksi | Supabase signOut | `signOut` |

### 10) Halaman Publik Masjid/RT  (`/k/[slug]`) — anon, TANPA login, TANPA PII
| Elemen UI | Tipe | Sumber (tabel.kolom) | Aksi/Akses |
|-----------|------|----------------------|------------|
| Header (nama, jenis, kelurahan, deskripsi) | konten | `communities` by `slug_publik` | anon select (publik) |
| Ringkasan kas (saldo, pemasukan, penyaluran, update) | uang | RPC `public_kas_summary(slug)` | anon (RINGKAS saja, bukan baris mentah) |
| Jadwal sholat | jam | Aladhan by `communities.lat/lng` | publik |
| Kegiatan mendatang | list | `events` (mulai ≥ now) | anon select (events publik) |
| Pengumuman ter-pin | list | `announcements(pinned=true)` | anon select (hanya pinned) |
| Kontak darurat | list | `contacts` | anon select (publik) |
| CTA "Masuk untuk bergabung" | nav | → `/masuk` | – |
| (keamanan) tidak menampilkan daftar warga / PII | — | — | NF-02 |

---

## D. Status pengisian (diisi saat eksekusi)
- [x] Onboarding/Login (M2 ✅)  - [~] Beranda (M3: kas/sholat/kegiatan/mutabaah/pengumuman-pinned = data nyata)  - [~] **Laporan Kas (kode+`0003` siap; perlu uji runtime)**  - [~] **Kegiatan + RSVP (kode siap; perlu uji)**  - [~] **Pengumuman (kode siap; perlu uji)**  - [~] **Profil lihat+edit nama/HP+keluar (kode siap; avatar ditunda)**  - [~] **Halaman publik `/k/[slug]` (kode siap; perlu uji)**  - [~] **Komunitas/Feed: post+suka+komentar+hapus (kode siap; foto ditunda)**  - [~] **Lapor RT/RW +GPS +status pengurus (kode siap; foto ditunda)**  - [~] **Polling +vote +hasil (kode siap)**  - [~] **Pesan/notif inbox (kode + trigger `0004` ✅ apply; perlu uji)**  - [ ] Buat Aksi (sisanya: donasi)
> 20 Jun 2026 (sesi 5) — **Supabase via kaki-tangan:** apply **`0004`** (trigger notifikasi: pengumuman→anggota, status laporan→pelapor) + **`0005`** (policy Storage). Bucket `avatars`/`post-images` = **publik**, `report-images`/`donation-proofs` = **privat**; 5 policy `storage.objects` pola folder `<uid>/`. Infra upload foto SIAP (kode upload menyusul). Verifikasi lulus (2 trigger, flag bucket benar, 5 policy).
> Tandai ✅ tiap baris saat tabel+RLS+Server Action+UI selesai & teruji.
> 19 Jun 2026 — Beranda baca-data LIVE: jadwal sholat Aladhan (Subuh 04:38 teruji), transparansi kas agregat (empty-state jujur), kegiatan mendatang, **toggle Mutabaah harian tersimpan** (0/5↔1/5 teruji). Seed `mutabaah_items` global via `0002_seed_mutabaah.sql`.
> 19 Jun 2026 (sesi 2) — **Kas TULIS + Laporan Kas dikoding**: pondasi bersama `getActiveCommunity()` (`lib/auth`) + `getKasSummary/getKasEntries` (`lib/kas`); action `catatKas` (pengurus, zod); halaman `/laporan-kas` (ringkasan+rincian+filter bulan+Cetak/PDF+Cek Keaslian) & `/laporan-kas/baru` (form); migrasi **`0003`** (rantai-hash SHA-256 + audit otomatis + RPC `verify_kas_chain`) **✅ di-apply**. `npm run build`+`lint` = 0/0.
> 20 Jun 2026 — **Kegiatan + Pengumuman dikoding** (tanpa migrasi DB; tabel+RLS sudah ada dari `0001`): helper `lib/events.ts` (`getUpcomingEvents`+peserta+sayaHadir) & `lib/announcements.ts` (`getPinnedAnnouncement`/`getAnnouncements`); action `buatKegiatan`+`toggleRsvp` (`actions/events`) & `buatPengumuman` (`actions/announcements`); halaman `/kegiatan`(+RSVP), `/kegiatan/baru`, `/pengumuman`, `/pengumuman/baru`; Beranda kini tampil **Kartu Unggulan pengumuman ter-pin** + link "Lihat semua" kegiatan; menu Aksi tersambung. Konversi waktu input WIB→UTC di action (anti salah-jam). `build`+`lint` = 0/0. **Belum diuji runtime.**
> 20 Jun 2026 (sesi 2) — **Profil + Halaman publik dikoding** (tanpa migrasi DB): `actions/profile.ts` `simpanProfil` (RLS `profiles_update_self`); `/profil` lihat+edit nama/HP, peran, daftar komunitas (link `/k/slug`), tombol Keluar. **`/k/[slug]`** (anon, force-dynamic): komunitas by slug (`notFound` bila tak ada), ringkasan kas via RPC `public_kas_summary`, jadwal sholat, kegiatan, pengumuman ter-pin, kontak, CTA Masuk + `generateMetadata` (SEO/OG). `build`+`lint`=0/0. **Belum diuji runtime.** ⚠️ **Avatar upload DITUNDA** → butuh policy Storage bucket `avatars` (migrasi `0004`, apply via kaki-tangan) + keputusan: bucket publik vs signed-URL.
> 20 Jun 2026 (sesi 4) — **M5 Buat Aksi dikoding** (tanpa migrasi utk fitur; tabel+RLS dari `0001`): **Lapor RT/RW** (`lib/reports`, `actions/reports` buatLapor+honeypot+GPS opsional, ubahStatusLapor pengurus; `/lapor`, `/lapor/baru`). **Polling** (`lib/polls`, `actions/polls` buatPolling pengurus + vote 1×/user + tolak tenggat; `/polling`, `/polling/baru` opsi dinamis, hasil bar%). **Pesan/notifikasi** (`lib/notifications` getNotifications+countUnread, `actions/notifications` tandaiDibaca[+buka link internal]/tandaiSemua; `/pesan` inbox + badge bell di Beranda). Menu Aksi tersambung (Lapor, Polling). **Migrasi `0004_notification_triggers.sql`** (pengumuman→anggota, status laporan→pelapor) **DITULIS, belum di-apply**. `build`+`lint`=0/0. ⚠️ Foto lapor ditunda (Storage).
> 20 Jun 2026 (sesi 3) — **Feed Komunitas (M4) dikoding** (tanpa migrasi DB; tabel+RLS sudah ada dari `0001`): `lib/posts.ts` (`getFeed`+`getPost`); `actions/posts.ts` (`buatPost`+honeypot, `toggleSuka`, `tambahKomentar`, `hapusPost` author/pengurus); tab **`/komunitas`** kini feed nyata (suka/komentar/tulis), `/komunitas/baru` (form post), `/komunitas/[id]` (detail + komentar `KomentarForm` + hapus). Menu Aksi "Buat Postingan"+"Feed Komunitas" tersambung. `build`+`lint`=0/0. **Belum diuji runtime.** ⚠️ **Foto postingan DITUNDA** (bucket `post-images` perlu policy Storage — digabung dengan keputusan avatar di satu langkah).
