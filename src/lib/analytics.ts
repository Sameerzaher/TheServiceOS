// Simple event tracking utility
// Can be extended to work with Google Analytics, Mixpanel, etc.

type AnalyticsEvent = 
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "onboarding_started"
  | "onboarding_completed"
  | "teacher_created"
  | "client_added"
  | "appointment_created"
  | "booking_form_submitted"
  | "settings_updated"
  | "demo_started"
  | "help_article_viewed";

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

export function trackEvent(
  event: AnalyticsEvent,
  properties?: EventProperties
): void {
  if (typeof window === "undefined") return;

  // Console log for development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", event, properties);
  }

  // Google Analytics (gtag)
  if (typeof window.gtag !== "undefined") {
    window.gtag("event", event, properties);
  }

  // Facebook Pixel
  if (typeof window.fbq !== "undefined") {
    window.fbq("track", event, properties);
  }

  // Custom analytics endpoint (optional)
  try {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        properties,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch(() => {
      // Fail silently
    });
  } catch {
    // Fail silently
  }
}

export function trackPageView(pagePath: string): void {
  trackEvent("page_view", { page: pagePath });
}

// Identify user (for segmentation)
export function identifyUser(userId: string, traits?: EventProperties): void {
  if (typeof window === "undefined") return;

  // Console log for development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] Identify", userId, traits);
  }

  // Store user ID for future events
  try {
    window.localStorage.setItem("analytics.userId", userId);
  } catch {
    // Ignore
  }
}

// Declare global types for analytics scripts
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}
