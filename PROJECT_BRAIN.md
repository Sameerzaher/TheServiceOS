# Project Brain

## 1. Product Overview

* **What the product does:** ServiceOS is a **multi-teacher operations app** for small service businesses (driving schools, clinics, etc.). It provides **appointments**, **client (customer) records**, **availability and slot booking**, **public booking pages** reachable via a per-teacher **slug URL**, **dashboard analytics**, **notifications**, **WhatsApp-oriented reminders**, optional **email (Resend)**, **PWA/offline** support, and **Stripe-related** dependencies for payments (integration points exist in code).
* **Who the target users are:** **Independent teachers / instructors** and **small businesses** that schedule lessons or visits; **end customers** use the public `/book/[slug]` flow without logging in; **staff/admin** use the authenticated `(app)` shell.
* **What problem it solves:** Replaces ad-hoc scheduling (spreadsheets, WhatsApp chaos) with a **single place** for calendar, clients, booking requests, reminders, and branded public booking links—**Hebrew-first**, **RTL**, and **vertical-specific** labels (e.g. driving vs. cosmetic).

---

## 2. Core Features

| Feature | What it does (in this codebase) |
|--------|----------------------------------|
| **Public booking** | Customer opens `/book/[slug]`, sees teacher info, picks a slot, submits; creates **pending** booking data via `POST /api/bookings` (server + Supabase admin). |
| **Internal booking / requests** | Dashboard lists booking requests; staff **approve/reject** via `PUT /api/bookings/[id]`; maps to **appointments** + `customFields` (e.g. `bookingApproval`). |
| **Appointments** | Full CRUD via `ServiceStorage` + `/api/appointments`; calendar UI (`react-big-calendar`). |
| **Clients** | Customer directory—not named “students” in code; types are `Client` / `clients` table. |
| **Teachers** | Multi-teacher per **business**; CRUD under `/api/teachers`; session-scoped listing; slugs for public links. |
| **Availability & slots** | `AvailabilitySettings` + `generateAvailableSlots`; persisted via `/api/availability-settings` (browser uses service role path because of RLS). |
| **Blocked dates** | API `/api/blocked-dates`; feeds slot generation and overlap logic. |
| **Settings** | `AppSettings` (branding, vertical, etc.) via `appSettingsRepository` + settings UI. |
| **Notifications** | In-app list via `/api/notifications` + `NotificationBell` (Supabase `notifications` table when present). |
| **Reminders** | Schedule/send routes under `/api/reminders/*`; templates in `core/utils/reminderTemplate`, WhatsApp helpers, optional AI reminder route `/api/ai/reminder`. |
| **Auth** | Cookie `session_token` → `sessions` table → `teachers`; `validateSession` in `lib/auth/session.ts`. |
| **Analytics & dashboard** | `/api/analytics`, dashboard components, insights utils. |
| **Backup/export** | JSON backup schema under `core/backup`, UI in settings; CSV export feature. |
| **Demo mode** | Seed/load demo data (`api/demo/load`, `core/demo`). |
| **PWA** | `@ducanh2912/next-pwa`, offline page `/offline`, manifest via `app/manifest.ts`. |

---

## 3. Architecture Overview

* **Tech stack:** **Next.js 14** (App Router), **React 18**, **TypeScript**, **Tailwind CSS**, **Supabase** (`@supabase/supabase-js`) with **anon browser client** + **service-role admin client** on the server, **Resend**, **Stripe** libraries, **next-pwa**.
* **High-level structure:**
  * **`src/app/`** — Routes: `(app)` authenticated shell, `(marketing)` public pages, `book/` public booking, `api/*` Route Handlers.
  * **`src/features/`** — Feature UI + hooks (booking, clients, appointments, settings, auth context, etc.).
  * **`src/core/`** — Domain types, Supabase repositories, storage abstraction (`ServiceStorage`), backup, reminders helpers, utils.
  * **`src/lib/`** — Cross-cutting: Supabase clients, session, `resolveBusinessId` / `resolveTeacherId`, email, audit, payments stub.
  * **`src/config/`** — Hebrew strings (`heUi`), vertical presets, PWA metadata, branding.
  * **`supabase/`** — SQL migrations and one-off scripts (not a single linear migration history; multiple fix/seed files).
