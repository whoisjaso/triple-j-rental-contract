# External Integrations

**Analysis Date:** 2026-02-17

## APIs & External Services

**Google Gemini AI:**
- Purpose: API key is configured in `.env.local` and exposed via Vite build (`vite.config.ts`), but **no actual API calls to Gemini exist in the current codebase**. The key is wired through `process.env.GEMINI_API_KEY` and `process.env.API_KEY` but never referenced in any application code.
- SDK/Client: None installed. No `@google/generative-ai` or similar package in `package.json`.
- Auth: `GEMINI_API_KEY` env var in `.env.local`
- Status: **Configured but unused** - likely a remnant of AI Studio scaffolding or intended for future use.

## CDN Services (Runtime Dependencies)

**Tailwind CSS CDN:**
- URL: `https://cdn.tailwindcss.com`
- Purpose: Utility-first CSS framework, loaded as play/CDN mode (not compiled)
- Configuration: Inline `tailwind.config` in `index.html` `<script>` block
- Risk: CDN dependency in production; no offline fallback

**html2pdf.js CDN:**
- URL: `https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js`
- Purpose: Client-side PDF generation from HTML content
- Usage: `App.tsx` line 87-113 uses `window.html2pdf()` to generate downloadable PDF agreements
- Auth: None required
- Risk: CDN dependency; accessed via `window.html2pdf` global (with `@ts-ignore`)

**Google Fonts CDN:**
- URL: `https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400`
- Purpose: Typography - Inter (sans-serif, UI elements) and Lora (serif, legal text)
- Auth: None required

**esm.sh CDN (Import Map):**
- URLs: `https://esm.sh/react@^19.2.4`, `https://esm.sh/react-dom@^19.2.4/`, `https://esm.sh/lucide-react@^0.574.0`
- Purpose: ES module imports for non-bundled development mode
- Note: Import map in `index.html` provides module resolution; Vite bundler handles resolution during `npm run dev` and `npm run build`

## Data Storage

**Databases:**
- None - this is a purely client-side form application with no backend

**File Storage:**
- Local filesystem only (PDF download to user's device via browser `save()`)
- Signature data stored as base64 PNG data URLs in React component state (`SignaturePad.tsx` line 122: `canvas.toDataURL('image/png')`)

**Caching:**
- None - all form state is held in React `useState` and lost on page refresh

**Persistence:**
- None - no `localStorage`, `sessionStorage`, `IndexedDB`, or any persistence mechanism exists. All form data is ephemeral.

## Authentication & Identity

**Auth Provider:**
- None - this is an open, unauthenticated form application
- No login, user accounts, or session management

## Monitoring & Observability

**Error Tracking:**
- None - errors are handled with `console.error` and `alert()` (see `App.tsx` line 114-115)

**Logs:**
- `console.error` only, used in PDF generation failure handler (`App.tsx`)

## CI/CD & Deployment

**Hosting:**
- Not configured - no deployment configuration files detected (no `vercel.json`, `netlify.toml`, `Dockerfile`, etc.)
- Intended as static SPA (Vite build output)

**CI Pipeline:**
- None - no `.github/workflows`, no CI config files

## Environment Configuration

**Required env vars:**
- `GEMINI_API_KEY` - Google Gemini API key (configured but currently unused by application code)

**Secrets location:**
- `.env.local` at project root (gitignored via `*.local` pattern in `.gitignore`)
- **Warning:** `.env.local` contains a `PLACEHOLDER_API_KEY` value that is committed to the repo via Vite's `define` at build time, exposing it client-side

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Integration Summary

This is a **self-contained client-side application** with no backend, no database, no API calls, and no authentication. All external dependencies are loaded via CDN at runtime:

| Integration | Type | Critical |
|---|---|---|
| Tailwind CSS CDN | Styling | Yes - all UI styling depends on it |
| html2pdf.js CDN | PDF generation | Yes - core feature (agreement download) |
| Google Fonts CDN | Typography | Medium - fallback fonts would render |
| esm.sh CDN | Module loading | Low - only for non-bundled mode |
| Gemini API | AI services | No - configured but unused |

---

*Integration audit: 2026-02-17*
