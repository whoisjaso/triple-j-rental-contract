# Phase 2: Shareable Links + Client Signing — Research

**Researched:** 2026-03-01
**Domain:** Token-based public URL access, multi-step mobile form wizard, canvas signature capture, QR code generation, Supabase anon RLS, optional Twilio SMS
**Confidence:** HIGH (core stack), MEDIUM (Twilio edge function integration), MEDIUM (IP capture reliability)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Link sharing flow:**
- Admin gets both a copyable URL and a QR code for each agreement
- In-app SMS send option via Twilio (optional alongside copy/QR)
- Links expire after 7 days by default (configurable)
- Confirmation screen after generating link with copy/QR/SMS options — status changes to "Sent" when admin confirms
- Admin can revoke a link and regenerate a new one (old link shows "no longer valid" message)

**Client form structure:**
- Multi-step wizard with progress bar at top
- Step 1: Review agreement terms (admin-filled vehicle, rates, terms, fees as read-only)
- Step 2: Personal info
- Step 3: Employment info
- Step 4: Emergency contact
- Step 5: Sign + initial
- Client sees admin-filled details as formatted document text (not disabled inputs) — reads like a printed contract
- Auto-save progress — client can close browser and return later via the same link
- Full Triple J branding: JJAI gold crest logo at top, TJ Green + Gold colors, company name prominent

**Signature and initials UX:**
- Draw | Type tabs for signature — equal presentation, draw tab selected by default
- Initials: client draws initials once, then taps checkboxes next to each acknowledgment section to apply them
- Final review + confirm step after signing — summary of everything with "Submit Agreement" button
- Confirmation page after submit: "Agreement signed successfully. A copy will be emailed to you." with Triple J branding

**Mobile signing feel:**
- Professional + warm tone for all client-facing text and error messages
- "Please enter your full legal name as it appears on your ID." style guidance

### Claude's Discretion

- Field validation timing/pattern (on blur vs on step advance)
- Post-submit experience details (confirmation page vs confirmation + summary)
- Landscape orientation handling for signature canvas
- Read-only field styling details beyond "document text" direction
- Loading states and transitions between wizard steps
- Exact wizard step grouping of fields within personal info / employment / emergency contact

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CORE-03 | Admin generates unique shareable link for client | Token generation via `crypto.randomUUID()` stored in `agreements.token`; URL pattern `/sign/:token`; existing DB column already present |
| CORE-04 | Admin fields locked/read-only when client views via link | Client view renders `AgreementData` as static document prose, never as inputs; read-only CSS pattern |
| CORE-05 | Client fields locked/read-only when admin views completed agreement | Admin `AgreementEdit` page detects `status === 'signed'` and renders client sections as read-only display |
| CORE-06 | Shareable links expire after configurable number of days | `token_expires_at` column exists in schema; anon RLS policy already enforces `token_expires_at > now()`; default 7 days set on generation |
| CORE-07 | Expired links show clear "expired" message page | `/sign/:token` route fetches agreement; on 404 or expired → render `<ExpiredPage>` with branded message |
| CORE-08 | QR code generated for each agreement link | `qrcode.react` v4.2.0 — SVG output, no server dependency; rendered in admin UI link-share modal |
| SIGN-01 | Client fills personal info, emergency contact, employment fields via link | Multi-step Zustand form store (separate from admin store); persisted to `localStorage` keyed on token; submitted to Supabase as PATCH on `agreements.data` |
| SIGN-02 | Client draws signature on canvas pad | Reuse and adapt existing `SignaturePad.tsx` component; stores as base64 PNG dataURL in `agreements.data.signatures.renterSig` |
| SIGN-03 | Client types name rendered in signature font as alternative | Type tab: text input rendered in Dancing Script font (Google Fonts); stored same as drawn signature |
| SIGN-04 | Client initials each acknowledgment section | Draw initials once on canvas; store as dataURL; tapping checkbox applies pre-drawn initials to acknowledgment sections without re-drawing |
| SIGN-05 | Signing form works flawlessly on mobile | `touch-action: none` on canvas; `passive: false` touch listeners; `viewport-fit=cover`; iOS safe area with `env(safe-area-inset-bottom)` |
| SIGN-06 | Signature data stored server-side with timestamp, IP, user agent | On submit: PATCH `agreements.data`, then INSERT `audit_log` with `action: 'signed'`, `ip_address`, `user_agent`, `metadata: {timestamp}` |
| AUDIT-02 | System records when client opens agreement link | On `/sign/:token` load: INSERT `audit_log` with `action: 'viewed'`, `actor_type: 'client'`, IP and user-agent captured from Edge Function or client-side headers |
| AUDIT-03 | System records when each signature and initial is captured | On each signature/initials save action: INSERT `audit_log` with `action: 'signed'`, granular metadata `{field: 'renterSig' \| 'acknowledgmentInitials'}` |

