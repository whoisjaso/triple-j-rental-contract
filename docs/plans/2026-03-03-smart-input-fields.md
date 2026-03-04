# Smart Input Fields — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add auto-formatting phone inputs, ZIP→city/state lookup, currency formatting for income, and a relationship dropdown to all client signing forms.

**Architecture:** Create shared formatting utilities (`src/lib/formatters.ts`) and a ZIP lookup module (`src/lib/zipLookup.ts`) using the `zipcodes` npm package. Update the `AgreementData` type to split `cityStateZip` into separate `city`, `state`, `zip` fields. Modify all 3 client form steps + review/submit + admin read-only views to use the new inputs. Phone and currency formatting happens on every keystroke via controlled inputs. ZIP lookup fires when 5 digits are entered.

**Tech Stack:** React 19, react-hook-form 7, Zod 4, `zipcodes` npm package, Tailwind CSS 4

---

### Task 1: Install zipcodes package and create formatting utilities

**Files:**
- Create: `src/lib/formatters.ts`
- Create: `src/lib/zipLookup.ts`

**Step 1: Install the zipcodes package**

```bash
cd D:/triple-j-auto-investment-agreement && npm install zipcodes
```

And install its types (if available):

```bash
npm install -D @types/zipcodes 2>/dev/null || true
```

**Step 2: Create `src/lib/formatters.ts`**

```ts
/**
 * Format a string of digits as a US phone number: (832) 400-5294
 * Strips all non-digit characters first, then applies formatting.
 * Returns partially formatted as user types.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

/**
 * Format a string of digits as US currency: $3,200
 * Strips all non-digit characters, adds $ prefix and comma grouping.
 */
export function formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  const num = parseInt(digits, 10)
  return `$${num.toLocaleString('en-US')}`
}

/**
 * Strip a formatted phone to just digits (for validation).
 */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Strip a formatted currency to just the numeric string (for validation/storage).
 */
export function currencyDigits(value: string): string {
  return value.replace(/\D/g, '')
}
```

**Step 3: Create `src/lib/zipLookup.ts`**

```ts
import zipcodes from 'zipcodes'

export interface ZipResult {
  city: string
  state: string
}

/**
 * Look up city and state for a US 5-digit ZIP code.
 * Returns null if the ZIP is not found.
 */
export function lookupZip(zip: string): ZipResult | null {
  const result = zipcodes.lookup(zip)
  if (!result) return null
  return { city: result.city, state: result.state }
}

/**
 * All 50 US states + DC as { value, label } for <select> dropdowns.
 */
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
] as const
```

Note: If `zipcodes` doesn't have TypeScript types, add a declaration file `src/types/zipcodes.d.ts`:

```ts
declare module 'zipcodes' {
  interface ZipLookupResult {
    zip: string
    latitude: number
    longitude: number
    city: string
    state: string
    country: string
  }
  function lookup(zip: string): ZipLookupResult | undefined
  export = { lookup }
}
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/lib/formatters.ts src/lib/zipLookup.ts package.json package-lock.json
git add src/types/zipcodes.d.ts 2>/dev/null  # only if created
git commit -m "feat: add phone/currency formatters and ZIP lookup utility"
```

---

### Task 2: Update data model — split cityStateZip into city, state, zip

**Files:**
- Modify: `src/types.ts` — change `renter.cityStateZip` to `renter.city`, `renter.state`, `renter.zip`

**Step 1: Update types.ts**

In the `renter` section of `AgreementData`, replace:
```ts
cityStateZip: string;
```
With:
```ts
city: string;
state: string;
zip: string;
```

Keep `cityStateZip` removed entirely — backward compat is handled at display time by checking for the old field in read-only views.

**Step 2: Fix all TypeScript errors from the type change**

Run `npx tsc --noEmit` to find all broken references. They will be in:
- `src/components/ClientPersonalStep.tsx` (schema + form)
- `src/components/ClientReviewSubmit.tsx` (payload + display)
- `src/pages/AgreementEdit.tsx` (read-only display)

Do NOT fix these files yet — they are handled in subsequent tasks. Just note the errors.

**Step 3: Commit**

```bash
git add src/types.ts
git commit -m "refactor: split cityStateZip into separate city, state, zip fields"
```

---

### Task 3: Update ClientPersonalStep — phone formatting, address split, ZIP lookup

**Files:**
- Modify: `src/components/ClientPersonalStep.tsx`

