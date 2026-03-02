---
phase: 02-shareable-links-client-signing
plan: 03
subsystem: ui
tags: [react, zustand, react-hook-form, zod, tailwind, mobile-first, wizard, client-signing]

# Dependency graph
requires:
  - phase: 02-shareable-links-client-signing/02-01
    provides: clientSignStore (createClientSignStore, useClientSignStore, ClientSignStoreContext), clientSigning.ts (fetchAgreementByToken, recordClientView), router /sign/:token registered
provides:
  - src/pages/ClientSign.tsx (wizard container, token fetch, audit view, step orchestration)
  - src/components/WizardProgress.tsx (step progress bar, mobile responsive)
  - src/components/ClientReviewStep.tsx (step 0 — read-only agreement terms document display)
  - src/components/ClientPersonalStep.tsx (step 1 — personal info with RHF+zod validation)
  - src/components/ClientEmploymentStep.tsx (step 2 — employment info with RHF+zod validation)
  - src/components/ClientEmergencyStep.tsx (step 3 — emergency contact with RHF+zod validation)
affects:
  - 02-04-PLAN.md (Plan 04 adds ClientSignStep and final submit; slots into step 4/5 placeholders in ClientSign.tsx)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Per-token Zustand store provided via React context (ClientSignStoreContext.Provider in ClientSign.tsx)
    - RHF + zod per-step form validation with pre-fill from store and persist-on-advance pattern
    - useRef to prevent duplicate fire-and-forget side effects across React re-renders (recordClientView)
    - 16px text-base inputs to prevent iOS auto-zoom on form focus
    - Wizard step orchestration: step index in store, onNext/onBack props passed to each step component

key-files:
  created:
    - src/pages/ClientSign.tsx
    - src/components/WizardProgress.tsx
    - src/components/ClientReviewStep.tsx
    - src/components/ClientPersonalStep.tsx
    - src/components/ClientEmploymentStep.tsx
    - src/components/ClientEmergencyStep.tsx
  modified: []

key-decisions:
  - "Step components receive onNext/onBack callbacks from ClientSign (not store setStep directly) for loose coupling"
  - "WizardProgress shows simplified 'Step N of M: Label' text on mobile (< md) instead of full bar to avoid cramped circles on small screens"
  - "ClientReviewStep uses SectionHeading + FieldRow components (dl/dt/dd layout) with Lora serif font for document-like feel"
  - "useRef(false) guards recordClientView from duplicate calls on StrictMode double-mount"

patterns-established:
  - "Pattern: RHF pre-fill from clientData store, persist fields individually via updateClientField on valid submit"
  - "Pattern: text-base (16px) on all client-facing inputs to prevent iOS auto-zoom"
  - "Pattern: noValidate on form element + zodResolver — zod is the sole validation authority"

requirements-completed: [CORE-04, SIGN-01, SIGN-05, AUDIT-02]

# Metrics
duration: ~4min
completed: 2026-03-01
---

# Phase 02 Plan 03: Client Signing Wizard — Steps 1-4 Summary

**Mobile-first RHF+zod multi-step signing wizard with token fetch, audit view recording, Zustand store persistence, and agreement terms displayed as formatted document text across 6 steps.**

## Performance

- **Duration:** ~4 minutes
- **Started:** 2026-03-01T20:17:18Z
- **Completed:** 2026-03-01T20:21:00Z
- **Tasks:** 2
- **Files modified:** 6 created, 0 modified

## Accomplishments

- ClientSign.tsx fetches agreement by token, records view audit on first load (useRef guard), creates per-token Zustand store, and renders a 6-step wizard with branded header
- WizardProgress renders step circles (completed=checkmark, current=ring, future=gray) on desktop and simplified "Step N of M: Label" on mobile
- Four step components (Review, Personal, Employment, Emergency) implement the full client data collection flow with professional error messages and localStorage persistence

## Task Commits

1. **Task 1: WizardProgress and ClientSign wizard container** - `8ab66c0` (feat)
2. **Task 2: Client form steps 1-4** - `7b3bfd2` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/pages/ClientSign.tsx` - Wizard container: token fetch, expiry redirect, recordClientView, Zustand context, step orchestration
- `src/components/WizardProgress.tsx` - Horizontal step indicator with mobile text fallback and desktop circles
- `src/components/ClientReviewStep.tsx` - Step 0: agreement terms as formatted document text (Lora serif, dl/dt/dd layout)
- `src/components/ClientPersonalStep.tsx` - Step 1: 9-field personal info form with RHF+zod (2-col md+, single col mobile)
- `src/components/ClientEmploymentStep.tsx` - Step 2: 3-field employment info form with RHF+zod
- `src/components/ClientEmergencyStep.tsx` - Step 3: 3-field emergency contact form with RHF+zod

## Decisions Made

- **Callback props vs direct store access:** Step components receive `onNext`/`onBack` as props rather than calling `store.setStep` directly. Keeps step components decoupled from navigation logic — ClientSign controls sequencing.
- **Mobile WizardProgress:** Shows "Step N of M: Label" text instead of full bar on `< md`. The full circle bar would be cramped at 6 steps on a 375px phone screen.
- **useRef guard for recordClientView:** StrictMode double-mounts would double-fire the audit insert without it. `viewRecorded.current = true` set before the async call prevents duplicates.
- **SectionHeading typed as `string`:** Avoids importing React type namespace for children prop; all headings are literal strings.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Type Error] Fixed React namespace reference in ClientReviewStep**
- **Found during:** Task 2, initial TypeScript check
- **Issue:** `{ children: React.ReactNode }` prop type on SectionHeading caused `Cannot find namespace 'React'` because no explicit React import is needed with react-jsx transform
- **Fix:** Changed prop type to `{ children: string }` — all callers pass string literals, which is semantically more precise
- **Files modified:** `src/components/ClientReviewStep.tsx`
- **Verification:** `npx tsc --noEmit` passes zero errors
- **Committed in:** 7b3bfd2 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 type error)
**Impact on plan:** Minor type refinement. No scope or behavioral impact.

## Issues Encountered

- Plan 02-02 (executed in prior session) had already updated `src/router.tsx` to import `ClientSign` and `ExpiredPage`, and had already created `ExpiredPage.tsx`. The router and ExpiredPage were committed in `ad1480c`. This plan's Task 1 therefore created `ClientSign.tsx` and `WizardProgress.tsx` without re-touching the router (which was already correct at HEAD).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- ClientSign.tsx has placeholder `<div>` blocks at steps 4 and 5 ready for Plan 04's `ClientSignStep` and review+submit step
- All client data (personal, employment, emergency) persists to `tj-sign-{token}` localStorage via Zustand persist
- Plan 04 needs: signature canvas component, acknowledgment initials, final submit via `submitClientSigning`

---
*Phase: 02-shareable-links-client-signing*
*Completed: 2026-03-01*

## Self-Check: PASSED
