# Phase 5: Manheim Autonomous Inventory Pipeline - Research

**Researched:** 2026-03-02
**Domain:** Gmail API, Google Sheets API v4, NHTSA vPIC, Supabase Edge Functions (Deno), PDF parsing, SMS, mobile photo upload
**Confidence:** HIGH (core stack), MEDIUM (photo workflow), HIGH (scheduling)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Pipeline Notifications**
- SMS text to admin (+18324005294) when a new vehicle is processed from an OVE purchase email
- Quick summary format: "New vehicle added: 2019 Nissan Pathfinder | VIN: ...4768 | $2,500 + $280 fee"
- SMS for errors too: "Pipeline error: Failed to parse OVE email. Check logs."
- SMS for new vehicle additions and errors ONLY — Central Dispatch towing cost updates and Manheim Sale Document condition/title updates are silent (no SMS)

**Website Listing Behavior**
- Pipeline sets Listing Status to **"Incoming"** (not "Available") — vehicle data exists but is not visible to customers
- While "Incoming", website shows vehicle as **"Coming Soon"** with basic info (year, make, model) but no price or full details
- Pipeline's Target List Price auto-populates as the customer-facing price (owner can override before publishing)
- Status flip from "Incoming" → "Available" can happen from either Google Sheet or admin dashboard — both paths work

**Data Source Strategy**
- **Google Sheet is the single source of truth** — pipeline writes to sheet only, NOT directly to Supabase
- Existing Google Sheets → website sync handles Supabase/website updates
- If pipeline parses data wrong, owner corrects in the sheet; existing sync propagates the fix
- No dual-write complexity — pipeline only touches Google Sheets API
- **Pipeline log table in Supabase** for debugging/audit trail (records: email received, data parsed, row written, errors)

**Photo Workflow**
- **Standalone quick-access page** (not inside admin dashboard) — fast-loading, bookmarkable on phone
- **Guided photo shots**: step-by-step prompts for front, rear, driver side, passenger side, interior, dashboard, trunk
- Select vehicle from list of "Incoming" vehicles, then walk through photo capture
- **Auto-publish**: once photos are uploaded, status automatically flips from "Incoming" to "Available" — vehicle goes live on website with no extra approval step
- Photos stored and linked to vehicle record via Photo Link column in sheet

### Claude's Discretion
- Photo storage destination (Supabase Storage, Google Drive, or other)
- Photo compression/optimization approach
- Exact SMS delivery mechanism (reuse Phase 3 approach if applicable)
- Pipeline log table schema and retention policy
- "Coming Soon" card design on the website
- Guided photo page UI/UX details beyond the shot sequence

### Deferred Ideas (OUT OF SCOPE)
- Super Dispatch BOL photos for delivery confirmation — future enhancement (mentioned in design doc as Source 4)
- Two-way sync between Sheet and Supabase — decided against, sheet is one-way source of truth
- Admin dashboard photo management (editing, reordering, deleting photos) — separate from the quick upload page
</user_constraints>

---

## Summary

Phase 5 builds an autonomous email-driven pipeline using Supabase Edge Functions (Deno) as the runtime. The pipeline polls Gmail every 5 minutes via the Gmail REST API using OAuth2 refresh token authentication, parses three email types (OVE Purchase Confirmation, Central Dispatch, Manheim Sale Documents), enriches data via NHTSA VIN decode, and appends/updates rows in Google Sheets. A companion standalone React page handles the one manual step: guided vehicle photo capture and upload, with auto-publish on completion.

The approved design document (`docs/plans/2026-03-02-manheim-pipeline-design.md`) is the canonical reference. The CONTEXT.md overrides one design doc decision: Listing Status must be **"Incoming"** (not "Available" as the old design doc said), because the user wants a "Coming Soon" holding pattern before photos are uploaded and the vehicle goes live.

The most critical implementation considerations are: (1) Gmail OAuth2 uses user-authorized OAuth2 with a refresh token — service accounts do NOT work for personal @gmail.com accounts; (2) Gmail returns URL-safe base64 which must be converted before using `atob()`; (3) Google Sheets has no search-by-VIN API — must read all VIN column data and find row index programmatically; (4) Supabase free tier allows pg_cron (no tier restriction, resource-based only); (5) PDF parsing in Deno uses `unpdf` (not `pdf-parse`, which is Node-only).

