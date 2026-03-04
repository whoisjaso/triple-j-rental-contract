# Design: Remove Login + Add Gold Crest Branding

**Date:** 2026-03-03
**Status:** Approved

## Problem

1. Visiting the app shows a login screen — user wants no authentication
2. The gold JJAI crest logo (`GoldTripleJLogo.png`) is not used anywhere — just plain "JJAI" text

## Solution

Remove all auth gating and add the gold crest logo throughout the app.

## Changes

### 1. Auth Removal

- Delete `src/pages/AdminLogin.tsx`
- Remove `/login` route from `src/router.tsx`
- Strip `AuthProvider` from `src/App.tsx`
- Remove auth guard from `AdminLayout.tsx` (no redirect to `/login`)
- Remove `useAuth()` calls from admin pages
- Change root `/` to render agreement list directly
- Keep `src/lib/supabase.ts` for data operations (not auth)
- Supabase CRUD calls that need `userId` pass `null` or hardcoded identifier

### 2. Asset Setup

- Copy `d:/GoldTripleJLogo.png` to `public/logo-crest.png`
- Reference as `/logo-crest.png` in components

### 3. Admin Nav (AdminLayout)

- Replace text "JJAI" with `<img src="/logo-crest.png" alt="JJAI" class="h-[60px]" />`
- Keep "Triple J Auto Investment" text adjacent
- Remove "Sign Out" button

### 4. Client Signing — Step 0 (Review)

- Hero crest centered above review content: 120px height
- Company name below in Cormorant Garamond serif, luxury-gold

### 5. Client Signing — Steps 1-5

- Smaller crest in header: 48px height
- Consistent placement alongside progress indicator

### 6. Unchanged

- All Supabase data operations (CRUD, token signing, audit log)
- Client signing flow (6 steps, localStorage, canvas signatures)
- Design tokens (luxury palette, fonts, colors)
- Print/PDF styles
