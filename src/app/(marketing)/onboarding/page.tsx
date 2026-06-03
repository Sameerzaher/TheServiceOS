import { PRODUCT_BRANDING } from "@/config/branding";
import { OwnerOnboardingFlow } from "@/features/onboarding/owner/OwnerOnboardingFlow";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <div className="mb-8 text-center">
          <p className="text-4xl" aria-hidden>
            {PRODUCT_BRANDING.icon}
          </p>
          <h1 className="mt-3 text-lg font-semibold text-neutral-800 dark:text-neutral-100 sm:text-xl">
            {PRODUCT_BRANDING.setupTimeLabelHe}
          </h1>
        </div>
        <OwnerOnboardingFlow />
      </div>
    </div>
  );
}
