import { cn } from "@/lib/cn";

export interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <span
      className={cn(
        "inline-block size-6 shrink-0 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-800",
        className,
      )}
      aria-hidden
    />
  );
}
