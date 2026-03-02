---
phase: 02-shareable-links-client-signing
plan: 01
subsystem: backend-infrastructure
tags: [rls, zustand, token-auth, client-signing, migrations, routing]
dependency_graph:
  requires: []
  provides:
    - src/lib/agreements.ts (generateShareLink, revokeLink)
    - src/lib/clientSigning.ts (fetchAgreementByToken, recordClientView, submitClientSigning)
    - src/stores/clientSignStore.ts (createClientSignStore, useClientSignStore, ClientSignStoreContext)
    - supabase/migrations/002_client_sign_rls.sql (anon UPDATE RLS + audit_log IP trigger)
    - public routes /sign/:token, /sign/:token/complete, /sign/expired
  affects:
    - src/router.tsx
    - src/main.css
    - package.json
tech_stack:
  added:
    - qrcode.react@^4.2.0 (QR code generation for admin link-share UI)
    - react-hook-form@^7.71.2 (client wizard per-step form validation)
    - zod@^4.3.6 (TypeScript-native schema validation)
    - "@hookform/resolvers@^5.2.2 (Zod <-> react-hook-form bridge)"
    - Dancing Script (Google Fonts, CSS @import, for typed signatures)
  patterns:
    - crypto.randomUUID() for cryptographically secure token generation
    - Zustand persist middleware keyed by token (tj-sign-{token}) for wizard state
    - deepMerge helper for overlaying client fields onto admin agreement data
    - fire-and-forget audit inserts (recordClientView non-blocking)
    - ip_address populated by DB trigger not client JS (PostgREST x-forwarded-for)
key_files:
  created:
    - supabase/migrations/002_client_sign_rls.sql
    - src/lib/clientSigning.ts
    - src/stores/clientSignStore.ts
  modified:
    - src/lib/agreements.ts (added generateShareLink and revokeLink)
    - src/router.tsx (added 3 public /sign/ routes)
    - src/main.css (added Dancing Script @import before tailwind import)
    - package.json (added 4 new dependencies)
decisions:
  - id: D-0201-1
    decision: "deepMerge helper written inline in clientSigning.ts (not a third-party library)"
    reason: "Only need top-level section merging for AgreementData shape; lodash/merge would add unnecessary bundle weight"
  - id: D-0201-2
    decision: "ip_address NOT passed from client JavaScript — populated by audit_log_auto_ip trigger"
    reason: "Browsers cannot self-report real IP; PostgREST forwards x-forwarded-for which get_client_ip() reads from request.headers at the DB layer"
  - id: D-0201-3
    decision: "recordClientView is fire-and-forget (not awaited, errors swallowed)"
    reason: "Audit view recording must not block the client wizard UI; user_agent is captured, IP is best-effort"
  - id: D-0201-4
    decision: "/sign/expired route registered BEFORE /sign/:token to prevent 'expired' being matched as a token"
    reason: "React Router matches routes in order; placing /sign/expired first ensures it takes precedence"
metrics:
  duration: "~4 minutes"
  completed_date: "2026-03-01"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 4
---

# Phase 02 Plan 01: Backend Foundation for Shareable Links and Client Signing — Summary

**One-liner:** Token-based anon RLS UPDATE policy with auto-IP trigger, link generation/revocation functions, client signing data path with deepMerge, and per-token Zustand persist wizard store.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install deps, add RLS migration with audit IP trigger, add Dancing Script font | 88ffbd4 | package.json, supabase/migrations/002_client_sign_rls.sql, src/main.css |
| 2 | Create link generation, client signing library, Zustand store, and register routes | 5dcf127 | src/lib/agreements.ts, src/lib/clientSigning.ts, src/stores/clientSignStore.ts, src/router.tsx |

## What Was Built

### Migration: 002_client_sign_rls.sql
Two additions to the database layer:

1. **Anon UPDATE RLS policy** — `agreements_update_anon_by_token` allows anonymous clients to UPDATE an agreement row only when `token IS NOT NULL AND token_expires_at > now()`. This gates writes the same way the existing SELECT policy gates reads (from 001). Clients can submit their filled data and signature to the agreement their token unlocks.

2. **audit_log IP auto-capture trigger** — `audit_log_auto_ip_trigger` fires BEFORE INSERT on `audit_log`. It calls the existing `get_client_ip()` and `get_user_agent()` functions (from 001_initial_schema.sql) to populate `ip_address` and `user_agent` from PostgREST request headers when the inserted values are NULL. Satisfies SIGN-06 and AUDIT-02 without any client-side IP detection code.

### src/lib/agreements.ts (additions)
- `generateShareLink(agreementId, expiryDays=7)`: Generates token via `crypto.randomUUID()`, calculates expiry, UPDATEs agreement (token + token_expires_at + status='sent'), INSERTs audit_log entry with expires_at metadata. Returns `{ token, expiresAt }`.
- `revokeLink(agreementId)`: Sets token=null, token_expires_at=null, status='draft'. NULL token means anon RLS USING clause blocks all access to the revoked agreement. INSERTs audit_log entry with reason='link_revoked'.

### src/lib/clientSigning.ts (new file)
- `fetchAgreementByToken(token)`: Anon SELECT by token, returns typed agreement row or null on error/expiry.
- `recordClientView(agreementId)`: Fire-and-forget audit INSERT + status advancement from 'sent' to 'viewed' (without overwriting 'signed'). ip_address not passed — handled by DB trigger.
- `submitClientSigning(token, clientData, auditMeta)`: Fetches current data, deepMerges client fields on top of admin fields, UPDATEs agreement to 'signed' status, INSERTs signed audit event. Throws on any error.
- `deepMerge()`: Private helper for recursive object merge of top-level AgreementData sections.

### src/stores/clientSignStore.ts (new file)
- `createClientSignStore(token)`: Factory that creates a Zustand persist store keyed to `tj-sign-{token}`. Wizard step (0-5), clientData (partial AgreementData), drawnSignature, drawnInitials, signatureType, typedSignatureName, acknowledgedSections (draw-once initials apply pattern), agreementId/Number.
- `ClientSignStoreContext`: React context for passing the store instance through the wizard tree.
- `useClientSignStore(selector)`: Typed hook for wizard steps to consume store state.

### src/router.tsx (additions)
Three public routes (not nested under `/admin` layout):
- `/sign/expired` — registered before `:token` to prevent "expired" matching as a token value
- `/sign/:token` — entry point for client signing wizard (Plan 03 component)
- `/sign/:token/complete` — confirmation page (Plan 04 component)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Type Error] Fixed `data` field type cast in fetchAgreementByToken**
- **Found during:** Task 2 TypeScript check (`npx tsc --noEmit`)
- **Issue:** Supabase types `data` column as `Json` (union type), not `AgreementData`. Direct `as AgreementData` cast fails because `Json[]` is not comparable to `AgreementData`.
- **Fix:** Changed to `as unknown as { ... data: AgreementData ... }` — standard two-step cast for well-known JSONB schema types (same pattern used in agreements.ts and agreementStore.ts).
- **Files modified:** `src/lib/clientSigning.ts` line 52
- **Commit:** 5dcf127 (fixed before commit, no separate commit needed)

## Self-Check: PASSED

All created files exist on disk. Both task commits (88ffbd4, 5dcf127) confirmed in git log. Build passes, TypeScript zero errors.
