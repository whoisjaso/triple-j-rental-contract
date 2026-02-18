# Architecture

**Analysis Date:** 2026-02-17

## Pattern Overview

**Overall:** Single-Page Application (SPA) -- Monolithic Component with Flat State

**Key Characteristics:**
- Client-side only React application with no backend or API layer
- All form state lives in a single `useState` hook in `App.tsx` via a single `AgreementData` object
- No routing -- the entire application is one page rendering a multi-section legal agreement form
- PDF generation and printing handled entirely client-side via `html2pdf.js` (loaded from CDN)
- Tailwind CSS loaded from CDN (`cdn.tailwindcss.com`) with inline configuration in `index.html`
- Dependencies loaded via ES Module import maps (esm.sh CDN) defined in `index.html`

## Layers

**Presentation Layer (Components):**
- Purpose: Render form inputs, sections, acknowledgment areas, and signature capture
- Location: `components/`
- Contains: 5 reusable React functional components
- Depends on: React, lucide-react (icons)
- Used by: `App.tsx`

**Application Layer (App):**
- Purpose: Orchestrate the entire agreement form, manage all state, handle print/PDF actions
- Location: `App.tsx`
- Contains: Root component with all business logic, form layout, and legal content
- Depends on: All components in `components/`, `types.ts`, lucide-react
- Used by: `index.tsx` (entry point)

**Type Definitions:**
- Purpose: Define the shape of the entire agreement data model
- Location: `types.ts`
- Contains: Single `AgreementData` interface with nested sub-objects
- Depends on: Nothing
- Used by: `App.tsx`

**Entry/Bootstrap Layer:**
- Purpose: Mount React app to DOM
- Location: `index.tsx`, `index.html`
- Contains: ReactDOM render call, CDN script tags, Tailwind config, CSS styles
- Depends on: `App.tsx`, CDN resources (Tailwind, html2pdf.js, Google Fonts, esm.sh)
- Used by: Browser

## Data Flow

**Form Input Flow:**

1. User types in an `InputLine`, `InitialsBox`, or interacts with `SignaturePad`
2. Component calls its `onChange` prop with the new value (string or data URL for signatures)
3. `App.tsx` `update()` function receives `(section, field, value)` and calls `setData()` with an immutable spread update
4. React re-renders the affected component with the new value from state

**Signature Capture Flow:**

1. User clicks "Tap to Sign" button in `SignaturePad` component
2. Component enters editing mode (`isEditing = true`), rendering a full-width `<canvas>` element
3. User draws on canvas via mouse or touch events (native event listeners with `passive: false`)
4. User clicks "Save Signature" -- canvas is exported as PNG data URL via `canvas.toDataURL('image/png')`
5. Data URL string is passed to parent via `onChange`, stored in `data.signatures.renterSig`
6. Component exits editing mode and renders the signature as an `<img>` element

**PDF Generation Flow:**

1. User clicks "PDF" button in the floating control panel
2. `handleDownloadPDF` in `App.tsx` adds `force-desktop` CSS class to the main content `<div>` (via `componentRef`)
3. `window.html2pdf()` (loaded from CDN) captures the DOM element using html2canvas at 2x scale
4. Generates a letter-sized portrait PDF with the filename based on renter name
5. `force-desktop` class is removed in `finally` block to restore normal layout
6. CSS rules in `index.html` under `.force-desktop` override responsive Tailwind classes to ensure desktop layout in PDF

**Print Flow:**

1. User clicks "Print" button
2. `window.print()` is called after a 100ms timeout
3. CSS `@media print` rules in `index.html` hide `.no-print` elements, apply page breaks, and force desktop grid layouts

**State Management:**
- All state is held in a single `useState<AgreementData>` hook in `App.tsx`
- No external state management library (no Redux, Zustand, Context, etc.)
- State shape is a flat object with nested sub-objects keyed by agreement section (renter, vehicle, payment, etc.)
- The `update` helper performs shallow immutable merges: `setData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }))`
- Top-level fields (`agreementNumber`, `agreementDate`) are updated via direct `setData` spread in JSX

## Key Abstractions

