# iOS-Style UI Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the app feel crisp, clean, and buttery smooth with Apple/iOS aesthetics — floating cards, spring physics, smooth scrolling, polished micro-interactions.

**Architecture:** CSS-only approach. Add global smoothing properties, a reusable `.card-float` shadow class, spring-eased button transitions, smooth input focus glow, and scroll-to-top on wizard step changes. Zero new dependencies.

**Tech Stack:** Tailwind CSS 4, CSS custom utilities, vanilla JS `scrollTo`

---

### Task 1: Global Smoothness — html/body Polish

**Files:**
- Modify: `src/main.css:15-22`

**Step 1: Add global smoothing properties**

Add to the existing `body` rule and add a new `html` rule in `src/main.css`. Insert BEFORE the `body` block (after the `@theme` closing brace on line 13):

```css
/* Buttery-smooth scrolling & tap behavior */
html {
  scroll-behavior: smooth;
}
```

Then update the existing `body` block (lines 16-22) to add font smoothing and tap highlight removal:

```css
body {
  background-color: var(--color-luxury-bg);
  color: var(--color-luxury-ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: transparent;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/main.css
git commit -m "style: add global smooth scrolling and font smoothing"
```

---

### Task 2: Floating Card Shadow Utility

**Files:**
- Modify: `src/main.css` (add new utility after animations section, around line 52)

**Step 1: Add `.card-float` class and hover variant**

Insert after the animation delay utilities (after line 52) and before the button styles:

```css
/* ─── iOS-style Floating Cards ─── */
.card-float {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.06),
    0 12px 32px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-float-hover:hover {
  transform: translateY(-1px);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 16px 40px rgba(0, 0, 0, 0.06);
}
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/main.css
git commit -m "style: add iOS floating card shadow utility"
```

---

### Task 3: Replace shadow-sm with card-float on Card Containers

**Files:**
- Modify: `src/components/ClientPersonalStep.tsx:118` — replace `shadow-sm` with `card-float`
- Modify: `src/components/ClientEmploymentStep.tsx:43` — replace `shadow-sm` with `card-float`
- Modify: `src/components/ClientEmergencyStep.tsx:60` — replace `shadow-sm` with `card-float`
- Modify: `src/components/ClientReviewStep.tsx:42` — replace `shadow-sm` with `card-float`
- Modify: `src/components/ClientSignStep.tsx:284` — replace `shadow-sm` with `card-float`
- Modify: `src/components/ClientReviewSubmit.tsx:172` — replace `shadow-sm` with `card-float`
- Modify: `src/pages/ClientSign.tsx:152` — replace `shadow-sm` with `card-float` (error card)
- Modify: `src/pages/ClientSign.tsx:170` — header: replace `shadow-sm` with `card-float`
- Modify: `src/pages/ClientSignComplete.tsx:12` — header: replace `shadow-sm` with `card-float`
- Modify: `src/pages/ClientSignComplete.tsx:19` — success card: replace `shadow-sm` with `card-float`
- Modify: `src/pages/ExpiredPage.tsx:9` — expired card: replace `shadow-sm` with `card-float`

**Step 1: In each file listed above, find `shadow-sm` on the main card container divs and replace with `card-float`**

Do NOT replace `shadow-sm` on these (they should stay small):
- `src/components/ClientSignStep.tsx:160` — signature canvas border (keep `shadow-sm`)
- `src/components/ClientSignStep.tsx:177` — eraser button (keep `shadow-sm`)
- `src/components/LinkShareModal.tsx:170` — QR code container (keep `shadow-sm`)
- `src/components/SignaturePad.tsx:149` — eraser button (keep `shadow-sm`)
- `src/components/SignaturePad.tsx:188` — edit button (keep `shadow-sm`)

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ClientPersonalStep.tsx src/components/ClientEmploymentStep.tsx src/components/ClientEmergencyStep.tsx src/components/ClientReviewStep.tsx src/components/ClientSignStep.tsx src/components/ClientReviewSubmit.tsx src/pages/ClientSign.tsx src/pages/ClientSignComplete.tsx src/pages/ExpiredPage.tsx
git commit -m "style: upgrade card shadows to iOS floating effect"
```

---

### Task 4: Input Focus Glow

**Files:**
- Modify: `src/main.css` (add after `.legal-input:focus` block)

**Step 1: Add smooth input focus utility**

Add right after the `.legal-input:focus` block (around line 163):

```css
/* ─── Smooth Input Focus (client forms) ─── */
.input-smooth {
  transition: border-color 0.2s ease,
              box-shadow 0.2s ease;
}
.input-smooth:focus {
  box-shadow:
    0 0 0 3px rgba(184, 155, 94, 0.15),
    0 1px 2px rgba(0, 0, 0, 0.05);
}
```

**Step 2: Apply `.input-smooth` to the input class constants in client form components**

In `src/components/ClientPersonalStep.tsx`, find the `inputClassName` constant (line 64) and the `selectClassName` constant (line 65). Append ` input-smooth` to each string:

```typescript
const inputClassName = "w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors placeholder:text-gray-400 input-smooth"
const selectClassName = "w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors bg-white input-smooth"
```

Also find the `Field` component's input className (line 55) and append ` input-smooth`:

```
className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors placeholder:text-gray-400 input-smooth"
```

Apply same to all client form inputs:
- `src/components/ClientEmploymentStep.tsx` — all 3 input classNames (lines 65, 85, 105)
- `src/components/ClientEmergencyStep.tsx` — all input/select classNames (lines 82, 102, 117, 141)
- `src/components/ClientSignStep.tsx` — typed signature input className (line 349)

**Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/main.css src/components/ClientPersonalStep.tsx src/components/ClientEmploymentStep.tsx src/components/ClientEmergencyStep.tsx src/components/ClientSignStep.tsx
git commit -m "style: add smooth gold glow on input focus"
```

