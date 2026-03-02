---
phase: 02-shareable-links-client-signing
plan: 02
subsystem: admin-ui
tags: [link-sharing, qr-code, modal, expired-page, read-only, admin-ui]
dependency_graph:
  requires:
    - src/lib/agreements.ts (generateShareLink, revokeLink) — provided by 02-01
  provides:
    - src/components/LinkShareModal.tsx (modal with QR + copy URL + revoke/regenerate)
    - src/pages/ExpiredPage.tsx (branded expired link dead-end page)
    - src/pages/AgreementEdit.tsx (Send to Client button + modal integration + read-only mode)
  affects:
    - src/router.tsx (/sign/expired now renders ExpiredPage, was placeholder div)
tech_stack:
  added: []
  patterns:
    - QRCodeSVG from qrcode.react for agreement share URL QR codes
    - navigator.clipboard.writeText with 2-second Copied! feedback for copy-to-clipboard
    - Confirmation dialog before destructive revoke action
    - isSigned derived boolean for conditional readOnly on all form inputs
    - disabled={isSigned} on checkbox/radio/select elements (InputLine readOnly prop for text inputs)
key_files:
  created:
    - src/components/LinkShareModal.tsx
    - src/pages/ExpiredPage.tsx
  modified:
    - src/pages/AgreementEdit.tsx
    - src/router.tsx
decisions:
  - id: D-0202-1
    decision: "Revoke & Regenerate flows as revoke-then-generate atomically in a single handler"
    reason: "Admin intent is always to get a fresh link; separate revoke and generate steps would leave no active link temporarily, which is confusing. Combining them gives a single state transition."
  - id: D-0202-2
    decision: "Read-only mode uses disabled prop on select/checkbox/radio, readOnly prop on InputLine text inputs"
    reason: "HTML readOnly only applies to text inputs; checkboxes, radios, and selects need disabled. InputLine already had readOnly prop, so no new component changes were needed."
  - id: D-0202-3
    decision: "router.tsx already had ExpiredPage and ClientSign imported (pre-existing)"
    reason: "The router.tsx already contained the ExpiredPage import and ClientSign import from a prior session. Plan 02-02 goal (replace placeholder with ExpiredPage) was already complete in the router; no changes were needed there."
metrics:
  duration: "~3 minutes"
  completed_date: "2026-03-02"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
---

# Phase 02 Plan 02: Admin Link-Share UI — Summary

**One-liner:** Gold-branded Send to Client button on AgreementEdit opens LinkShareModal with QRCodeSVG, one-click copy URL, and revoke/regenerate flow; expired/revoked links route to a branded ExpiredPage with contact info.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create LinkShareModal with QR code, URL copy, and revoke/regenerate | 36713eb | src/components/LinkShareModal.tsx |
| 2 | Wire LinkShareModal into AgreementEdit and create ExpiredPage | ad1480c | src/pages/AgreementEdit.tsx, src/pages/ExpiredPage.tsx, src/router.tsx |

## What Was Built

### src/components/LinkShareModal.tsx (new — 324 lines)

Modal dialog for sharing agreement sign links. Key features:

- **Props:** `isOpen`, `onClose`, `agreementId`, `agreementNumber`, `existingToken`, `existingExpiry`, `onLinkGenerated`, `onLinkRevoked`
- **No-token state:** Centered "No link generated yet" prompt with a "Generate Link" button. Calls `generateShareLink(agreementId)` from agreements.ts. On success, calls `onLinkGenerated(token, expiresAt)` to update parent state.
- **Active-token state:** Renders `QRCodeSVG` with `size={180}`, `level="M"`, `fgColor="#011c12"` (TJ Dark Green), value = `{origin}/sign/{token}`. Read-only URL input with a "Copy" button that calls `navigator.clipboard.writeText()` and switches to "Copied!" for 2 seconds. Expiry date formatted as full weekday + date string.
- **Revoke flow:** "Revoke & Regenerate" button triggers an inline confirmation panel with warning text before proceeding. Confirmation calls `revokeLink` then `generateShareLink` in a single handler, giving the admin a fresh token without going through a no-token intermediate state.
- **Accessibility:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to header `h2`. Escape key close via `document.addEventListener`. Overlay click closes modal.
- **Branding:** Forest-green header with agreement number in gold badge. White panel, rounded-2xl, shadow-2xl. Done button in forest-green at footer.

### src/pages/ExpiredPage.tsx (new — 77 lines)

Branded dead-end page for expired, revoked, or invalid sign links.

- Full-page `min-h-screen` centered layout on `bg-gray-50`
- JJAI crest (dark green circle with gold "JJAI" text) at top
- Heading: "This Agreement Link Has Expired" in forest-green
- Subtext: "This link is no longer valid. Please contact Triple J Auto Investment LLC for a new link." in gray
- Phone: `+1 (832) 400-5294` as `tel:` link in forest-green
- Address: 8774 Almeda Genoa Road, Houston, TX 77075 in `<address>` tag
- Intentional design — looks professional, not like a 404 error

### src/pages/AgreementEdit.tsx (modified)

Three additions:

1. **Send to Client button:** Gold button (`#D4AF37`) with `Share2` lucide icon. Shows "Send to Client" for draft status, "View Share Link" for sent/viewed status. Hidden when `isSigned`.

2. **LinkShareModal integration:** State added for `showLinkModal`, `currentToken`, `currentTokenExpiry`. Modal opened by Send to Client button. `onLinkGenerated` sets token state and advances status to 'sent'. `onLinkRevoked` clears token state and reverts status to 'draft'. Token and expiry extracted from Supabase row in `useEffect`.

3. **Read-only mode for signed agreements:** `isSigned = status === 'signed' || status === 'completed'`. All `InputLine` components receive `readOnly={isSigned}`. Checkbox and radio inputs receive `disabled={isSigned}`. Select receives `disabled={isSigned}`. "Save Changes" button hidden when `isSigned`. "Client has signed" green badge shown instead of Send to Client button. Green notice banner at top of page when in read-only mode.

### src/router.tsx (unchanged — already complete)

The `/sign/expired` route already rendered `<ExpiredPage />` (from a prior session). No modifications needed. The plan goal was already satisfied.

## Deviations from Plan

### Pre-existing State

**1. [Observation] router.tsx and ExpiredPage.tsx already existed**
- **Found during:** Task 2 pre-check
- **Issue:** The router already had `import ExpiredPage from './pages/ExpiredPage'` and `element: <ExpiredPage />` for the `/sign/expired` route. A stub `ExpiredPage.tsx` existed with basic branded content.
- **Action:** Updated `ExpiredPage.tsx` to the full branded design (added JJAI circle logo, structured contact section, professional layout). `router.tsx` required no changes.
- **Not a deviation requiring Rule 4** — the existing code was a stub that needed fleshing out, not an architectural conflict.

## Self-Check: PASSED

- src/components/LinkShareModal.tsx: FOUND (324 lines, exceeds 80-line minimum)
- src/pages/ExpiredPage.tsx: FOUND (77 lines, exceeds 20-line minimum)
- src/pages/AgreementEdit.tsx: FOUND, contains `LinkShareModal`
- Commit 36713eb: FOUND in git log
- Commit ad1480c: FOUND in git log
- `npx tsc --noEmit`: PASSED (zero errors)
- `npm run build`: PASSED (build successful)
- QRCodeSVG pattern in LinkShareModal: FOUND
- generateShareLink|revokeLink pattern in LinkShareModal: FOUND
- LinkShareModal pattern in AgreementEdit: FOUND