This is the biggest change. The file needs:

1. **Phone fields** (`phonePrimary`, `phoneSecondary`): Use `formatPhone()` on every keystroke via react-hook-form's `onChange` handler. Update Zod schema to validate formatted phone pattern.

2. **Address split**: Replace single `cityStateZip` field with three fields: `zip`, `city`, `state`. ZIP triggers `lookupZip()` when 5 digits are typed, auto-filling city and state.

3. **Email**: Add `inputMode="email"` to the email field.

**Step 1: Rewrite the full component**

The Zod schema changes:
```ts
const personalInfoSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full legal name as it appears on your ID.'),
  dob: z.string().min(1, 'Date of birth is required.'),
  dlNumber: z.string().min(1, "Driver's license number is required."),
  dlExp: z.string().min(1, 'License expiration date is required.'),
  address: z.string().min(5, 'Please enter your full street address.'),
  zip: z.string().regex(/^\d{5}$/, 'Please enter a valid 5-digit ZIP code.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
  phonePrimary: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Please enter a valid 10-digit phone number.'),
  phoneSecondary: z.string().optional(),
  email: z.string().email('Please enter a valid email address.'),
})
```

The Field component needs a variant that supports `onChange` interception for formatting:
- Phone fields: intercept `onChange`, apply `formatPhone()`, then call `setValue()` from react-hook-form
- ZIP field: intercept `onChange`, strip non-digits, limit to 5, call `lookupZip()` when length === 5, then `setValue('city', ...)` and `setValue('state', ...)`
- State field: becomes a `<select>` dropdown using `US_STATES`

Key implementation details:
- Use `register` with manual `onChange` for formatted fields (phone, zip)
- Use `setValue` from `useForm` to programmatically set city/state from ZIP lookup
- `watch('zip')` to monitor ZIP changes isn't needed — just handle in onChange
- For the state dropdown, use `register('state')` directly on a `<select>`

The `onSubmit` function changes `cityStateZip` references to separate `city`, `state`, `zip` fields:
```ts
updateClientField('renter', 'city', values.city)
updateClientField('renter', 'state', values.state)
updateClientField('renter', 'zip', values.zip)
```

And removes the old:
```ts
// DELETE: updateClientField('renter', 'cityStateZip', values.cityStateZip)
```

Layout:
- ZIP: 1/3 width on desktop, full on mobile
- City: 2/3 width on desktop, full on mobile
- State: 1/2 width on desktop, full on mobile (dropdown)
- Keep address as full-width

**Step 2: Verify in browser**

Navigate to a client signing link, go to Step 1:
- Type digits in Primary Phone → should auto-format to `(832) 400-5294`
- Type 5-digit ZIP → city and state should auto-fill
- State dropdown should show all 50 states + DC
- Email field should show email keyboard on mobile

**Step 3: Commit**

```bash
git add src/components/ClientPersonalStep.tsx
git commit -m "feat: add phone formatting, ZIP lookup, and address split to personal step"
```

---

### Task 4: Update ClientEmploymentStep — phone formatting, income formatting

**Files:**
- Modify: `src/components/ClientEmploymentStep.tsx`

**Step 1: Add formatting to employer phone and monthly income**

Import `formatPhone` and `formatCurrency` from `../lib/formatters`.

Update Zod schema:
```ts
const employmentSchema = z.object({
  employerName: z.string().min(2, "Please enter your employer's name."),
  employerPhone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Please enter your employer's phone number."),
  monthlyIncome: z.string().min(1, 'Please enter your approximate monthly income.'),
})
```

For the phone field: intercept onChange, apply `formatPhone()`, call `setValue()`.
For the income field: intercept onChange, apply `formatCurrency()`, call `setValue()`.

Both fields need `inputMode="numeric"` for mobile number keyboards.

**Step 2: Verify in browser**

- Employer phone auto-formats as you type
- Monthly income shows `$3,200` format
- Both show numeric keyboard on mobile

**Step 3: Commit**

```bash
git add src/components/ClientEmploymentStep.tsx
git commit -m "feat: add phone and currency formatting to employment step"
```

---

### Task 5: Update ClientEmergencyStep — phone formatting, relationship dropdown

**Files:**
- Modify: `src/components/ClientEmergencyStep.tsx`

**Step 1: Add phone formatting and relationship dropdown**

Import `formatPhone` from `../lib/formatters`.

