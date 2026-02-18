# Technology Stack

**Project:** Triple J Auto Investment Agreement System
**Researched:** 2026-02-18
**Mode:** Ecosystem -- Stack Dimension
**Overall Confidence:** HIGH

---

## Executive Summary

This stack recommendation builds on the existing React 19 / TypeScript / Vite SPA foundation. The core addition is **Supabase** as the all-in-one backend (database, auth, storage, edge functions), which eliminates the need to build or host a separate server. PDF generation moves from the brittle client-side html2pdf.js to server-side **@react-pdf/renderer** running in Supabase Edge Functions. Email delivery uses **Resend** (3,000 free emails/month -- far more than needed). SMS uses **Twilio** (pay-as-you-go at $0.0083/message -- effectively free at this volume). Tailwind CSS moves from CDN play mode to a proper **@tailwindcss/vite** build. The entire stack fits comfortably within free tiers for a single-user business doing a few agreements per week.

---

## Recommended Stack

### Backend Platform

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Supabase** | Current (hosted) | Database, auth, storage, edge functions | All-in-one BaaS that eliminates custom server infrastructure. Free tier includes 500 MB database, 1 GB file storage, 500K edge function invocations/month, and 50K monthly active users for auth. Perfect for single-user, low-volume business. Integrates natively with React/TypeScript. | HIGH |
| **Supabase Edge Functions** | Deno 2.1+ runtime | Server-side logic (PDF gen, email, SMS) | Serverless functions that run close to users. Support npm packages via `npm:` prefix. No server to manage. 500K free invocations/month is orders of magnitude beyond what this app needs. | HIGH |
| **Supabase Database (PostgreSQL)** | Postgres 15+ | Agreement data persistence | Full PostgreSQL with Row Level Security (RLS) for authorization. Store agreements, track status (draft/pending/signed). 500 MB free tier is massive for text-based agreement records. | HIGH |
| **Supabase Storage** | Current | PDF file storage | Store generated PDF agreements. 1 GB free tier. Individual file limit 50 MB (a single agreement PDF will be ~200 KB). Provides signed URLs for secure downloads. | HIGH |
| **Supabase Auth** | Current | Admin authentication | Email/password auth for the single admin user. Overkill compared to raw PIN auth, but provides proper JWT tokens that secure the entire API layer via RLS -- zero additional security code needed. The admin creates one account and never thinks about auth again. | HIGH |

**Why Supabase over alternatives:**
- **vs Firebase:** Supabase is PostgreSQL (relational, better for structured agreement data). Firebase is NoSQL (document-based). Agreement data has strong relational structure (agreement -> signatures, vehicle details, payment terms). PostgreSQL is the natural fit.
- **vs custom Express/Fastify server:** Supabase eliminates server hosting, deployment, SSL, scaling, and database management. For a single-user business, running infrastructure is pure overhead.
- **vs Vercel serverless + Neon/PlanetScale:** More pieces to connect and configure. Supabase bundles database + auth + storage + functions in one dashboard with one SDK.

### Frontend Framework (Existing -- No Changes)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **React** | ^19.2.4 | UI framework | Already in use. React 19 is current stable. No reason to change. | HIGH |
| **TypeScript** | ~5.8.2 | Type safety | Already in use. Current version. | HIGH |
| **Vite** | ^6.2.0 | Build tool / dev server | Already in use. Current version. Fast HMR and builds. | HIGH |

### Routing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **React Router** | ^7.13.0 | Client-side routing | Needed for admin dashboard vs client form views, plus unique agreement URLs. React Router v7 is the standard choice -- 7.13.0 is current. Simpler API surface than TanStack Router. The app has ~4 routes total, so advanced type-safe routing is unnecessary overhead. | HIGH |

**Why React Router over TanStack Router:**
- This app has minimal routing needs (~4 routes: admin login, admin dashboard, client form, PDF preview).
- React Router v7 is mature, battle-tested, and the team/owner likely already knows it from the Next.js site.
- TanStack Router's type-safe routing advantages only matter at scale with many dynamic parameters. Overkill here.

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Zustand** | ^5.0.11 | Global application state | Lightweight (~3KB), zero boilerplate, works naturally with React 19. Replaces the single giant `useState` in App.tsx. Stores admin session state, current agreement data, form step progress, and UI state. Simple enough that the pattern is immediately obvious. | HIGH |