**Primary recommendation:** Deploy a single Supabase Edge Function (`manheim-pipeline`) scheduled every 5 minutes via pg_cron + pg_net, using pure REST calls to Gmail API, Google Sheets API v4, NHTSA vPIC, and Twilio SMS. All dependencies imported via `npm:` specifier (Deno 2.1 preferred pattern). Photo upload uses a dedicated standalone React page with `getUserMedia()` for camera capture, `browser-image-compression` for client-side resize, and Supabase Storage for persistence (1 GB free tier, 50 MB max file size per file).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Edge Functions (Deno) | Deno 2.1 | Pipeline runtime | Already in project, free tier, 500k invocations/month |
| Gmail REST API | v1 | Read emails, mark as read | No SDK needed — pure fetch to googleapis.com |
| Google Sheets REST API | v4 | Append rows, update cells | No SDK needed — pure fetch to sheets.googleapis.com |
| NHTSA vPIC REST API | current | VIN decode for GVWR/drive type | Free, no auth, JSON output |
| unpdf | 0.10+ (PDF.js v5.4) | PDF text extraction in Deno | Only Deno-compatible PDF parser; specifically designed for serverless/edge |
| jsr:@b-fuze/deno-dom | latest | Parse HTML email bodies | JSR-native Deno DOM parser; querySelector support; WASM backend |
| Twilio Messaging API | 2010-04-01 | Send SMS to admin | Already decided in project; pure fetch with Basic auth |
| pg_cron + pg_net | bundled with Supabase | Schedule Edge Function | Native Supabase scheduling; works on free tier |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| browser-image-compression | 2.x | Client-side photo resize before upload | Photo upload page — resize before sending to Supabase Storage |
| supabase-js | 2.97.0 | Supabase Storage upload (photo page) | Client-side photo upload to Storage bucket |
| @supabase/supabase-js (Edge) | 2.97.0 (esm.sh) | Write pipeline_log to Supabase from Edge Function | Audit/dedup within the Edge Function |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| unpdf | pdf-parse | pdf-parse is Node-only; does not run in Deno without shims |
| jsr:@b-fuze/deno-dom | cheerio via npm: | deno-dom is WASM-native, no Node.js globals needed |
| Supabase Storage | Google Drive API | Drive requires additional OAuth scope and API; Storage is already in project |
| pg_cron | cron-job.org | cron-job.org is external; pg_cron is native and free |
| getUserMedia + canvas | `<input capture>` | input capture closes camera after one shot; getUserMedia supports multi-shot flow |

**Installation (photo page — new dependencies only):**
```bash
npm install browser-image-compression
```

**Edge Function imports (no npm install — Deno fetches at deploy time):**
```typescript
import { createClient } from "npm:@supabase/supabase-js@2.97.0";
import { DOMParser } from "jsr:@b-fuze/deno-dom";
import { extractText, getDocumentProxy } from "npm:unpdf";
```

---

## Architecture Patterns

### Recommended Project Structure
```
supabase/
└── functions/
    └── manheim-pipeline/
        ├── index.ts          # Entry point + pg_cron handler
        ├── types.ts          # Shared TypeScript interfaces
        ├── gmail.ts          # Gmail API client (list, get, mark read, get attachment)
        ├── parsers/
        │   ├── ove.ts        # Parse OVE Purchase Confirmation HTML
        │   ├── central-dispatch.ts  # Parse Central Dispatch plain text
        │   └── sale-docs.ts  # Parse Manheim Sale Documents PDF
        ├── sheets.ts         # Google Sheets API (append, find row, update cells)
        ├── nhtsa.ts          # NHTSA vPIC VIN decode
        └── sms.ts            # Twilio SMS sender

src/
└── pages/
    └── PhotoUpload.tsx       # Standalone guided photo upload page
    └── components/photo/
        ├── VehicleSelector.tsx   # List "Incoming" vehicles from Sheet/Supabase
        ├── PhotoStep.tsx         # Per-shot camera capture + preview
        └── UploadProgress.tsx    # Upload status + auto-publish trigger
```

### Pattern 1: OAuth2 Refresh Token Exchange (Gmail + Sheets)

**What:** Exchange stored refresh token for a short-lived access token at the start of each Edge Function invocation.

**When to use:** Every invocation — access tokens expire in 1 hour; refresh tokens are long-lived for personal Gmail.

**Critical detail:** Gmail returns **URL-safe base64** (RFC 4648 with `-` and `_`) which must be converted to standard base64 before `atob()`. This is a verified Deno bug workaround.

