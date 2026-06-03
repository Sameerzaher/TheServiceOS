import type { Metadata } from "next";

import { heUi } from "@/config";

export const metadata: Metadata = {
  title: `${heUi.pwa.offlineTitle} · ServiceOS`,
  robots: { index: false, follow: false },
};

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