**Why Zustand over alternatives:**
- **vs raw useState (current):** The app is adding roles, routing, and multi-step flows. A single `useState` in App.tsx will not scale to admin dashboard + client form + agreement list views. Zustand provides shared state across routes without prop drilling.
- **vs Jotai:** Jotai's atomic model is better for apps with many independent state pieces. This app has one primary state shape (agreement data) -- Zustand's single-store model is a more natural fit.
- **vs React Context:** Context causes unnecessary re-renders of the entire tree. Zustand's selector pattern (`useStore(s => s.field)`) prevents this. For form-heavy apps, this matters.
- **vs Redux Toolkit:** Massive overkill for an app with one store. Zustand does the same thing in 1/10th the code.

### PDF Generation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **@react-pdf/renderer** | ^4.3.2 | Server-side PDF creation | Creates PDFs using React components -- the team already thinks in React. Supports complex layouts, custom fonts (Inter, Lora), images (JJAI logo), and precise styling. Runs server-side in Edge Functions for consistent output regardless of client device. 860K+ weekly npm downloads. | HIGH |

**Why @react-pdf/renderer over alternatives:**
- **vs html2pdf.js (current):** html2pdf.js captures DOM screenshots -- results vary by browser, screen size, and rendering quirks. @react-pdf/renderer generates PDFs programmatically with pixel-perfect control. For a legal agreement that "must look professional," programmatic generation is non-negotiable.
- **vs pdf-lib (1.17.1):** pdf-lib is low-level (draw text at x,y coordinates). Building a multi-page legal agreement with tables, headers, and complex layout would require hundreds of lines of manual positioning code. @react-pdf/renderer uses declarative React components with flexbox layout -- dramatically simpler for complex documents.
- **vs Puppeteer:** Requires a headless Chrome instance. Cannot run in Supabase Edge Functions (Deno runtime). Would require a separate server just for PDF generation. Massive overhead for a single-user app.
- **vs jsPDF:** Same problem as pdf-lib -- manual coordinate-based layout. Poor support for complex multi-page documents with consistent headers/footers.
- **vs pdfme:** Newer, less proven (33K weekly downloads vs 860K for @react-pdf/renderer). Template-based approach is good for forms but less flexible for the complex legal document structure this app needs.

**Note:** @react-pdf/renderer works in Node.js and can be imported in Supabase Edge Functions via `npm:@react-pdf/renderer`. If Edge Function compatibility proves problematic (LOW risk but worth flagging), the fallback is **pdf-lib** for a more manual but guaranteed-compatible approach.

### Email Delivery

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Resend** | API (REST) | Transactional email (PDF delivery) | 3,000 free emails/month. Developer-first API with excellent TypeScript SDK. Official Supabase Edge Functions integration with documentation. React Email compatible for beautiful HTML email templates. For an app sending maybe 10-20 emails/month, the free tier will never be exceeded. | HIGH |
| **@react-email/components** | ^1.0.7 | Email template components | Build email templates with React components. Same mental model as the rest of the app. Supports responsive layouts and inline styles. | MEDIUM |

**Why Resend over alternatives:**
- **vs SendGrid:** SendGrid free tier is 100 emails/day but requires more setup and verification. Resend is simpler, faster to integrate, and designed for developers. Has official Supabase Edge Function examples.
- **vs Amazon SES:** Cheaper at scale but requires AWS account setup, IAM configuration, domain verification, and sending limits management. Massive overkill for 10-20 emails/month.
- **vs Nodemailer + Gmail SMTP:** Fragile. Google rate-limits SMTP, changes auth requirements, and can randomly block "less secure apps." Not suitable for a business system.
- **vs Postmark:** Similar quality but no free tier (only a sandbox). Resend's free tier covers the use case completely.

