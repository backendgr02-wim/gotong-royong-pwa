/**
 * Skema database Gotong Royong v1 (Drizzle ORM, Postgres/Supabase).
 *
 * Prinsip:
 * - Multi-tenant: SEMUA tabel data men-scope `community_id`. Di tabel anak (komentar, reaksi,
 *   rsvp, vote) `community_id` SENGAJA di-denormalisasi agar kebijakan RLS lugas (tanpa join).
 * - TANPA NIK / data sensitif (perbaikan cacat web lama NF-02).
 * - Uang disimpan sebagai bigint Rupiah utuh (IDR tidak pakai sen).
 * - Drizzle dipakai untuk DEFINISI skema + migrasi. Akses data RUNTIME lewat klien Supabase
 *   (@supabase/ssr) supaya RLS aktif dengan JWT pengguna — JANGAN query Postgres langsung dari app.
 *
 * RLS (ENABLE + policy) ditambahkan di migrasi SQL terpisah: `src/db/migrations/0001_rls.sql`.
 */
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  bigint,
  integer,
  jsonb,
  doublePrecision,
  unique,
  index,
} from "drizzle-orm/pg-core";

/* ============================== ENUM ============================== */
export const peranEnum = pgEnum("peran", ["warga", "pengurus", "dkm", "admin"]);
export const statusAnggotaEnum = pgEnum("status_anggota", ["aktif", "nonaktif", "menunggu"]);
export const komunitasJenisEnum = pgEnum("komunitas_jenis", ["rt", "rw", "masjid"]);
export const kasJenisEnum = pgEnum("kas_jenis", ["masuk", "keluar"]);
export const donasiJenisEnum = pgEnum("donasi_jenis", ["donasi", "iuran"]);
export const donasiStatusEnum = pgEnum("donasi_status", ["menunggu", "terverifikasi", "ditolak"]);
export const laporanStatusEnum = pgEnum("laporan_status", ["baru", "diproses", "selesai"]);
export const acaraJenisEnum = pgEnum("acara_jenis", ["kajian", "kegiatan"]);
export const reaksiJenisEnum = pgEnum("reaksi_jenis", ["suka", "doa", "semangat"]);

/* ============================== FONDASI ============================== */

/** Komunitas (RT/RW/Masjid) — unit tenant. */
export const communities = pgTable(
  "communities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nama: text("nama").notNull(),
    jenis: komunitasJenisEnum("jenis").notNull(),
    parentId: uuid("parent_id"),
    kelurahan: text("kelurahan"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    deskripsi: text("deskripsi"),
    slugPublik: text("slug_publik").notNull().unique(),
    rekeningTujuan: text("rekening_tujuan"),
    nominalIuranDefault: bigint("nominal_iuran_default", { mode: "number" }).default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("communities_kelurahan_idx").on(t.kelurahan)],
);

/** Profil pengguna — id = auth.users.id (FK ditambahkan di SQL). TANPA NIK. */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  nama: text("nama").notNull().default(""),
  noHp: text("no_hp"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Keanggotaan — basis multi-tenant & peran (dasar semua RLS). */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    peran: peranEnum("peran").notNull().default("warga"),
    status: statusAnggotaEnum("status").notNull().default("aktif"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("memberships_community_profile_uniq").on(t.communityId, t.profileId),
    index("memberships_community_idx").on(t.communityId),
    index("memberships_profile_idx").on(t.profileId),
  ],
);

/* ============================== KEUANGAN ============================== */

/** Buku kas (transparansi). Opsional rantai-hash SHA-256 untuk anti-utak-atik. */
export const kasEntries = pgTable(
  "kas_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    jenis: kasJenisEnum("jenis").notNull(),
    nominal: bigint("nominal", { mode: "number" }).notNull(),
    keterangan: text("keterangan").notNull(),
    tgl: date("tgl").notNull(),
    dibuatOleh: uuid("dibuat_oleh").references(() => profiles.id),
    donationId: uuid("donation_id"),
    hashPrev: text("hash_prev"),
    hashSelf: text("hash_self"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("kas_community_tgl_idx").on(t.communityId, t.tgl)],
);

/** Donasi & iuran — transfer manual + foto bukti (tanpa payment gateway). */
export const donations = pgTable(
  "donations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    donaturId: uuid("donatur_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    jenis: donasiJenisEnum("jenis").notNull().default("donasi"),
    nominal: bigint("nominal", { mode: "number" }).notNull(),
    buktiUrl: text("bukti_url"),
    status: donasiStatusEnum("status").notNull().default("menunggu"),
    verifikatorId: uuid("verifikator_id").references(() => profiles.id),
    catatan: text("catatan"),
    periode: text("periode"), // untuk iuran, mis. "2026-06"
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("donations_community_status_idx").on(t.communityId, t.status),
    index("donations_donatur_idx").on(t.donaturId),
  ],
);