</phase_requirements>

---

## Summary

Phase 2 adds the client-facing path to the system already built in Phase 1. The database schema is essentially complete — `agreements.token`, `token_expires_at`, the anon RLS SELECT policy, and the `audit_log` table all exist from the migration. This phase is primarily front-end and integration work: a new public route (`/sign/:token`), a mobile-optimized multi-step wizard, and the link-generation UI in the admin area.

The most nuanced technical challenges are: (1) the anon RLS UPDATE policy that allows clients to write their data only to the agreement their token matches, (2) capturing IP/user-agent for audit entries without a server session, and (3) the canvas signature UX on mobile (scroll prevention while drawing). All three have well-understood solutions with the existing stack.

The optional Twilio SMS integration involves a Supabase Edge Function (Deno runtime) that holds the Twilio credentials server-side and is invoked from the admin UI. This is fully feasible but introduces an external deployment dependency — it can be wired in Phase 2 or safely deferred as a stub.

**Primary recommendation:** Build the client wizard, link generation, and QR code UI first (these are all self-contained). Add the anon RLS UPDATE migration second. Wire Twilio SMS last as it requires a deployed edge function and Twilio credentials.

---

## Standard Stack

### Core (already installed — no new installs unless noted)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Component framework | Already installed |
| React Router v7 | 7.13.0 | `/sign/:token` public route | Already installed |
| Zustand | 5.0.11 | Client wizard state + localStorage persist | Already installed; has built-in `persist` middleware |
| @supabase/supabase-js | 2.97.0 | Anon client for public sign route | Already installed |
| Tailwind CSS v4 | 4.2.0 | Styling | Already installed |
| lucide-react | 0.574.0 | Icons | Already installed |

### New Installs Required

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| qrcode.react | ^4.2.0 | QR code generation | 2.9M weekly downloads; SVG output; no server needed; `<QRCodeSVG value={url} />` is one line |
| react-hook-form | ^7.x | Client wizard form validation | Most performant React form library; works per-step |
| zod | ^3.x | Schema validation | TypeScript-native; paired with react-hook-form via `@hookform/resolvers` |
| @hookform/resolvers | ^3.x | Connects Zod to RHF | Standard bridge |

### Supporting / Optional

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Dancing Script (Google Fonts) | N/A | Typed signature rendering | Phase 2 SIGN-03; load via `@import` in CSS |
| twilio (npm, Edge Function only) | ^5.x | SMS sending | Only installed in `/supabase/functions/send-sms/`; never in client bundle |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| qrcode.react | react-qr-code | Both equivalent; qrcode.react is more downloaded (2.9M/wk vs 1.2M/wk), exports `QRCodeSVG` and `QRCodeCanvas` |
| react-hook-form + zod | Hand-rolled validation | RHF eliminates re-renders on keypress; Zod provides TypeScript type inference; worth the install |
| Zustand persist middleware | Supabase-only auto-save | localStorage persist is instant (no network); combine both: local for resilience, Supabase for cross-device return |
| Supabase Edge Function for SMS | Direct Twilio REST from client | Never expose Twilio Auth Token in client bundle; Edge Function is mandatory |

