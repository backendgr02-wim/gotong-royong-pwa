-- =====================================================================
-- 0003_kas_chain_audit.sql — Segel anti-utak-atik kas (rantai-hash SHA-256) + audit otomatis.
-- Jalankan SETELAH 0000, 0001, 0002 (di Supabase SQL Editor / via kaki-tangan).
-- Aman dijalankan ulang (idempoten): pakai "create or replace" + "drop trigger if exists".
--
-- Kenapa di DB, bukan di kode app:
--  - Setiap mutasi kas (termasuk donasi yang diverifikasi → kas otomatis, M6) lewat SATU titik
--    penegakan, jadi tak ada jalur yang lupa menyegel/mengaudit.
--  - audit_log TIDAK punya policy INSERT untuk pengguna (deny-by-default), maka penulisan audit
--    HARUS lewat fungsi SECURITY DEFINER (bypass RLS) — bukan dari klien.
-- =====================================================================

create extension if not exists pgcrypto;

-- Susunan teks yang di-hash untuk satu baris kas (dipakai sama persis saat segel & saat verifikasi).
create or replace function public.kas_payload(
  c uuid, j text, n bigint, ket text, t date, prev text, rid uuid
) returns text language sql immutable set search_path = public as $$
  select coalesce(c::text,'')   || '|' ||
         coalesce(j,'')         || '|' ||
         coalesce(n::text,'')   || '|' ||
         coalesce(ket,'')       || '|' ||
         coalesce(t::text,'')   || '|' ||
         coalesce(prev,'')      || '|' ||
         coalesce(rid::text,'');
$$;

-- ---------- 1. Rantai-hash per komunitas (BEFORE INSERT) ----------
-- hash_prev = hash_self baris terakhir komunitas; hash_self = sha256(payload baris ini).
-- Mengubah satu baris lama akan memutus rantai → ketahuan saat verify_kas_chain().
create or replace function public.kas_hash_chain()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  prev text;
begin
  -- Kunci per komunitas: cegah dua insert bersamaan membuat rantai bercabang.
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

drop trigger if exists trg_kas_hash_chain on public.kas_entries;
create trigger trg_kas_hash_chain
  before insert on public.kas_entries
  for each row execute function public.kas_hash_chain();

-- ---------- 2. Audit otomatis (AFTER INSERT/UPDATE/DELETE) ----------
-- Catat siapa (auth.uid) & kapan tiap perubahan kas ke audit_log.
create or replace function public.kas_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  aksi_txt text;
  comm uuid;
  ent uuid;
begin
  if tg_op = 'INSERT' then
    aksi_txt := 'kas_tambah'; comm := new.community_id; ent := new.id;
  elsif tg_op = 'UPDATE' then
    aksi_txt := 'kas_ubah';   comm := new.community_id; ent := new.id;
  else
    aksi_txt := 'kas_hapus';  comm := old.community_id; ent := old.id;
  end if;

  insert into public.audit_log (community_id, aktor_id, aksi, entitas, entitas_id)
  values (comm, auth.uid(), aksi_txt, 'kas_entries', ent);

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_kas_audit on public.kas_entries;
create trigger trg_kas_audit
  after insert or update or delete on public.kas_entries
  for each row execute function public.kas_audit();

-- ---------- 3. Verifikasi keaslian rantai (untuk tombol "Cek Keaslian") ----------
-- Hitung ulang seluruh rantai komunitas. ok=true bila utuh; bila putus, balikkan baris pertama yg rusak.
create or replace function public.verify_kas_chain(community uuid)
returns table (ok boolean, rusak_id uuid, rusak_tgl date)
language plpgsql security definer set search_path = public as $$
declare
  r record;
  prev text := null;
  calc text;
begin
  -- Hanya anggota komunitas yang boleh memverifikasi (sejalan dengan RLS kas_select).
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

grant execute on function public.verify_kas_chain(uuid) to authenticated;
