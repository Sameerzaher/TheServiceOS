"use client";

import { useCallback, useState } from "react";

import { heUi } from "@/config";
import { Button, useToast } from "@/components/ui";
import { generateReminderMessage } from "@/features/reminders/api/generateReminderMessage";
import { cn } from "@/lib/cn";

export interface AiReminderButtonProps {
  clientName: string;
  date: string;
  time: string;
  businessName: string;
  className?: string;
  onCopied?: () => void;
}

export function AiReminderButton({
  clientName,
  date,
  time,
  businessName,
  className,
  onCopied,
}: AiReminderButtonProps) {
  const toast = useToast();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const onGenerate = useCallback(async () => {
    setBusy(true);
    setCopied(false);
    try {
      const { message: next } = await generateReminderMessage({
        clientName,
        date,
        time,
        businessName,
      });
      setMessage(next);
    } finally {
      setBusy(false);
    }
  }, [clientName, date, time, businessName]);

  const onCopy = useCallback(async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      onCopied?.();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast(heUi.reminders.clipboardError, "error");
      setCopied(false);
    }
  }, [message, onCopied, toast]);

  return (
    <div
      className={cn("flex flex-col gap-2 border-t border-neutral-100 pt-3", className)}
    >
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-w-0 flex-1 sm:flex-initial"
          disabled={busy}
          aria-busy={busy}
          onClick={() => void onGenerate()}
        >
          {busy ? heUi.reminders.aiGenerating : heUi.reminders.aiGenerate}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="min-w-0 flex-1 sm:flex-initial"
          disabled={!message || busy}
          onClick={() => void onCopy()}
        >
          {copied ? heUi.reminders.copied : heUi.reminders.aiCopy}
        </Button>
      </div>
      {message ? (
        <p
          className="rounded-lg bg-neutral-50 px-3 py-2 text-sm leading-relaxed text-neutral-800"
          dir="rtl"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
