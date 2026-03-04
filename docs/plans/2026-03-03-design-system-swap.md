# Design System Swap — Match Financing Agreement

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the investment agreement's design system with an exact copy of the financing agreement's luxury document aesthetic (Cormorant Garamond/Montserrat, luxury-ink/luxury-gold/luxury-bg palette) across all pages and components. Zero logic changes.

**Architecture:** Pure CSS/className token swap. Every `forest-green` becomes `luxury-ink`, every `gold` becomes `luxury-gold`, every `charcoal` merges into `luxury-ink`, every `light-gray` becomes `luxury-bg`. Font families swap from Inter/Lora to Montserrat/Cormorant Garamond. All component structure, state management, routing, and business logic remain untouched.

**Tech Stack:** React 19, Tailwind CSS 4, Vite 6 (unchanged — only styling tokens and classNames change)

---

### Task 1: Update Font Imports and CSS Theme Tokens

**Files:**
- Modify: `index.html`
- Modify: `src/main.css`

**Step 1: Update `index.html` — swap Google Fonts link**

Replace the existing font import lines (lines 7-9) with:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap" rel="stylesheet">
```

Update the `<body>` tag class from:
```html
<body class="bg-gray-100 text-charcoal font-serif">
```
to:
```html
<body class="bg-luxury-bg text-luxury-ink font-sans">
```

**Step 2: Update `src/main.css` — swap theme tokens and base styles**

Replace the font import (line 1) with:
```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');
```

Replace the `@theme` block (lines 4-13) with:
```css
@theme {
  --color-luxury-bg: #f5f2ed;
  --color-luxury-ink: #1a1a1a;
  --color-luxury-gold: #b89b5e;
  --color-luxury-gold-light: #dfcda3;
  --color-alert-red: #8B1A1A;

  --font-sans: "Montserrat", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Cormorant Garamond", ui-serif, Georgia, serif;
}
```

Add body styling after the @theme block:
```css
body {
  background-color: var(--color-luxury-bg);
  color: var(--color-luxury-ink);
  font-family: var(--font-sans);
}
```

Update `.legal-input:focus` border color from `#1A472A` to `var(--color-luxury-gold)`:
```css
.legal-input:focus {
  border-bottom-color: var(--color-luxury-gold);
}
```

Update `.force-desktop` signature line border from `2px solid #2C2C2C` to `2px solid #1a1a1a`.

**Step 3: Commit**

```bash
git add index.html src/main.css
git commit -m "style: swap design tokens to luxury palette (Montserrat/Cormorant Garamond, luxury-ink/gold/bg)"
```

---

### Task 2: Update Shared Components (Section, InputLine, InitialsBox, AcknowledgmentBox)

**Files:**
- Modify: `src/components/Section.tsx`
- Modify: `src/components/InputLine.tsx`
- Modify: `src/components/InitialsBox.tsx`
- Modify: `src/components/AcknowledgmentBox.tsx`

**Step 1: Update `Section.tsx`**

Replace all className references:
- `border-b-2 border-gold` → `border-b-2 border-luxury-ink`
- `text-forest-green` → `text-luxury-ink/50` (both the number and title spans)
- `tracking-tight` → `tracking-widest`
- `text-lg` → `text-[10px]` (for section labels to match financing agreement)
- `border-l-4 border-alert-red` stays as-is

The title bar div becomes:
```tsx
<div className="flex items-baseline border-b-2 border-luxury-ink mb-4 pb-1">
  {number && <span className="text-[10px] font-bold font-sans text-luxury-ink/50 mr-3 tracking-widest uppercase">{number}</span>}
  <h2 className="text-[10px] font-bold font-sans text-luxury-ink/50 uppercase tracking-widest">{title}</h2>
</div>
```

**Step 2: Update `InputLine.tsx`**

- Label: `text-forest-green` → `text-luxury-ink/50`
- Input: `text-charcoal` → `text-luxury-ink`, `placeholder-gray-300` → `placeholder-gray-300` (stays)

```tsx
{label && <label className="text-xs font-sans font-bold text-luxury-ink/50 uppercase tracking-wider mb-1">{label}</label>}
<input ... className="legal-input font-serif text-luxury-ink placeholder-gray-300 text-sm py-1 bg-transparent" />
```

**Step 3: Update `InitialsBox.tsx`**

- `text-forest-green` → `text-luxury-ink/50`
- `border-b-2 border-charcoal` → `border-b-2 border-luxury-ink`

