# Phase 2: Shareable Links + Client Signing - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin generates a shareable link (URL + QR code) for a client to fill their portion of the agreement on their phone — personal info, emergency contact, employment — then sign and initial the agreement. All client actions are audit-logged. Link sharing, client form, signing, and audit logging are in scope. PDF generation and email delivery are Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Link sharing flow
- Admin gets both a copyable URL and a QR code for each agreement
- In-app SMS send option via Twilio (optional alongside copy/QR)
- Links expire after 7 days by default (configurable)
- Confirmation screen after generating link with copy/QR/SMS options — status changes to "Sent" when admin confirms
- Admin can revoke a link and regenerate a new one (old link shows "no longer valid" message)

### Client form structure
- Multi-step wizard with progress bar at top
- Step 1: Review agreement terms (admin-filled vehicle, rates, terms, fees as read-only)
- Step 2: Personal info
- Step 3: Employment info
- Step 4: Emergency contact
- Step 5: Sign + initial
- Client sees admin-filled details as formatted document text (not disabled inputs) — reads like a printed contract
- Auto-save progress — client can close browser and return later via the same link
- Full Triple J branding: JJAI gold crest logo at top, TJ Green + Gold colors, company name prominent

### Signature & initials UX
- Draw | Type tabs for signature — equal presentation, draw tab selected by default
- Initials: client draws initials once, then taps checkboxes next to each acknowledgment section to apply them
- Final review + confirm step after signing — summary of everything with "Submit Agreement" button
- Confirmation page after submit: "Agreement signed successfully. A copy will be emailed to you." with Triple J branding

### Mobile signing feel
- Professional + warm tone for all client-facing text and error messages
- "Please enter your full legal name as it appears on your ID." style guidance

### Claude's Discretion
- Field validation timing/pattern (on blur vs on step advance)
- Post-submit experience details (confirmation page vs confirmation + summary)
- Landscape orientation handling for signature canvas
- Read-only field styling details beyond "document text" direction
- Loading states and transitions between wizard steps
- Exact wizard step grouping of fields within personal info / employment / emergency contact

</decisions>

<specifics>
## Specific Ideas

- Admin-filled fields should look like reading a printed contract, not like disabled form inputs
- Initials flow should be low-friction: draw once, tap to place (not re-draw for each section)
- The confirmation screen after generating a link serves as the status transition point
- Client auto-save means partial progress is stored server-side, keyed to the link token
- SMS sending gives admin a one-tap share option alongside the manual copy/QR approach

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-shareable-links-client-signing*
*Context gathered: 2026-03-01*
