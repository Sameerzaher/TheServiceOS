import { InlineLoading, ui } from "@/components/ui";

export default function ClientProfileLoading() {
  return (
    <main className={ui.pageMain}>
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <InlineLoading />
      </div>
    </main>
  );
}