**Step 4: Update `AcknowledgmentBox.tsx`**

- `bg-light-gray` → `bg-luxury-bg/30`
- `border border-gray-200` → `border border-luxury-ink/10`
- `text-forest-green focus:ring-forest-green` → `text-luxury-gold focus:ring-luxury-gold`
- `text-charcoal` → `text-luxury-ink`

**Step 5: Commit**

```bash
git add src/components/Section.tsx src/components/InputLine.tsx src/components/InitialsBox.tsx src/components/AcknowledgmentBox.tsx
git commit -m "style: update shared components to luxury design tokens"
```

---

### Task 3: Update SignaturePad Component

**Files:**
- Modify: `src/components/SignaturePad.tsx`

**Step 1: Apply color swaps throughout**

Editing mode:
- Label: `text-forest-green` → `text-luxury-ink/50`
- Canvas border: `border-2 border-forest-green` → `border-2 border-luxury-ink`
- Clear button: `hover:bg-alert-red` stays
- Cancel button: `bg-gray-200 text-charcoal` → `bg-gray-200 text-luxury-ink`
- Save button: `bg-forest-green text-white` → `bg-luxury-ink text-white`, `hover:bg-green-900` → `hover:opacity-90`

View mode:
- Label: `text-forest-green` → `text-luxury-ink/50`
- Signature border: `border-b-2 border-charcoal` → `border-b-2 border-luxury-ink`
- Edit button: `text-charcoal` stays (it's gray-200 bg)
- Placeholder button: `hover:border-forest-green` → `hover:border-luxury-gold`
- Placeholder icon/text: `group-hover:text-forest-green` → `group-hover:text-luxury-gold`

**Step 2: Commit**

```bash
git add src/components/SignaturePad.tsx
git commit -m "style: update SignaturePad to luxury design tokens"
```

---

### Task 4: Update WizardProgress Component

**Files:**
- Modify: `src/components/WizardProgress.tsx`

**Step 1: Apply color swaps**

- Mobile text: `text-forest-green` → `text-luxury-gold`
- Connector lines: `bg-forest-green` → `bg-luxury-gold`
- Step circles (completed): `bg-forest-green text-white` → `bg-luxury-gold text-white`
- Step circles (current): `bg-forest-green text-white ring-2 ring-forest-green ring-offset-2` → `bg-luxury-gold text-white ring-2 ring-luxury-gold ring-offset-2`
- Current label: `text-forest-green` → `text-luxury-gold`

**Step 2: Commit**

```bash
git add src/components/WizardProgress.tsx
git commit -m "style: update WizardProgress to luxury design tokens"
```

---

### Task 5: Update LinkShareModal Component

**Files:**
- Modify: `src/components/LinkShareModal.tsx`

**Step 1: Apply color swaps**

- Header icon: `text-forest-green` → `text-luxury-ink`
- Title: `text-forest-green` → `text-luxury-ink`
- Badge: `bg-gold text-white` → `bg-luxury-gold text-white`
- Label: `text-forest-green` → `text-luxury-ink/50`
- Copy button: `bg-forest-green text-white` → `bg-luxury-ink text-white`
- Generate button: `bg-forest-green` → `bg-luxury-ink`
- Footer done button: `bg-forest-green` → `bg-luxury-ink`
- QR fgColor: `#011c12` → `#1a1a1a`

**Step 2: Commit**

```bash
git add src/components/LinkShareModal.tsx
git commit -m "style: update LinkShareModal to luxury design tokens"
```

---

### Task 6: Update Client Wizard Steps (Personal, Employment, Emergency)

**Files:**
- Modify: `src/components/ClientPersonalStep.tsx`
- Modify: `src/components/ClientEmploymentStep.tsx`
- Modify: `src/components/ClientEmergencyStep.tsx`

**Step 1: Apply identical pattern to all three**

All three share the same card/form structure. For each:
- Card: `border border-gray-200` → `border border-luxury-ink/10`
- Header border: `border-b border-gray-100` → `border-b border-luxury-ink/10`
- Title: `text-forest-green` → `text-luxury-ink`
- Field labels: `text-charcoal` → `text-luxury-ink`
- Required asterisk: `text-alert-red` stays
- Input focus: `focus:ring-forest-green focus:border-forest-green` → `focus:ring-luxury-gold focus:border-luxury-gold`
- Error text: `text-alert-red` stays
- Footer: `bg-gray-50 border-t border-gray-100` → `bg-luxury-bg/30 border-t border-luxury-ink/10`
- Back button: `text-forest-green` → `text-luxury-ink`
- Continue button: `bg-forest-green` → `bg-luxury-ink`

**Step 2: Commit**

```bash
git add src/components/ClientPersonalStep.tsx src/components/ClientEmploymentStep.tsx src/components/ClientEmergencyStep.tsx
git commit -m "style: update client wizard form steps to luxury design tokens"
```

---

### Task 7: Update ClientSignStep Component

**Files:**
- Modify: `src/components/ClientSignStep.tsx`

**Step 1: Apply color swaps throughout**

Card/header:
- Card: `border border-gray-200` → `border border-luxury-ink/10`
- Header border: `border-b border-gray-100` → `border-b border-luxury-ink/10`
- Title: `text-forest-green` → `text-luxury-ink`
- Section headings: `text-charcoal` → `text-luxury-ink`

DrawCanvas (the one inside this file at line 160):
- `border-2 border-forest-green` → `border-2 border-luxury-ink`
- Clear button: `hover:text-alert-red` stays

Signature tabs:
- Active tab: `bg-forest-green text-white` → `bg-luxury-ink text-white`
- Inactive tab: `text-forest-green` → `text-luxury-ink`

Typed signature:
- `border-b-2 border-charcoal` → `border-b-2 border-luxury-ink`
- `text-charcoal` → `text-luxury-ink`
- Input focus: `focus:ring-forest-green focus:border-forest-green` → `focus:ring-luxury-gold focus:border-luxury-gold`
- Label: `text-charcoal` → `text-luxury-ink`

Acknowledgments:
- Checked: `border-forest-green bg-green-50` → `border-luxury-gold bg-luxury-bg/30`
- Checkbox accent: `accent-forest-green` → `accent-luxury-gold`
- Section label: `text-charcoal` → `text-luxury-ink`
- "Initialed" text: `text-forest-green` → `text-luxury-gold`

Footer:
- `bg-gray-50 border-t border-gray-100` → `bg-luxury-bg/30 border-t border-luxury-ink/10`
- Back: `text-forest-green` → `text-luxury-ink`
- Submit: `bg-forest-green` → `bg-luxury-ink`

**Step 2: Commit**

```bash
git add src/components/ClientSignStep.tsx
git commit -m "style: update ClientSignStep to luxury design tokens"
```

---

### Task 8: Update ClientReviewStep and ClientReviewSubmit

**Files:**
- Modify: `src/components/ClientReviewStep.tsx`
- Modify: `src/components/ClientReviewSubmit.tsx`

**Step 1: Update ClientReviewStep.tsx**

FieldRow:
- `border-b border-gray-100` → `border-b border-luxury-ink/10`
- `text-charcoal` → `text-luxury-ink`

SectionHeading:
- `text-forest-green` → `text-luxury-ink/50`
- `border-b border-forest-green/20` → `border-b border-luxury-ink/20`

Card:
- `border border-gray-200` → `border border-luxury-ink/10`
- Header border: `border-b border-gray-100` → `border-b border-luxury-ink/10`
- Title: `text-forest-green` → `text-luxury-ink`
- Footer: `bg-gray-50 border-t border-gray-100` → `bg-luxury-bg/30 border-t border-luxury-ink/10`
- CTA: `bg-forest-green` → `bg-luxury-ink`

**Step 2: Update ClientReviewSubmit.tsx**

ReviewRow:
- `text-charcoal` → `text-luxury-ink`

ReviewSection:
- `border border-gray-200` → `border border-luxury-ink/10`
- Header: `bg-gray-50 border-b border-gray-200` → `bg-luxury-bg/30 border-b border-luxury-ink/10`
- Title: `text-forest-green` → `text-luxury-ink/50`

Card:
- `border border-gray-200` → `border border-luxury-ink/10`
- Title: `text-forest-green` → `text-luxury-ink`
- Edit links: `text-forest-green` → `text-luxury-gold`
- Signature border: `border-b-2 border-charcoal` → `border-b-2 border-luxury-ink`
- `text-charcoal` → `text-luxury-ink` (signature text, acknowledged items)
- CheckCircle2: `text-forest-green` → `text-luxury-gold`
- Error retry: `text-forest-green` → `text-luxury-gold`
- Footer: `bg-gray-50 border-t border-gray-100` → `bg-luxury-bg/30 border-t border-luxury-ink/10`
- Back: `text-forest-green` → `text-luxury-ink`
- Submit: `bg-forest-green` → `bg-luxury-ink`

**Step 3: Commit**

```bash
git add src/components/ClientReviewStep.tsx src/components/ClientReviewSubmit.tsx
git commit -m "style: update review steps to luxury design tokens"
```

---

### Task 9: Update Admin Pages (AdminLayout, AdminLogin, AgreementList)

**Files:**
- Modify: `src/pages/AdminLayout.tsx`
- Modify: `src/pages/AdminLogin.tsx`
- Modify: `src/pages/AgreementList.tsx`

**Step 1: Update AdminLayout.tsx**

- `bg-light-gray` → `bg-luxury-bg`
- Nav: `bg-white border-b border-gray-200` → `bg-white border-b border-luxury-ink/10`
- Brand text: `text-forest-green` → `text-luxury-ink`
- Sign out: `hover:text-alert-red` stays

**Step 2: Update AdminLogin.tsx**

- Page bg: `bg-light-gray` → `bg-luxury-bg`
- Card border: `border-t-4 border-gold` → `border-t-4 border-luxury-gold`
- Title: `text-forest-green` → `text-luxury-ink`
- Subtitle: `text-charcoal` → `text-luxury-ink`
- Labels: `text-charcoal` → `text-luxury-ink`
- Input focus: `focus:ring-forest-green focus:border-forest-green` → `focus:ring-luxury-gold focus:border-luxury-gold`
- Error: `text-alert-red` stays
- Button: `bg-forest-green` → `bg-luxury-ink`, `hover:bg-green-900` → `hover:opacity-90`

**Step 3: Update AgreementList.tsx**

- Status colors: `bg-forest-green text-white` (completed) → `bg-luxury-ink text-white`
- Title: `text-forest-green` → `text-luxury-ink`
- "New Agreement" button: `bg-forest-green` → `bg-luxury-ink`
- Table header text: `text-forest-green` → `text-luxury-ink/50`
- Table borders: `border-b border-gray-200` → `border-b border-luxury-ink/10`
- Row hover: `hover:bg-gray-50` → `hover:bg-luxury-bg/30`
- Row borders: `border-b border-gray-100` → `border-b border-luxury-ink/10`
- Cell text: `text-charcoal` → `text-luxury-ink`
- Card: `bg-white rounded shadow` → `bg-white rounded-sm border border-luxury-ink/10`

**Step 4: Commit**

```bash
git add src/pages/AdminLayout.tsx src/pages/AdminLogin.tsx src/pages/AgreementList.tsx
git commit -m "style: update admin pages to luxury design tokens"
```

---

### Task 10: Update AgreementCreate and AgreementEdit Pages

**Files:**
- Modify: `src/pages/AgreementCreate.tsx`
- Modify: `src/pages/AgreementEdit.tsx`

**Step 1: Update AgreementCreate.tsx**

- Title: `text-forest-green` → `text-luxury-ink`
- Cards: `bg-white rounded shadow p-6 mb-6` → `bg-white rounded-sm border border-luxury-ink/10 p-6 mb-6`
- Inline labels: `text-forest-green` → `text-luxury-ink/50`
- Radio accent: `accent-forest-green` → `accent-luxury-gold`
- Radio text: `text-charcoal` → `text-luxury-ink`
- Select focus: `focus:border-forest-green` → `focus:border-luxury-gold`
- Select text: `text-charcoal` → `text-luxury-ink`
- Select border: `border-b border-gray-300` → `border-b border-luxury-ink/10`
- Error box: `border-alert-red text-alert-red` stays
- Save button: `bg-forest-green` → `bg-luxury-ink`
- Cancel link: `hover:text-charcoal` → `hover:text-luxury-ink`

**Step 2: Update AgreementEdit.tsx**

Same card/form patterns as AgreementCreate plus:
- Title: `text-forest-green` → `text-luxury-ink`
- Badge: `bg-gold text-white` → `bg-luxury-gold text-white`
- "Back" link: `text-forest-green` → `text-luxury-ink`
- Inline labels: `text-forest-green` → `text-luxury-ink/50`
- Radio: `accent-forest-green` → `accent-luxury-gold`
- Select: `focus:border-forest-green` → `focus:border-luxury-gold`, `text-charcoal` → `text-luxury-ink`
- All cards: `bg-white rounded shadow` → `bg-white rounded-sm border border-luxury-ink/10`
- Save button: `bg-forest-green` → `bg-luxury-ink`
- Share button inline style `backgroundColor: '#D4AF37'` → `backgroundColor: '#b89b5e'`
- Client info section: `bg-forest-green` → `text-luxury-ink` for headings
- Activity log dot: `bg-forest-green` → `bg-luxury-gold`
- Activity text: `text-charcoal` → `text-luxury-ink`
- CheckCircle2 icons: `text-forest-green` → `text-luxury-gold`
- Signature border: `border-b-2 border-charcoal` → `border-b-2 border-luxury-ink`
- ReadOnlyField label `text-gray-500` → stays (secondary info styling)

**Step 3: Commit**

```bash
git add src/pages/AgreementCreate.tsx src/pages/AgreementEdit.tsx
git commit -m "style: update agreement admin pages to luxury design tokens"
```

---

### Task 11: Update Client Sign Pages (ClientSign, ClientSignComplete, ExpiredPage)

**Files:**
- Modify: `src/pages/ClientSign.tsx`
- Modify: `src/pages/ClientSignComplete.tsx`
- Modify: `src/pages/ExpiredPage.tsx`

**Step 1: Update ClientSign.tsx**

Loading state:
- `bg-light-gray` → `bg-luxury-bg`
- `text-gold` → `text-luxury-gold`
- `text-forest-green` → `text-luxury-ink`
- Spinner: `border-forest-green border-t-transparent` → `border-luxury-gold border-t-transparent`

Error state:
- `bg-light-gray` → `bg-luxury-bg`
- `text-gold` → `text-luxury-gold`
- `text-forest-green` → `text-luxury-ink`
- Card: `border border-gray-200` → `border border-luxury-ink/10`
- `text-charcoal` → `text-luxury-ink`
- Button: `bg-forest-green` → `bg-luxury-ink`

Main layout:
- `bg-light-gray` → `bg-luxury-bg`
- Header: `border-b border-gray-200` → `border-b border-luxury-ink/10`
- `text-gold` → `text-luxury-gold`
- `text-forest-green` → `text-luxury-ink`

**Step 2: Update ClientSignComplete.tsx**

- `bg-light-gray` → `bg-luxury-bg`
- Header: `border-b border-gray-200` → `border-b border-luxury-ink/10`
- `text-gold` → `text-luxury-gold`
- `text-forest-green` → `text-luxury-ink`
- Card: `border border-gray-200` → `border border-luxury-ink/10`
- CircleCheck: `text-forest-green` → `text-luxury-gold`
- Title: `text-forest-green` → `text-luxury-ink`
- Contact link: `text-forest-green` → `text-luxury-gold`

**Step 3: Update ExpiredPage.tsx**

- Page bg: `bg-gray-50` → `bg-luxury-bg`
- Brand circle: `bg-forest-green` → `bg-luxury-ink`
- `text-gold` → `text-luxury-gold`
- Card: `border border-gray-100` → `border border-luxury-ink/10`
- Title: `text-forest-green` → `text-luxury-ink`
- Contact link: `text-forest-green` → `text-luxury-gold`

**Step 4: Commit**

```bash
git add src/pages/ClientSign.tsx src/pages/ClientSignComplete.tsx src/pages/ExpiredPage.tsx
git commit -m "style: update client-facing pages to luxury design tokens"
```

---

### Task 12: Verify Build and Visual Check

**Step 1: Run build to catch any broken class references**

Run: `npm run build`
Expected: Clean build with no errors

**Step 2: Run dev server for visual check**

Run: `npm run dev`
Expected: App loads with cream background, Montserrat/Cormorant Garamond fonts, luxury-ink/luxury-gold color scheme throughout

**Step 3: Verify no remaining old token references**

Search codebase for any remaining references to old tokens:
- `forest-green` — should return 0 results in src/
- `text-charcoal` — should return 0 results in src/
- `bg-light-gray` — should return 0 results in src/
- `border-gold` (as Tailwind class, not `luxury-gold`) — should return 0 results in src/
- `'Inter'` or `'Lora'` — should return 0 results in src/

**Step 4: Final commit if any stragglers found**

```bash
git add -A
git commit -m "style: clean up any remaining old design token references"
```
