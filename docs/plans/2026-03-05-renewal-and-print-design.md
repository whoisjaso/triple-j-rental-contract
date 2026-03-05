# Contract Renewal & Print/Download Design

**Goal:** Enable clients to renew rental agreements with a new legally-signed document, and allow admins to print or download any agreement as a PDF.

---

## Feature 1: Contract Renewal

### Database

Add `renewed_from` column to `agreements` table:
- Type: UUID, nullable
- FK to `agreements(id)` ON DELETE SET NULL
- Creates a chain: original → renewal 1 → renewal 2

Add `renewed` to the `audit_log` action CHECK constraint.

### Admin UI

**"Renew" button** on AgreementEdit page:
- Visible only when status is `signed` or `completed`
- Creates a new draft agreement pre-filled with:
  - Vehicle info (yearMakeModel, VIN, plate, color, odometer, fuel, damage)
  - Renter info (name, DOB, DL, address, phone, email, employer, emergency)
  - Payment terms (rate, deposit, fees, methods)
  - Mileage options
  - Fresh agreement date (today)
  - Start/end dates blank for admin to set
  - All signatures cleared
  - `renewed_from` = original agreement ID
- Navigates to the new draft for admin to adjust dates/rate, then send signing link

**Renewal chain display:**
- On AgreementEdit, if `renewed_from` is set or renewals exist, show "Agreement History" section
- Lists linked agreements with number, status, date, and link to each

### Audit

- Log `renewed` action on the original agreement when renewal is created
- Metadata includes `{ new_agreement_id, new_agreement_number }`

---

## Feature 2: Print & Download

### Print

- "Print" button on AgreementEdit (any status)
- Uses `window.print()` with existing `.force-desktop` print CSS
- Renders `AgreementPrintView` component in formal document layout

### Download PDF

- "Download PDF" button next to Print on AgreementEdit
- Uses `html2canvas` + `jsPDF` (client-side, no server)
- Renders `AgreementPrintView` to canvas → PDF
- File name: `{agreement_number}-Agreement.pdf`

### AgreementPrintView Component

New component rendering a formal document:
- Company logo + header
- Agreement number + date
- Vehicle information
- Rental term
- Payment terms
- Mileage options
- Insurance, GPS, geographic, recovery disclosures
- Signature blocks (if signed, shows signature images)
- Condition report (if filled)

Hidden on screen, rendered only for print/export.

### Audit

- `pdf_generated` logged on Download PDF click
- `downloaded` logged after successful save

---

## Files

### New
- `src/components/AgreementPrintView.tsx` — formal document layout
- `supabase/migrations/003_renewal_column.sql` — add `renewed_from` column

### Modified
- `src/lib/agreements.ts` — add `renewAgreement()`, `getAgreementRenewals()`, PDF audit functions
- `src/pages/AgreementEdit.tsx` — add Renew, Print, Download buttons + renewal chain display
- `src/types.ts` — no changes needed (data shape stays the same)

### Dependencies
- `html2canvas` — render DOM to canvas
- `jspdf` — generate PDF from canvas
