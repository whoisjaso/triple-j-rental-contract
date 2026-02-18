# Technology Stack

**Analysis Date:** 2026-02-17

## Languages

**Primary:**
- TypeScript ~5.8.2 - All application code (`.tsx` and `.ts` files)

**Secondary:**
- HTML - Single entry point `index.html` with inline Tailwind config and CSS
- CSS - Inline styles in `index.html` (`<style>` block); no separate CSS files exist despite `index.html` referencing `/index.css` (missing file)

## Runtime

**Environment:**
- Node.js (version not pinned; no `.nvmrc` or `engines` field)
- Browser-based SPA (client-side only, no server runtime)

**Package Manager:**
- npm (implied by `package.json` scripts; no `yarn.lock`, `pnpm-lock.yaml`, or `package-lock.json` present)
- Lockfile: **missing** - no lockfile committed to the repository

## Frameworks

**Core:**
- React 19.2.4 - UI framework, functional components with hooks (`useState`, `useRef`, `useEffect`)
- ReactDOM 19.2.4 - DOM rendering via `createRoot` API

**Testing:**
- Not detected - no test framework, test config, or test files exist

**Build/Dev:**
- Vite 6.2.0 - Dev server and production bundler
- `@vitejs/plugin-react` 5.0.0 - React JSX transform for Vite

## Key Dependencies

**Critical:**
- `react` ^19.2.4 - Core UI framework, all components are React functional components
- `react-dom` ^19.2.4 - DOM rendering, entry point at `index.tsx`
- `lucide-react` ^0.574.0 - Icon library used for UI icons (Printer, Download, Eraser, Check, X, PenTool)

**Infrastructure:**
- `typescript` ~5.8.2 - Type checking, configured in `tsconfig.json`
- `vite` ^6.2.0 - Build tooling and dev server
- `@vitejs/plugin-react` ^5.0.0 - Vite React integration
- `@types/node` ^22.14.0 - Node.js type definitions (for `path` module in `vite.config.ts`)

**CDN Dependencies (loaded via `index.html`, NOT in package.json):**
- Tailwind CSS - loaded via CDN script tag `https://cdn.tailwindcss.com` with inline config
- html2pdf.js 0.10.1 - PDF generation, loaded via CDN `https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js`
- Google Fonts (Inter, Lora) - loaded via Google Fonts CDN

**Import Map (in `index.html` for non-bundled mode):**
- `react` and `react-dom` mapped to `esm.sh` CDN (`^19.2.4`)
- `lucide-react` mapped to `esm.sh` CDN (`^0.574.0`)

## Configuration

**TypeScript (`tsconfig.json`):**
- Target: ES2022
- Module: ESNext with bundler resolution
- JSX: react-jsx
- Path alias: `@/*` maps to project root (`./`)
- `experimentalDecorators: true` (enabled but not used)
- `noEmit: true` - type checking only, Vite handles compilation
- `allowImportingTsExtensions: true` - allows `.ts`/`.tsx` in imports

**Vite (`vite.config.ts`):**
- Dev server: port 3000, host `0.0.0.0`
- Plugins: `@vitejs/plugin-react`
- Env loading: reads `.env.local` via `loadEnv()`, exposes `GEMINI_API_KEY` as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`
- Path alias: `@` resolves to project root

**Tailwind CSS (inline in `index.html`):**
- Custom colors: `forestGreen` (#1A472A), `gold` (#C5A059), `alertRed` (#8B1A1A), `charcoal` (#2C2C2C), `lightGray` (#F5F5F5)
- Custom fonts: `sans` (Inter), `serif` (Lora)
- Custom screen: `print` media query
- Loaded via CDN play mode (`https://cdn.tailwindcss.com`), NOT as a build dependency

**Environment (`.env.local`):**
- `GEMINI_API_KEY` - Google Gemini API key (placeholder value committed)

## Build & Run Commands

```bash
npm run dev       # Start Vite dev server on port 3000
npm run build     # Production build via Vite (outputs to dist/)
npm run preview   # Preview production build locally
```

## Platform Requirements

**Development:**
- Node.js (no specific version pinned)
- npm package manager
- Internet access required (CDN dependencies for Tailwind, html2pdf.js, Google Fonts, esm.sh import maps)

**Production:**
- Static file hosting (SPA output from `vite build`)
- No server-side runtime needed
- CDN availability required for Tailwind CSS, html2pdf.js, and Google Fonts

## Project Origin

- Generated from Google AI Studio (`metadata.json` references AI Studio app)
- README links to: `https://ai.studio/apps/drive/1PUeyzF1cavQrY9TKfs3LU5AVBnMiN8Nl`

---

*Stack analysis: 2026-02-17*