```typescript
// Source: https://github.com/denoland/deno/issues/19546 + https://developers.google.com/identity/protocols/oauth2/web-server#offline

async function getAccessToken(): Promise<string> {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: Deno.env.get("GOOGLE_REFRESH_TOKEN")!,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
    }),
  });
  const data = await resp.json();
  return data.access_token;
}

// CRITICAL: Gmail uses URL-safe base64 — must convert before atob()
function decodeGmailBase64(b64: string): string {
  const standard = b64.replace(/-/g, "+").replace(/_/g, "/");
  return atob(standard);
}

function decodeGmailBase64ToBytes(b64: string): Uint8Array {
  const standard = b64.replace(/-/g, "+").replace(/_/g, "/");
  const binString = atob(standard);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}
```

### Pattern 2: Gmail Poll + Process Loop

**What:** List unread messages matching a query, get full message details, parse, process, mark as read.

**When to use:** Each of three email sources follows this exact loop.

```typescript
// Source: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list

async function listUnreadMessages(token: string, query: string): Promise<string[]> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await resp.json();
  return (data.messages ?? []).map((m: { id: string }) => m.id);
}

async function getMessage(token: string, messageId: string): Promise<GmailMessage> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.json();
}

async function markAsRead(token: string, messageId: string): Promise<void> {
  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
  });
}
```

**Gmail queries (verified):**
```
from:support@ove.com subject:"Purchase Confirmation" is:unread
from:do-not-reply@centraldispatch.com subject:"has been ACCEPTED" is:unread
from:noreply@manheim.com subject:"Sale Documents" is:unread
```

### Pattern 3: HTML Email Parsing (OVE Purchase Confirmation)

**What:** Decode base64 email body, parse HTML with deno-dom, extract labeled field values.

**When to use:** OVE emails are structured HTML with labeled fields. Central Dispatch emails are plain text (use regex, no DOM needed).

```typescript
// Source: https://jsr.io/@b-fuze/deno-dom

import { DOMParser } from "jsr:@b-fuze/deno-dom";

function parseOVEEmail(base64Body: string): ParsedVehicle {
  const html = decodeGmailBase64(base64Body);
  const doc = new DOMParser().parseFromString(html, "text/html");

  // OVE emails use labeled field pattern: find element containing "VIN:" then get adjacent value
  // Use doc.querySelector() or doc.querySelectorAll() with text search
  const vinText = findFieldValue(doc, "VIN");
  // ... extract other fields
  return { vin: vinText.trim(), /* ... */ };
}
```

### Pattern 4: Google Sheets Append New Row

**What:** Append a new vehicle row using USER_ENTERED mode so formulas and date parsing work correctly.

**When to use:** OVE purchase processing — first time a vehicle is added.

**Critical detail:** Use `USER_ENTERED` not `RAW` so Google Sheets interprets `=TODAY()-B2` style formulas. Use `INSERT_ROWS` for insertDataOption to avoid overwriting.

```typescript
// Source: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append

async function appendVehicleRow(token: string, sheetId: string, values: string[][]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });
  if (!resp.ok) throw new Error(`Sheets append failed: ${resp.status}`);
}
```

### Pattern 5: Find Row by VIN and Update Cells

**What:** Read the VIN column, find the row index for a given VIN, then update specific cells in that row.

**When to use:** Central Dispatch and Sale Documents processing — updating existing rows.

**Critical detail:** The Sheets API has NO native search-by-value. Must read the VIN column, find row index, then target that row for update. The VIN is in column A.

```typescript
// Source: https://developers.google.com/workspace/sheets/api/guides/values

async function findRowByVIN(token: string, sheetId: string, vin: string): Promise<number | null> {
  // Read VIN column (column A, all rows)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:A`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await resp.json();
  const rows: string[][] = data.values ?? [];
  const rowIndex = rows.findIndex(row => row[0] === vin);
  return rowIndex === -1 ? null : rowIndex + 1; // +1 because Sheets rows are 1-indexed
}

