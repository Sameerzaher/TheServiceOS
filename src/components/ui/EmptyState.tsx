import { cn } from "@/lib/cn";

export type EmptyStateTone = "neutral" | "muted" | "warning";

export interface EmptyStateProps {
  title: string;
  description?: string;
  tone?: EmptyStateTone;
  className?: string;
}

const toneClass: Record<EmptyStateTone, string> = {
  neutral:
    "border border-dashed border-neutral-300/90 bg-white shadow-sm ring-1 ring-neutral-950/[0.03]",
  muted:
    "border border-neutral-200/80 bg-neutral-50/95 shadow-sm ring-1 ring-neutral-950/[0.04]",
  warning:
    "border border-amber-200/90 bg-amber-50/90 shadow-sm ring-1 ring-amber-900/10",
};

export function EmptyState({
  title,
  description,
  tone = "neutral",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl px-6 py-12 text-center",
        toneClass[tone],
        className,
      )}
      role="status"
    >
      <p className="text-base font-medium text-neutral-900">{title}</p>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {description}
        </p>
      ) : null}
    </div>
  );
}
