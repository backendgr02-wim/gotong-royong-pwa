-- =====================================================================
-- 0001_auth_and_rls.sql — Keamanan inti Gotong Royong (jalankan SETELAH 0000)
-- Dijalankan di Supabase (SQL Editor) atau via drizzle-kit/psql setelah DATABASE_URL ada.
-- Berisi: FK ke auth.users, trigger profil & komunitas, fungsi helper RLS,
--         ENABLE RLS + policy semua tabel, RPC ringkasan kas publik.
-- Prinsip: deny-by-default. Tanpa policy = tidak ada akses. Semua di-scope community_id.
-- =====================================================================

-- ---------- 1. Hubungkan profiles ke auth.users + auto-buat profil ----------
alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nama)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nama', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. Fungsi helper RLS (SECURITY DEFINER → bypass RLS, anti-rekursi) ----------
create or replace function public.is_member(c uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.community_id = c and m.profile_id = auth.uid() and m.status = 'aktif'
  );
$$;

create or replace function public.is_pengurus(c uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.community_id = c and m.profile_id = auth.uid()
      and m.status = 'aktif' and m.peran in ('pengurus', 'dkm', 'admin')
  );
$$;

create or replace function public.shares_community(target uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.memberships a
    join public.memberships b on a.community_id = b.community_id
    where a.profile_id = auth.uid() and a.status = 'aktif'
      and b.profile_id = target and b.status = 'aktif'
  );
$$;

-- ---------- 3. Saat komunitas dibuat, pembuat otomatis jadi pengurus ----------
create or replace function public.handle_new_community()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    insert into public.memberships (community_id, profile_id, peran, status)
    values (new.id, auth.uid(), 'pengurus', 'aktif')
    on conflict (community_id, profile_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_community_created on public.communities;
create trigger on_community_created
  after insert on public.communities
  for each row execute function public.handle_new_community();

-- ---------- 4. ENABLE RLS semua tabel ----------
alter table public.communities        enable row level security;
alter table public.profiles           enable row level security;
alter table public.memberships        enable row level security;
alter table public.kas_entries        enable row level security;
alter table public.donations          enable row level security;
alter table public.announcements      enable row level security;
alter table public.posts              enable row level security;
alter table public.post_reactions     enable row level security;
alter table public.post_comments      enable row level security;
alter table public.events             enable row level security;
alter table public.event_rsvp         enable row level security;
alter table public.reports            enable row level security;
alter table public.polls              enable row level security;
alter table public.poll_votes         enable row level security;
alter table public.contacts           enable row level security;
alter table public.mutabaah_items     enable row level security;
alter table public.mutabaah_logs      enable row level security;
alter table public.prayer_cache       enable row level security;
alter table public.notifications      enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.audit_log          enable row level security;

-- ---------- 5. POLICY ----------

-- communities: direktori publik (nama/slug) boleh dibaca siapa saja; kelola = pengurus.
create policy "communities_select_all" on public.communities for select to anon, authenticated using (true);
create policy "communities_insert_auth" on public.communities for insert to authenticated with check (true);
create policy "communities_update_pengurus" on public.communities for update to authenticated
  using (is_pengurus(id)) with check (is_pengurus(id));

-- profiles: diri sendiri atau sesama anggota komunitas. TANPA akses anon (cegah kebocoran PII).
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_community(id));
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- memberships: gabung sendiri HANYA sebagai 'warga' (cegah eskalasi); pengurus kelola anggota.
create policy "memberships_select" on public.memberships for select to authenticated
  using (profile_id = auth.uid() or public.is_member(community_id) or public.is_pengurus(community_id));
create policy "memberships_insert_self" on public.memberships for insert to authenticated
  with check (profile_id = auth.uid() and peran = 'warga');
create policy "memberships_update" on public.memberships for update to authenticated
  using (profile_id = auth.uid() or public.is_pengurus(community_id))
  with check (profile_id = auth.uid() or public.is_pengurus(community_id));
create policy "memberships_delete" on public.memberships for delete to authenticated
  using (profile_id = auth.uid() or public.is_pengurus(community_id));

-- kas_entries: baca = anggota; tulis = pengurus.
create policy "kas_select" on public.kas_entries for select to authenticated using (public.is_member(community_id));
create policy "kas_insert" on public.kas_entries for insert to authenticated with check (public.is_pengurus(community_id));
create policy "kas_update" on public.kas_entries for update to authenticated
  using (public.is_pengurus(community_id)) with check (public.is_pengurus(community_id));
create policy "kas_delete" on public.kas_entries for delete to authenticated using (public.is_pengurus(community_id));

-- donations: donatur lihat miliknya; pengurus lihat semua & verifikasi. Buat = milik sendiri, status awal menunggu.
create policy "donations_select" on public.donations for select to authenticated
  using (donatur_id = auth.uid() or public.is_pengurus(community_id));
create policy "donations_insert_self" on public.donations for insert to authenticated
  with check (donatur_id = auth.uid() and public.is_member(community_id) and status = 'menunggu');
create policy "donations_update_pengurus" on public.donations for update to authenticated
  using (public.is_pengurus(community_id)) with check (public.is_pengurus(community_id));

-- announcements: anggota lihat semua; publik hanya yang pinned (untuk /k/[slug]). Tulis = pengurus.
create policy "announcements_select" on public.announcements for select to anon, authenticated
  using (pinned = true or public.is_member(community_id));
create policy "announcements_write_pengurus" on public.announcements for all to authenticated
  using (public.is_pengurus(community_id)) with check (public.is_pengurus(community_id));