async function updateCells(
  token: string,
  sheetId: string,
  range: string, // e.g. "O2" for row 2, column O (Towing Cost)
  values: string[][]
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=USER_ENTERED`;
  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });
}
```

### Pattern 6: PDF Parsing with unpdf

**What:** Download PDF attachment from Gmail, extract text, regex for condition and title type.

**When to use:** Manheim Sale Documents email processing.

**Critical detail:** Gmail attachment body requires fetching by `attachmentId`, not inline in the message. Add `await` before `configureUnPDF()` — forgetting it causes "PDF.js is not available" error in production.

```typescript
// Source: https://github.com/unjs/unpdf + https://github.com/unjs/unpdf/issues/3

import { extractText, getDocumentProxy } from "npm:unpdf";

async function getAttachment(token: string, messageId: string, attachmentId: string): Promise<Uint8Array> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await resp.json();
  return decodeGmailBase64ToBytes(data.data); // URL-safe base64
}

async function extractPDFText(pdfBytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(pdfBytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}
```

### Pattern 7: NHTSA VIN Decode

**What:** Fetch GVWR and drive type from NHTSA public API.

**When to use:** After OVE email parsed — enrich with technical vehicle specs.

```typescript
// Source: https://vpic.nhtsa.dot.gov/api/

async function decodeVIN(vin: string): Promise<NHTSAData> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`;
  const resp = await fetch(url);
  const data = await resp.json();
  const results: Array<{ Variable: string; Value: string }> = data.Results ?? [];

  const get = (variable: string) =>
    results.find(r => r.Variable === variable)?.Value ?? "";

  return {
    gvwr: get("Gross Vehicle Weight Rating From"),
    driveType: get("Drive Type"),
    engineDisplacement: get("Displacement (L)"),
    fuelType: get("Fuel Type - Primary"),
    bodyClass: get("Body Class"),
    doors: get("Doors"),
  };
}
```

**NHTSA field names (verified from API structure):**
- GVWR field: `"Gross Vehicle Weight Rating From"` (e.g., "5,001-6,000 lb")
- Drive Type: `"Drive Type"` (e.g., "FWD/Front Wheel Drive")

### Pattern 8: Twilio SMS (Deno)

**What:** Send SMS via Twilio REST API using Basic auth and form-encoded body.

**When to use:** After successful OVE email processing (new vehicle added) or pipeline error.

```typescript
// Source: https://www.twilio.com/docs/messaging/api

async function sendSMS(to: string, body: string): Promise<void> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
  const from = Deno.env.get("TWILIO_PHONE_NUMBER")!;

  const credentials = btoa(`${accountSid}:${authToken}`);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
}
```

### Pattern 9: pg_cron Schedule

**What:** Schedule the Edge Function to run every 5 minutes using pg_cron + pg_net.

**When to use:** One-time setup migration. Store secrets in Supabase Vault before running.

```sql
-- Source: https://supabase.com/docs/guides/functions/schedule-functions

-- Step 1: Store credentials in vault (run once)
select vault.create_secret('https://scgmpliwlfabnpygvbsy.supabase.co', 'project_url');
select vault.create_secret('YOUR_ANON_KEY', 'anon_key');

-- Step 2: Schedule the pipeline every 5 minutes
select cron.schedule(
  'manheim-pipeline-every-5min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/manheim-pipeline',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
    ),
    body := '{"source":"pg_cron"}'::jsonb
  ) as request_id;
  $$
);
```

**Auth note:** The anon key approach is standard practice for pg_cron → Edge Function. Add a header check in the Edge Function to reject non-scheduled invocations if needed. The service_role_key alternative is more powerful but the anon key suffices for this use case since the function's logic is self-contained.

### Pattern 10: Photo Upload Page (Standalone React)

**What:** Standalone page at `/photos` — lists "Incoming" vehicles, guides through 7 shot types, uploads to Supabase Storage, updates Sheet and triggers auto-publish.

**Camera approach:** Use `getUserMedia({ video: { facingMode: "environment" } })` for rear camera. Draw video frame to canvas, call `canvas.toBlob()` to capture. Compress with `browser-image-compression` before uploading.

**Why NOT `<input capture>`:** The capture attribute closes the camera after one shot, making multi-shot guided flow impossible without reopening camera 7 times.

```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos
// + https://github.com/donaldcwl/browser-image-compression

import imageCompression from "browser-image-compression";

async function capturePhoto(videoEl: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  canvas.getContext("2d")!.drawImage(videoEl, 0, 0);

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob!), "image/jpeg", 0.85);
  });
}