**AgreementData Interface:**
- Purpose: Single source of truth for all form data across the entire multi-page agreement
- File: `types.ts`
- Pattern: Flat top-level object with 13 nested sub-objects, each representing a logical section of the agreement (renter info, vehicle info, payment, insurance acknowledgments, signatures, vehicle condition, additional drivers)

**Section Component:**
- Purpose: Consistent visual wrapper for each numbered section of the legal agreement
- File: `components/Section.tsx`
- Pattern: Accepts `title`, `number`, `critical` (adds red left border), `noBreak` (CSS page-break avoidance), and `children`

**InputLine Component:**
- Purpose: Labeled text input styled as an underlined legal-form field
- File: `components/InputLine.tsx`
- Pattern: Controlled input with `value`/`onChange` props, optional `label`, `type`, `width`, `readOnly`, and `className` customization

**AcknowledgmentBox Component:**
- Purpose: Checkbox + legal acknowledgment text + initials capture for each critical agreement section
- File: `components/AcknowledgmentBox.tsx`
- Pattern: Composes `InitialsBox` internally; renders a gray background box with checkbox, bold text, and initials field

**SignaturePad Component:**
- Purpose: Canvas-based electronic signature capture with touch and mouse support
- File: `components/SignaturePad.tsx`
- Pattern: Two-mode component -- display mode (shows saved signature image or "Tap to Sign" placeholder) and editing mode (full canvas with draw/erase/save/cancel controls). Stores signature as PNG data URL string.

## Entry Points

**Browser Entry:**
- Location: `index.html`
- Triggers: Browser page load
- Responsibilities: Loads CDN dependencies (Tailwind CSS, html2pdf.js, Google Fonts), configures Tailwind theme (custom colors, fonts, print breakpoint), defines ES module import maps for React/lucide-react, includes all CSS (legal-input styles, print styles, force-desktop PDF styles), mounts `<div id="root">`, loads `index.tsx` as ES module

**React Entry:**
- Location: `index.tsx`
- Triggers: Module execution from `index.html` script tag
- Responsibilities: Creates React root on `#root` element, renders `<App />` inside `<React.StrictMode>`

**Application Root:**
- Location: `App.tsx`
- Triggers: React render from `index.tsx`
- Responsibilities: Initializes all form state with `initialData`, renders the entire multi-page agreement form (header, 11 sections, 2 addenda, fee schedule), provides print and PDF download controls

## Error Handling

**Strategy:** Minimal -- primarily `try/catch` around PDF generation

**Patterns:**
- PDF generation wraps `html2pdf` call in `try/catch` with `alert()` on failure and `console.error` for logging (`App.tsx` lines 93-124)
- PDF unavailability check: `if (!window.html2pdf || !element)` guard with user-facing `alert()` (`App.tsx` lines 87-91)
- React entry point throws if `#root` element is missing (`index.tsx` line 7)
- No form validation exists -- all fields accept any string input
- No error boundaries are implemented
- `@ts-ignore` is used twice in `App.tsx` (lines 87, 113) to suppress TypeScript errors for `window.html2pdf` which is loaded via CDN and has no type declarations

## Cross-Cutting Concerns

**Logging:** Console only -- `console.error` in the PDF generation catch block. No structured logging.

**Validation:** None. All form fields accept arbitrary string input. No required field enforcement, format validation, or submission validation exists.

**Authentication:** None. This is an open, client-side-only form with no user accounts or access control.

**Styling:** Tailwind CSS loaded from CDN with custom theme configuration in `index.html`. Custom colors: `forestGreen` (#1A472A), `gold` (#C5A059), `alertRed` (#8B1A1A), `charcoal` (#2C2C2C), `lightGray` (#F5F5F5). Custom fonts: Inter (sans), Lora (serif). All responsive behavior uses Tailwind `md:` prefix. Print and PDF styles are defined in `<style>` block in `index.html`.

**Responsive Design:** Mobile-first approach using Tailwind responsive prefixes (`md:`). PDF generation applies `force-desktop` CSS class to simulate desktop layout on mobile devices. Print media queries force two-column grid layouts.

---

*Architecture analysis: 2026-02-17*
