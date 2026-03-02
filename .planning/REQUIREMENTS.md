# Requirements: Triple J Auto Investment Agreement System

**Defined:** 2026-02-18
**Core Value:** The client must be able to receive a link, fill out their portion on their phone, sign the agreement, and both parties automatically get a professional PDF -- seamlessly, with zero friction.

## v1 Requirements

### Infrastructure

- [ ] **INFRA-01**: App has a backend with API endpoints for agreement CRUD operations
- [ ] **INFRA-02**: Agreement data persists in a database across sessions and page refreshes
- [ ] **INFRA-03**: Admin can log in with a simple PIN or basic auth to access the admin area
- [ ] **INFRA-04**: App uses React Router for separate admin and client views

### Agreement Core

- [ ] **CORE-01**: Admin can create a new agreement and fill vehicle info, rates, terms, and fees
- [ ] **CORE-02**: Agreement numbers are auto-generated sequentially (e.g., TJ-2026-0001)
- [x] **CORE-03**: Admin can generate a unique shareable link for a client to fill their portion
- [x] **CORE-04**: Admin fields are locked and read-only when client views the agreement via link
- [x] **CORE-05**: Client fields are locked and read-only when admin views a completed agreement
- [x] **CORE-06**: Shareable links expire after a configurable number of days
- [x] **CORE-07**: Expired links show a clear "expired" message page
- [x] **CORE-08**: QR code is generated for each agreement link (for in-person handoffs)

### Signing Experience

- [x] **SIGN-01**: Client can fill personal info, emergency contact, and employment fields via the link
- [x] **SIGN-02**: Client can draw their signature on a canvas pad (finger/mouse/stylus)
- [x] **SIGN-03**: Client can type their name and have it rendered in a signature font as alternative
- [x] **SIGN-04**: Client can initial each acknowledgment section
- [x] **SIGN-05**: Signing form works flawlessly on mobile phones (mobile-first design)
- [x] **SIGN-06**: Signature data is stored server-side with timestamp, IP address, and user agent for audit

### PDF & Branding

- [ ] **PDF-01**: JJAI gold crest logo appears prominently at the top of every agreement
- [ ] **PDF-02**: PDF is generated server-side with professional, symmetrical layout
- [ ] **PDF-03**: PDF headings, text, and sections are cleanly formatted and well-spaced
- [ ] **PDF-04**: PDF filename includes agreement number and renter name

### Delivery & Notifications

- [ ] **NOTIF-01**: Completed signed PDF is automatically emailed to admin
- [ ] **NOTIF-02**: Completed signed PDF is automatically emailed to client
- [ ] **NOTIF-03**: Admin receives SMS notification when client completes signing
- [ ] **NOTIF-04**: Email includes the PDF as an attachment

### Admin Dashboard

- [ ] **DASH-01**: Admin can see a list of all agreements with their current status
- [ ] **DASH-02**: Agreement statuses include: Draft, Sent, Viewed, Signed, Completed
- [ ] **DASH-03**: Admin can search agreements by renter name, vehicle, or agreement number
- [ ] **DASH-04**: Admin can filter agreements by status
- [ ] **DASH-05**: Admin can save vehicle/rate configurations as reusable templates
- [ ] **DASH-06**: Admin can create new agreements from saved templates

### Audit Trail

- [ ] **AUDIT-01**: System records when an agreement is created, with admin IP and timestamp
- [x] **AUDIT-02**: System records when a client opens the agreement link (IP, timestamp, user agent)
- [x] **AUDIT-03**: System records when each signature and initial is captured
- [ ] **AUDIT-04**: Audit log is append-only and cannot be modified after creation

## v2 Requirements

### Delivery Enhancements

- **NOTIF-05**: Branded HTML email with JJAI logo and colors
- **NOTIF-06**: Secure time-limited download link as backup to email attachment
- **NOTIF-07**: Automated signing reminders if client hasn't signed in N days

### Dashboard Enhancements

- **DASH-07**: Dashboard analytics (active rentals, revenue tracking, upcoming expirations)
- **DASH-08**: Vehicle condition photo upload associated with agreements

### Agreement Enhancements

- **CORE-09**: Agreement amendment/addendum workflow for post-signing changes
- **CORE-10**: Duplicate existing agreement to create a new one quickly

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-tenant / multi-business support | Single business operation; no need for tenant isolation |
| Client accounts / login for renters | Clients access via unique link only; accounts add friction |
| Payment processing / invoicing | Payments happen outside the system (cash, Zelle, etc.) |
| Complex RBAC (role-based access control) | Single admin user; full permissions system is overkill |
| Real-time collaborative editing | Sequential workflow (admin then client); no simultaneous editing |
| Advanced e-signature compliance (PKI) | ESIGN Act accepts simple electronic signatures for vehicle rentals |
| Document template builder/editor | Fixed agreement structure; only field values change |
| Internationalization (i18n) | Houston, TX business; English only; Texas law references |
| Third-party e-sign API (DocuSign, etc.) | Custom build is simpler and cheaper for this use case |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| CORE-01 | Phase 1 | Pending |
| CORE-02 | Phase 1 | Pending |
| CORE-03 | Phase 2 | Complete |
| CORE-04 | Phase 2 | Complete |
| CORE-05 | Phase 2 | Complete |
| CORE-06 | Phase 2 | Complete |
| CORE-07 | Phase 2 | Complete |
| CORE-08 | Phase 2 | Complete |
| SIGN-01 | Phase 2 | Complete |
| SIGN-02 | Phase 2 | Complete |
| SIGN-03 | Phase 2 | Complete |
| SIGN-04 | Phase 2 | Complete |
| SIGN-05 | Phase 2 | Complete |
| SIGN-06 | Phase 2 | Complete |
| PDF-01 | Phase 3 | Pending |
| PDF-02 | Phase 3 | Pending |
| PDF-03 | Phase 3 | Pending |
| PDF-04 | Phase 3 | Pending |
| NOTIF-01 | Phase 3 | Pending |
| NOTIF-02 | Phase 3 | Pending |
| NOTIF-03 | Phase 3 | Pending |
| NOTIF-04 | Phase 3 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| DASH-04 | Phase 4 | Pending |
| DASH-05 | Phase 4 | Pending |
| DASH-06 | Phase 4 | Pending |
| AUDIT-01 | Phase 1 | Pending |
| AUDIT-02 | Phase 2 | Complete |
| AUDIT-03 | Phase 2 | Complete |
| AUDIT-04 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 after roadmap creation*