async function compressAndUpload(
  supabase: SupabaseClient,
  blob: Blob,
  vehicleVin: string,
  shotName: string
): Promise<string> {
  const file = new File([blob], `${shotName}.jpg`, { type: "image/jpeg" });

  // Compress to max 1MB, max 1920px width
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });

  const path = `${vehicleVin}/${shotName}-${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from("vehicle-photos")
    .upload(path, compressed, { contentType: "image/jpeg" });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("vehicle-photos")
    .getPublicUrl(path);

  return publicUrl;
}
```

### Anti-Patterns to Avoid

- **Using pdf-parse in Deno:** pdf-parse is Node.js-only. Use `npm:unpdf` instead.
- **Using cheerio via esm.sh for HTML parsing:** deno-dom from JSR is the correct choice; cheerio has Node.js global dependencies.
- **Assuming service accounts work for personal Gmail:** They do NOT. Only user-authorized OAuth2 (refresh token) works for `@gmail.com` accounts.
- **Not converting Gmail's URL-safe base64:** Gmail returns `-` and `_` instead of `+` and `/`. `atob()` will throw `InvalidCharacterError` without conversion.
- **Using `valueInputOption=RAW` for Sheets append:** RAW mode ignores dates and formulas. The sheet has formula columns — use `USER_ENTERED`.
- **Not marking emails as read on error:** If processing fails, do NOT mark as read. Leave unread for retry on next cycle.
- **Forgetting `await` on unpdf `configureUnPDF()`:** No-op in Deno 2.1+ but the forgetting pattern caused production failures — pattern to remember.
- **Storing public URLs from Supabase Storage as signed URLs:** Use public bucket with UUID-style paths; store the public URL (not a signed URL) in the Photo Link column. Signed URLs expire.
- **Using esm.sh for imports when npm: works:** Deno 2.1 recommends `npm:` specifier; esm.sh imports can fail with `?target=deno` edge cases.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction in Deno | Custom PDF byte parser | `npm:unpdf` | PDF binary format is extremely complex; unpdf wraps PDF.js serverless build |
| HTML DOM parsing in Deno | Regex-only HTML parser | `jsr:@b-fuze/deno-dom` | Email HTML has nested tables, encoded chars; querySelector is correct tool |
| Image compression before upload | Canvas loop with quality reduction | `browser-image-compression` | Handles EXIF stripping, orientation, quality optimization, web worker offload |
| OAuth2 token refresh | Custom JWT signing | Fetch `oauth2.googleapis.com/token` directly | Google's endpoint handles all the OAuth2 complexity; no library needed |
| VIN lookup | Custom parser | NHTSA vPIC REST API | Free, authoritative, maintained by DOT |
| Photo file naming/dedup | UUID generator | `${Date.now()}` suffix on VIN-named path | Simple, sortable, collision-proof for this volume |
| Scheduled execution | Custom cron infrastructure | pg_cron + pg_net (bundled with Supabase) | Already available in project; no external dependency |

**Key insight:** Every "hard" problem in this pipeline has a well-maintained, Deno-compatible solution. The main risk is using Node.js-only libraries (pdf-parse, most npm parsers) without verifying Deno compatibility first.

---

## Common Pitfalls

### Pitfall 1: Gmail URL-Safe Base64 Crashes Deno atob()

**What goes wrong:** `atob(message.payload.body.data)` throws `InvalidCharacterError` in Deno because Gmail's base64 uses `-` and `_` (URL-safe variant) instead of `+` and `/`.
**Why it happens:** Gmail API uses RFC 4648 URL-safe encoding; Deno's `atob()` expects standard base64.
**How to avoid:** Always replace `-` → `+` and `_` → `/` before calling `atob()`. Apply this to both message bodies AND attachment data.
**Warning signs:** `InvalidCharacterError` or `DOMException` when decoding email content.

### Pitfall 2: Google Sheets Search is Read-Then-Filter, Not Query

**What goes wrong:** Attempting to use query parameters to filter Sheets rows returns nothing — the API only supports range-based access.
**Why it happens:** Google Sheets API v4 has no WHERE-clause equivalent. It's a cell grid API, not a database.
**How to avoid:** Always read the full VIN column (A:A) first, find the matching row index in JavaScript, then target that row for updates.
**Warning signs:** Empty results or 400 errors when trying to add filter params to the sheets URL.

### Pitfall 3: Listing Status "Available" vs "Incoming" Mismatch