Update Zod schema:
```ts
const emergencyContactSchema = z.object({
  emergencyName: z.string().min(2, "Please enter your emergency contact's full name."),
  emergencyPhone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Please enter a valid phone number.'),
  emergencyRelation: z.string().min(1, 'Please specify your relationship.'),
})
```

Phone field: same pattern as Tasks 3-4.

Relationship field: change from `<input>` to a `<select>` dropdown:
```tsx
<select
  id="emergencyRelation"
  {...register('emergencyRelation')}
  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors bg-white"
>
  <option value="">Select relationship...</option>
  <option value="Spouse">Spouse</option>
  <option value="Parent">Parent</option>
  <option value="Child">Child</option>
  <option value="Sibling">Sibling</option>
  <option value="Friend">Friend</option>
  <option value="Employer">Employer</option>
  <option value="Other">Other</option>
</select>
```

If "Other" is selected, show a text input below for custom entry. Use `watch('emergencyRelation')` to detect:
```tsx
{watchRelation === 'Other' && (
  <input
    type="text"
    placeholder="Specify relationship"
    {...register('emergencyRelationOther')}
    className="..."
  />
)}
```

Add `emergencyRelationOther` to the schema as optional, and in `onSubmit`, if relation is "Other", use the custom value instead.

**Step 2: Verify in browser**

- Emergency phone auto-formats
- Relationship shows dropdown
- Selecting "Other" reveals text input

**Step 3: Commit**

```bash
git add src/components/ClientEmergencyStep.tsx
git commit -m "feat: add phone formatting and relationship dropdown to emergency step"
```

---

### Task 6: Update ClientReviewSubmit — display new fields

**Files:**
- Modify: `src/components/ClientReviewSubmit.tsx`

**Step 1: Update review display and payload**

In the review display, replace:
```tsx
<ReviewRow label="City, State, ZIP" value={renter?.cityStateZip} />
```
With:
```tsx
<ReviewRow label="City" value={renter?.city} />
<ReviewRow label="State" value={renter?.state} />
<ReviewRow label="ZIP" value={renter?.zip} />
```

In `handleSubmit`, update the `clientPayload.renter` object — replace:
```ts
cityStateZip: renter?.cityStateZip ?? '',
```
With:
```ts
city: renter?.city ?? '',
state: renter?.state ?? '',
zip: renter?.zip ?? '',
```

**Step 2: Commit**

```bash
git add src/components/ClientReviewSubmit.tsx
git commit -m "refactor: update review/submit to use separate city, state, zip fields"
```

---

### Task 7: Update AgreementEdit — handle read-only display

**Files:**
- Modify: `src/pages/AgreementEdit.tsx`

**Step 1: Update read-only display for signed agreements**

In the "Client Submitted Information" section, replace:
```tsx
<ReadOnlyField label="City, State, ZIP" value={data.renter?.cityStateZip} />
```
With backward-compatible logic:
```tsx
{data.renter?.city ? (
  <>
    <ReadOnlyField label="City" value={data.renter?.city} />
    <ReadOnlyField label="State" value={data.renter?.state} />
    <ReadOnlyField label="ZIP" value={data.renter?.zip} />
  </>
) : (
  <ReadOnlyField label="City, State, ZIP" value={(data.renter as any)?.cityStateZip} />
)}
```

This handles both old agreements (with `cityStateZip`) and new agreements (with separate fields).

**Step 2: Commit**

```bash
git add src/pages/AgreementEdit.tsx
git commit -m "feat: update admin read-only view for split city/state/zip with backward compat"
```

---

### Task 8: Final verification

**Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 2: Build check**

```bash
npm run build
```

Expected: Build succeeds

**Step 3: Manual smoke test**

Client signing wizard:
- Step 1 (Personal): Phone fields auto-format to `(XXX) XXX-XXXX`, ZIP auto-fills city+state, state is dropdown, email shows email keyboard on mobile
- Step 2 (Employment): Employer phone auto-formats, income shows `$X,XXX` format
- Step 3 (Emergency): Phone auto-formats, relationship is dropdown with "Other" option
- Step 5 (Review): Shows separate City, State, ZIP rows

Admin views:
- Old signed agreements still show "City, State, ZIP" as one field
- New signed agreements show separate City, State, ZIP fields

**Step 4: Commit if needed**

```bash
git add -A
git commit -m "feat: smart input fields — complete"
```
