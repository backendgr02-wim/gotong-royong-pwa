import { z } from "zod";

/**
 * Skema validasi terpusat (zod) — dipakai di SETIAP Server Action (batas server).
 * Memenuhi standar keamanan playbook (validasi input di tiap batas) & mencegah data sampah.
 * Ditulis kompatibel zod v3/v4 (pakai .regex untuk tanggal, .email() untuk email).
 */

const tanggalISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");

const nominalRupiah = z.coerce
  .number()
  .int("Nominal harus bilangan bulat")
  .positive("Nominal harus lebih dari 0")
  .max(1_000_000_000_000, "Nominal tidak wajar");

export const masukSchema = z.object({
  email: z.string().email("Email tidak valid").max(254),
});

export const profilSchema = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 huruf").max(80),
  noHp: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, "Nomor HP tidak valid")
    .optional()
    .or(z.literal("")),
});

export const buatKomunitasSchema = z.object({
  nama: z.string().trim().min(3).max(100),
  jenis: z.enum(["rt", "rw", "masjid"]),
  kelurahan: z.string().trim().max(100).optional().or(z.literal("")),
  deskripsi: z.string().trim().max(500).optional().or(z.literal("")),
});

export const gabungKomunitasSchema = z.object({
  communityId: z.string().uuid(),
});

export const kasSchema = z.object({
  jenis: z.enum(["masuk", "keluar"]),
  nominal: nominalRupiah,
  keterangan: z.string().trim().min(3, "Keterangan minimal 3 huruf").max(200),
  tgl: tanggalISO,
});

export const donasiSchema = z.object({
  jenis: z.enum(["donasi", "iuran"]).default("donasi"),
  nominal: nominalRupiah,
  buktiUrl: z.string().url("URL bukti tidak valid").optional().or(z.literal("")),
  periode: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Periode harus YYYY-MM")
    .optional()
    .or(z.literal("")),
  website: z.literal("").optional(), // honeypot
});

export const verifikasiDonasiSchema = z.object({
  donationId: z.string().uuid(),
  status: z.enum(["terverifikasi", "ditolak"]),
  catatan: z.string().trim().max(200).optional().or(z.literal("")),
});

export const pengumumanSchema = z.object({
  judul: z.string().trim().min(3).max(120),
  isi: z.string().trim().min(3).max(2000),
  pinned: z.coerce.boolean().default(false),
  fotoUrl: z.string().url().optional().or(z.literal("")),
});

export const postSchema = z.object({
  isi: z.string().trim().min(1, "Tulis sesuatu dulu").max(2000),
  fotoUrl: z.string().url().optional().or(z.literal("")),
  // honeypot: harus kosong (anti-bot)
  website: z.literal("").optional(),
});

export const komentarSchema = z.object({
  postId: z.string().uuid(),
  isi: z.string().trim().min(1).max(800),
});

export const kegiatanSchema = z.object({
  judul: z.string().trim().min(3).max(120),
  jenis: z.enum(["kajian", "kegiatan"]).default("kegiatan"),
  mulai: z.string().min(10, "Waktu mulai wajib diisi"),
  lokasi: z.string().trim().max(160).optional().or(z.literal("")),
  deskripsi: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const laporSchema = z.object({
  kategori: z.string().trim().min(2).max(60),
  deskripsi: z.string().trim().min(5, "Jelaskan minimal 5 huruf").max(1000),
  fotoUrl: z.string().url().optional().or(z.literal("")),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  website: z.literal("").optional(), // honeypot
});

export const pollSchema = z.object({
  pertanyaan: z.string().trim().min(3).max(200),
  opsi: z.array(z.string().trim().min(1).max(100)).min(2, "Minimal 2 opsi").max(8),
  berakhir: z.string().optional().or(z.literal("")),
});

export const voteSchema = z.object({
  pollId: z.string().uuid(),
  opsiIndex: z.coerce.number().int().min(0).max(7),
});

export const toggleMutabaahSchema = z.object({
  itemId: z.string().uuid(),
});

export const rsvpSchema = z.object({
  eventId: z.string().uuid(),
});

export const postRefSchema = z.object({
  postId: z.string().uuid(),
});

export const laporStatusSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(["baru", "diproses", "selesai"]),
});

export const notifRefSchema = z.object({
  notifId: z.string().uuid(),
});

export type KasInput = z.infer<typeof kasSchema>;
export type DonasiInput = z.infer<typeof donasiSchema>;
export type LaporInput = z.infer<typeof laporSchema>;