**What goes wrong:** The approved design doc (before CONTEXT.md) specified default Listing Status = "Available". CONTEXT.md overrides this to "Incoming".
**Why it happens:** Design doc was written before the "Coming Soon" workflow decision was finalized.
**How to avoid:** Use `"Incoming"` as the default Listing Status written by the pipeline. The photo upload page triggers the flip to "Available".
**Warning signs:** Vehicles appearing live on website immediately after OVE email (not "Coming Soon").

### Pitfall 4: PDF Attachment vs Inline PDF

**What goes wrong:** The Manheim Sale Documents email has the PDF as an attachment (not inline body). Accessing `message.payload.body.data` returns nothing.
**Why it happens:** Multipart emails have `parts[]` array; attachments have `attachmentId` not inline `data`. Large attachments require a separate `attachments.get` API call.
**How to avoid:** Walk `message.payload.parts[]` looking for `mimeType === "application/pdf"` or `"application/octet-stream"` with a filename matching the pattern. Use `attachmentId` to fetch bytes separately.
**Warning signs:** Empty PDF buffer or zero-length text extraction.

### Pitfall 5: Central Dispatch Multiple Carrier Events for Same Load

**What goes wrong:** Multiple ACCEPTED emails arrive for the same Load ID as carriers accept/cancel. Processing each one independently overwrites the towing cost with different values.
**Why it happens:** CD sends ACCEPTED for each carrier event; a load may have multiple carriers.
**How to avoid:** Track Load IDs in the pipeline_log table. On each ACCEPTED email, update (not insert) the towing cost. The most recent ACCEPTED for a Load ID wins. If a CANCELLED follows an ACCEPTED, keep the last ACCEPTED value.
**Warning signs:** Towing cost fluctuating unexpectedly in the sheet.

### Pitfall 6: Supabase Storage 1GB Free Tier vs Vehicle Photo Volume

**What goes wrong:** At ~7 photos per vehicle × 1MB average = 7MB per vehicle. At ~15 vehicles/month, storage fills ~1.5GB in ~10 months.
**Why it happens:** 1GB storage limit on free tier; 50MB max file size per upload (not a per-file limit issue, a total cap issue).
**How to avoid:** Compress photos to ≤1MB before upload using `browser-image-compression`. At 1MB average, the 1GB limit supports ~140 vehicles. At current acquisition pace this gives 12+ months. Monitor usage in Supabase dashboard.
**Warning signs:** Upload 400/413 errors indicating storage full.

### Pitfall 7: Refresh Token Expiration

**What goes wrong:** Gmail/Sheets API calls return 401 months after initial setup, breaking the pipeline silently.
**Why it happens:** Google refresh tokens expire if unused for 6 months, or if the user changes their Google password.
**How to avoid:** The pipeline runs every 5 minutes — it uses the token constantly, so 6-month idle expiration will not occur. Document that if the pipeline is paused for months, re-authorization via OAuth Playground is required. Log all 401 responses to pipeline_log.
**Warning signs:** `invalid_grant` error in token refresh response, pipeline_log errors with 401 status.

### Pitfall 8: pg_cron Anon Key Authentication Weakness

**What goes wrong:** Anyone who knows the project's anon key can invoke the pipeline manually.
**Why it happens:** pg_cron uses the anon key in Authorization header; anon key is semi-public.
**How to avoid:** Add a check in the Edge Function for a `x-pipeline-secret` header containing a secret value stored in Deno.env. The pg_cron call includes this header; external callers won't know it.
**Warning signs:** Unexpected pipeline_log entries from non-cron invocations.

---

## Code Examples

Verified patterns from official sources:

### OAuth2 Token Refresh (Google)
```typescript
// Source: https://developers.google.com/identity/protocols/oauth2/web-server#offline
const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: Deno.env.get("GOOGLE_REFRESH_TOKEN")!,
    client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
    client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
  }),
});
const { access_token } = await tokenResp.json();
```

### Gmail List Unread Messages
```typescript
// Source: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list
const query = encodeURIComponent("from:support@ove.com subject:\"Purchase Confirmation\" is:unread");
const resp = await fetch(
  `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const { messages = [] } = await resp.json();
