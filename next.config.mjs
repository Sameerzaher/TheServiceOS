import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  /** Cache client navigations so App Router routes work offline after first visit. */
  cacheOnFrontEndNav: true,
  /** When both network and cache fail, show a friendly offline page (must exist at this path). */
  fallbacks: {
    document: "/offline",
  },
});

const isVercel = process.env.VERCEL === "1";
const isWin = process.platform === "win32";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  /**
   * On some Windows setups, `next build` fails during "Collecting build traces"
   * with ENOENT for `.nft.json` / rename under `.next`. Disabling tracing avoids
   * that flake. Vercel/Linux builds should keep tracing on so the serverless
   * bundle includes the app correctly (avoids `clientReferenceManifest` / `clientModules` crashes).
   */
  outputFileTracing: isVercel || !isWin,

  /**
   * - Client dev: disable splitChunks to reduce flaky `MODULE_NOT_FOUND` from
   *   webpack-runtime on Windows HMR.
   * - **Prod** server on Windows: disable splitChunks (avoids missing `./<id>.js`
   *   chunks during `next build` / trace). Dev server must **not** do this on
   *   the server bundle — it breaks App Router SSR (`ErrorBoundary` →
   *   `usePathname` → null React dispatcher / `useContext`).
   */
  webpack: (config, { dev, isServer }) => {
    const disableSplitChunks =
      (!isServer && dev) || (isServer && isWin && !dev);
    if (disableSplitChunks) {
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
      };
    }
    return config;
  },
};

export default withPWA(nextConfig);
