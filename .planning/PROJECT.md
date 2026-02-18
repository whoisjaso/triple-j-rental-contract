# Triple J Auto Investment Agreement System

## What This Is

A professional Vehicle Rental Agreement generation and signing platform for Triple J Auto Investment LLC. The system allows the business owner to fill out vehicle/rate/term details, then send a unique link to clients who complete their personal information, acknowledgments, and signatures on any device. Upon completion, a polished PDF is auto-generated and emailed to both parties.

## Core Value

The client must be able to receive a link, fill out their portion on their phone, sign the agreement, and both parties automatically get a professional PDF -- seamlessly, with zero friction.

## Requirements

### Validated

- ✓ Complete 11-section Vehicle Rental Agreement form with legal language — existing
- ✓ Renter information capture (personal, emergency, employment) — existing
- ✓ Vehicle information capture (year/make/model, VIN, plate, odometer) — existing
- ✓ Rental term & payment schedule configuration — existing
- ✓ Insurance & liability requirements with acknowledgment boxes — existing
- ✓ GPS/VSRS tracking consent with acknowledgment — existing
- ✓ Geographic & use restrictions with acknowledgment — existing
- ✓ Vehicle recovery protocol with acknowledgment — existing
- ✓ Vehicle return & deposit terms — existing
- ✓ Additional terms & conditions (mileage, maintenance, smoking, pets) — existing
- ✓ Vehicle condition documentation checklist (Addendum A) — existing
- ✓ Additional authorized drivers section (Addendum B) — existing
- ✓ Fee schedule summary table — existing
- ✓ Canvas-based electronic signature pad (draw with mouse/touch) — existing
- ✓ Initials capture for acknowledgment sections — existing
- ✓ PDF download via html2pdf.js — existing
- ✓ Print functionality — existing
- ✓ Mobile-responsive layout — existing
- ✓ JJAI brand theme (forest green #1A472A, gold #C5A059) — existing

### Active

- [ ] Admin/client role split -- admin fills vehicle, rates, terms, fees; client fills personal info, signatures, initials, acknowledgments
- [ ] Admin locks their fields and generates a unique shareable link for the client
- [ ] Client receives link, fills their portion, signs the agreement (mobile-first)
- [ ] JJAI gold crest logo displayed at the top of every agreement
- [ ] Professional PDF formatting -- symmetrical layout, clean headings, polished typography
- [ ] Auto-generate PDF when client completes and signs
- [ ] Email completed PDF to both admin and client automatically
- [ ] SMS notification to admin when client completes signing
- [ ] Admin dashboard to manage multiple agreements (pending, signed, active)
- [ ] Simple admin authentication (PIN or basic auth -- single user)
- [ ] Simple data storage for agreement persistence
- [ ] Typed and drawn signature options for client
- [ ] Integration pathway with thetriplejauto.com (Next.js/React site)

### Out of Scope

- Multi-user admin accounts -- single owner operation, no need for team access now
- Payment processing -- agreements track payment terms but don't collect payments
- Document versioning -- no need to track agreement revisions
- Client accounts/login -- clients access via unique link only, no accounts
- Template editor -- agreement structure is fixed, only field values change
- E-signature legal compliance (DocuSign-level) -- simple electronic signatures sufficient for this use case

## Context

**Business:** Triple J Auto Investment LLC is a Texas-licensed vehicle rental company (Dealer License P171632) based at 8774 Almeda Genoa Road, Houston, TX 77075. The owner needs to streamline the agreement process -- currently filling out everything manually.

**Existing Codebase:** A working React/TypeScript/Vite SPA that renders the complete agreement form. All content and legal language is already written and structured into 11 sections + 2 addenda. Currently client-side only with no backend, no auth, no data persistence. Dependencies loaded via CDN (Tailwind, html2pdf.js, Google Fonts). Originally generated from Google AI Studio.

**Client Profile:** Renters who will fill out agreements primarily on their phones. Must be dead-simple -- click link, fill fields, sign, done. No app downloads, no account creation.

**Website:** Owner has thetriplejauto.com built with Next.js/React. This agreement system will be linked from or integrated with that site.

**Logo:** Gold coat of arms crest with "JJAI" monogram, horses, crown, and banner reading "VERITAS EST.2025 DIGNITAS". Must appear prominently at top of every agreement.

## Constraints

- **Tech Stack**: Must remain React/TypeScript -- compatible with existing Next.js site
- **Mobile-First**: Client form must work flawlessly on phones (primary device for renters)
- **Simplicity**: Admin is one person -- no enterprise features, keep auth/storage minimal
- **Cost**: Prefer free-tier or low-cost hosting/services (Supabase free tier, Vercel, etc.)
- **PDF Quality**: Generated PDFs must look professional and symmetrical -- this represents the business

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Same form for admin and client (role-based field locking) | Simpler than building two separate interfaces; admin sees exactly what client will see | -- Pending |
| Auto-generate PDF & email to both on completion | Removes manual step; ensures both parties have the signed copy immediately | -- Pending |
| Simple file-based or lightweight DB storage | Single user, low volume; no need for enterprise database | -- Pending |
| Mobile-first client experience | Most renters will sign on their phone at the dealership or at home | -- Pending |
| Both typed and drawn signatures | Flexibility for client preference; drawn signatures feel more "official" | -- Pending |
| PIN/basic auth for admin | Only one admin user; full auth system is overkill | -- Pending |
| JJAI gold crest logo at top | Brand presence on every agreement; professional appearance | -- Pending |

---
*Last updated: 2026-02-18 after initialization*
