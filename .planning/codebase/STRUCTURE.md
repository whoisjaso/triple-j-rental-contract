# Codebase Structure

**Analysis Date:** 2026-02-17

## Directory Layout

```
triple-j-auto-investment-agreement/
├── components/                # Reusable React UI components
│   ├── AcknowledgmentBox.tsx  # Legal acknowledgment checkbox + initials
│   ├── InitialsBox.tsx        # Small initials text input
│   ├── InputLine.tsx          # Labeled underline-style form input
│   ├── Section.tsx            # Numbered agreement section wrapper
│   └── SignaturePad.tsx       # Canvas-based signature capture
├── .planning/                 # Planning and analysis documents (not app code)
│   └── codebase/              # Codebase mapping documents
├── App.tsx                    # Root component: all state, layout, and logic
├── index.tsx                  # React DOM entry point
├── index.html                 # HTML shell, CDN deps, Tailwind config, all CSS
├── types.ts                   # TypeScript interface for AgreementData
├── metadata.json              # AI Studio app metadata
├── package.json               # NPM dependencies and scripts
├── tsconfig.json              # TypeScript compiler configuration
├── vite.config.ts             # Vite dev server and build config
├── .env.local                 # Environment variables (GEMINI_API_KEY placeholder)
├── .gitignore                 # Git ignore rules
└── README.md                  # Setup instructions
```

## Directory Purposes

**`components/`:**
- Purpose: Houses all reusable presentational React components for the agreement form
- Contains: 5 `.tsx` files, each exporting a single named React functional component
- Key files:
  - `components/InputLine.tsx`: The most-used component -- renders labeled underline-style text inputs throughout the form
  - `components/SignaturePad.tsx`: Most complex component -- handles canvas drawing, touch events, data URL export, and two display modes (editing vs. saved)
  - `components/Section.tsx`: Layout wrapper applied to every numbered section of the agreement
  - `components/AcknowledgmentBox.tsx`: Combines checkbox, legal text, and `InitialsBox` for section-level acknowledgments
  - `components/InitialsBox.tsx`: Minimal initials input, used standalone and within `AcknowledgmentBox`

**Root directory (`/`):**
- Purpose: Contains the application entry points, root component, type definitions, and all configuration
- Contains: Application source files (`.tsx`, `.ts`), configuration files (`.json`, `.ts`), HTML shell, environment config
- Key files:
  - `App.tsx`: The entire application in one file -- 621 lines containing all form state, update logic, PDF/print handlers, and JSX layout for the full multi-page agreement
  - `types.ts`: Single `AgreementData` interface definition (104 lines) used by `App.tsx`
  - `index.tsx`: Minimal React bootstrapping (15 lines)
  - `index.html`: Critical file -- contains Tailwind CDN config, html2pdf.js CDN, Google Fonts, ES module import maps, and all custom CSS including print and PDF generation styles (171 lines)

## Key File Locations

**Entry Points:**
- `index.html`: Browser entry -- loads all CDN dependencies, defines Tailwind theme and CSS, mounts React app
- `index.tsx`: React entry -- creates root and renders `<App />` in StrictMode
- `App.tsx`: Application root -- all state initialization, form rendering, print/PDF logic

**Configuration:**
- `package.json`: Dependencies (react 19, lucide-react) and scripts (dev, build, preview)
- `tsconfig.json`: TypeScript config -- ES2022 target, bundler module resolution, `@/*` path alias mapped to root
- `vite.config.ts`: Vite config -- port 3000, `@vitejs/plugin-react`, `@` path alias, exposes `GEMINI_API_KEY` env var
- `.env.local`: Environment variables -- `GEMINI_API_KEY` placeholder (currently unused in app logic)
- `metadata.json`: AI Studio app metadata (name, description, permissions)

