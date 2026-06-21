-- =====================================================================
-- 0005_storage_policies.sql — Izin (RLS) Storage untuk upload foto.
-- Jalankan SETELAH 0000–0004 (di Supabase SQL Editor / via kaki-tangan). Idempoten.
--
-- Keputusan pemilik (20 Jun 2026):
--   PUBLIK : avatars, post-images   (dilihat umum → URL langsung, ringan)
--   PRIVAT : report-images, donation-proofs (sensitif → signed URL)
--
-- Pola keamanan (2026, sesuai docs Supabase): tiap user mengunggah ke FOLDER namanya sendiri
-- (mis. `<uid>/namafile.jpg`); policy memakai (storage.foldername(name))[1] = auth.uid().
-- Pengurus membaca foto PRIVAT (verifikasi donasi/laporan) → nanti via signed URL sisi server
-- memakai SECRET key (bypass RLS), dibangun saat M6. Bucket diasumsikan SUDAH dibuat (dashboard).
-- =====================================================================

-- 1) Set visibilitas bucket.
update storage.buckets set public = true  where id in ('avatars', 'post-images');
update storage.buckets set public = false where id in ('report-images', 'donation-proofs');

-- 2) BACA publik untuk bucket publik (avatars, post-images).
drop policy if exists "gr_public_read" on storage.objects;
create policy "gr_public_read" on storage.objects for select to anon, authenticated
  using (bucket_id in ('avatars', 'post-images'));

-- 3) BACA privat: pemilik boleh membaca objeknya sendiri (untuk signed URL miliknya).
drop policy if exists "gr_private_read_own" on storage.objects;
create policy "gr_private_read_own" on storage.objects for select to authenticated
  using (
    bucket_id in ('report-images', 'donation-proofs')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) UNGGAH (insert): hanya ke folder milik sendiri, di keempat bucket aplikasi.
drop policy if exists "gr_own_folder_insert" on storage.objects;
create policy "gr_own_folder_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'post-images', 'report-images', 'donation-proofs')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5) UBAH objek milik sendiri (mis. ganti avatar).
drop policy if exists "gr_own_folder_update" on storage.objects;
create policy "gr_own_folder_update" on storage.objects for update to authenticated
  using (
    bucket_id in ('avatars', 'post-images', 'report-images', 'donation-proofs')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('avatars', 'post-images', 'report-images', 'donation-proofs')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6) HAPUS objek milik sendiri.
drop policy if exists "gr_own_folder_delete" on storage.objects;
create policy "gr_own_folder_delete" on storage.objects for delete to authenticated
  using (
    bucket_id in ('avatars', 'post-images', 'report-images', 'donation-proofs')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