**Installation:**
```bash
npm install qrcode.react react-hook-form zod @hookform/resolvers
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── pages/
│   ├── AdminLayout.tsx         # (exists) admin wrapper
│   ├── AgreementEdit.tsx       # (exists) — add "Generate Link" modal
│   ├── AgreementList.tsx       # (exists)
│   ├── ClientSign.tsx          # NEW: public sign route entry point
│   └── ClientSignComplete.tsx  # NEW: confirmation page after submit
├── components/
│   ├── SignaturePad.tsx         # (exists) — reuse / extend for Draw|Type tabs
│   ├── InitialsBox.tsx          # (exists) — repurpose for draw-once initials
│   ├── AcknowledgmentBox.tsx    # (exists) — adapt checkbox to apply pre-drawn initials
│   ├── LinkShareModal.tsx       # NEW: admin link generation UI (URL + QR + SMS)
│   ├── WizardProgress.tsx       # NEW: step progress bar
│   ├── ClientReviewStep.tsx     # NEW: Step 1 — read-only agreement terms
│   ├── ClientPersonalStep.tsx   # NEW: Step 2 — personal info form
│   ├── ClientEmploymentStep.tsx # NEW: Step 3 — employment info form
│   ├── ClientEmergencyStep.tsx  # NEW: Step 4 — emergency contact form
│   └── ClientSignStep.tsx       # NEW: Step 5 — signature + initials
├── stores/
│   ├── agreementStore.ts        # (exists) — admin store
│   └── clientSignStore.ts       # NEW: wizard state with Zustand persist
├── lib/
│   ├── agreements.ts            # (exists) — add generateToken(), revokeToken()
│   └── clientSigning.ts         # NEW: fetchByToken(), submitSigning(), auditView()
└── supabase/
    ├── migrations/
    │   └── 002_client_sign_rls.sql  # NEW: anon UPDATE policy
    └── functions/
        └── send-sms/
            └── index.ts             # NEW: Twilio Edge Function (optional)
```

### Pattern 1: Token-Based Public Route

The `/sign/:token` route uses React Router's loader pattern (or `useEffect` on mount) to fetch the agreement by token. The Supabase anon client (using the publishable key) is already configured in `src/lib/supabase.ts`. The existing anon SELECT RLS policy already gates access:

```sql
-- Already in migration 001 — no change needed for SELECT
CREATE POLICY "agreements_select_anon" ON agreements
  FOR SELECT TO anon
  USING (token IS NOT NULL AND token_expires_at > now());
```

The client queries by token, not by ID:

```typescript
// Source: Supabase JS v2 docs + existing lib/agreements.ts pattern
export async function fetchAgreementByToken(token: string) {
  const { data, error } = await supabase
    .from('agreements')
    .select('id, agreement_number, status, data, token_expires_at')
    .eq('token', token)
    .single()

  if (error) return null  // 404 or expired (RLS blocks expired rows)
  return data
}
```

**Route registration** in `router.tsx`:
```typescript
{
  path: '/sign/:token',
  element: <ClientSign />,
},
{
  path: '/sign/:token/complete',
  element: <ClientSignComplete />,
},
{
  path: '/sign/expired',
  element: <ExpiredPage />,
},
```

### Pattern 2: Anon RLS UPDATE Policy (migration required)

The client must UPDATE `agreements.data` when submitting their filled fields + signatures. The existing schema has no anon UPDATE policy. A new migration adds it:

```sql
-- supabase/migrations/002_client_sign_rls.sql
-- Allow anon clients to update an agreement's data field only when they hold the valid token
CREATE POLICY "agreements_update_anon_by_token" ON agreements
  FOR UPDATE TO anon
  USING (token IS NOT NULL AND token_expires_at > now())
  WITH CHECK (token IS NOT NULL AND token_expires_at > now());
```

Note: The policy passes because the anon client always queries by `eq('token', token)` — Postgres enforces the USING clause matches the row being updated.

**Critical:** The client must NOT be able to update `status` or `token` columns during their signing. The update from the client lib should only touch the `data` column:

```typescript
// Client signs — only updates data field
await supabase
  .from('agreements')
  .update({ data: mergedData, status: 'signed' })  // status: 'signed' is intentional here
  .eq('token', token)
```

Status transitions: `draft` → `sent` (admin confirms) → `viewed` (client opens) → `signed` (client submits).

### Pattern 3: Token Generation (Admin Side)

Token generation happens when admin clicks "Generate Link" on an agreement. Use `crypto.randomUUID()` — cryptographically secure, no library needed, works in all modern browsers (HTTPS required, which production will have):

