-- =====================================================================
-- 0007_fix_pgcrypto_search_path.sql — Perbaiki akses digest() di schema extensions.
-- pgcrypto di Supabase terinstal di schema `extensions`, bukan `public`.
-- Trigger kas_hash_chain & verify_kas_chain pakai `set search_path = public`
-- yang TIDAK mencakup `extensions` → error "function digest(text, unknown) does not exist".
-- =====================================================================

-- 1. Rantai-hash per komunitas (BEFORE INSERT).
create or replace function public.kas_hash_chain()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  prev text;
begin
  perform pg_advisory_xact_lock(hashtext(new.community_id::text));

  select hash_self into prev
  from public.kas_entries
  where community_id = new.community_id
  order by created_at desc, id desc
  limit 1;

  new.hash_prev := prev;
  new.hash_self := encode(
    digest(
      public.kas_payload(new.community_id, new.jenis::text, new.nominal,
                         new.keterangan, new.tgl, new.hash_prev, new.id),
      'sha256'
    ),
    'hex'
  );
  return new;
end;
$$;

-- 2. Verifikasi keaslian rantai.
create or replace function public.verify_kas_chain(community uuid)
returns table (ok boolean, rusak_id uuid, rusak_tgl date)
language plpgsql security definer set search_path = public, extensions as $$
declare
  r record;
  prev text := null;
  calc text;
begin
  if not public.is_member(community) then
    raise exception 'Bukan anggota komunitas ini.';
  end if;

  for r in
    select id, community_id, jenis, nominal, keterangan, tgl, hash_prev, hash_self
    from public.kas_entries
    where community_id = community
    order by created_at asc, id asc
  loop
    calc := encode(
      digest(
        public.kas_payload(r.community_id, r.jenis::text, r.nominal,
                           r.keterangan, r.tgl, prev, r.id),
        'sha256'
      ),
      'hex'
    );
    if r.hash_prev is distinct from prev or r.hash_self is distinct from calc then
      ok := false; rusak_id := r.id; rusak_tgl := r.tgl; return next; return;
    end if;
    prev := r.hash_self;
  end loop;

  ok := true; rusak_id := null; rusak_tgl := null; return next;
end;
$$;
