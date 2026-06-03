import type { MetadataRoute } from "next";

import {
  PWA_APP_NAME,
  PWA_BACKGROUND_COLOR,
  PWA_DESCRIPTION,
  PWA_SHORT_NAME,
  PWA_THEME_COLOR,
} from "@/config/pwa";

/**
 * Web app manifest (served at `/manifest.webmanifest`).
 * `dir` / `lang` align with `layout.tsx` for RTL Hebrew.
 *
 * Icons: `public/icons/icon-192.png` and `icon-512.png` are required for install.
 * Maskable uses the 512 asset as a practical stub (safe-area padding in source art is ideal).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: PWA_APP_NAME,
    short_name: PWA_SHORT_NAME,
    description: PWA_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    dir: "rtl",
    lang: "he",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