```typescript
// Source: MDN Web Docs — crypto.randomUUID()
export async function generateShareLink(
  agreementId: string,
  expiryDays: number = 7
): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)

  const { error } = await supabase
    .from('agreements')
    .update({
      token,
      token_expires_at: expiresAt.toISOString(),
      status: 'sent',
    })
    .eq('id', agreementId)

  if (error) throw error

  await supabase.from('audit_log').insert({
    agreement_id: agreementId,
    action: 'sent',
    actor_type: 'admin',
    metadata: { expires_at: expiresAt.toISOString() }
  })

  return { token, expiresAt: expiresAt.toISOString() }
}
```

The shareable URL is: `${window.location.origin}/sign/${token}`

### Pattern 4: QR Code in Link Share Modal

`qrcode.react` v4.2.0 exports `QRCodeSVG`. SVG is preferred over Canvas because it scales without pixelation and can be styled:

```typescript
import { QRCodeSVG } from 'qrcode.react'

// Inside LinkShareModal.tsx
const signUrl = `${window.location.origin}/sign/${token}`

<div className="bg-white p-4 rounded-lg inline-block">
  <QRCodeSVG
    value={signUrl}
    size={200}
    level="M"  // Medium error correction — no logo overlay
    title={`Agreement ${agreementNumber} signing QR code`}
  />
</div>
```

Wrap in a white container — QR codes require a quiet zone and this prevents dark backgrounds from breaking scannability.

### Pattern 5: Multi-Step Wizard with Zustand Persist

Create a separate Zustand store for the client wizard (do NOT mix with the admin `agreementStore`). Use Zustand's built-in `persist` middleware with `localStorage`, keyed by the agreement token so returning clients restore their progress:

```typescript
// src/stores/clientSignStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ClientSignStore {
  step: number
  clientData: Partial<ClientSignData>  // only client-fillable fields
  drawnInitials: string  // base64 dataURL of initials drawn once
  drawnSignature: string // base64 dataURL of signature
  setStep: (step: number) => void
  updateClientData: (field: string, value: unknown) => void
  setDrawnInitials: (dataUrl: string) => void
  setDrawnSignature: (dataUrl: string) => void
  reset: () => void
}

// Key by token so different agreements don't collide
export function createClientSignStore(token: string) {
  return create<ClientSignStore>()(
    persist(
      (set) => ({
        step: 0,
        clientData: {},
        drawnInitials: '',
        drawnSignature: '',
        setStep: (step) => set({ step }),
        updateClientData: (field, value) => set((state) => ({
          clientData: { ...state.clientData, [field]: value }
        })),
        setDrawnInitials: (dataUrl) => set({ drawnInitials: dataUrl }),
        setDrawnSignature: (dataUrl) => set({ drawnSignature: dataUrl }),
        reset: () => set({ step: 0, clientData: {}, drawnInitials: '', drawnSignature: '' }),
      }),
      { name: `client-sign-${token}` }  // token-specific key
    )
  )
}
```

**Note:** `persist` is built into Zustand v5 — no separate package. Zustand v5 is already installed.

### Pattern 6: Draw-Once Initials Apply Pattern

The user decision requires: draw initials once, tap checkbox next to each acknowledgment to apply. This means:

1. Step 5 starts with an initials canvas (separate from signature canvas)
2. Client draws their initials, saves as `drawnInitials` (base64 dataURL in store)
3. Each `AcknowledgmentBox` shows a checkbox — when checked, it copies `drawnInitials` into that section's initials field
4. The stored initials dataURL (not re-drawn) is what gets persisted to `agreements.data`

Adapt the existing `AcknowledgmentBox` component: replace the `<InitialsBox>` text input with a checkbox that fires `onApplyInitials(drawnInitials)`:

```typescript
interface AcknowledgmentBoxProps {
  text: string
  initialsApplied: boolean
  onApply: () => void  // sets the initials from the shared drawnInitials
  previewInitials: string  // dataURL to show when applied
}
```

### Pattern 7: Typed Signature Font Rendering

SIGN-03 requires a typed-name alternative. Dancing Script from Google Fonts renders professional cursive:

```css
/* main.css — add alongside existing @theme */
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');

/* OR self-host via CSS @font-face for no third-party dependency */
```

The type tab renders the typed name live:
```typescript
// TypedSignaturePreview.tsx
<p
  style={{ fontFamily: "'Dancing Script', cursive", fontSize: '2rem', color: '#000' }}
  className="border-b-2 border-charcoal min-h-16 flex items-end px-2 pb-1"
>
  {typedName || <span className="text-gray-300 text-sm">Your name will appear here</span>}
</p>
```

