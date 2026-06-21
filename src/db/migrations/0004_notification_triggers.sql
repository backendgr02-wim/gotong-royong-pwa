-- =====================================================================
-- 0004_notification_triggers.sql — Buat notifikasi in-app otomatis (kotak "Pesan").
-- Jalankan SETELAH 0000–0003 (di Supabase SQL Editor / via kaki-tangan). Idempoten.
--
-- Kenapa trigger (bukan kode app): tabel `notifications` sengaja TIDAK punya policy INSERT
-- (deny-by-default), jadi penulisan WAJIB lewat fungsi SECURITY DEFINER — bukan dari klien.
-- Penegakan "siapa boleh baca" tetap di RLS `notif_select` (profile_id = auth.uid).
-- =====================================================================

-- 1) Pengumuman baru → notifikasi ke SEMUA anggota aktif komunitas (kecuali penulisnya).
create or replace function public.notify_new_announcement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (profile_id, community_id, judul, isi, link)
  select m.profile_id, new.community_id, 'Pengumuman: ' || new.judul, left(new.isi, 140), '/pengumuman'
  from public.memberships m
  where m.community_id = new.community_id
    and m.status = 'aktif'
    and m.profile_id is distinct from new.author_id;
  return new;
end;
$$;

drop trigger if exists trg_notify_announcement on public.announcements;
create trigger trg_notify_announcement
  after insert on public.announcements
  for each row execute function public.notify_new_announcement();

-- 2) Status laporan berubah → notifikasi ke pelapor.
create or replace function public.notify_report_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.pelapor_id is not null then
    insert into public.notifications (profile_id, community_id, judul, isi, link)
    values (
      new.pelapor_id,
      new.community_id,
      'Status laporan diperbarui',
      'Laporan "' || left(new.deskripsi, 60) || '" kini: ' || new.status,
      '/lapor'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_report_status on public.reports;
create trigger trg_notify_report_status
  after update on public.reports
  for each row execute function public.notify_report_status();