-- posts: anggota; penulis kelola miliknya, pengurus moderasi.
create policy "posts_select" on public.posts for select to authenticated using (public.is_member(community_id));
create policy "posts_insert" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and public.is_member(community_id));
create policy "posts_update" on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_pengurus(community_id))
  with check (author_id = auth.uid() or public.is_pengurus(community_id));
create policy "posts_delete" on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_pengurus(community_id));

-- post_reactions
create policy "reactions_select" on public.post_reactions for select to authenticated using (public.is_member(community_id));
create policy "reactions_insert" on public.post_reactions for insert to authenticated
  with check (profile_id = auth.uid() and public.is_member(community_id));
create policy "reactions_delete" on public.post_reactions for delete to authenticated using (profile_id = auth.uid());

-- post_comments
create policy "comments_select" on public.post_comments for select to authenticated using (public.is_member(community_id));
create policy "comments_insert" on public.post_comments for insert to authenticated
  with check (profile_id = auth.uid() and public.is_member(community_id));
create policy "comments_update" on public.post_comments for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "comments_delete" on public.post_comments for delete to authenticated
  using (profile_id = auth.uid() or public.is_pengurus(community_id));

-- events: jadwal kajian/kegiatan = info publik (boleh anon di /k/[slug]); tulis = pengurus.
create policy "events_select" on public.events for select to anon, authenticated using (true);
create policy "events_write_pengurus" on public.events for all to authenticated
  using (public.is_pengurus(community_id)) with check (public.is_pengurus(community_id));

-- event_rsvp
create policy "rsvp_select" on public.event_rsvp for select to authenticated using (public.is_member(community_id));
create policy "rsvp_insert" on public.event_rsvp for insert to authenticated
  with check (profile_id = auth.uid() and public.is_member(community_id));
create policy "rsvp_delete" on public.event_rsvp for delete to authenticated using (profile_id = auth.uid());

-- reports: anggota lihat (transparansi); buat = milik sendiri; ubah status = pengurus.
create policy "reports_select" on public.reports for select to authenticated using (public.is_member(community_id));
create policy "reports_insert" on public.reports for insert to authenticated
  with check (pelapor_id = auth.uid() and public.is_member(community_id));
create policy "reports_update_pengurus" on public.reports for update to authenticated
  using (public.is_pengurus(community_id)) with check (public.is_pengurus(community_id));
create policy "reports_delete" on public.reports for delete to authenticated
  using (pelapor_id = auth.uid() or public.is_pengurus(community_id));

-- polls & votes
create policy "polls_select" on public.polls for select to authenticated using (public.is_member(community_id));
create policy "polls_write_pengurus" on public.polls for all to authenticated
  using (public.is_pengurus(community_id)) with check (public.is_pengurus(community_id));
create policy "votes_select" on public.poll_votes for select to authenticated using (public.is_member(community_id));
create policy "votes_insert" on public.poll_votes for insert to authenticated
  with check (profile_id = auth.uid() and public.is_member(community_id));

-- contacts: direktori darurat boleh publik; kelola = pengurus.
create policy "contacts_select_all" on public.contacts for select to anon, authenticated using (true);
create policy "contacts_write_pengurus" on public.contacts for all to authenticated
  using (public.is_pengurus(community_id)) with check (public.is_pengurus(community_id));

-- mutabaah_items: default global (community_id null) atau milik komunitas; kelola = pengurus.
create policy "mutabaah_items_select" on public.mutabaah_items for select to authenticated
  using (community_id is null or public.is_member(community_id));
create policy "mutabaah_items_write" on public.mutabaah_items for all to authenticated
  using (community_id is not null and public.is_pengurus(community_id))
  with check (community_id is not null and public.is_pengurus(community_id));

-- mutabaah_logs: hanya milik sendiri.
create policy "mutabaah_logs_all" on public.mutabaah_logs for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- prayer_cache: baca publik; tulis cache = anggota (data turunan, tidak sensitif).
create policy "prayer_select_all" on public.prayer_cache for select to anon, authenticated using (true);
create policy "prayer_insert" on public.prayer_cache for insert to authenticated with check (public.is_member(community_id));
create policy "prayer_update" on public.prayer_cache for update to authenticated
  using (public.is_member(community_id)) with check (public.is_member(community_id));

-- notifications: hanya milik sendiri (insert dilakukan server via service role / trigger).
create policy "notif_select" on public.notifications for select to authenticated using (profile_id = auth.uid());
create policy "notif_update" on public.notifications for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- push_subscriptions: milik sendiri.
create policy "push_all" on public.push_subscriptions for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- audit_log: anggota komunitas boleh lihat (transparansi); insert via server.
create policy "audit_select" on public.audit_log for select to authenticated using (public.is_member(community_id));

-- ---------- 6. RPC ringkasan kas publik (untuk halaman /k/[slug] tanpa membocorkan baris) ----------
create or replace function public.public_kas_summary(slug text)
returns table (total bigint, pemasukan bigint, penyaluran bigint, update_terakhir date)
language sql security definer stable set search_path = public as $$
  select
    coalesce(sum(case when k.jenis = 'masuk' then k.nominal else -k.nominal end), 0)::bigint,
    coalesce(sum(case when k.jenis = 'masuk' then k.nominal else 0 end), 0)::bigint,
    coalesce(sum(case when k.jenis = 'keluar' then k.nominal else 0 end), 0)::bigint,
    max(k.tgl)
  from public.kas_entries k
  join public.communities c on c.id = k.community_id
  where c.slug_publik = slug;
$$;
grant execute on function public.public_kas_summary(text) to anon, authenticated;
