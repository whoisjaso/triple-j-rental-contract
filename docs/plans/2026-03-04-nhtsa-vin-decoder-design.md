# NHTSA VIN Decoder Design

**Goal:** Auto-populate vehicle Year/Make/Model from VIN using the free NHTSA vPIC API, with title-case formatting.

**Approach:** New `vinDecode.ts` utility calls `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{VIN}?format=json`, extracts Year/Make/Model, title-cases each word, and returns a formatted string. A "Decode" button next to the VIN input triggers the lookup.

---

## API

- Endpoint: `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{VIN}?format=json`
- Free, no API key required
- Returns JSON with `Results` array of `{ Variable, Value }` objects
- Relevant variables: `Model Year`, `Make`, `Model`

## Title Case

`toTitleCase(str)` — converts `"CHEVROLET"` → `"Chevrolet"`, `"grand cherokee"` → `"Grand Cherokee"`

## UI

- "Decode" button appears next to VIN input in AgreementCreate and AgreementEdit (when draft)
- Button shows spinner while loading
- On success: fills `yearMakeModel` with `"{Year} {Make} {Model}"`
- On error: inline red text below VIN field

## Files

- Create: `src/lib/vinDecode.ts`
- Modify: `src/pages/AgreementCreate.tsx`
- Modify: `src/pages/AgreementEdit.tsx`
