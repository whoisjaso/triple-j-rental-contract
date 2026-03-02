# Phase 5: Manheim Autonomous Inventory Pipeline - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Build an autonomous pipeline that monitors Gmail for Manheim purchase confirmation emails, parses vehicle data from three email sources (OVE purchase, Central Dispatch shipping, Manheim sale documents), enriches via NHTSA VIN decode, and writes to Google Sheets. The existing Sheet → website sync handles Supabase/website updates. Includes a standalone photo upload page for the one manual step (vehicle photos), and SMS notifications for pipeline events.

Reference: `docs/plans/2026-03-02-manheim-pipeline-design.md` (approved design doc with email source details, column mapping, and architecture).

</domain>

<decisions>
## Implementation Decisions

### Pipeline Notifications
- SMS text to admin (+18324005294) when a new vehicle is processed from an OVE purchase email
- Quick summary format: "New vehicle added: 2019 Nissan Pathfinder | VIN: ...4768 | $2,500 + $280 fee"
- SMS for errors too: "Pipeline error: Failed to parse OVE email. Check logs."
- SMS for new vehicle additions and errors ONLY — Central Dispatch towing cost updates and Manheim Sale Document condition/title updates are silent (no SMS)

### Website Listing Behavior
- Pipeline sets Listing Status to **"Incoming"** (not "Available") — vehicle data exists but is not visible to customers
- While "Incoming", website shows vehicle as **"Coming Soon"** with basic info (year, make, model) but no price or full details
- Pipeline's Target List Price auto-populates as the customer-facing price (owner can override before publishing)
- Status flip from "Incoming" → "Available" can happen from either Google Sheet or admin dashboard — both paths work

### Data Source Strategy
- **Google Sheet is the single source of truth** — pipeline writes to sheet only, NOT directly to Supabase
- Existing Google Sheets → website sync handles Supabase/website updates
- If pipeline parses data wrong, owner corrects in the sheet; existing sync propagates the fix
- No dual-write complexity — pipeline only touches Google Sheets API
- **Pipeline log table in Supabase** for debugging/audit trail (records: email received, data parsed, row written, errors)

### Photo Workflow
- **Standalone quick-access page** (not inside admin dashboard) — fast-loading, bookmarkable on phone
- **Guided photo shots**: step-by-step prompts for front, rear, driver side, passenger side, interior, dashboard, trunk
- Select vehicle from list of "Incoming" vehicles, then walk through photo capture
- **Auto-publish**: once photos are uploaded, status automatically flips from "Incoming" to "Available" — vehicle goes live on website with no extra approval step
- Photos stored and linked to vehicle record via Photo Link column in sheet

### Claude's Discretion
- Photo storage destination (Supabase Storage, Google Drive, or other)
- Photo compression/optimization approach
- Exact SMS delivery mechanism (reuse Phase 3 approach if applicable)
- Pipeline log table schema and retention policy
- "Coming Soon" card design on the website
- Guided photo page UI/UX details beyond the shot sequence

</decisions>

<specifics>
## Specific Ideas

- SMS format should be concise and actionable — owner is likely on-the-go at auctions
- The photo upload page needs to work well standing next to the car — camera integration, not just gallery picker
- "Coming Soon" listings create anticipation for customers and show inventory is actively growing
- Pipeline should NOT mark emails as read if processing fails — ensures retry on next cycle

</specifics>

<deferred>
## Deferred Ideas

- Super Dispatch BOL photos for delivery confirmation — future enhancement (mentioned in design doc as Source 4)
- Two-way sync between Sheet and Supabase — decided against, sheet is one-way source of truth
- Admin dashboard photo management (editing, reordering, deleting photos) — separate from the quick upload page

</deferred>

---

*Phase: 05-manheim-autonomous-inventory-pipeline*
*Context gathered: 2026-03-02*
