import type { ReactNode } from "react";

/** Avoid stale RSC/nav cache for public booking in production. */
export const dynamic = "force-dynamic";

export default function BookSlugLayout({ children }: { children: ReactNode }) {
  return children;
}
