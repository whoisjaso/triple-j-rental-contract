# Design: Smart Input Fields

**Date:** 2026-03-03
**Status:** Approved

## Problem

Form fields accept any text with no formatting, validation feedback, or smart behavior. Phone numbers aren't formatted, address city/state/zip is a single freeform field, income has no dollar formatting.

## Solution

Add input masks, auto-formatting, ZIP-to-city/state lookup, and a relationship dropdown — all with zero external API dependencies.

## Changes

### 1. Phone Formatting (4 fields)

Fields: `phonePrimary`, `phoneSecondary`, `employerPhone`, `emergencyPhone`

- Auto-format as user types: `(832) 400-5294`
- Strip non-digit input, max 10 digits
- `inputMode="numeric"` for mobile number keyboard
- Store formatted string
- Update Zod regex to match `(XXX) XXX-XXXX`

### 2. Address Split — city, state, zip

Current `cityStateZip` becomes three fields: `city`, `state`, `zip`.

- **ZIP:** `inputMode="numeric"`, 5 digits max. On completing 5 digits, auto-fill city + state from bundled ZIP database.
- **City:** Text, pre-filled by ZIP, editable.
- **State:** Dropdown of US states, pre-filled by ZIP, editable.
- **Layout order:** ZIP first (triggers auto-fill), then city, then state.
- **Data model:** Update `types.ts` renter interface, Zod schemas, stores. Handle backward compat with existing `cityStateZip` data in read-only views.
- **ZIP database:** Bundle a ~200KB JSON map of ZIP → { city, state }, loaded lazily.

### 3. Income Formatting

Field: `monthlyIncome`

- Auto-prepend `$`, add comma grouping: `3200` → `$3,200`
- Digits only, `inputMode="numeric"`
- Store formatted string

### 4. Relationship Dropdown

Field: `emergencyRelation`

- Change to `<select>` with options: Spouse, Parent, Child, Sibling, Friend, Employer, Other
- "Other" shows a text input for custom entry

### 5. Unchanged Fields

- `fullName`, `dlNumber`, `address` (street), `employerName`: plain text
- `dob`, `dlExp`: native date picker
- `email`: add `inputMode="email"`, keep Zod validation

### 6. Scope

- Client signing wizard (Steps 1-3): primary target
- Admin read-only views: handle city/state/zip split display
- Admin forms don't have these fields (client-only)
