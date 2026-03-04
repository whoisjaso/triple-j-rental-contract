# Design System Swap — Investment Agreement matches Financing Agreement

## Goal
Exact visual copy of the financing agreement's design system applied to the investment agreement app. Zero logic changes. Frontend-only.

## Source of Truth
`d:\triple-j-financing-agreement-main\triple-j-financing-agreement-main\src\`

## Design Tokens to Copy Exactly

### Fonts
- Sans: `Montserrat` (300, 400, 500, 600 weights + italic)
- Serif: `Cormorant Garamond` (300, 400, 500, 600, 700 weights + italic)
- Remove: Inter, Lora, Dancing Script

### Colors
- `--color-luxury-bg: #f5f2ed`
- `--color-luxury-ink: #1a1a1a`
- `--color-luxury-gold: #b89b5e`
- `--color-luxury-gold-light: #dfcda3`
- Remove: forest-green, gold, charcoal, light-gray (replace all references)
- Keep: alert-red (#8B1A1A) for warnings

### Body
- `background-color: var(--color-luxury-bg)`
- `color: var(--color-luxury-ink)`
- `font-family: var(--font-sans)` (Montserrat)

## Component Styling — Exact Copy from Financing Agreement

### Section headers
- `text-[10px] font-bold tracking-widest uppercase text-luxury-ink/50`
- Border: `border-b-2 border-luxury-ink`

### Input fields
- Labels: `text-[10px] font-bold tracking-widest uppercase text-luxury-ink/50`
- Input text: `font-serif text-luxury-ink text-sm`
- Focus: `border-bottom-color: var(--color-luxury-gold)`

### Cards/containers
- `border border-luxury-ink/10 rounded-sm bg-luxury-bg/30`
- No heavy shadows

### Buttons
- Primary: `bg-luxury-ink text-white`
- Hover: `opacity-90`
- Accent/active: luxury-gold

### Acknowledgment boxes
- `bg-luxury-bg/30 border border-luxury-ink/10 rounded-sm`
- Checkbox: `text-luxury-gold focus:ring-luxury-gold`

### Signature areas
- Active canvas border: `border-2 border-luxury-ink`
- Save button: `bg-luxury-ink text-white`
- Labels: `text-[10px] tracking-widest uppercase text-luxury-ink/50`

### Tables
- Header: `border-y border-luxury-ink/20 bg-luxury-bg/50`
- Cells: `p-3 text-sm`
- Row borders: `border-b border-luxury-ink/10`

### Typography hierarchy (exact from financing)
- H1: `text-4xl font-serif font-bold uppercase tracking-widest`
- H2: `text-2xl font-serif font-semibold`
- H3/Labels: `text-[10px] font-bold tracking-widest uppercase text-luxury-ink/50`
- Body: `text-sm font-sans`
- Small/legal: `text-[10px] or text-[11px]`

## Print/PDF Styles
- `.legal-input:focus` border → luxury-gold
- `.force-desktop` signature line → `2px solid #1a1a1a`
- All color refs updated to luxury palette
- Page background stays white for document

## Scope
- All files in `src/components/`, `src/pages/`, `src/main.css`, `index.html`
- NO changes to: stores, lib/, types, router, API calls, form validation, business logic