When submitted, the typed name is encoded: either stored as plain text in `renterName` and a flag `signatureType: 'typed'`, or rendered to a canvas using `drawText` so it always stores as a dataURL. Storing as dataURL is consistent with the drawn path.

### Pattern 8: Audit Logging for Client Open (AUDIT-02)

The `audit_log` table allows anon INSERT (policy `audit_log_insert_anon` already exists in migration 001). When the client's browser loads `/sign/:token`, immediately INSERT a viewed event:

```typescript
// In clientSigning.ts — called once on ClientSign mount
export async function recordClientView(agreementId: string) {
  await supabase.from('audit_log').insert({
    agreement_id: agreementId,
    action: 'viewed',
    actor_type: 'client',
    // IP capture: from Supabase Edge Function OR pass from request context
    // user_agent: navigator.userAgent (client-readable)
    user_agent: navigator.userAgent,
    metadata: { timestamp: new Date().toISOString() }
  })
}
```

**IP address capture:** The Supabase REST API for direct table inserts does NOT reliably forward the real client IP into the `ip_address` column through the JS SDK — that column is populated via the `get_client_ip()` function in the DB, which reads `request.headers`. When an anon client calls `supabase.from('audit_log').insert(...)`, the PostgREST layer does receive the request and the `x-forwarded-for` header is available in `request.headers` for the DB function. This should work for direct SDK calls. However, to be safe, also capture `navigator.userAgent` client-side and pass it explicitly in the insert.

### Pattern 9: Supabase Edge Function for Twilio SMS (Optional)

The Twilio `accountSid` and `authToken` must never appear in the client bundle. The pattern:

1. Create `/supabase/functions/send-sms/index.ts`
2. Store `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` as Supabase project secrets
3. Admin UI calls `supabase.functions.invoke('send-sms', { body: { to: phoneNumber, message } })`

