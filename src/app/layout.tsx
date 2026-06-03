import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";

import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import {
  PWA_APP_NAME,
  PWA_DESCRIPTION,
  PWA_THEME_COLOR,
} from "@/config/pwa";

import { AppProviders } from "./providers";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-rubik",
});

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: PWA_APP_NAME,
  description: PWA_DESCRIPTION,
  applicationName: PWA_APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_APP_NAME,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <body className="font-sans antialiased">
        <AppProviders>
          {children}
          <PwaInstallBanner />
        </AppProviders>
      </body>
    </html>
  );
}
