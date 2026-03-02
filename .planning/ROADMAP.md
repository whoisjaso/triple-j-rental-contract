# Roadmap: Triple J Auto Investment Agreement System

**Created:** 2026-02-18
**Depth:** Quick (3-5 phases)
**Phases:** 4
**Coverage:** 36/36 v1 requirements mapped

## Overview

Transform the existing client-side React agreement form into a full e-signing platform where admin fills vehicle/payment details, generates a shareable link, client signs on their phone, and both parties receive a professional PDF automatically. Four phases follow the critical dependency chain: backend foundation, shareable signing flow, PDF generation with delivery, and admin dashboard.

---

## Phase 1: Backend Foundation

**Goal:** Admin can log in, create agreements with auto-generated numbers, and persist them in a database.

**Dependencies:** None (first phase)

**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md -- Project restructure + Tailwind v4 migration
- [x] 01-02-PLAN.md -- Supabase database schema + client setup
- [x] 01-03-PLAN.md -- Auth provider + React Router + protected routes
- [x] 01-04-PLAN.md -- Agreement CRUD + Zustand store + admin form

**Requirements:**
- INFRA-01: Backend with API endpoints for agreement CRUD
- INFRA-02: Agreement data persists in database across sessions
- INFRA-03: Admin login with simple PIN or basic auth
- INFRA-04: React Router for separate admin and client views
- CORE-01: Admin can create agreement and fill vehicle info, rates, terms, fees
- CORE-02: Agreement numbers auto-generated sequentially (TJ-2026-0001)
- AUDIT-01: System records agreement creation with admin IP and timestamp
- AUDIT-04: Audit log is append-only and cannot be modified after creation

**Success Criteria:**
1. Admin can log in with credentials and access the admin area; unauthenticated users are redirected
2. Admin can create a new agreement, fill in vehicle/rate/term/fee fields, and save it
3. Agreement persists across browser refresh and shows the same data when reopened
4. Each new agreement receives a unique sequential number in TJ-YYYY-NNNN format
5. Audit log records creation events and cannot be edited or deleted

---

## Phase 2: Shareable Links + Client Signing

**Goal:** Admin can send a link to a client who fills their portion on their phone, signs the agreement, and all actions are audit-logged.

**Dependencies:** Phase 1 (needs persistent agreements, auth, routing, audit infrastructure)

**Plans:** 2/4 plans executed

Plans:
- [x] 02-01-PLAN.md -- Dependencies, RLS migration, link generation lib, client store, routes
- [ ] 02-02-PLAN.md -- Admin link share modal with QR code + expired page
- [ ] 02-03-PLAN.md -- Client wizard container + form steps 1-4
- [ ] 02-04-PLAN.md -- Signature/initials capture, review/submit, confirmation, admin read-only

**Requirements:**
- CORE-03: Admin generates unique shareable link for client
- CORE-04: Admin fields are locked/read-only when client views via link
- CORE-05: Client fields are locked/read-only when admin views completed agreement
- CORE-06: Shareable links expire after configurable number of days
- CORE-07: Expired links show clear "expired" message page
- CORE-08: QR code generated for each agreement link
- SIGN-01: Client fills personal info, emergency contact, employment fields via link
- SIGN-02: Client draws signature on canvas pad (finger/mouse/stylus)
- SIGN-03: Client types name rendered in signature font as alternative
- SIGN-04: Client initials each acknowledgment section
- SIGN-05: Signing form works flawlessly on mobile phones (mobile-first)
- SIGN-06: Signature data stored server-side with timestamp, IP, user agent
- AUDIT-02: System records when client opens agreement link (IP, timestamp, user agent)
- AUDIT-03: System records when each signature and initial is captured

**Success Criteria:**
1. Admin clicks "Send to Client" and receives a shareable URL and QR code for the agreement
2. Client opens the link on their phone, sees admin-filled fields as read-only, and can fill only their own fields (personal info, emergency contact, employment)
3. Client can draw or type their signature, initial each acknowledgment section, and submit the completed agreement
4. An expired link shows a clear expiration message instead of the form
5. After client signs, admin sees client fields as read-only and audit log shows all client actions with timestamps and IP addresses

---

## Phase 3: PDF Generation + Delivery

**Goal:** Upon signing completion, a professional branded PDF is auto-generated and delivered to both parties via email, with SMS alert to admin.

**Dependencies:** Phase 2 (needs completed signed agreement data, signature images)

**Requirements:**
- PDF-01: JJAI gold crest logo appears prominently at top of every agreement
- PDF-02: PDF generated server-side with professional, symmetrical layout
- PDF-03: PDF headings, text, sections cleanly formatted and well-spaced
- PDF-04: PDF filename includes agreement number and renter name
- NOTIF-01: Completed signed PDF automatically emailed to admin
- NOTIF-02: Completed signed PDF automatically emailed to client
- NOTIF-03: Admin receives SMS notification when client completes signing
- NOTIF-04: Email includes PDF as attachment

**Success Criteria:**
1. When client completes signing, a PDF is automatically generated with the JJAI gold crest logo, professional formatting, and all agreement data including embedded signatures
2. Both admin and client receive an email with the PDF attached; filename contains the agreement number and renter name
3. Admin receives an SMS text message when the client finishes signing
4. PDF layout is symmetrical and professional -- headings, sections, and text are cleanly formatted on every page

---

## Phase 4: Admin Dashboard

**Goal:** Admin can manage all agreements from a central dashboard with search, filtering, status tracking, and reusable templates.

**Dependencies:** Phase 3 (needs agreement statuses, PDF availability, notification status for complete dashboard data)

**Requirements:**
- DASH-01: Admin sees list of all agreements with current status
- DASH-02: Agreement statuses include Draft, Sent, Viewed, Signed, Completed
- DASH-03: Admin can search by renter name, vehicle, or agreement number
- DASH-04: Admin can filter agreements by status
- DASH-05: Admin can save vehicle/rate configurations as reusable templates
- DASH-06: Admin can create new agreements from saved templates

**Success Criteria:**
1. Admin sees all agreements in a list view showing status (Draft/Sent/Viewed/Signed/Completed), renter name, vehicle, and agreement number
2. Admin can search by renter name, vehicle, or agreement number and filter the list by status
3. Admin can save a vehicle/rate configuration as a template and create new agreements from it

---

## Progress

| Phase | Name | Requirements | Status |
|-------|------|:------------:|--------|
| 1 | Backend Foundation | 8 | Complete (4 plans) |
| 2 | 2/4 | In Progress|  |
| 3 | PDF Generation + Delivery | 8 | Pending |
| 4 | Admin Dashboard | 6 | Pending |
| **Total** | | **36** | |

---
*Roadmap created: 2026-02-18*
*Phase 1 planned: 2026-02-18*
*Phase 2 planned: 2026-03-01*
*Phase 2 Plan 01 complete: 2026-03-01*