### SMS Notifications

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Twilio** | API (REST) | SMS notification to admin on signing | Industry standard. $0.0083 per SMS in US + $1.15/month for a phone number. For an app sending maybe 5-10 SMS/month, total cost is ~$1.25/month. REST API callable from Edge Functions with zero dependencies. | HIGH |

**Why Twilio over alternatives:**
- **vs Telnyx:** Slightly cheaper ($0.004/message) but smaller ecosystem and fewer examples. Twilio's documentation and Supabase integration examples are more abundant. At 5-10 messages/month, the $0.004 savings per message is meaningless.
- **vs Plivo:** Similar pricing but less documentation for Supabase/Deno integration.
- **vs Vonage:** No meaningful advantage at this volume.
- **Twilio free trial note:** The trial account allows 50 messages/day but only to verified numbers and prepends "Sent from a Twilio Trial account." For production, upgrade the account ($20 initial credit) to remove these restrictions. At $0.0083/message, $20 covers ~2,400 messages.

### Styling (Migration from CDN)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Tailwind CSS** | ^4.1.18 | Utility-first CSS | Already in use via CDN. Must migrate to build-time compilation via `@tailwindcss/vite` plugin. CDN play mode is not suitable for production (large payload, no tree-shaking, no custom plugins). v4 is the current major version with simplified configuration. | HIGH |
| **@tailwindcss/vite** | ^4.1.18 | Vite integration plugin | First-party Vite plugin. Zero-config: just add to vite plugins and `@import "tailwindcss"` in CSS. Replaces CDN script tag with proper build-time processing. | HIGH |

### Unique Link Generation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **nanoid** | ^5.1.5 | Short, URL-safe unique IDs | 118 bytes, cryptographically secure, URL-friendly (A-Za-z0-9_-). 21-character IDs with collision probability equivalent to UUID v4. 86M+ weekly npm downloads. Used for generating shareable agreement links like `/agreement/V1StGXR8_Z5jdHi6B-myT`. | HIGH |

**Why nanoid over alternatives:**
- **vs crypto.randomUUID():** UUIDs are 36 characters. nanoid produces 21-character IDs that are more URL-friendly and shorter to share via SMS/text.
- **vs shortid:** Deprecated in favor of nanoid. Not maintained.
- **vs Supabase auto-generated UUIDs:** UUIDs work for database primary keys, but shareable links benefit from shorter, cleaner IDs. Use both: UUID as database PK, nanoid as the public-facing link token.

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **@supabase/supabase-js** | ^2.49+ | Supabase client SDK | All database queries, auth, storage, and function invocations from the React frontend. | HIGH |
| **lucide-react** | ^0.574.0 | Icons | Already in use. Continue using for UI icons (dashboard, status indicators, actions). | HIGH |
| **date-fns** | ^4.1+ | Date formatting | Format agreement dates, rental periods, payment schedules in both UI and PDFs. Lightweight, tree-shakeable. Prefer over dayjs/moment. | MEDIUM |

---

## What NOT to Use

| Technology | Why Not | Use Instead |
|------------|---------|-------------|
| **html2pdf.js** (current) | Screenshot-based PDF generation produces inconsistent results across devices/browsers. Cannot run server-side. Results vary on mobile (where clients sign). | @react-pdf/renderer |
| **Tailwind CDN** (current) | Play mode unsuitable for production. No tree-shaking (ships entire framework). No custom plugin support. Breaks if CDN is down. | @tailwindcss/vite (build-time) |
| **esm.sh import maps** (current) | CDN module resolution is fragile and prevents proper bundling, tree-shaking, and type checking. | npm packages via Vite bundler |
| **Firebase** | NoSQL document model is poor fit for relational agreement data. Firestore's query model is limiting for dashboard filtering/sorting. | Supabase (PostgreSQL) |
| **Puppeteer/Playwright** | Headless browser for PDF generation requires Chrome binary. Cannot run in Edge Functions. Requires dedicated server. Massive memory footprint. | @react-pdf/renderer |
| **Next.js (for this app)** | The agreement app is a pure SPA. SSR/SSG adds complexity with zero benefit -- clients load a single form page. The existing Next.js site at thetriplejauto.com is separate. Keep them separate; link from Next.js site to this app. | Vite SPA (current) |
| **Redux / Redux Toolkit** | Boilerplate-heavy for an app with ~1 store and ~5 actions. Zustand achieves the same result in 1/10th the code. | Zustand |
| **Prisma / Drizzle ORM** | Supabase client SDK handles all database operations. Adding an ORM adds a build step, schema sync complexity, and is incompatible with Edge Functions. | @supabase/supabase-js |
| **Express / Fastify server** | Running a custom Node.js server means managing hosting, SSL, scaling, and deployment. Supabase Edge Functions eliminate all of this. | Supabase Edge Functions |
| **Moment.js** | Deprecated by its own maintainers. 300KB+ bundle size. | date-fns |
| **AWS SES / SendGrid** | Over-engineered for 10-20 emails/month. More setup, more configuration, more things to manage. | Resend |