```typescript
// supabase/functions/send-sms/index.ts (Deno)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { to, message } = await req.json()

  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
  const authToken  = Deno.env.get('TWILIO_AUTH_TOKEN')!
  const from       = Deno.env.get('TWILIO_FROM_NUMBER')!

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      },
      body: new URLSearchParams({ To: to, From: from, Body: message }),
    }
  )

  const result = await response.json()
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Note:** A2P 10DLC registration for Twilio SMS is a 1-4 week approval process (flagged in STATE.md). If not yet registered, the Edge Function can be built but SMS will fail until registration completes.

### Anti-Patterns to Avoid

- **Putting Twilio credentials in client bundle:** Use Edge Function. Non-negotiable.
- **Storing signature as raw base64 in a separate DB column:** Store in `agreements.data.signatures` JSONB field — consistent with Phase 1 design.
- **Adding a passive touch listener to the canvas:** `touch-action: none` in CSS AND `passive: false` on `touchstart`/`touchmove` events are both needed to prevent iOS scroll-while-drawing. The existing `SignaturePad.tsx` already does this correctly.
- **Generating token with `Math.random()`:** Use `crypto.randomUUID()` — cryptographically secure, no import needed.
- **Checking token expiry only in client code:** The RLS policy `token_expires_at > now()` enforces expiry server-side. Client expiry check is UX only.
- **Allowing anon to update `token` or `token_expires_at`:** The UPDATE policy should limit what columns can change. Consider using Column Level Security or application-layer logic to scope the PATCH to `data` and `status` only.
- **Re-drawing initials for every section:** Contradicts user decision. Draw once, apply via checkbox.
- **Using the admin `agreementStore` in the client signing flow:** Create a separate `clientSignStore`. The admin store is wired to auth state and admin routes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR code generation | Custom canvas QR renderer | `qrcode.react` | QR spec has 40 versions, error correction modes, encoding modes — weeks of work |
| Form validation per step | `if (!field) setError(...)` chains | `react-hook-form` + `zod` | RHF avoids re-renders, Zod gives TypeScript types for free |
| localStorage wizard persistence | Custom `useEffect` serialization | Zustand `persist` middleware | Already in Zustand v5; handles hydration, serialization, key scoping |
| Typed signature font | Canvas `fillText` rendering | CSS `font-family: 'Dancing Script'` | No canvas needed for display; only need canvas if converting to dataURL for storage |
| Twilio HTTP client | `fetch` to Twilio REST directly | Twilio node SDK inside Edge Function | SDK handles auth, retry, error parsing |

**Key insight:** The client-signing problem has three genuinely complex sub-problems (canvas touch behavior, multi-step state persistence, secure token access). Everything else is composition of existing patterns.

---

## Common Pitfalls

### Pitfall 1: Canvas Scroll-While-Drawing on iOS

**What goes wrong:** User tries to sign, page scrolls instead. Signature is unusable on mobile.
**Why it happens:** iOS default touch behavior is scroll. `touchmove` must have `passive: false` AND `e.preventDefault()` called to suppress scroll.
**How to avoid:** The existing `SignaturePad.tsx` already handles this correctly (`passive: false` listeners, `e.cancelable && e.preventDefault()`). Verify the canvas container has `touch-action: none` in Tailwind: `className="touch-none"`.
**Warning signs:** On physical iPhone, drawing produces scroll instead of line.

### Pitfall 2: Anon RLS UPDATE Policy Too Permissive

**What goes wrong:** An anon client who guesses or leaks a token could overwrite any row that matches the token.
**Why it happens:** The token column IS the only access control for anon clients. Tokens from `crypto.randomUUID()` have 122 bits of entropy — brute-force is infeasible. But revoked tokens must have `token` set to NULL (not just status change) to prevent reuse.
**How to avoid:** When admin revokes a link, NULL out the `token` column (not just change status). The RLS policy `USING (token IS NOT NULL)` then blocks all anon access.
**Warning signs:** Old (revoked) link still allows signing.

### Pitfall 3: Auto-Save Race Condition

**What goes wrong:** Client makes two changes rapidly; the second Supabase PATCH arrives before the first, producing stale data.
**Why it happens:** Async updates without debouncing or sequential queuing.
**How to avoid:** Debounce auto-save writes (500ms–1s delay). The primary source of truth is localStorage (instant); Supabase writes are resilience backup. On step advance, do a synchronous save before navigating to the next step.
**Warning signs:** Partial saves appearing in the DB inconsistently.

### Pitfall 4: Signature dataURL Size Bloating `agreements.data` JSONB

**What goes wrong:** A base64 PNG from a 400×200 canvas is ~20-40KB. If there are 6 initials fields + 1 signature = 7 dataURLs, the JSONB field could be 200-280KB per agreement. Supabase free tier has 500MB storage total — this is fine for hundreds of agreements but plan ahead.
**Why it happens:** Canvas `toDataURL('image/png')` is lossless and uncompressed.
**How to avoid:** Use `toDataURL('image/jpeg', 0.8)` or use `toDataURL('image/webp', 0.8)` for ~60-70% size reduction. Note: WebP is supported in all modern mobile browsers. Alternatively, `canvas.toBlob()` → upload to Supabase Storage, store URL in JSONB instead. For this project scale, JPEG at 0.8 quality in JSONB is the simplest path.
**Warning signs:** Agreements JSONB rows exceeding 500KB.

### Pitfall 5: IP Address Not Captured

**What goes wrong:** `audit_log.ip_address` stays NULL even after client opens the link.
**Why it happens:** The `get_client_ip()` DB function reads `request.headers` from PostgREST context. When running locally, `x-forwarded-for` is not set. In Supabase cloud, it has been reported as inconsistent.
**How to avoid:** Accept that IP capture is best-effort. Don't block the audit insert on IP success. `user_agent` (captured client-side via `navigator.userAgent`) is reliable. For stronger IP capture, route the "record view" through a Supabase Edge Function (request object reliably has `req.headers.get('x-forwarded-for')`).
**Warning signs:** `ip_address` is NULL in all `audit_log` rows.

### Pitfall 6: Token in URL Visible in Server Logs / Referers

**What goes wrong:** The token in `/sign/abc-123-def` appears in server access logs and HTTP Referer headers if the client navigates to an external link.
**Why it happens:** Standard URL design — tokens in paths are logged.
**How to avoid:** This is acceptable for this use case (it's not a password, it's a shareable link by design). Do NOT put tokens in query params as they're more likely to appear in analytics. Path-based tokens (`/sign/:token`) are the standard pattern for document signing links (DocuSign, HelloSign all use this pattern). No mitigation needed.
**Warning signs:** N/A — this is intentional design.

### Pitfall 7: Wizard Step State Lost on Browser Refresh

**What goes wrong:** Client fills 3 steps, refreshes, loses progress.
**Why it happens:** React state is in-memory. Without persistence, it's gone on refresh.
**How to avoid:** Zustand `persist` middleware with `localStorage` handles this automatically. The store is hydrated from `localStorage` on mount. Test explicitly: fill step 2, refresh — step 2 data should still be there.
**Warning signs:** Client complains progress is lost.

---

## Code Examples

### QR Code in Link Share Modal

```typescript
// Source: qrcode.react official README + npm package docs
import { QRCodeSVG } from 'qrcode.react'

