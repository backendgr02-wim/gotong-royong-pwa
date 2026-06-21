CREATE TYPE "public"."acara_jenis" AS ENUM('kajian', 'kegiatan');--> statement-breakpoint
CREATE TYPE "public"."donasi_jenis" AS ENUM('donasi', 'iuran');--> statement-breakpoint
CREATE TYPE "public"."donasi_status" AS ENUM('menunggu', 'terverifikasi', 'ditolak');--> statement-breakpoint
CREATE TYPE "public"."kas_jenis" AS ENUM('masuk', 'keluar');--> statement-breakpoint
CREATE TYPE "public"."komunitas_jenis" AS ENUM('rt', 'rw', 'masjid');--> statement-breakpoint
CREATE TYPE "public"."laporan_status" AS ENUM('baru', 'diproses', 'selesai');--> statement-breakpoint
CREATE TYPE "public"."peran" AS ENUM('warga', 'pengurus', 'dkm', 'admin');--> statement-breakpoint
CREATE TYPE "public"."reaksi_jenis" AS ENUM('suka', 'doa', 'semangat');--> statement-breakpoint
CREATE TYPE "public"."status_anggota" AS ENUM('aktif', 'nonaktif', 'menunggu');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"judul" text NOT NULL,
	"isi" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"foto_url" text,
	"author_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid,
	"aktor_id" uuid,
	"aksi" text NOT NULL,
	"entitas" text NOT NULL,
	"entitas_id" uuid,
	"waktu" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" text NOT NULL,
	"jenis" "komunitas_jenis" NOT NULL,
	"parent_id" uuid,
	"kelurahan" text,
	"lat" double precision,
	"lng" double precision,
	"deskripsi" text,
	"slug_publik" text NOT NULL,
	"rekening_tujuan" text,
	"nominal_iuran_default" bigint DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "communities_slug_publik_unique" UNIQUE("slug_publik")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"nama" text NOT NULL,
	"peran" text NOT NULL,
	"no_hp" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"donatur_id" uuid NOT NULL,
	"jenis" "donasi_jenis" DEFAULT 'donasi' NOT NULL,
	"nominal" bigint NOT NULL,
	"bukti_url" text,
	"status" "donasi_status" DEFAULT 'menunggu' NOT NULL,
	"verifikator_id" uuid,
	"catatan" text,
	"periode" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_rsvp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"community_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_rsvp_uniq" UNIQUE("event_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"judul" text NOT NULL,
	"jenis" "acara_jenis" DEFAULT 'kegiatan' NOT NULL,
	"mulai" timestamp with time zone NOT NULL,
	"lokasi" text,
	"deskripsi" text,
	"dibuat_oleh" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kas_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"jenis" "kas_jenis" NOT NULL,
	"nominal" bigint NOT NULL,
	"keterangan" text NOT NULL,
	"tgl" date NOT NULL,
	"dibuat_oleh" uuid,
	"donation_id" uuid,
	"hash_prev" text,
	"hash_self" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"peran" "peran" DEFAULT 'warga' NOT NULL,
	"status" "status_anggota" DEFAULT 'aktif' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_community_profile_uniq" UNIQUE("community_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "mutabaah_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid,
	"label" text NOT NULL,
	"urutan" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mutabaah_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	CONSTRAINT "mutabaah_logs_uniq" UNIQUE("profile_id","item_id","tanggal")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"community_id" uuid,
	"judul" text NOT NULL,
	"isi" text,
	"link" text,
	"dibaca" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"community_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"opsi_index" integer NOT NULL,
	CONSTRAINT "poll_votes_uniq" UNIQUE("poll_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"pertanyaan" text NOT NULL,
	"opsi" jsonb NOT NULL,
	"berakhir" timestamp with time zone,
	"dibuat_oleh" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"community_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"isi" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"community_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"jenis" "reaksi_jenis" DEFAULT 'suka' NOT NULL,
	CONSTRAINT "post_reactions_uniq" UNIQUE("post_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"isi" text NOT NULL,
	"foto_url" text,
	"tersembunyi" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_cache" (
	"community_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"waktu" jsonb NOT NULL,
	CONSTRAINT "prayer_cache_uniq" UNIQUE("community_id","tanggal")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nama" text DEFAULT '' NOT NULL,
	"no_hp" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"keys" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"pelapor_id" uuid NOT NULL,
	"kategori" text NOT NULL,
	"deskripsi" text NOT NULL,
	"foto_url" text,
	"lat" double precision,
	"lng" double precision,
	"status" "laporan_status" DEFAULT 'baru' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_aktor_id_profiles_id_fk" FOREIGN KEY ("aktor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_donatur_id_profiles_id_fk" FOREIGN KEY ("donatur_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_verifikator_id_profiles_id_fk" FOREIGN KEY ("verifikator_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvp" ADD CONSTRAINT "event_rsvp_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvp" ADD CONSTRAINT "event_rsvp_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvp" ADD CONSTRAINT "event_rsvp_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_dibuat_oleh_profiles_id_fk" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kas_entries" ADD CONSTRAINT "kas_entries_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kas_entries" ADD CONSTRAINT "kas_entries_dibuat_oleh_profiles_id_fk" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutabaah_items" ADD CONSTRAINT "mutabaah_items_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutabaah_logs" ADD CONSTRAINT "mutabaah_logs_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutabaah_logs" ADD CONSTRAINT "mutabaah_logs_item_id_mutabaah_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."mutabaah_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_dibuat_oleh_profiles_id_fk" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_cache" ADD CONSTRAINT "prayer_cache_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_pelapor_id_profiles_id_fk" FOREIGN KEY ("pelapor_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_community_idx" ON "announcements" USING btree ("community_id","pinned");--> statement-breakpoint
CREATE INDEX "audit_community_idx" ON "audit_log" USING btree ("community_id","waktu");--> statement-breakpoint
CREATE INDEX "communities_kelurahan_idx" ON "communities" USING btree ("kelurahan");--> statement-breakpoint
CREATE INDEX "contacts_community_idx" ON "contacts" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "donations_community_status_idx" ON "donations" USING btree ("community_id","status");--> statement-breakpoint
CREATE INDEX "donations_donatur_idx" ON "donations" USING btree ("donatur_id");--> statement-breakpoint
CREATE INDEX "events_community_mulai_idx" ON "events" USING btree ("community_id","mulai");--> statement-breakpoint
CREATE INDEX "kas_community_tgl_idx" ON "kas_entries" USING btree ("community_id","tgl");--> statement-breakpoint
CREATE INDEX "memberships_community_idx" ON "memberships" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "memberships_profile_idx" ON "memberships" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "notifications_profile_idx" ON "notifications" USING btree ("profile_id","dibaca");--> statement-breakpoint
CREATE INDEX "post_comments_post_idx" ON "post_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "posts_community_created_idx" ON "posts" USING btree ("community_id","created_at");--> statement-breakpoint
CREATE INDEX "reports_community_status_idx" ON "reports" USING btree ("community_id","status");