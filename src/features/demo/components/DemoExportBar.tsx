"use client";

import { heUi } from "@/config";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface DemoExportBarProps {
  onLoadDemo: () => void;
  /** Opens confirmation — parent runs destructive reset after user confirms. */
  onRequestReset: () => void;
  onExportStudents: () => void;
  /** Disables actions during one-shot operations (e.g. export). */
  disabled?: boolean;
  className?: string;
}

export function DemoExportBar({
  onLoadDemo,
  onRequestReset,
  onExportStudents,
  disabled = false,
  className,
}: DemoExportBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:p-5",
        className,
      )}
    >
      <Button
        type="button"
        variant="primary"
        onClick={onLoadDemo}
        disabled={disabled}
      >
        {heUi.demo.load}
      </Button>
      <Button
        type="button"
        variant="danger"
        onClick={onRequestReset}
        disabled={disabled}
        aria-label={heUi.dialog.resetDemoTitle}
      >
        {heUi.demo.reset}
      </Button>
      <span className="hidden h-8 w-px bg-neutral-200 sm:block" aria-hidden />
      <Button
        type="button"
        variant="secondary"
        onClick={onExportStudents}
        disabled={disabled}
      >
        {heUi.export.students}
      </Button>
    </div>
  );
}
