# Coding Conventions

**Analysis Date:** 2026-02-17

## Naming Patterns

**Files:**
- Components use PascalCase: `InputLine.tsx`, `Section.tsx`, `SignaturePad.tsx`, `AcknowledgmentBox.tsx`, `InitialsBox.tsx`
- Entry point and app root use PascalCase for component (`App.tsx`) and camelCase for bootstrap (`index.tsx`)
- Type definition files use camelCase: `types.ts`
- Config files use camelCase with dot separators: `vite.config.ts`, `tsconfig.json`

**Functions:**
- Use camelCase for all functions and handlers: `handlePrint`, `handleDownloadPDF`, `update`, `clearCanvas`, `saveSignature`
- Event handler naming pattern: `handle` prefix for top-level handlers in `App.tsx` (e.g., `handlePrint`, `handleDownloadPDF`)
- Callback props use `on` prefix: `onChange`, `onInitialsChange`
- Internal helpers use plain camelCase: `getPos`, `setCanvasSize`

**Variables:**
- camelCase for all variables: `isGeneratingPdf`, `componentRef`, `initialData`, `isEditing`, `isDrawing`
- Boolean variables use `is` prefix: `isGeneratingPdf`, `isEditing`, `isDrawing`
- Refs use `Ref` suffix: `componentRef`, `canvasRef`, `containerRef`

**Types:**
- Interfaces use PascalCase with `Props` suffix for component props: `InputLineProps`, `SectionProps`, `SignaturePadProps`, `InitialsBoxProps`, `AcknowledgmentBoxProps`
- Data types use PascalCase without suffix: `AgreementData`
- Union literal types used inline for constrained string values: `'day' | 'week' | 'month' | 'custom'`

## Code Style

**Formatting:**
- No formatter tool configured (no `.prettierrc`, no `biome.json`)
- 2-space indentation throughout all TypeScript/TSX files
- Single quotes for string literals in TypeScript
- Semicolons used at end of statements
- Trailing commas not consistently applied
- JSX attributes use double quotes for string values
- Multi-line JSX uses parentheses wrapping

**Linting:**
- No linter configured (no `.eslintrc`, no `eslint.config.*`)
- TypeScript strict mode is NOT enabled in `tsconfig.json`
- `@ts-ignore` used for global library access (`window.html2pdf`) in `App.tsx` lines 87, 113
- `any` type used explicitly in state updater function (`App.tsx` line 62, 66)

## Import Organization

**Order:**
1. React core imports: `import React, { useState, useRef } from 'react';`
2. Local component imports: `import { Section } from './components/Section';`
3. Local type imports: `import { AgreementData } from './types';`
4. Third-party library imports: `import { Printer, Download } from 'lucide-react';`

**Note:** The order is NOT strict -- in `App.tsx`, React comes first, then local components, then types, then lucide-react. In `SignaturePad.tsx`, React comes first then lucide-react directly. Follow the pattern of React first, then local, then third-party.

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json` and `vite.config.ts`)
- NOT currently used in any imports -- all imports use relative paths (`./components/Section`, `./types`)
- When adding new code, prefer relative paths for consistency with existing codebase

## Error Handling

**Patterns:**
- Guard clauses with early return: check for null refs before proceeding (`App.tsx` lines 84-91)
- Try/catch/finally for async operations: PDF generation wrapped in try/catch with cleanup in finally (`App.tsx` lines 93-123)
- User-facing errors shown via `alert()`: `alert("PDF generator is unavailable.")`, `alert("Failed to generate PDF.")`
- Console error logging for developer context: `console.error("PDF Generation failed:", err)`
- Guard against double-invocation with boolean flag: `if (isGeneratingPdf) return;` (`App.tsx` line 81)
- Null element check: `if (!rootElement) { throw new Error(...) }` (`index.tsx` line 6)

## Logging

**Framework:** `console` (browser native)

**Patterns:**
- `console.error()` for caught exceptions only (`App.tsx` line 115)
- No structured logging, no log levels beyond error
- No logging for state changes, user actions, or component lifecycle

## Comments

**When to Comment:**
- Block comments above distinct code sections within useEffect hooks: `// Setup Canvas Size and Context`, `// Handle Drawing Logic`
- Inline comments for non-obvious behavior: `// Critical for stopping scroll`, `// slight buffer to prevent layout thrashing`
- CSS section comments with `/* */` syntax in `index.html`: `/* Base Input Styles */`, `/* Print Styles */`, `/* PDF Generation Force-Desktop Styles */`
- Section markers in JSX using `{/* SECTION N */}` and `{/* ADDENDUM A */}` pattern

**JSDoc/TSDoc:**
- Not used anywhere in the codebase
- No function documentation beyond occasional inline comments

## Function Design

**Size:**
- Components range from single-return (~25 lines for `InputLine`) to large monolithic renders (~560 lines for `App`)
- `App.tsx` is a single large component containing ALL business logic and rendering (620 lines total)
- Helper components are small and focused (15-25 lines each for `InputLine`, `Section`, `InitialsBox`, `AcknowledgmentBox`)
- `SignaturePad.tsx` is the most complex component at ~210 lines with canvas drawing logic

**Parameters:**
- Components accept destructured props with defaults: `{ label, value, onChange, placeholder = "", type = "text", width = "w-full", className = "", readOnly = false }`
- Callback props pass transformed values (not raw events): `onChange={v => update('renter', 'fullName', v)}` where `v` is already the string value
- The `update` helper takes section key, field name, and value: `update(section: keyof AgreementData, field: string, value: any)`

**Return Values:**
- Components return JSX
- Event handlers return void
- `saveSignature` and `clearCanvas` return void, operating via refs

## Module Design

**Exports:**
- Components use named exports: `export const InputLine: React.FC<...>`
- Exception: `App.tsx` uses default export: `export default App;`
- Types use named exports: `export interface AgreementData`

**Barrel Files:**
- Not used. Each component is imported directly from its file path.

## Component Patterns

**State Management:**
- Single `useState<AgreementData>` in `App.tsx` holds ALL form state as one large object
- State updates use spread-based immutable pattern via the `update()` helper function
- Local component state (e.g., `isEditing` in `SignaturePad`) managed with individual `useState` hooks
- No external state management library (no Redux, Zustand, Jotai, etc.)

**Styling:**
- Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com">`) -- NOT installed as a dependency
- Tailwind config embedded in `index.html` `<script>` tag with custom colors and fonts
- Custom CSS classes defined in `index.html` `<style>` tag: `.legal-input`, `.force-desktop`, print styles
- Responsive design uses Tailwind `md:` breakpoint prefix pattern
- Print styles use `print:` prefix and `@media print` in custom CSS
- No CSS modules, no styled-components, no CSS-in-JS

**Props Pattern:**
- All component props are explicitly typed via interfaces defined in the same file as the component
- Optional props have default values in destructuring
- `children` prop typed as `React.ReactNode` (see `Section.tsx`)
- Components typed with `React.FC<PropsInterface>` pattern

**Ref Usage:**
- `useRef<HTMLDivElement>` for DOM measurement and class manipulation (`componentRef` in App)
- `useRef<HTMLCanvasElement>` for canvas 2D drawing context (`canvasRef` in SignaturePad)
- `useRef<HTMLDivElement>` for container width measurement (`containerRef` in SignaturePad)

---

*Convention analysis: 2026-02-17*