* **How layers interact:**
  * **Browser:** `StorageProvider` loads **`createServiceStorage()`** (lazy) → **Supabase adapter** for clients/appointments/settings; **availability** is loaded via **`fetch('/api/availability-settings')`** with teacher scope headers (RLS bypass for writes).
  * **Server APIs:** Use **`getSupabaseAdminClient()`**, **`validateSession`**, **`resolveTeacherIdFromRequest` / `resolveTeacherScopeFromSession`**, **`resolveBusinessIdForTeacher`** for multitenant-safe queries.
  * **Public booking** does **not** rely on the user’s `ServiceStorage`; it uses **bootstrap + POST bookings** with explicit `teacherId`.

---

## 4. Folder & File Structure

* **`src/app/layout.tsx`** — Root HTML, `Rubik` font, RTL, `AppProviders`.
* **`src/app/providers.tsx`** — `LocaleProvider`, `ThemeProvider`, `ToastProvider`, `StorageProvider`.
* **`src/app/(app)/layout.tsx`** — Authenticated layout: `AuthContext`, `AppShell`, teacher dashboard context.
* **`src/app/(app)/*`** — Dashboard, appointments, clients, booking, settings, teachers, blocked-dates.
* **`src/app/book/[slug]/page.tsx`** — Public booking page (client component; bootstrap fetch).
* **`src/app/api/**`** — All REST-style Route Handlers (`route.ts` per folder).
* **`src/features/booking/`** — `PublicBookingPageContent`, forms, slot picker, `useBooking`, `usePublicTeacherAppointments`, `generateAvailableSlots`, `publicBookingShared.ts`.
* **`src/core/storage/`** — `StorageContext`, `createServiceStorage`, `supabaseStorageAdapter`, mappers, write queue.
* **`src/core/repositories/supabase/`** — `clientsRepository`, `appointmentsRepository`, `appSettingsRepository`, `bookingSettingsRepository`, `postgrestErrors`.
* **`src/lib/api/resolveBusinessId.ts`** — Tenant `business_id` from `teachers` row.
* **`src/config/locale/he/strings.ts`** — Primary UI copy (`heUi`).
* **`next.config.mjs`** — PWA wrapper, `outputFileTracing: false`, webpack `splitChunks` tweaks for Windows dev/server stability.
* **`scripts/clean-next.mjs`** — Deletes `.next` (`npm run clean`).

---

## 5. Booking Flow (Critical)

### A. Public customer (`/book/[slug]`)

1. **UI:** `src/app/book/[slug]/page.tsx` reads `slug`, calls **`GET /api/public-booking/bootstrap?slug=...`**.
2. **Bootstrap API:** `src/app/api/public-booking/bootstrap/route.ts` resolves **teacher** by slug, loads **`business_id`** (from teacher, not env-only), merges **app settings + booking settings + availability**, returns JSON (`ok`, `teacher`, `availability`, …). On missing teacher → **404**; infra errors → **503** as implemented.
3. **Ready state:** Renders **`PublicBookingPageContent`** with `teacherId`, `businessType`, identity, `availability`.
4. **Slots:** `usePublicTeacherAppointments(teacherId)` loads existing appointments for overlap; **`generateAvailableSlots`** combines **availability**, **blocked dates** (from settings path), and **existing appointments**.
5. **Submit:** User fills **`PublicBookingForm`** → **`useBooking.submitBooking`** → **`POST /api/bookings`** with JSON including **`teacherId`**, **`slotStart`/`slotEnd`**, **`status: "pending"`**, **`bookingCustomFields`**, etc.
6. **API:** `src/app/api/bookings/route.ts` (POST) validates body (`parsePublicBookingBody` / shared helpers), **`normalizePhone`**, **`sanitizePublicBookingCustomFields`**, checks **`bookingOverlapsExistingAppointments`**, **`isDateBlocked`**, resolves **`business_id`** via **`resolveBusinessIdForTeacher`**, upserts **client** and inserts **appointment** with **`status: AppointmentStatus.Scheduled`**, **`payment_status: Unpaid`**, and **`custom_fields`** including **`bookingApproval: "pending"`**, **`bookingSource: "public"`**, **`bookingSlotEnd`**, etc. The HTTP payload’s **`status: "pending"`** is stored as **`bookingRequestStatus`** inside **`custom_fields`**—**staff approval** is driven by **`bookingApproval`** (`approved` / `rejected`), not by changing `AppointmentStatus` to a nonexistent “pending” enum value.
7. **Response:** JSON `{ ok: true, bookingId?, ... }` or 4xx/5xx with Hebrew error strings.