/* ============================== KOMUNITAS / FEED ============================== */

/** Pengumuman (tulis = pengurus). `pinned` boleh tampil publik di /k/[slug]. */
export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    judul: text("judul").notNull(),
    isi: text("isi").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    fotoUrl: text("foto_url"),
    authorId: uuid("author_id").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("announcements_community_idx").on(t.communityId, t.pinned)],
);

/** Postingan warga. */
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    isi: text("isi").notNull(),
    fotoUrl: text("foto_url"),
    tersembunyi: boolean("tersembunyi").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("posts_community_created_idx").on(t.communityId, t.createdAt)],
);

export const postReactions = pgTable(
  "post_reactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    jenis: reaksiJenisEnum("jenis").notNull().default("suka"),
  },
  (t) => [unique("post_reactions_uniq").on(t.postId, t.profileId)],
);

export const postComments = pgTable(
  "post_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    isi: text("isi").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("post_comments_post_idx").on(t.postId)],
);

/* ============================== KEGIATAN / KAJIAN ============================== */

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    judul: text("judul").notNull(),
    jenis: acaraJenisEnum("jenis").notNull().default("kegiatan"),
    mulai: timestamp("mulai", { withTimezone: true }).notNull(),
    lokasi: text("lokasi"),
    deskripsi: text("deskripsi"),
    dibuatOleh: uuid("dibuat_oleh").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("events_community_mulai_idx").on(t.communityId, t.mulai)],
);

export const eventRsvp = pgTable(
  "event_rsvp",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("event_rsvp_uniq").on(t.eventId, t.profileId)],
);

/* ============================== ASPIRASI ============================== */

/** Lapor RT/RW (foto + lokasi opsional). */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    pelaporId: uuid("pelapor_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    kategori: text("kategori").notNull(),
    deskripsi: text("deskripsi").notNull(),
    fotoUrl: text("foto_url"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    status: laporanStatusEnum("status").notNull().default("baru"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("reports_community_status_idx").on(t.communityId, t.status)],
);

/** Polling / voting. */
export const polls = pgTable("polls", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id")
    .notNull()
    .references(() => communities.id, { onDelete: "cascade" }),
  pertanyaan: text("pertanyaan").notNull(),
  opsi: jsonb("opsi").notNull(), // string[]
  berakhir: timestamp("berakhir", { withTimezone: true }),
  dibuatOleh: uuid("dibuat_oleh").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pollVotes = pgTable(
  "poll_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    opsiIndex: integer("opsi_index").notNull(),
  },
  (t) => [unique("poll_votes_uniq").on(t.pollId, t.profileId)],
);

/* ============================== DIREKTORI & IBADAH ============================== */

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    nama: text("nama").notNull(),
    peran: text("peran").notNull(),
    noHp: text("no_hp"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("contacts_community_idx").on(t.communityId)],
);

/** Daftar item mutabaah; community_id null = default global. */
export const mutabaahItems = pgTable("mutabaah_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  communityId: uuid("community_id").references(() => communities.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  urutan: integer("urutan").notNull().default(0),
});

/** Log mutabaah harian per pengguna. */
export const mutabaahLogs = pgTable(
  "mutabaah_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => mutabaahItems.id, { onDelete: "cascade" }),
    tanggal: date("tanggal").notNull(),
    done: boolean("done").notNull().default(false),
  },
  (t) => [unique("mutabaah_logs_uniq").on(t.profileId, t.itemId, t.tanggal)],
);

/** Cache jadwal sholat harian per komunitas (dari Aladhan). */
export const prayerCache = pgTable(
  "prayer_cache",
  {
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    tanggal: date("tanggal").notNull(),
    waktu: jsonb("waktu").notNull(),
  },
  (t) => [unique("prayer_cache_uniq").on(t.communityId, t.tanggal)],
);

/* ============================== NOTIFIKASI & AUDIT ============================== */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    communityId: uuid("community_id").references(() => communities.id, { onDelete: "cascade" }),
    judul: text("judul").notNull(),
    isi: text("isi"),
    link: text("link"),
    dibaca: boolean("dibaca").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("notifications_profile_idx").on(t.profileId, t.dibaca)],
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  keys: jsonb("keys").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    communityId: uuid("community_id").references(() => communities.id, { onDelete: "cascade" }),
    aktorId: uuid("aktor_id").references(() => profiles.id),
    aksi: text("aksi").notNull(),
    entitas: text("entitas").notNull(),
    entitasId: uuid("entitas_id"),
    waktu: timestamp("waktu", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_community_idx").on(t.communityId, t.waktu)],
);