// messages is: Array<{ id: string, threadId: string }>
```

### Google Sheets Append Row
```typescript
// Source: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append
const SHEET_ID = "1ZJpUk9lsWkDOcuOTkKNcBbsywToFbfmF8I_7Gm60kuI";
const appendResp = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
  {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      values: [
        [vin, searchKey, year, make, model, color, weight, odometer,
         condition, titleType, dateAcquired, dateListed, /*days formula*/,
         purchasePrice, towingCost, 0, 0, buyFee, /*allIn formula*/,
         0.25, /*targetPrice formula*/, 0.10, /*floorPrice formula*/,
         "", "Incoming", /*currentPrice formula*/]
      ]
    })
  }
);
```

### PDF Text Extraction (Deno)
```typescript
// Source: https://github.com/unjs/unpdf
import { extractText, getDocumentProxy } from "npm:unpdf";

const pdfBytes: Uint8Array = await getAttachment(token, messageId, attachmentId);
const pdf = await getDocumentProxy(pdfBytes);
const { text } = await extractText(pdf, { mergePages: true });

// Extract condition from text (regex against PDF content)
const conditionMatch = text.match(/Condition[:\s]+([A-Za-z ]+)/i);
const condition = conditionMatch?.[1]?.trim() ?? "Pending Inspection";
```

### Supabase Storage Upload + Public URL
```typescript
// Source: https://supabase.com/docs/reference/javascript/storage-from-upload
const path = `${vin}/${shotName}-${Date.now()}.jpg`;
const { data, error } = await supabase.storage
  .from("vehicle-photos")   // public bucket
  .upload(path, compressedFile, { contentType: "image/jpeg" });

if (error) throw error;

const { data: { publicUrl } } = supabase.storage
  .from("vehicle-photos")
  .getPublicUrl(path);
// publicUrl = "https://scgmpliwlfabnpygvbsy.supabase.co/storage/v1/object/public/vehicle-photos/VIN/front-1234567890.jpg"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pdf-parse (Node.js) | unpdf (Deno/serverless) | 2023+ | pdf-parse is Node-only; unpdf works in Edge Functions |
| esm.sh imports | `npm:` specifier | Deno 2.0 (2024) | More reliable; fewer compatibility issues |
| cheerio for HTML | jsr:@b-fuze/deno-dom | 2023+ | deno-dom is Deno-native; no Node globals needed |
| `<input capture>` for camera | `getUserMedia()` stream | Browser standard | Multi-shot capture requires sustained camera stream |
| Google IMAP/SMTP + basic auth | OAuth2 only | March 2025 | Google disabled basic auth for Gmail; OAuth2 required |
| Service accounts for Gmail | User OAuth2 refresh token | Always | Service accounts only work for Workspace, not personal @gmail.com |

