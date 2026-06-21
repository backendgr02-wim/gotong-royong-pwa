-- =====================================================================
-- 0006_donation_notification_triggers.sql — Notifikasi status donasi + auto-buat kas_entry saat verifikasi.
-- Jalankan SETELAH 0000–0005 (di Supabase SQL Editor / via kaki-tangan). Idempoten.
--
-- 1) Status donasi berubah (terverifikasi/ditolak) → notifikasi ke donatur (SECURITY DEFINER).
-- 2) Saat diverifikasi → auto-buat kas_entries (pemasukan) untuk transparansi.
-- =====================================================================

-- 1) Notifikasi perubahan status donasi.
create or replace function public.notify_donation_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (profile_id, community_id, judul, isi, link)
    values (
      new.donatur_id,
      new.community_id,
      case new.status
        when 'terverifikasi' then 'Donasi terverifikasi'
        when 'ditolak' then 'Donasi ditolak'
        else 'Status donasi berubah'
      end,
      case new.status
        when 'terverifikasi' then 'Donasi Rp ' || new.nominal::text || ' telah diverifikasi. Terima kasih!'
        when 'ditolak' then 'Donasi Rp ' || new.nominal::text || ' ditolak' || case when new.catatan is not null then '. Catatan: ' || new.catatan else '' end
        else 'Status donasi: ' || new.status
      end,
      '/donasi'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_donation_status on public.donations;
create trigger trg_notify_donation_status
  after update on public.donations
  for each row execute function public.notify_donation_status();

-- 2) Auto-buat kas_entry saat donasi diverifikasi (pemasukan).
create or replace function public.donation_verified_to_kas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'terverifikasi' and (old.status is distinct from 'terverifikasi') then
    insert into public.kas_entries (community_id, jenis, nominal, keterangan, tgl, dibuat_oleh, donation_id)
    values (
      new.community_id,
      'masuk',
      new.nominal,
      case new.jenis
        when 'iuran' then 'Iuran anggota — ' || coalesce(new.periode, 'periode tidak disebut')
        else 'Donasi dari warga'
      end,
      current_date,
      new.verifikator_id,
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_donation_verified_to_kas on public.donations;
create trigger trg_donation_verified_to_kas
  after update on public.donations
  for each row execute function public.donation_verified_to_kas();