### B. Staff approval

1. **UI:** e.g. **`BookingRequestsPanel`** / dashboard calls **`PUT /api/bookings/[id]`** with teacher scope headers.
2. **API:** `src/app/api/bookings/[id]/route.ts` validates session, resolves **business_id**, updates appointment/customFields (**approved/rejected** paths—see file for exact transitions to **`AppointmentStatus`**).

### Files to touch when changing booking behavior

* **Shared rules:** `src/features/booking/logic/publicBookingShared.ts`
* **Slots:** `src/features/booking/utils/generateAvailableSlots.ts`, `src/core/types/availability.ts`
* **Client submit:** `src/features/booking/hooks/useBooking.ts`
* **Server:** `src/app/api/bookings/route.ts`, `src/app/api/bookings/[id]/route.ts`, `src/app/api/public-booking/bootstrap/route.ts`
* **Multitenant:** `src/lib/api/resolveBusinessId.ts`

---

## 6. Data Flow

* **Authenticated app data:** React tree → **`StorageProvider`** → **`ServiceStorage`** implementation (**Supabase** adapter) → repositories scoped by **`business_id`** + **`teacher_id`** (headers / env default teacher).
* **Availability writes:** Not only direct Supabase from browser; **`persistAvailabilitySettings`** path goes through **`/api/availability-settings`** (see comments in `supabaseStorageAdapter.ts`).
* **Server-only data:** Teachers listing, notifications, bookings POST/PUT, bootstrap—**admin client** + session.
* **State management:** **React Context** — `AuthContext`, `ThemeProvider`, `LocaleProvider`, `StorageContext`, `DashboardTeacherContext`, `ToastProvider`. No Redux/Zustand in `package.json`.
* **API communication:** `fetch` to same-origin `/api/*` with JSON; teacher scope via **`mergeTeacherScopeHeaders`** (`x-teacher-id` pattern—see `lib/api/teacherScopeHeaders.ts`).

---

## 7. Business Logic Rules

* **Booking / slots**
  * **Overlap:** `bookingOverlapsExistingAppointments` in `publicBookingShared.ts` — ignores **cancelled** appointments; uses **`customFields.bookingSlotEnd`** when present to determine window end.
  * **Blocked dates:** `isDateBlocked` supports **recurring** (month/day) and exact dates.
  * **Custom fields (public):** Allowlist **`PUBLIC_BOOKING_CUSTOM_FIELD_KEYS`** (`pickupLocation`, `transmissionType`, `treatmentType`, `treatmentArea`, `carType`); unknown keys stripped.
  * **Phone:** `normalizePhone` strips non-digits except leading `+`.
* **Multitenant:** **`getSupabaseBusinessId()`** reads **`NEXT_PUBLIC_BUSINESS_ID`** with MVP default UUID; **`resolveBusinessIdForTeacher`** prefers **`teachers.business_id`** for API routes that must not rely on env alone.
* **Session:** **`validateSession`** ties cookie to **`sessions`** and active **`teachers`** row; APIs return **401** when unauthenticated.
* **Assumptions (from code comments / env):** Single-deployment MVP defaults in `supabaseEnv.ts` (`DEFAULT_MVP_BUSINESS_ID`, `DEFAULT_MVP_TEACHER_ID`); table names overridable via **`NEXT_PUBLIC_SUPABASE_*_TABLE`**.

---

## 8. UI & UX Rules

* **Design system:** Shared primitives under **`src/components/ui/`** — `Button`, `Modal`, `Toast`, `Spinner`, `ui` class tokens (`ui.pageMain`, `ui.input`, etc.), `theme.ts`.
* **Hebrew / RTL:** Root **`layout.tsx`** sets **`lang="he"`**, **`dir="rtl"`**; copy centralized in **`heUi`** (`config/locale/he/`).
* **Verticals:** **`getVerticalPreset`**, **`VERTICAL_REGISTRY`**, presets in `config/verticals/*.ts` — drive labels and **custom booking fields**.
* **App shell:** **`AppShell`** — pathname-aware navigation, mobile bottom bar; **`ToastProvider`** adjusts bottom padding for **`/book/*`** and **`/offline`** via **`usePathname`**.
* **Theming:** **`ThemeProvider`** — `light` / `dark` / `system` with `localStorage` key **`serviceos.theme`** and **`dark`** class on `documentElement`.
* **PWA:** Install banner **`PwaInstallBanner`**, offline fallback **`/offline`**.