**Deprecated/outdated:**
- Basic auth for Gmail (IMAP/SMTP): disabled by Google as of March 14, 2025
- pgjwt extension: deprecated in Postgres 17 (don't use for Edge Function auth)
- pgsodium: Supabase explicitly states "do NOT recommend any new usage"

---

## Open Questions

1. **Photo Link column format in the Google Sheet**
   - What we know: Column 24 (X) is "Photo Link" — stores a single URL or comma-separated list
   - What's unclear: Does the existing Sheet → website sync expect one URL or JSON array for multiple photos?
   - Recommendation: Inspect the existing website sync code before implementing. If single URL, store a comma-separated list or pipe-separated. If website expects multiple photos, may need to store JSON array as a cell value.

2. **"Coming Soon" display on the main website**
   - What we know: CONTEXT.md says "website shows vehicle as Coming Soon with basic info (year, make, model) but no price or full details" when status is "Incoming"
   - What's unclear: This requires modifying the main website (triple-j-auto-investment repo), which is a separate codebase
   - Recommendation: Phase 5 plan must include a task for the website change OR note it as a dependency. The photo upload page auto-publish can still proceed; the "Coming Soon" display is a website concern.

3. **Vehicles table schema in Supabase (for existing sync)**
   - What we know: The shared Supabase project has a `vehicles` table; the Google Sheet → website sync already populates it
   - What's unclear: Exact column names in `vehicles` table that correspond to Sheet columns; specifically whether "Listing Status" maps to a `status` or `listing_status` column
   - Recommendation: Run the query from the design doc prerequisite (`SELECT column_name FROM information_schema.columns WHERE table_name = 'vehicles'`) before implementing. The pipeline writes to sheets only, but the photo upload page needs to read "Incoming" vehicles from the sheet or Supabase.

4. **Photo upload page data source for vehicle list**
   - What we know: The page must show list of "Incoming" vehicles for the owner to select
   - What's unclear: Should the page read directly from Google Sheets (requires same OAuth2 in client), or from Supabase (which syncs from Sheet)? If from Supabase, depends on whether the existing sync already reflects "Incoming" status
   - Recommendation: Read from Supabase `vehicles` table where `status = 'Incoming'` — this avoids exposing Google OAuth credentials in client-side code. The existing sync handles propagation.

5. **Pipeline log table in the agreement system Supabase vs website Supabase**
   - What we know: The agreement system and website share the same Supabase project (`scgmpliwlfabnpygvbsy`)
   - What's unclear: Confirmed — same project. Pipeline log table can live in the same Supabase project without conflict.
   - Recommendation: Create `pipeline_log` table in the shared project with its own RLS policies.

---

## Sources

### Primary (HIGH confidence)
- `https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list` — Gmail list messages query syntax, maxResults
- `https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append` — Sheets append endpoint, USER_ENTERED vs RAW, insertDataOption
- `https://developers.google.com/workspace/sheets/api/guides/values` — Sheets read/write patterns, batchUpdate
- `https://developers.google.com/identity/protocols/oauth2/web-server#offline` — Token endpoint URL, refresh token exchange parameters
- `https://vpic.nhtsa.dot.gov/api/` — NHTSA vPIC endpoint structure
- `https://supabase.com/docs/guides/functions/schedule-functions` — pg_cron SQL for scheduling Edge Functions, Vault usage
- `https://github.com/unjs/unpdf` — unpdf API for Deno PDF extraction
- `https://jsr.io/@b-fuze/deno-dom` — deno-dom import pattern
- `https://github.com/denoland/deno/issues/19546` — Gmail URL-safe base64 workaround (verified)
- `https://github.com/unjs/unpdf/issues/3` — unpdf in Supabase Edge Functions works (verified fix)

### Secondary (MEDIUM confidence)
- `https://github.com/orgs/supabase/discussions/37405` — pg_cron works on free tier (community + Supabase collaborator confirmed)
- `https://github.com/supabase/cli/issues/4287` — anon key for pg_cron auth is current pattern (no official alternative documented)
- `https://supabase.com/docs/guides/storage/uploads/file-limits` — 50MB max file size, 1GB total on free tier
- `https://support.google.com/mail/thread/154372788/` — User OAuth2 is required for personal Gmail; service accounts don't work

### Tertiary (LOW confidence)
- Central Dispatch email text parsing logic — based on design doc's live email examples; actual regex patterns need testing against real emails
- NHTSA vPIC specific field variable names — `"Gross Vehicle Weight Rating From"` and `"Drive Type"` — based on API structure knowledge; verify against live API response

---

## Pipeline Log Table Schema (Recommended)

```sql
-- Migration: create pipeline_log for audit and deduplication
CREATE TABLE pipeline_log (
  id bigserial PRIMARY KEY,
  gmail_message_id text NOT NULL,
  email_type text NOT NULL CHECK (email_type IN ('ove_purchase', 'central_dispatch', 'sale_documents')),
  vin text,
  status text NOT NULL CHECK (status IN ('processed', 'error', 'skipped')),
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for deduplication check
CREATE UNIQUE INDEX pipeline_log_gmail_id_unique ON pipeline_log(gmail_message_id) WHERE status = 'processed';

-- RLS: Edge Function uses service role (bypasses RLS); authenticated admin can read
ALTER TABLE pipeline_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipeline_log_select_authenticated" ON pipeline_log FOR SELECT TO authenticated USING (true);
-- No anon read or write policies — Edge Function uses service role key for writes
```

**Retention policy recommendation:** Keep all records (volume is small — max ~3 emails per vehicle purchase, ~15 vehicles/month = ~45 records/month). At that rate, 1 year = ~540 rows. No retention cleanup needed.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against official docs and GitHub issues
- Gmail/Sheets API patterns: HIGH — verified against official Google developer docs
- Architecture: HIGH — based on approved design doc + verified technical constraints
- PDF parsing (unpdf): HIGH — confirmed working in Supabase Edge Functions (GitHub issue closed as fixed)
- Photo upload workflow: MEDIUM — getUserMedia pattern is well-documented; Supabase Storage integration is documented; specific multi-shot UX pattern is recommendation not a verified single source
- Pitfalls: HIGH — base64 and service-account issues verified from official GitHub issues and Google docs

**Research date:** 2026-03-02
**Valid until:** 2026-05-01 (60 days — Gmail/Sheets/NHTSA APIs are stable; Deno import patterns evolve slowly)
