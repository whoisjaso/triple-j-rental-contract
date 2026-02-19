---
phase: 01-backend-foundation
plan: 01
subsystem: build-tooling
tags: [tailwindcss-v4, vite, project-structure, dependencies]

dependency-graph:
  requires: []
  provides:
    - src/ directory structure
    - Tailwind CSS v4 build-time pipeline
    - Phase 1 dependency tree (react-router, supabase-js, zustand)
    - @/ path alias pointing to src/
  affects:
    - 01-02 (Supabase schema -- needs src/lib/ directory)
    - 01-03 (Auth + routing -- needs react-router, src/pages/)
    - 01-04 (State management -- needs zustand, src/stores/)

tech-stack:
  added:
    - react-router (routing)
    - "@supabase/supabase-js" (database client)
    - zustand (state management)
    - tailwindcss (v4, build-time CSS)
    - "@tailwindcss/vite" (Vite plugin for Tailwind v4)
    - supabase (CLI, devDependency)
  patterns:
    - CSS-first Tailwind v4 config via @theme in src/main.css
    - Kebab-case custom color utilities (forest-green, alert-red, light-gray)
    - Vite path alias @/ -> src/

key-files:
  created:
    - src/main.css
    - src/pages/ (empty directory)
    - src/stores/ (empty directory)
  modified:
    - package.json (new dependencies)
    - package-lock.json (lockfile)
    - tsconfig.json (path alias, vite/client types)
    - vite.config.ts (tailwindcss plugin, removed define block, updated alias)
    - index.html (stripped CDN scripts, importmap, inline styles)
    - src/index.tsx (added CSS import)
    - src/App.tsx (moved + color class migration + JSX arrow fix)
    - src/components/InputLine.tsx (moved + color class migration)
    - src/components/Section.tsx (moved + color class migration)
    - src/components/InitialsBox.tsx (moved + color class migration)
    - src/components/AcknowledgmentBox.tsx (moved + color class migration)
    - src/components/SignaturePad.tsx (moved + color class migration)
  relocated:
    - App.tsx -> src/App.tsx
    - index.tsx -> src/index.tsx
    - types.ts -> src/types.ts
    - components/*.tsx -> src/components/*.tsx

decisions:
  - id: D-0101-1
    decision: "Added vite/client to tsconfig types array"
    reason: "Pre-existing src/lib/supabase.ts uses import.meta.env which requires Vite type definitions"
    impact: "Enables TypeScript to understand Vite-specific APIs across the project"

metrics:
  tasks: 2/2
  completed: 2026-02-18
---

# Phase 01 Plan 01: Project Restructure + Tailwind v4 Migration Summary

**One-liner:** Relocated all source to src/, installed Phase 1 deps (react-router, supabase-js, zustand), and migrated Tailwind from CDN play mode to @tailwindcss/vite v4 build with CSS-first @theme config.

## What Was Done

### Task 1: Install Dependencies and Create src/ Directory Structure
- Installed 6 packages: react-router, @supabase/supabase-js, zustand, tailwindcss, @tailwindcss/vite, supabase (CLI)
- Created src/ with subdirectories: components/, pages/, lib/, stores/
- Moved all source files (App.tsx, index.tsx, types.ts, 5 component files) into src/ via git mv
- Updated tsconfig.json path alias from `./*` to `./src/*`
- Added `vite/client` to tsconfig types for import.meta.env support

### Task 2: Migrate Tailwind CSS from CDN to @tailwindcss/vite v4
- Created src/main.css with `@import "tailwindcss"` and @theme block defining 5 custom colors and 2 font families
- Moved all inline styles from index.html (legal-input, print, force-desktop, signature-pad) into src/main.css
- Updated vite.config.ts: added tailwindcss() plugin, removed GEMINI_API_KEY define block, updated @/ alias to src/
- Stripped index.html of: CDN script tag, html2pdf CDN, importmap block, inline tailwind.config, inline style block, index.css link
- Updated index.html script src from `/index.tsx` to `/src/index.tsx`
- Added `import './main.css'` to src/index.tsx
- Migrated all camelCase custom color classes to kebab-case across 7 files:
  - forestGreen -> forest-green (text-, bg-, border-, hover:bg-, focus:ring-)
  - alertRed -> alert-red (text-, border-, hover:bg-)
  - lightGray -> light-gray (bg-)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed JSX parse error with `->` arrows in dispute resolution text**
- **Found during:** Task 1 (tsc --noEmit verification)
- **Issue:** Line 465 of App.tsx contained literal `->` characters in JSX text content, which TypeScript interprets as JSX syntax
- **Fix:** Replaced `->` with `&rarr;` HTML entity
- **Files modified:** src/App.tsx
- **Commit:** e0d9a39

**2. [Rule 3 - Blocking] Added vite/client types to tsconfig.json**
- **Found during:** Task 1 (tsc --noEmit verification)
- **Issue:** Pre-existing src/lib/supabase.ts uses `import.meta.env` which requires Vite type definitions. TypeScript reported "Property 'env' does not exist on type 'ImportMeta'"
- **Fix:** Added `"vite/client"` to the `types` array in tsconfig.json
- **Files modified:** tsconfig.json
- **Commit:** e0d9a39

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` | Pass -- builds in ~4s, 26KB CSS + 240KB JS |
| `npx tsc --noEmit` | Pass -- zero type errors |
| 5 components in src/components/ | Pass |
| src/main.css has @import + @theme | Pass |
| No CDN script tags in index.html | Pass |
| Zero camelCase color references | Pass |

## Commits

| Hash | Message |
|------|---------|
| e0d9a39 | feat(01-01): install deps and restructure source into src/ |
| 22109e7 | feat(01-01): migrate Tailwind CSS from CDN to @tailwindcss/vite v4 |

## Next Plan Readiness

Plan 01-02 (Supabase Schema) is unblocked:
- src/lib/ directory exists (already contains database.types.ts and supabase.ts from prior planning)
- @supabase/supabase-js is installed
- supabase CLI is installed as devDependency
- TypeScript compiles clean with vite/client types
