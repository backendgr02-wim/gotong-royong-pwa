-- 0007_get_donasi_summary.sql — RPC aggregate ringkasan donasi (efisien, gantikan .limit(10000))
-- Jalankan di Supabase SQL Editor setelah 0006.

create or replace function public.get_donasi_summary(community_id_param uuid)
returns table (
  "totalDonasi" bigint,
  "totalIuran" bigint,
  "menunggu" bigint,
  "totalNominal" bigint
) language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(case when jenis = 'donasi' and status = 'terverifikasi' then nominal else 0 end), 0)::bigint,
    coalesce(sum(case when jenis = 'iuran' and status = 'terverifikasi' then nominal else 0 end), 0)::bigint,
    coalesce(count(*) filter (where status = 'menunggu'), 0)::bigint,
    coalesce(sum(case when status = 'terverifikasi' then nominal else 0 end), 0)::bigint
  from donations
  where community_id = community_id_param;
$$;