---

### Task 5: Button Spring Physics

**Files:**
- Modify: `src/main.css` — update `.btn-primary` and `.btn-secondary` transition curves

**Step 1: Update button transition timing**

In `.btn-primary` (line 70), change the transition line:
```css
/* Old: */ transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
/* New: */ transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
```

In `.btn-secondary` (line 102), change:
```css
/* Old: */ transition: all 0.2s ease-out;
/* New: */ transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
```

In `.btn-dark` (line 132), change:
```css
/* Old: */ transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
/* New: */ transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
```

This gives all buttons a subtle spring overshoot on hover lift — they'll bounce up slightly past -2px then settle, creating that alive iOS feel.

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/main.css
git commit -m "style: add spring physics to button hover transitions"
```

---

### Task 6: Wizard Progress Bar Transitions

**Files:**
- Modify: `src/components/WizardProgress.tsx`

**Step 1: Add transition classes to step circles and connector lines**

Find the connector line divs (lines 29-33 and 65-69). Add `transition-all duration-300` to each:

Line ~30: Change from:
```tsx
className={`flex-1 h-0.5 ${
  isCompleted || isCurrent ? 'bg-luxury-gold' : 'bg-gray-300'
}`}
```
To:
```tsx
className={`flex-1 h-0.5 transition-all duration-300 ${
  isCompleted || isCurrent ? 'bg-luxury-gold' : 'bg-gray-300'
}`}
```

Same for the right connector (line ~66).

Find the step circle div (lines 37-45). Add `transition-all duration-300` to the className:

```tsx
className={`
  flex-shrink-0 flex items-center justify-center rounded-full font-bold text-sm transition-all duration-300
  ${isCompleted
    ? 'w-8 h-8 bg-luxury-gold text-white'
    : isCurrent
    ? 'w-9 h-9 bg-luxury-gold text-white ring-2 ring-luxury-gold ring-offset-2'
    : 'w-8 h-8 border-2 border-gray-300 text-gray-400 bg-white'
  }
`}
```

Note: the step circle already has `transition-all` — just make sure `duration-300` is added.

Find the label span (lines 74-83). Add `transition-colors duration-300`:

```tsx
className={`mt-1.5 text-xs font-medium text-center leading-tight transition-colors duration-300 ${
  isCurrent
    ? 'text-luxury-gold'
    : isFuture
    ? 'text-gray-400'
    : 'text-gray-500'
}`}
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/WizardProgress.tsx
git commit -m "style: add smooth transitions to wizard progress bar"
```

---

### Task 7: Scroll-to-Top on Wizard Step Change

**Files:**
- Modify: `src/pages/ClientSign.tsx`

**Step 1: Add scroll-to-top effect in the WizardInner component**

In the `WizardInner` function component (around line 17), add a `useEffect` that scrolls to top when `step` changes. Add `useEffect` to the existing import on line 1.

After the `const step = ...` and `const setStep = ...` lines, add:

```tsx
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}, [step])
```

Make sure `useEffect` is imported — it already is on line 1: `import { useEffect, useRef, useMemo, useState } from 'react'`

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/ClientSign.tsx
git commit -m "style: smooth scroll to top on wizard step change"
```

---

### Task 8: Admin Table Hover Polish

**Files:**
- Modify: `src/pages/AgreementList.tsx`

**Step 1: Add card-float to admin table container**

Find the table wrapper (the `<div className="bg-white rounded-sm ...">` around line 68). Replace `rounded-sm` with `rounded-xl card-float`:

```tsx
<div className="bg-white rounded-xl card-float border border-luxury-ink/10 overflow-hidden">
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/AgreementList.tsx
git commit -m "style: add floating shadow to admin table"
```

---

### Task 9: Final Visual Verification & Push

**Step 1: Full build check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Push to GitHub**

```bash
git push origin master
```