**Core Logic:**
- `App.tsx`: All application state management, the `update()` helper function, `handlePrint()`, `handleDownloadPDF()`, and the complete JSX tree for all 11 sections + 2 addenda + fee schedule
- `types.ts`: `AgreementData` interface -- the central type definition that shapes all form data

**Styling:**
- `index.html` (lines 34-154): All custom CSS lives here -- `.legal-input` base styles, `@media print` rules, `.force-desktop` PDF generation overrides
- `index.html` (lines 13-32): Tailwind theme extension -- custom colors, fonts, print screen breakpoint

**Testing:**
- No test files exist in the codebase
- No test framework is configured

## Naming Conventions

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `InputLine.tsx`, `SignaturePad.tsx`)
- Entry points: lowercase (e.g., `index.tsx`, `index.html`)
- Type definitions: lowercase (e.g., `types.ts`)
- Config files: lowercase with dots (e.g., `vite.config.ts`, `tsconfig.json`)
- Root app component: PascalCase (`App.tsx`)

**Directories:**
- All lowercase: `components/`

**Components:**
- Named exports matching filename: `export const InputLine` in `InputLine.tsx`
- Default export only for `App` component in `App.tsx`
- All components are `React.FC<Props>` with explicit interface definitions
- Interface names: Component name + `Props` suffix (e.g., `InputLineProps`, `SectionProps`, `SignaturePadProps`)

**State Fields:**
- camelCase throughout `AgreementData` interface (e.g., `yearMakeModel`, `dlNumber`, `acknowledgmentInitials`)
- Additional driver fields use abbreviated prefixes: `d1Name`, `d2Dob`, `d1Dl`
- Section keys in state match logical agreement sections: `renter`, `vehicle`, `rentalTerm`, `payment`, `insurance`, `gps`, `geo`, `recovery`, `options`, `signatures`, `condition`, `additionalDrivers`

## Where to Add New Code

**New Form Section:**
- Add section type definition to `types.ts` inside the `AgreementData` interface
- Add initial data for the section in the `initialData` constant in `App.tsx` (line 10)
- Add JSX for the section in `App.tsx` using `<Section>` wrapper with appropriate `number` and `title`
- Use `update('sectionKey', 'fieldName', value)` pattern for all field onChange handlers
- Place `<div className="page-break"></div>` before the section if it should start a new page in print/PDF

**New Reusable Component:**
- Create a new `.tsx` file in `components/`
- Use PascalCase filename matching the component name
- Define a `ComponentNameProps` interface
- Export as a named export: `export const ComponentName: React.FC<ComponentNameProps>`
- Import in `App.tsx` with: `import { ComponentName } from './components/ComponentName'`

**New Form Input Type:**
- If it is a variation of text input: extend `InputLine.tsx` props or create a new component in `components/`
- If it is a new interactive element (like `SignaturePad`): create a new component in `components/` following the controlled component pattern (`value`/`onChange` props)

**New Utility Function:**
- Currently no utilities directory exists
- For form-related utilities (validation, formatting, calculation): create `utils.ts` in the root directory
- For multiple utilities: create a `utils/` directory with individual files

**New Page/Route:**
- Not applicable -- this is a single-page form application with no router
- If routing is needed in the future: install `react-router-dom`, create a `pages/` directory

**New CSS/Styles:**
- All CSS currently lives in `index.html` `<style>` block (lines 34-154)
- Add new print-related styles under `@media print` (line 55)
- Add new PDF generation styles under `.force-desktop` selectors (line 82)
- Add new base styles alongside `.legal-input` (line 41)
- For Tailwind theme extensions (colors, fonts): modify the `tailwind.config` object in `index.html` (line 13)

## Special Directories

**`components/`:**
- Purpose: All reusable React presentational components
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: Codebase analysis and planning documents
- Generated: By analysis tooling
- Committed: At user discretion

**`node_modules/`:**
- Purpose: Installed NPM packages
- Generated: Yes (via `npm install`)
- Committed: No (in `.gitignore`)

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes (via `npm run build`)
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-02-17*