---

## Architecture Overview

```
[Client Browser]
    |
    |-- React SPA (Vite build, hosted on Vercel/Netlify)
    |     |-- React Router (admin login, dashboard, client form)
    |     |-- Zustand (state management)
    |     |-- @supabase/supabase-js (API client)
    |     |-- Tailwind CSS v4 (build-time)
    |
    |-- Supabase (hosted backend)
          |-- PostgreSQL Database
          |     |-- agreements table (status, data, admin fields, client fields)
          |     |-- Row Level Security (admin owns all rows)
          |
          |-- Auth (email/password for admin)
          |
          |-- Storage (generated PDF files)
          |
          |-- Edge Functions
                |-- generate-pdf (triggered on agreement completion)
                |     |-- @react-pdf/renderer (build PDF)
                |     |-- Upload to Supabase Storage
                |
                |-- send-email (triggered after PDF generation)
                |     |-- Resend API (deliver PDF to both parties)
                |
                |-- send-sms (triggered on agreement completion)
                      |-- Twilio API (notify admin)
```

---

## Cost Analysis (Monthly)

| Service | Free Tier | Estimated Usage | Monthly Cost |
|---------|-----------|-----------------|--------------|
| **Supabase** | 500 MB DB, 1 GB storage, 500K function calls | ~50 agreements, ~50 function calls | **$0** |
| **Resend** | 3,000 emails/month | ~20-40 emails (2 per agreement) | **$0** |
| **Twilio** | Pay-as-you-go | ~10-20 SMS + $1.15 number rental | **~$1.35** |
| **Vercel** (hosting) | 100 GB bandwidth | Static SPA, minimal bandwidth | **$0** |
| **Total** | | | **~$1.35/month** |

---

## Installation Plan

```bash
# Core frontend additions
npm install react-router zustand @supabase/supabase-js nanoid date-fns

# Tailwind CSS migration (replace CDN)
npm install tailwindcss @tailwindcss/vite

# Dev dependencies
npm install -D @types/react-router supabase

# Edge Function dependencies (in supabase/functions/)
# These use Deno imports, not npm install:
# - npm:@react-pdf/renderer
# - npm:resend
# (Twilio uses REST API directly, no SDK needed)
```

### Environment Variables

```bash
# .env.local (frontend - exposed to client)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Supabase Edge Function secrets (set via dashboard or CLI)
RESEND_API_KEY=re_xxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
ADMIN_PHONE_NUMBER=+1xxxxxxxxxx
```

---

## Version Verification Log

All versions verified via npm registry and web search on 2026-02-18:

