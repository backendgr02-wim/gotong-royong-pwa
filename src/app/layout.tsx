import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SerwistProvider } from "@serwist/next/react";
import { AppFrame } from "@/components/layout/app-frame";
import { NetworkStatus } from "@/components/features/network-status";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const APP_NAME = "Gotong Royong";
const APP_DESCRIPTION =
  "Aplikasi komunitas RT/RW & Masjid: transparansi kas, jadwal sholat, pengumuman, lapor warga, donasi.";

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: APP_NAME },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
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
        <SerwistProvider swUrl="/sw.js">
          <NetworkStatus>
            <AppFrame>{children}</AppFrame>
          </NetworkStatus>
        </SerwistProvider>
      </body>
    </html>
  );
}