---

## 9. Code Conventions

* **Naming:** Hebrew user-facing strings in **`heUi`**; domain entities **Client**, **Appointment**, **Teacher** (not “Student”). Files often **PascalCase** for components, **camelCase** for functions. API routes export **`GET`/`POST`/`PUT`** handlers as named exports.
* **Imports:** Alias **`@/`** → `src/`.
* **“use client”:** Client components at top of file when using hooks or browser APIs.
* **API routes:** `export const runtime = "nodejs"` and often **`dynamic = "force-dynamic"`** where static rendering is unsafe.
* **Repositories:** Supabase-specific modules under **`core/repositories/supabase/`**; not all domains have a repository (e.g. teachers logic inlined in API routes).

---

## 10. Current Gaps (IMPORTANT)

* **No dedicated `teachersRepository` / `bookingsRepository`:** Teacher and booking SQL is largely **inside Route Handlers**—harder to test and reuse.
* **`AppointmentStatus` vs. booking request “pending”:** New public rows use **`AppointmentStatus.Scheduled`** at the DB layer; the **request** waiting for staff is represented by **`custom_fields.bookingApproval === "pending"`** (and related keys). The client still sends **`status: "pending"`** in the POST body for **`bookingRequestStatus`**—**always cross-check `route.ts`** when changing status semantics.
* **`outputFileTracing: false` in `next.config.mjs`:** Trades **smaller/traceable Vercel bundles** for Windows build stability; Next warns this may go away—**deploy size / trace behavior** should be revisited.
* **Webpack workarounds:** **`splitChunks: false`** on server and in **client dev** to avoid missing chunks / HMR issues on Windows—**larger dev bundles**, non-default behavior.
* **Notifications / reminders:** Heavy logic in **`route.ts`** files; **DB must be created manually** (SQL files in `supabase/`); error messages reference missing tables.
* **Tests:** No **`jest`/`vitest`** in `package.json`; **`src/qa`** is manual helpers, not automated CI tests.
* **ESLint:** Known warning in **`NotificationBell`** (`react-hooks/exhaustive-deps`) per prior lint output.
* **Build-time noise:** API routes that use **`cookies`/`headers`** log **dynamic server usage** during `next build` static generation—expected but noisy.

---

## 11. Next Priorities

1. **Extract repositories** for **teachers**, **bookings**, and optionally **notifications/reminders** to match `clientsRepository` / `appointmentsRepository` quality and simplify `route.ts` files.
2. **Align booking status model** in TypeScript (document or extend **`AppointmentStatus`** / `customFields` schema) so public “pending” vs. internal approval is **one clear source of truth**.
3. **Revisit `outputFileTracing` and webpack overrides** once Windows/Next issues are confirmed fixed on target Node version—aim for **default Next behavior** in CI/production.
4. **Automated tests** for **`publicBookingShared`** (overlap, blocked dates) and **critical API handlers** (bookings POST/PUT with multitenant IDs).
5. **Operational hardening:** Structured logging, rate limiting on **public POST `/api/bookings`**, and monitoring for **`bootstrap`** / **reminders** endpoints (inferred as production concerns from public-facing design—not yet implemented as middleware in repo).

---

*Generated from repository structure and key source files. Update this document when architecture or flows change.*
## 12. AI Operating Instructions

You are a senior full-stack engineer working on ServiceOS.

Always follow these rules:
- Use this document as the source of truth
- Do not invent architecture that does not exist
- Prefer minimal safe changes
- Preserve Hebrew RTL support
- Always identify target files before coding
- Focus on production-ready solutions

When implementing:
1. Identify relevant files
2. Explain the change
3. Implement minimal safe code
4. Suggest manual tests

Focus on:
- Booking flow stability
- Validation and edge cases
- Real user experience