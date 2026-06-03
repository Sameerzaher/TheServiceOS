/** Shared Tailwind tokens — keep layouts consistent without a heavy design system. */
const inputBase =
  "w-full min-h-[2.75rem] rounded-xl border-2 border-neutral-300/90 bg-white py-2.5 text-base leading-normal text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 hover:border-emerald-400/50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-emerald-600/60 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/25";

const cardSurface =
  "rounded-2xl border border-neutral-200/80 bg-white shadow-lg ring-1 ring-neutral-950/[0.04] transition-shadow hover:shadow-xl dark:border-neutral-700 dark:bg-neutral-900 dark:ring-white/[0.06] dark:hover:shadow-emerald-950/20";

export const ui = {
  pageMain:
    "mx-auto min-h-dvh w-full max-w-2xl px-4 py-6 sm:max-w-3xl sm:px-6 sm:py-10 sm:pb-10",
  pageStack: "flex flex-col gap-8 sm:gap-12",
  section: "space-y-4 sm:space-y-5",
  sectionHeading:
    "text-lg font-bold tracking-tight text-neutral-900 sm:text-xl dark:text-neutral-100",
  pageTitle:
    "text-3xl font-black tracking-tight text-neutral-900 sm:text-4xl bg-gradient-to-br from-neutral-900 to-emerald-700 bg-clip-text text-transparent dark:from-neutral-50 dark:to-emerald-400 dark:text-transparent",
  pageSubtitle:
    "mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-400",
  header:
    "mb-6 border-b-2 border-neutral-200/70 pb-5 sm:mb-10 sm:pb-8 dark:border-neutral-700",
  card: cardSurface,
  cardHover:
    "transition hover:border-emerald-200/80 hover:ring-emerald-900/[0.06] hover:-translate-y-0.5 dark:hover:border-emerald-700/70 dark:hover:ring-emerald-400/10",
  cardPadding: "p-5 sm:p-6",
  statCard: `${cardSurface} p-4 sm:p-6 bg-gradient-to-br from-white to-emerald-50/30 dark:from-neutral-900 dark:to-emerald-950/35`,
  formCard: `${cardSurface} p-4 sm:p-8`,
  list: "flex w-full flex-col gap-4 sm:gap-5",
  listItem: `${cardSurface} px-5 py-6 sm:p-6 hover:border-emerald-300/50 dark:hover:border-emerald-700/50`,
  input: `${inputBase} px-3`,
  /** Native `<select>` — chevron + RTL padding via `.form-select` in `globals.css`. */
  select: `${inputBase} form-select`,
  label:
    "mb-1.5 block text-sm font-semibold text-neutral-800 dark:text-neutral-200",
} as const;