const signUrl = `${window.location.origin}/sign/${token}`

<div className="flex justify-center p-4 bg-white rounded-xl border border-gray-200">
  <QRCodeSVG
    value={signUrl}
    size={180}
    level="M"
    title={`Sign Agreement ${agreementNumber}`}
    bgColor="#FFFFFF"
    fgColor="#011c12"  // TJ Dark Green for brand alignment
  />
</div>
```

### Supabase Anon Client Update (Client Signing Submission)

```typescript
// Source: Supabase JS v2 docs + existing lib/agreements.ts patterns
export async function submitClientSigning(
  token: string,
  clientData: Partial<AgreementData>,
  auditMeta: { userAgent: string }
): Promise<void> {
  // First, fetch current agreement data
  const { data: agreement, error: fetchError } = await supabase
    .from('agreements')
    .select('id, data')
    .eq('token', token)
    .single()

  if (fetchError || !agreement) throw new Error('Agreement not found or expired')

  // Merge client data into existing agreement data
  const mergedData = deepMerge(agreement.data as AgreementData, clientData)

  // Update the agreement
  const { error: updateError } = await supabase
    .from('agreements')
    .update({ data: mergedData, status: 'signed' })
    .eq('token', token)

  if (updateError) throw updateError

  // Audit log the signing event
  await supabase.from('audit_log').insert({
    agreement_id: agreement.id,
    action: 'signed',
    actor_type: 'client',
    user_agent: auditMeta.userAgent,
    metadata: {
      signed_at: new Date().toISOString(),
      fields_signed: ['renterSig', 'renterName', 'acknowledgmentInitials']
    }
  })
}
```

### Wizard Step Validation with React Hook Form

```typescript
// Source: react-hook-form + zod resolver pattern
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const personalInfoSchema = z.object({
  fullName:     z.string().min(2, 'Please enter your full legal name as it appears on your ID.'),
  dob:          z.string().min(1, 'Date of birth is required.'),
  dlNumber:     z.string().min(1, 'Driver\'s license number is required.'),
  dlExp:        z.string().min(1, 'License expiration date is required.'),
  address:      z.string().min(5, 'Please enter your full street address.'),
  cityStateZip: z.string().min(5, 'Please enter your city, state, and ZIP code.'),
  phonePrimary: z.string().regex(/^\+?[\d\s\-()]{10,}$/, 'Please enter a valid phone number.'),
  email:        z.string().email('Please enter a valid email address.'),
})

type PersonalInfo = z.infer<typeof personalInfoSchema>

// In ClientPersonalStep.tsx
const { register, handleSubmit, formState: { errors } } = useForm<PersonalInfo>({
  resolver: zodResolver(personalInfoSchema),
  defaultValues: clientSignStore.clientData,  // pre-fill from persisted store
})
```

### Zustand Persist Store Hydration

```typescript
// Source: Zustand v5 official docs — persist middleware
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Create once per token at ClientSign mount, pass down via context
const useClientSignStore = create<ClientSignStore>()(
  persist(
    (set, get) => ({ /* ... state and actions */ }),
    {
      name: `tj-sign-${token}`,  // unique per agreement
      // partialize: exclude large dataURLs from localStorage if needed
    }
  )
)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `signature_pad` raw library | `react-signature-canvas` (React wrapper) | ~2020 | Cleaner React integration; same underlying Bezier curve algorithm |
| QR via server-side API call | Client-side `qrcode.react` | ~2018 | No server needed; instant generation |
| Custom form state validation | `react-hook-form` + Zod | ~2021-2022 | 95% less re-renders; schema-driven TypeScript types |
| `Math.random()` tokens | `crypto.randomUUID()` | ES2021, universal 2023+ | Native, cryptographically secure, no imports |
| Zustand with manual localStorage | Zustand `persist` middleware | Zustand v4+ | Built-in, no custom `useEffect` |

