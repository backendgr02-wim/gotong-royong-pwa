-- =====================================================================
-- 0002_seed_mutabaah.sql — Seed item Mutabaah default (global).
-- community_id = NULL → daftar default yang dipakai semua komunitas (lihat RLS
-- "mutabaah_items_select": community_id is null OR is_member).
-- Idempoten: hanya menyisipkan bila belum ada item global sama sekali.
-- Jalankan di Supabase SQL Editor setelah 0000 + 0001.
-- =====================================================================

insert into public.mutabaah_items (community_id, label, urutan)
select v.community_id, v.label, v.urutan
from (values
  (null::uuid, 'Shalat Subuh',     1),
  (null::uuid, 'Tilawah Al-Quran', 2),
  (null::uuid, 'Dzikir Pagi',      3),
  (null::uuid, 'Sedekah',          4),
  (null::uuid, 'Shalat Dhuha',     5)
) as v(community_id, label, urutan)
where not exists (
  select 1 from public.mutabaah_items where community_id is null
);
