# DESIGN — Sistem Desain "Social Synergy" (Gotong Royong)

> Status: DRAFT · 19 Jun 2026. Token diambil **persis** dari `gotong_royong_app/lib/theme.dart`
> + `home_screen.dart` agar PWA identik dengan mockup yang sudah di-fix.

## 1. Warna (token Tailwind v4 `@theme`, format oklch + hex acuan)
| Token | Hex | Pakai |
|-------|-----|-------|
| `--color-primary` | `#10B981` | warna utama, tombol CTA, ikon aktif |
| `--color-primary-dark` | `#059669` | hover/pressed, tag "Ibadah" |
| `--color-primary-deep` | `#006C49` | teks heading gelap |
| `--color-header` | `#0E7A45` | header hijau & kartu unggulan |
| `--color-finance` | `#0A5C34` | kartu transparansi keuangan |
| `--color-accent` | `#F59E0B` (amber) | badge/cek di kartu transparansi |
| `--color-bg` | `#F9FAFB` / `#F8F9FA` | latar halaman |
| `--color-surface` | `#FFFFFF` | kartu/komponen |
| `--color-on-surface` | `#1A1B22` | teks utama |
| `--color-secondary` | `#5F5E60` | teks sekunder/metadata |
| `--color-outline` | `#E5E7EB` | border kartu |
| `--color-success-subtle` | `#ECFDF5` | badge positif |
| Tag warna | Ibadah `#059669`/bg `#D1FAE5`; Kesehatan `#16A34A`/bg `#DCFCE7` | badge artikel |

## 2. Tipografi
- Font: **Plus Jakarta Sans** via `next/font` (subset latin, display swap).
- Heading kartu 16–22px w700; total uang 30px w700; body 13–14px; metadata 10–12px.
- Aturan: teks minimum 16px untuk input (anti-zoom iOS); kurangi 60% teks di dashboard.

## 3. Bentuk & elevasi
- Radius: kartu 20–24px; header sudut bawah 28px; pill/badge 99px; tombol 16px.
- Bayangan: halus berlapis (`shadow` lembut, blur 6–12, opacity ~0.04–0.1). Hindari hitam pekat.
- Glassmorphism opsional pada overlay (border tipis `white/10` gelap, `black/5` terang).

## 4. Komponen wajib (shadcn/ui + kustom)
Button, Card, Input, Textarea, Select, Badge, Avatar, Tabs, Sheet, Dialog, Toast,
**Skeleton/Shimmer**, **EmptyState**, **ErrorState**, BottomNav (5 tab + FAB "+"), Header hijau.

## 5. Navigasi (sama seperti mockup)
Bottom Navigation: `[ Beranda ] [ Komunitas ] [ + Aksi ] [ Pesan ] [ Profil ]`.
Tombol "+ Aksi" tengah membuka layar Buat Aksi (route push). Tab lain pertahankan state.

## 6. Daftar halaman (route)
`/` (Beranda) · `/komunitas` · `/aksi` (Buat Aksi) · `/pesan` · `/profil` ·
`/masuk` · `/onboarding` · `/laporan-kas` · `/k/[slug]` (publik) · `/donasi` · `/lapor`.

## 7. Aturan mobile-first / aksesibilitas / performa
- Tap target ≥ 48px; kontras ≥ 4.5:1 (WCAG AA); ikon selalu berlabel teks.
- Skeleton shimmer (bukan spinner) untuk loading; status pakai warna + simbol.
- Lazy-load gambar (`next/image`, blur placeholder); hormati `prefers-reduced-motion`.
- Animasi via **motion** (spring lembut), smooth scroll **Lenis**.
- Target: bundle kecil, LCP < 3s di 3G/HP kentang, skor PWA hijau.

## 8. Aset
- Ikon `lucide-react`. Ikon PWA 192/512 (maskable) + theme-color `#10B981`, display `standalone`.
- Logo/ikon daun (mockup pakai `Icons.eco`) → siapkan SVG hijau.