**Deprecated/outdated:**
- `uuid` npm package: replaced by `crypto.randomUUID()` for client-side use in secure contexts (HTTPS)
- React class components for wizard steps: hooks + function components are standard
- `localStorage.setItem(JSON.stringify(...))` in `useEffect`: replaced by Zustand persist middleware

---

## Open Questions

1. **Twilio A2P 10DLC registration status**
   - What we know: STATE.md flagged this as a 1-4 week process that should start during Phase 1
   - What's unclear: Whether registration has been initiated; if not, SMS will not send in production
   - Recommendation: Build the Edge Function and UI regardless; it will start working when registration completes. Do not block Phase 2 delivery on it.

2. **IP capture reliability in Supabase cloud**
   - What we know: `x-forwarded-for` has been reported as inconsistently populated in Supabase's PostgREST layer for direct SDK calls
   - What's unclear: Current reliability status as of 2026
   - Recommendation: Accept `ip_address: null` for direct client inserts. For a harder requirement, route the "record view" INSERT through an Edge Function which reliably has access to the forwarded IP via `req.headers.get('x-forwarded-for')`.

3. **Signature storage: JSONB vs Supabase Storage**
   - What we know: Base64 PNG in JSONB works but inflates row size; Supabase Storage adds URL indirection but is more scalable
   - What's unclear: Whether row size will be a practical concern at this business's scale
   - Recommendation: Use JPEG at 0.8 quality stored in JSONB. A single agreement row will be ~80-150KB total — well within Supabase's limits. Revisit if agreement volume exceeds 10,000.

4. **Landscape orientation on mobile signature canvas**
   - What we know: Marked as Claude's discretion; iOS users often rotate to landscape for signing
   - What's unclear: Whether to prompt rotation or handle both orientations
   - Recommendation: Detect landscape via CSS `@media (orientation: landscape)` on the signing step only; show a "Rotate your phone for the best signing experience" hint (non-blocking); canvas should still function in portrait.

---

## Sources

### Primary (HIGH confidence)

- Existing `supabase/migrations/001_initial_schema.sql` — confirms `token`, `token_expires_at`, anon SELECT RLS, anon `audit_log` INSERT all exist
- Existing `src/lib/database.types.ts` — confirms column types and status enum
- Existing `src/components/SignaturePad.tsx` — confirms touch handling pattern already implemented
- Zustand v5 docs (GitHub pmndrs/zustand) — persist middleware is built-in
- MDN Web Docs `crypto.randomUUID()` — cryptographically secure, all modern browsers, HTTPS required
- Supabase RLS docs `supabase.com/docs/guides/database/postgres/row-level-security` — anon UPDATE policy pattern

### Secondary (MEDIUM confidence)

- qrcode.react npm page — version 4.2.0, 2.9M weekly downloads, `QRCodeSVG` export — verified via WebSearch multiple sources
- react-hook-form + @hookform/resolvers + zod — standard pattern verified by multiple tutorials and official repos
- Supabase + Twilio SMS Edge Function — pattern verified by official Twilio blog post and Supabase docs
- `request.headers` `x-forwarded-for` in Supabase Edge Functions — verified via GitHub discussion #7884 (inconsistency acknowledged)

### Tertiary (LOW confidence — flag for validation)

- Dancing Script Google Font load performance — assumed acceptable for single-page signing form; not benchmarked
- `toDataURL('image/jpeg', 0.8)` vs `image/webp` for signature compression — WebP mobile support assumed universal; validate on iOS Safari
- Zustand persist hydration timing with React 19 — no specific testing; Zustand v5 React 19 compatibility assumed from package peer deps

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all core libraries already installed; only qrcode.react and RHF+zod are new additions, both well-documented
- Architecture: HIGH — patterns derived directly from existing Phase 1 code (same file conventions, same Supabase patterns, same component structure)
- Pitfalls: HIGH for canvas/iOS (existing component proves the pattern) and RLS (schema is proven); MEDIUM for IP capture (known inconsistency in Supabase)

**Research date:** 2026-03-01
**Valid until:** 2026-06-01 (stable libraries; Supabase IP behavior may improve)
