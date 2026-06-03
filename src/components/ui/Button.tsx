import {
  type ButtonHTMLAttributes,
  forwardRef,
} from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "border-2 border-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-900/20 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl focus-visible:outline-emerald-700 active:scale-95 dark:border-emerald-500 dark:from-emerald-500 dark:to-emerald-600",
  secondary:
    "border-2 border-neutral-300/90 bg-white text-neutral-900 shadow-md hover:border-emerald-400/80 hover:bg-emerald-50/70 hover:shadow-lg focus-visible:outline-emerald-500/40 active:scale-95 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/50",
  danger:
    "border-2 border-red-300 bg-white text-red-700 shadow-md hover:bg-red-50 hover:shadow-lg focus-visible:outline-red-400 active:scale-95 dark:border-red-800 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-red-950/50",
};

const sizeClass: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "min-h-[2.5rem] px-3 py-1.5 text-xs font-semibold sm:text-sm",
  md: "min-h-[2.75rem] px-4 py-2 text-sm font-semibold sm:px-5 sm:text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold shadow-md transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantClass[variant],
          sizeClass[size],
          className,
        )}
        {...props}
      />
    );
  },
);