| Package | Stated Version | Verification Source | Status |
|---------|---------------|-------------------|--------|
| React | ^19.2.4 | package.json (existing) | Verified |
| TypeScript | ~5.8.2 | package.json (existing) | Verified |
| Vite | ^6.2.0 | package.json (existing) | Verified |
| React Router | ^7.13.0 | npm registry | Verified |
| Zustand | ^5.0.11 | npm registry | Verified |
| @react-pdf/renderer | ^4.3.2 | npm registry | Verified |
| Tailwind CSS | ^4.1.18 | npm registry | Verified |
| @tailwindcss/vite | ^4.1.18 | npm registry | Verified |
| nanoid | ^5.1.5 | npm registry (86M weekly downloads) | Verified |
| @react-email/components | ^1.0.7 | npm registry | Verified |
| @supabase/supabase-js | ^2.49+ | npm registry | Verified |
| pdf-lib | 1.17.1 | npm registry (fallback only) | Verified |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| @react-pdf/renderer incompatible with Supabase Edge Functions (Deno) | LOW | HIGH | Fallback to pdf-lib (1.17.1) which has confirmed Deno compatibility. Or use Vercel serverless function for PDF generation only. |
| Supabase free tier project pausing (no API requests for 1 week) | MEDIUM | MEDIUM | The admin dashboard will generate periodic requests. If concerned, set up a simple cron ping. At worst, project resumes manually in dashboard. |
| Resend email deliverability (new domain) | LOW | MEDIUM | Resend handles SPF/DKIM setup via their domain verification flow. For initial testing, send from onboarding@resend.dev (their default). |
| Twilio trial limitations (prepended message, verified-only) | NONE (planned) | LOW | Budget $20 to upgrade from trial immediately. At $0.0083/message, this covers years of SMS notifications. |

---

## Sources

### Supabase
- [Supabase Pricing](https://supabase.com/pricing) -- free tier limits
- [Supabase Pricing Breakdown (UI Bakery)](https://uibakery.io/blog/supabase-pricing) -- detailed plan comparison
- [Edge Functions Docs](https://supabase.com/docs/guides/functions) -- capabilities and architecture
- [NPM Compatibility for Edge Functions](https://supabase.com/features/npm-compatibility) -- npm package support in Deno
- [Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- RLS patterns
- [Storage File Limits](https://supabase.com/docs/guides/storage/uploads/file-limits) -- 50 MB per file, 1 GB total on free tier
- [Database Webhooks](https://supabase.com/docs/guides/database/webhooks) -- trigger edge functions from DB changes

### PDF Generation
- [@react-pdf/renderer on npm](https://www.npmjs.com/package/@react-pdf/renderer) -- v4.3.2, 860K weekly downloads
- [react-pdf.org](https://react-pdf.org/) -- official documentation
- [PDF Libraries Comparison (npm-compare)](https://npm-compare.com/@react-pdf/renderer,jspdf,pdfmake,react-pdf) -- download and feature comparison
- [pdf-lib on npm](https://www.npmjs.com/package/pdf-lib) -- v1.17.1 as fallback, Deno compatible
- [pdf-lib Deno Usage](https://deno.com/npm/package/pdf-lib) -- confirmed Deno compatibility

### Email
- [Resend Pricing](https://resend.com/pricing) -- 3,000 free emails/month
- [Resend + Supabase Edge Functions Guide](https://resend.com/docs/send-with-supabase-edge-functions) -- official integration
- [React Email 5.0 Announcement](https://resend.com/blog/react-email-5) -- latest React Email features
- [@react-email/components on npm](https://www.npmjs.com/package/@react-email/components) -- v1.0.7

### SMS
- [Twilio SMS Pricing (US)](https://www.twilio.com/en-us/sms/pricing/us) -- $0.0083/message
- [Twilio Free Trial Limitations](https://help.twilio.com/articles/360036052753-Twilio-Free-Trial-Limitations) -- 50/day, verified numbers only

### Frontend Libraries
- [React Router on npm](https://www.npmjs.com/package/react-router) -- v7.13.0
- [Zustand on npm](https://www.npmjs.com/package/zustand) -- v5.0.11
- [@tailwindcss/vite on npm](https://www.npmjs.com/package/@tailwindcss/vite) -- v4.1.18
- [Tailwind CSS v4 Installation](https://tailwindcss.com/docs) -- Vite plugin setup
- [nanoid on npm](https://www.npmjs.com/package/nanoid) -- 86M weekly downloads

---

*Stack research: 2026-02-18*
