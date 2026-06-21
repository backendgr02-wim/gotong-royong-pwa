import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppFrame } from "@/components/layout/app-frame";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gotong Royong",
  description:
    "Aplikasi komunitas RT/RW & Masjid: transparansi kas, jadwal sholat, pengumuman, lapor warga, donasi.",
  applicationName: "Gotong Royong",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Gotong Royong" },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
