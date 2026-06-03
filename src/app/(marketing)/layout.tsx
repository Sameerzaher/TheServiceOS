import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PRODUCT_BRANDING } from "@/config/branding";

export const metadata: Metadata = {
  title: `${PRODUCT_BRANDING.name} - ${PRODUCT_BRANDING.tagline}`,
  description: PRODUCT_BRANDING.tagline,
  keywords: [
    "ניהול תורים",
    "הזמנת תורים אונליין",
    "מערכת לקביעת תורים",
    "מורה נהיגה",
    "מרפאה קוסמטית",
    "ניהול לקוחות",
    "תזכורות ווטסאפ",
    "CRM לעסקים קטנים",
  ],
  authors: [{ name: PRODUCT_BRANDING.nameEn }],
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: "https://torpo.co.il",
    siteName: PRODUCT_BRANDING.name,
    title: `${PRODUCT_BRANDING.name} - ${PRODUCT_BRANDING.tagline}`,
    description: PRODUCT_BRANDING.tagline,
    images: [
      {
        url: "https://torpo.co.il/og-image.png",
        width: 1200,
        height: 630,
        alt: PRODUCT_BRANDING.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${PRODUCT_BRANDING.name} - ${PRODUCT_BRANDING.tagline}`,
    description: PRODUCT_BRANDING.tagline,
    images: ["https://torpo.co.il/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://torpo.co.il",
  },
  verification: {
    google: "YOUR_GOOGLE_SITE_VERIFICATION_CODE",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell>{children}</MarketingShell>;
}
