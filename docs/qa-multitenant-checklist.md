# Multi-tenant QA checklist (ServiceOS)

Use with **two QA teachers** seeded via `supabase/seed_qa_multitenant.sql` (slugs `qa-alpha`, `qa-beta`). Constants: `src/qa/multitenantFixtures.ts`.

## Preconditions

- Supabase env configured; `NEXT_PUBLIC_BUSINESS_ID` matches migration `00000000-0000-0000-0000-000000000001` (or your real business UUID).
- Run the seed SQL; confirm **3+** rows in `teachers` (default + QA Alpha + QA Beta).

## 1. Public booking URLs (unique per teacher)

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Open `/book/qa-alpha` | Page loads; header shows Alpha business/teacher identity. |
| 1.2 | Open `/book/qa-beta` in another tab | Page loads; **different** identity than Alpha. |
| 1.3 | Compare URLs | Paths are **`/book/qa-alpha`** vs **`/book/qa-beta`** — never identical. |

## 2. Dashboard — teacher context switch

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Dashboard → **הזמנה** (booking settings). Select **QA Alpha** in header teacher control. | **Public link** preview shows `…/book/qa-alpha`. |
| 2.2 | Switch to **QA Beta**. | Preview updates to `…/book/qa-beta` (copy + WhatsApp + open link use new slug). |

## 3. Clients isolation

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | With **Alpha** selected, create client “Client A”. | Client appears in list. |
| 3.2 | Switch to **Beta**. | **Client A not listed** (empty or only Beta’s clients). |
| 3.3 | Create “Client B” under Beta. | Client B appears. |
| 3.4 | Switch back to Alpha. | Only **Client A**; Client B hidden. |

## 4. Appointments isolation

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Under Alpha, add a lesson for Client A. | Lesson visible on calendar/list. |
| 4.2 | Switch to Beta. | Alpha’s lesson **not** shown. |
| 4.3 | Under Beta, add a lesson for Client B. | Only Beta’s lesson(s) when Beta is selected. |

## 5. Bookings (public requests) isolation

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Submit a public booking from `/book/qa-alpha` (or internal POST scoped to Alpha). | Request appears under **Alpha** in dashboard booking requests. |
| 5.2 | Submit from `/book/qa-beta`. | Request appears under **Beta** only when Beta is selected. |

## 6. Settings isolation

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | **Settings** with Alpha: set a distinct business name (e.g. “Studio Alpha QA”). | Saves; reload shows same name when Alpha selected. |
| 6.2 | Switch to Beta; set a different name (“Studio Beta QA”). | Saves; **no overwrite** of Alpha’s name. |
| 6.3 | Toggle booking availability / hours for Beta; switch to Alpha. | Alpha retains **its** availability and app settings. |

## 7. API spot-check (optional)

With DevTools or `curl`, call `GET /api/clients` with header `x-teacher-id: <Alpha UUID>` then `x-teacher-id: <Beta UUID>`.

| Check | Expected |
|-------|----------|
| Client lists | Disjoint (unless you intentionally duplicated names); each row’s `teacherId` matches header. |
| `GET /api/settings` | `teacherSlug` in JSON matches the teacher row for that id. |

UUIDs: see `src/qa/multitenantFixtures.ts` (`QA_TEACHER_ALPHA_ID`, `QA_TEACHER_BETA_ID`).

## Programmatic helpers

Import from `@/qa`:

- `QA_TEACHER_FIXTURES`, `allClientsScopedToTeacher`, `allAppointmentsScopedToTeacher`, `publicBookingUrlsAreDistinct`, `absolutePublicBookingUrl`.

Use in future automated tests or console experiments.
