import Link from "next/link";

import { heUi } from "@/config";
import { ui } from "@/components/ui";

export default function NotFound() {
  return (
    <main className={ui.pageMain}>
      <h1 className={ui.pageTitle}>{heUi.clientProfile.notFound}</h1>
      <p className="mt-2 text-neutral-600">
        <Link
          href="/"
          className="font-medium text-neutral-900 underline-offset-2 hover:underline"
        >
          {heUi.clientProfile.back}
        </Link>
      </p>
    </main>
  );
}
