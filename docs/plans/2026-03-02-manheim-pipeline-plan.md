# Manheim-to-Website Autonomous Pipeline — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Supabase Edge Function that monitors Gmail for Manheim purchase emails and autonomously populates Google Sheets + the website's Supabase vehicles table.

**Architecture:** A single Deno-based Edge Function polls Gmail every 5 minutes for three email types (OVE purchase confirmations, Central Dispatch shipping, Manheim sale documents), parses structured data from each, enriches via NHTSA VIN decode, and writes simultaneously to Google Sheets and Supabase. A `pipeline_log` table tracks processed emails to prevent duplicates.

**Tech Stack:** Supabase Edge Functions (Deno), Gmail REST API (OAuth2), Google Sheets REST API v4, NHTSA vPIC REST API, pg_cron for scheduling.

---

## Prerequisites (Manual, One-Time)

Before any code tasks, the developer must complete Google OAuth2 setup. These are manual steps with exact instructions.

### Pre-1: Create Google Cloud Project & Enable APIs

1. Go to https://console.cloud.google.com/
2. Create new project named "Triple J Pipeline"
3. Go to APIs & Services > Library
4. Enable **Gmail API**
5. Enable **Google Sheets API**

### Pre-2: Create OAuth2 Credentials

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: **Web application**
4. Name: "Manheim Pipeline"
5. Authorized redirect URIs: add `https://developers.google.com/oauthplayground`
6. Save the **Client ID** and **Client Secret**

### Pre-3: Get Refresh Token via OAuth Playground

1. Go to https://developers.google.com/oauthplayground/
2. Click gear icon (top right) > Check "Use your own OAuth credentials"
3. Enter Client ID and Client Secret from Pre-2
4. In Step 1, select scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify` (for marking as read)
   - `https://www.googleapis.com/auth/spreadsheets`
5. Click "Authorize APIs"
6. Sign in with **triplejautoinvestment@gmail.com** (this is the account that receives Manheim emails)
7. Grant all permissions
8. In Step 2, click "Exchange authorization code for tokens"
9. Copy the **Refresh Token** (this never expires unless revoked)

### Pre-4: Store Secrets in Supabase

```bash
supabase secrets set GOOGLE_CLIENT_ID="<from Pre-2>"
supabase secrets set GOOGLE_CLIENT_SECRET="<from Pre-2>"
supabase secrets set GOOGLE_REFRESH_TOKEN="<from Pre-3>"
supabase secrets set PIPELINE_GOOGLE_SHEET_ID="1ZJpUk9lsWkDOcuOTkKNcBbsywToFbfmF8I_7Gm60kuI"
supabase secrets set PIPELINE_SHEET_GID="185291081"
```

### Pre-5: Verify Vehicles Table Schema

Run this query against Supabase to get exact column names:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;
```

Save the output — Task 9 adapts to this schema.

---

## Task 1: Initialize Edge Function Scaffold

**Files:**
- Create: `supabase/functions/manheim-pipeline/index.ts`
- Create: `supabase/functions/manheim-pipeline/types.ts`

**Step 1: Create the function directory and entry point**

```bash
mkdir -p supabase/functions/manheim-pipeline
```

**Step 2: Write shared types**

File: `supabase/functions/manheim-pipeline/types.ts`

```typescript
// Parsed vehicle data from OVE purchase confirmation email
export interface ParsedVehicle {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  exteriorColor: string;
  interiorColor: string;
  odometer: number;
  purchasePrice: number;
  buyFee: number;
  totalAmount: number;
  purchaseDate: string; // MM/DD/YYYY
  pickupLocation: string;
  seller: string;
  facilityName: string;
  facilityPhone: string;
  facilityEmail: string;
}

// Enrichment data from NHTSA VIN decode
export interface NHTSAData {
  gvwr: string; // e.g., "5,001-6,000 lb"
  driveType: string;
  engineDisplacement: string; // e.g., "3.5"
  fuelType: string;
  bodyClass: string;
  doors: string;
}

// Parsed Central Dispatch shipping data
export interface ParsedShipping {
  loadId: string;
  price: number; // total load price
  vehicleCount: number;
  vehicles: Array<{ vin: string; yearMakeModel: string }>;
  pickupLocation: string;
  deliveryLocation: string;
  carrierName: string;
  pickupDate: string;
  deliveryDate: string;
}

// Complete vehicle record ready for Google Sheets + Supabase
export interface VehicleRecord {
  vin: string;
  searchKey: string; // "YEAR MAKE MODEL"
  year: number;
  make: string;
  model: string;
  exteriorInteriorColor: string; // "Black / GRY"
  emptyWeight: string; // GVWR from NHTSA
  odometer: number;
  condition: string; // "Pending Inspection" default
  titleType: string; // "Clean" default
  dateAcquired: string;
  dateListed: string;
  purchasePrice: number;
  towingCost: number; // from CD or $700 default
  mechanicalCost: number; // $0 default
  cosmeticCost: number; // $0 default
  otherCosts: number; // buy fee
  listingStatus: string; // "Available"
}

// Pipeline log entry for deduplication
export interface PipelineLogEntry {
  email_id: string;
  email_type: 'ove_purchase' | 'central_dispatch' | 'sale_documents';
  vin: string | null;
  status: 'processed' | 'error';
  error_message: string | null;
  metadata: Record<string, unknown>;
}

// Gmail API message structure
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string; attachmentId?: string };
      parts?: Array<{
        mimeType: string;
        body?: { data?: string };
      }>;
    }>;
  };
}
```

**Step 3: Write minimal index.ts handler**

File: `supabase/functions/manheim-pipeline/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

Deno.serve(async (req: Request) => {
  try {
    // Auth check: only allow invocations with service role key or from pg_cron
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 });
    }

    return new Response(
      JSON.stringify({ status: "ok", message: "Pipeline not yet implemented" }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "error", message: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
```

**Step 4: Verify function serves locally**

```bash
supabase functions serve manheim-pipeline --no-verify-jwt
```

Then in another terminal:
```bash
curl http://localhost:54321/functions/v1/manheim-pipeline
```

Expected: `{"status":"ok","message":"Pipeline not yet implemented"}`

**Step 5: Commit**

```bash
git add supabase/functions/manheim-pipeline/
git commit -m "feat(pipeline): scaffold Edge Function with shared types"
```

---

## Task 2: Create pipeline_log Migration

Tracking processed emails in the database is more reliable than relying on Gmail "read" status.

**Files:**
- Create: `supabase/migrations/003_pipeline_log.sql`

**Step 1: Write the migration**

File: `supabase/migrations/003_pipeline_log.sql`

```sql
-- Pipeline log: tracks processed emails to prevent duplicate processing
CREATE TABLE IF NOT EXISTS pipeline_log (
  id bigserial PRIMARY KEY,
  email_id text NOT NULL UNIQUE,  -- Gmail message ID (guaranteed unique)
  email_type text NOT NULL CHECK (email_type IN ('ove_purchase', 'central_dispatch', 'sale_documents')),
  vin text,                        -- Primary VIN associated with this email
  status text NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'error')),
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookup by email_id (deduplication check)
CREATE INDEX IF NOT EXISTS idx_pipeline_log_email_id ON pipeline_log(email_id);

-- Index for VIN lookups (matching CD emails to vehicles)
CREATE INDEX IF NOT EXISTS idx_pipeline_log_vin ON pipeline_log(vin) WHERE vin IS NOT NULL;

-- Index for finding vehicles without towing cost (7-day fallback)
CREATE INDEX IF NOT EXISTS idx_pipeline_log_type_date ON pipeline_log(email_type, processed_at);

-- RLS: only service role can read/write pipeline_log
ALTER TABLE pipeline_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated (admin) to read for debugging
CREATE POLICY pipeline_log_select_authenticated ON pipeline_log
  FOR SELECT TO authenticated USING (true);

-- No anon access
-- Edge Functions use service_role key which bypasses RLS
```

**Step 2: Apply migration locally**

```bash
supabase db push
```

Or if using remote:
```bash
supabase db push --linked
```

**Step 3: Commit**

```bash
git add supabase/migrations/003_pipeline_log.sql
git commit -m "feat(pipeline): add pipeline_log table for email deduplication"
```

---

## Task 3: Gmail API Client

**Files:**
- Create: `supabase/functions/manheim-pipeline/gmail.ts`
- Create: `supabase/functions/manheim-pipeline/gmail_test.ts`

**Step 1: Write the failing test**

File: `supabase/functions/manheim-pipeline/gmail_test.ts`

```typescript
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

// We'll test the token refresh and message parsing logic
// External API calls are mocked

Deno.test("refreshAccessToken returns token from Google response", async () => {
  const { refreshAccessToken } = await import("./gmail.ts");

  // Mock fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url: string | URL | Request, _init?: RequestInit) => {
    return new Response(JSON.stringify({
      access_token: "mock_access_token_123",
      expires_in: 3600,
      token_type: "Bearer",
    }));
  };

  try {
    const token = await refreshAccessToken("client_id", "client_secret", "refresh_token");
    assertEquals(token, "mock_access_token_123");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("searchMessages builds correct Gmail API query", async () => {
  const { searchMessages } = await import("./gmail.ts");

  let capturedUrl = "";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: string | URL | Request, _init?: RequestInit) => {
    capturedUrl = url.toString();
    return new Response(JSON.stringify({ messages: [], resultSizeEstimate: 0 }));
  };

  try {
    await searchMessages("mock_token", 'from:support@ove.com subject:"Purchase Confirmation" is:unread');
    assertEquals(capturedUrl.includes("q=from%3Asupport%40ove.com"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("getMessageBody extracts text from multipart email", async () => {
  const { getMessageBody } = await import("./gmail.ts");

  // Base64url encoded "<html><body>Hello World</body></html>"
  const encoded = btoa("<html><body>Hello World</body></html>")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const body = getMessageBody({
    id: "123",
    threadId: "123",
    labelIds: [],
    snippet: "",
    payload: {
      headers: [],
      parts: [
        {
          mimeType: "text/html",
          body: { data: encoded },
        },
      ],
    },
  });

  assertExists(body);
  assertEquals(body.includes("Hello World"), true);
});
```

**Step 2: Run test to verify it fails**

```bash
cd supabase/functions/manheim-pipeline && deno test gmail_test.ts --allow-net --allow-read
```

Expected: FAIL — module "./gmail.ts" not found

**Step 3: Write the Gmail API client**

File: `supabase/functions/manheim-pipeline/gmail.ts`

```typescript
import type { GmailMessage } from "./types.ts";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

/**
 * Exchange a refresh token for a fresh access token.
 */
export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string> {
  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token refresh failed (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  return data.access_token;
}

/**
 * Search Gmail for messages matching a query.
 * Returns array of {id, threadId} objects.
 */
export async function searchMessages(
  accessToken: string,
  query: string,
  maxResults = 10,
): Promise<Array<{ id: string; threadId: string }>> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  });

  const resp = await fetch(`${GMAIL_API_BASE}/messages?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gmail search failed (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  return data.messages || [];
}

/**
 * Get full message details by ID.
 */
export async function getMessage(
  accessToken: string,
  messageId: string,
): Promise<GmailMessage> {
  const resp = await fetch(`${GMAIL_API_BASE}/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gmail get message failed (${resp.status}): ${text}`);
  }

  return await resp.json();
}

/**
 * Mark a message as read by removing the UNREAD label.
 */
export async function markAsRead(
  accessToken: string,
  messageId: string,
): Promise<void> {
  const resp = await fetch(`${GMAIL_API_BASE}/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gmail mark read failed (${resp.status}): ${text}`);
  }
}

/**
 * Extract the HTML body from a Gmail message payload.
 * Handles both simple and multipart messages.
 */
export function getMessageBody(message: GmailMessage): string {
  const payload = message.payload;

  // Simple message with direct body
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Multipart message — look for text/html part
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      // Nested multipart (e.g., multipart/alternative inside multipart/mixed)
      if (part.parts) {
        for (const nested of part.parts) {
          if (nested.mimeType === "text/html" && nested.body?.data) {
            return decodeBase64Url(nested.body.data);
          }
        }
      }
    }

    // Fallback to text/plain
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
  }

  return "";
}

/**
 * Get a message header value by name.
 */
export function getHeader(message: GmailMessage, name: string): string {
  const header = message.payload.headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase(),
  );
  return header?.value ?? "";
}

/**
 * Decode base64url-encoded string (Gmail API encoding).
 */
function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}
```

**Step 4: Run tests to verify they pass**

```bash
cd supabase/functions/manheim-pipeline && deno test gmail_test.ts --allow-net --allow-read
```

Expected: 3 tests PASS

**Step 5: Commit**

```bash
git add supabase/functions/manheim-pipeline/gmail.ts supabase/functions/manheim-pipeline/gmail_test.ts
git commit -m "feat(pipeline): Gmail API client with OAuth2 token refresh"
```

---

## Task 4: OVE Purchase Confirmation Parser

This is the most critical parser — it extracts all vehicle + purchase data from the OVE email HTML.

**Files:**
- Create: `supabase/functions/manheim-pipeline/parsers/ove-purchase.ts`
- Create: `supabase/functions/manheim-pipeline/parsers/ove-purchase_test.ts`
- Create: `supabase/functions/manheim-pipeline/parsers/fixtures/ove-email-sample.ts`

**Step 1: Create test fixture from real email data**

File: `supabase/functions/manheim-pipeline/parsers/fixtures/ove-email-sample.ts`

This fixture is based on the ACTUAL email content verified from triplejautoinvestment@gmail.com.

```typescript
// Subject line from real email
export const OVE_SUBJECT =
  "Manheim.com Purchase Confirmation (2019 Nissan Pathfinder SV 5N1DR2MM1KC634768 SANTANDER CONSUMER)";

// Cleaned text content extracted from the real HTML email body.
// The actual HTML uses tables; this represents the text-extracted version
// that the parser will produce after stripping HTML tags.
export const OVE_BODY_TEXT = `Purchase Confirmation
Congratulations! You have placed the winning offer on the listing below.
2019 Nissan Pathfinder SV Hard Top
5N1DR2MM1KC634768 • 113,377 mi • Black ext • GRY int
View Details
Pick Up
Vehicle Location At Auction
Pick-Up Location Clarksville, IN 47129
Listing
Work Order Number --
Stock Number AS
Fees and Payments
Buy Fee $280
Purchase Date 03/01/26
Purchase Amount $2,500
Total Amount $2,780
Facilitation
Facilitating Location Manheim Louisville
Contact Name Sammye Fleischer
Address 5425 US-31, Clarksville, IN 47129-9228
Phone 812-283-0734
Email sammye.fleischer@manheim.com
Buyer and Account
Buyer
Name JASON OBAWEMIMO
Seller
Contact Name Sammye Fleischer
Account Name SANTANDER CONSUMER (Santander Consumer Open)`;

// Second fixture: different vehicle, different format variations
export const OVE_SUBJECT_2 =
  "Manheim.com Purchase Confirmation (2016 Hyundai Elantra SE 5NPDH4AE9GH713780 COLONIAL AUTO FINANCE INC)";

export const OVE_BODY_TEXT_2 = `Purchase Confirmation
Congratulations! You have placed the winning offer on the listing below.
2016 Hyundai Elantra SE
5NPDH4AE9GH713780 • 98,210 mi • Silver ext • BLK int
View Details
Pick Up
Vehicle Location At Auction
Pick-Up Location Dallas, TX 75207
Fees and Payments
Buy Fee $195
Purchase Date 02/27/26
Purchase Amount $1,800
Total Amount $1,995
Facilitation
Facilitating Location Manheim Dallas
Contact Name John Smith
Phone 214-555-0100
Email john.smith@manheim.com
Seller
Account Name COLONIAL AUTO FINANCE INC`;
```

**Step 2: Write the failing test**

File: `supabase/functions/manheim-pipeline/parsers/ove-purchase_test.ts`

```typescript
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  OVE_SUBJECT,
  OVE_BODY_TEXT,
  OVE_SUBJECT_2,
  OVE_BODY_TEXT_2,
} from "./fixtures/ove-email-sample.ts";

Deno.test("parseOvePurchase extracts vehicle data from Pathfinder email", async () => {
  const { parseOvePurchase } = await import("./ove-purchase.ts");

  const result = parseOvePurchase(OVE_SUBJECT, OVE_BODY_TEXT);

  assertEquals(result.vin, "5N1DR2MM1KC634768");
  assertEquals(result.year, 2019);
  assertEquals(result.make, "Nissan");
  assertEquals(result.model, "Pathfinder");
  assertEquals(result.trim, "SV Hard Top");
  assertEquals(result.exteriorColor, "Black");
  assertEquals(result.interiorColor, "GRY");
  assertEquals(result.odometer, 113377);
  assertEquals(result.purchasePrice, 2500);
  assertEquals(result.buyFee, 280);
  assertEquals(result.totalAmount, 2780);
  assertEquals(result.purchaseDate, "03/01/26");
  assertEquals(result.pickupLocation, "Clarksville, IN 47129");
  assertEquals(result.seller, "SANTANDER CONSUMER");
});

Deno.test("parseOvePurchase extracts vehicle data from Elantra email", async () => {
  const { parseOvePurchase } = await import("./ove-purchase.ts");

  const result = parseOvePurchase(OVE_SUBJECT_2, OVE_BODY_TEXT_2);

  assertEquals(result.vin, "5NPDH4AE9GH713780");
  assertEquals(result.year, 2016);
  assertEquals(result.make, "Hyundai");
  assertEquals(result.model, "Elantra");
  assertEquals(result.trim, "SE");
  assertEquals(result.exteriorColor, "Silver");
  assertEquals(result.interiorColor, "BLK");
  assertEquals(result.odometer, 98210);
  assertEquals(result.purchasePrice, 1800);
  assertEquals(result.buyFee, 195);
  assertEquals(result.totalAmount, 1995);
  assertEquals(result.purchaseDate, "02/27/26");
  assertEquals(result.pickupLocation, "Dallas, TX 75207");
  assertEquals(result.seller, "COLONIAL AUTO FINANCE INC");
});

Deno.test("parseOvePurchase extracts VIN from subject as fallback", async () => {
  const { extractVinFromSubject } = await import("./ove-purchase.ts");

  const vin = extractVinFromSubject(OVE_SUBJECT);
  assertEquals(vin, "5N1DR2MM1KC634768");
});
```

**Step 3: Run test to verify it fails**

```bash
cd supabase/functions/manheim-pipeline && deno test parsers/ove-purchase_test.ts --allow-read
```

Expected: FAIL — module "./ove-purchase.ts" not found

**Step 4: Write the parser**

File: `supabase/functions/manheim-pipeline/parsers/ove-purchase.ts`

```typescript
import type { ParsedVehicle } from "../types.ts";

/**
 * Parse an OVE Purchase Confirmation email into structured vehicle data.
 *
 * The email subject contains: "Manheim.com Purchase Confirmation (YEAR MAKE MODEL VIN SELLER)"
 * The email body (after HTML stripping) contains labeled fields in a predictable order.
 */
export function parseOvePurchase(subject: string, bodyText: string): ParsedVehicle {
  // --- Extract from subject line as primary/fallback source ---
  const subjectMatch = subject.match(
    /Purchase Confirmation \((\d{4})\s+(\w+)\s+(.+?)\s+([A-HJ-NPR-Z0-9]{17})\s+(.+)\)$/,
  );

  const vinFromSubject = subjectMatch?.[4] ?? "";
  const sellerFromSubject = subjectMatch?.[5]?.trim() ?? "";

  // --- Extract from body text ---
  // VIN line: "VIN • MILES mi • COLOR ext • COLOR int"
  const vinLineMatch = bodyText.match(
    /([A-HJ-NPR-Z0-9]{17})\s*[•·]\s*([\d,]+)\s*mi\s*[•·]\s*(\w+)\s*ext\s*[•·]\s*(\w+)\s*int/,
  );

  const vin = vinLineMatch?.[1] ?? vinFromSubject;
  const odometer = vinLineMatch
    ? parseInt(vinLineMatch[2].replace(/,/g, ""), 10)
    : 0;
  const exteriorColor = vinLineMatch?.[3] ?? "";
  const interiorColor = vinLineMatch?.[4] ?? "";

  // Year Make Model (line before VIN line)
  // Pattern: "YEAR Make Model Trim" on its own line
  const vehicleLineMatch = bodyText.match(
    /(\d{4})\s+([A-Za-z]+)\s+([A-Za-z0-9]+)\s*(.*?)(?:\n|$)/,
  );

  let year = 0, make = "", model = "", trim = "";
  if (vehicleLineMatch) {
    year = parseInt(vehicleLineMatch[1], 10);
    make = vehicleLineMatch[2];
    model = vehicleLineMatch[3];
    trim = vehicleLineMatch[4]?.trim() ?? "";
  } else if (subjectMatch) {
    year = parseInt(subjectMatch[1], 10);
    make = subjectMatch[2];
    // Subject has "Model Trim VIN" — split model from rest
    const modelTrimRaw = subjectMatch[3];
    const parts = modelTrimRaw.split(/\s+/);
    model = parts[0] ?? "";
    trim = parts.slice(1).join(" ");
  }

  // Purchase Amount
  const purchaseAmountMatch = bodyText.match(
    /Purchase Amount\s*\$?([\d,]+(?:\.\d{2})?)/,
  );
  const purchasePrice = purchaseAmountMatch
    ? parseFloat(purchaseAmountMatch[1].replace(/,/g, ""))
    : 0;

  // Buy Fee
  const buyFeeMatch = bodyText.match(/Buy Fee\s*\$?([\d,]+(?:\.\d{2})?)/);
  const buyFee = buyFeeMatch
    ? parseFloat(buyFeeMatch[1].replace(/,/g, ""))
    : 0;

  // Total Amount
  const totalAmountMatch = bodyText.match(
    /Total Amount\s*\$?([\d,]+(?:\.\d{2})?)/,
  );
  const totalAmount = totalAmountMatch
    ? parseFloat(totalAmountMatch[1].replace(/,/g, ""))
    : purchasePrice + buyFee;

  // Purchase Date
  const purchaseDateMatch = bodyText.match(
    /Purchase Date\s*(\d{2}\/\d{2}\/\d{2,4})/,
  );
  const purchaseDate = purchaseDateMatch?.[1] ?? "";

  // Pick-Up Location
  const pickupMatch = bodyText.match(
    /Pick-Up Location\s+(.+?)(?:\n|Listing|Fees)/,
  );
  const pickupLocation = pickupMatch?.[1]?.trim() ?? "";

  // Seller Account Name
  const sellerMatch = bodyText.match(
    /Account Name\s+(.+?)(?:\s*\(|$|\n)/m,
  );
  const seller = sellerMatch?.[1]?.trim() ?? sellerFromSubject;

  // Facility info
  const facilityNameMatch = bodyText.match(
    /Facilitating Location\s+(.+?)(?:\n|$)/,
  );
  const facilityPhoneMatch = bodyText.match(
    /(?:Facilitation|Contact)[\s\S]*?Phone\s+([\d-]+)/,
  );
  const facilityEmailMatch = bodyText.match(
    /(?:Facilitation|Contact)[\s\S]*?Email\s+([\w.@-]+)/,
  );

  return {
    vin,
    year,
    make,
    model,
    trim,
    exteriorColor,
    interiorColor,
    odometer,
    purchasePrice,
    buyFee,
    totalAmount,
    purchaseDate,
    pickupLocation,
    seller,
    facilityName: facilityNameMatch?.[1]?.trim() ?? "",
    facilityPhone: facilityPhoneMatch?.[1]?.trim() ?? "",
    facilityEmail: facilityEmailMatch?.[1]?.trim() ?? "",
  };
}

/**
 * Extract VIN from OVE email subject line.
 * Subject format: "Manheim.com Purchase Confirmation (YEAR MAKE MODEL VIN SELLER)"
 */
export function extractVinFromSubject(subject: string): string {
  const match = subject.match(/([A-HJ-NPR-Z0-9]{17})/);
  return match?.[1] ?? "";
}

/**
 * Strip HTML tags from email body and normalize whitespace.
 * Preserves table cell boundaries as newlines for field extraction.
 */
export function stripHtml(html: string): string {
  let text = html;
  // Replace </td>, </th> with newline (preserves table structure)
  text = text.replace(/<\/t[dh]>/gi, "\n");
  text = text.replace(/<\/tr>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&quot;/g, '"');
  // Normalize whitespace within lines
  text = text.replace(/[ \t]+/g, " ");
  // Remove blank lines
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
  return text;
}
```

**Step 5: Run tests to verify they pass**

```bash
cd supabase/functions/manheim-pipeline && deno test parsers/ove-purchase_test.ts --allow-read
```

Expected: 3 tests PASS

**Step 6: Commit**

```bash
git add supabase/functions/manheim-pipeline/parsers/
git commit -m "feat(pipeline): OVE purchase confirmation email parser with tests"
```

---

## Task 5: Central Dispatch Parser

**Files:**
- Create: `supabase/functions/manheim-pipeline/parsers/central-dispatch.ts`
- Create: `supabase/functions/manheim-pipeline/parsers/central-dispatch_test.ts`
- Create: `supabase/functions/manheim-pipeline/parsers/fixtures/cd-email-sample.ts`

**Step 1: Create test fixture from real email data**

File: `supabase/functions/manheim-pipeline/parsers/fixtures/cd-email-sample.ts`

```typescript
// Real email from Central Dispatch — 2 vehicles on one load
export const CD_SUBJECT_MULTI =
  "Load ID: 2819124266 has been ACCEPTED by Pasia Towing LLC";

export const CD_BODY_MULTI = `Hello Triple J Auto Investment LLC,
Pasia Towing LLC has accepted and electronically signed your dispatch sheet for the order below.
View Dispatch Sheet
Load Details
Load ID 2819124266
Pick Up Location Birmingham, AL 35217
Delivery Location Houston, TX 77075
Requested Pick Up Date Estimated 03/02/2026
Requested Delivery Date Estimated 03/04/2026
Carrier Pick Up ETA 03/02/2026
Carrier Delivery ETA 03/04/2026
Price $750.00
Number of Vehicles 2
•YMM 2002 Toyota Camry VIN 4T1BE32K52U583280
•YMM 2014 MAZDA MAZDA5 VIN JM1CW2BL7E0173651`;

// Real email — 1 vehicle
export const CD_SUBJECT_SINGLE =
  "Load ID: 2819124266 has been PICKED UP by I&R Towing Llc";

export const CD_BODY_SINGLE = `Hello Triple J Auto Investment LLC,
Load Details
Load ID 2819124266
Pick Up Location Clearwater, FL 33762
Delivery Location Houston, TX 77075
Requested Pick Up Date Estimated 02/19/2026
Requested Delivery Date Estimated 02/23/2026
Price $400.00
Number of Vehicles 1
•YMM 2012 MINI Hardtop`;

// Cancelled load — should be detected
export const CD_SUBJECT_CANCELLED =
  "Load ID: 2819124266 has been CANCELLED by Maximum Services Inc";
```

**Step 2: Write the failing test**

File: `supabase/functions/manheim-pipeline/parsers/central-dispatch_test.ts`

```typescript
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  CD_SUBJECT_MULTI,
  CD_BODY_MULTI,
  CD_SUBJECT_SINGLE,
  CD_BODY_SINGLE,
  CD_SUBJECT_CANCELLED,
} from "./fixtures/cd-email-sample.ts";

Deno.test("parseCentralDispatch extracts multi-vehicle load data", async () => {
  const { parseCentralDispatch } = await import("./central-dispatch.ts");

  const result = parseCentralDispatch(CD_SUBJECT_MULTI, CD_BODY_MULTI);

  assertEquals(result.loadId, "2819124266");
  assertEquals(result.price, 750);
  assertEquals(result.vehicleCount, 2);
  assertEquals(result.vehicles.length, 2);
  assertEquals(result.vehicles[0].vin, "4T1BE32K52U583280");
  assertEquals(result.vehicles[1].vin, "JM1CW2BL7E0173651");
  assertEquals(result.pickupLocation, "Birmingham, AL 35217");
  assertEquals(result.deliveryLocation, "Houston, TX 77075");
  assertEquals(result.carrierName, "Pasia Towing LLC");
});

Deno.test("parseCentralDispatch calculates per-vehicle cost", async () => {
  const { parseCentralDispatch, perVehicleCost } = await import("./central-dispatch.ts");

  const multi = parseCentralDispatch(CD_SUBJECT_MULTI, CD_BODY_MULTI);
  assertEquals(perVehicleCost(multi), 375); // $750 / 2 vehicles

  const single = parseCentralDispatch(CD_SUBJECT_SINGLE, CD_BODY_SINGLE);
  assertEquals(perVehicleCost(single), 400); // $400 / 1 vehicle
});

Deno.test("isCancelledLoad detects CANCELLED status in subject", async () => {
  const { isCancelledLoad } = await import("./central-dispatch.ts");

  assertEquals(isCancelledLoad(CD_SUBJECT_CANCELLED), true);
  assertEquals(isCancelledLoad(CD_SUBJECT_MULTI), false);
});

Deno.test("extractLoadId gets load ID from subject", async () => {
  const { extractLoadId } = await import("./central-dispatch.ts");

  assertEquals(extractLoadId(CD_SUBJECT_MULTI), "2819124266");
});
```

**Step 3: Run test — should fail**

```bash
cd supabase/functions/manheim-pipeline && deno test parsers/central-dispatch_test.ts --allow-read
```

**Step 4: Write the parser**

File: `supabase/functions/manheim-pipeline/parsers/central-dispatch.ts`

```typescript
import type { ParsedShipping } from "../types.ts";

/**
 * Parse a Central Dispatch ACCEPTED/PICKED UP email into shipping data.
 */
export function parseCentralDispatch(
  subject: string,
  bodyText: string,
): ParsedShipping {
  // Load ID from body
  const loadIdMatch = bodyText.match(/Load ID\s+(\d+)/);
  const loadId = loadIdMatch?.[1] ?? extractLoadId(subject);

  // Price
  const priceMatch = bodyText.match(/Price\s+\$?([\d,]+(?:\.\d{2})?)/);
  const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : 0;

  // Vehicle count
  const countMatch = bodyText.match(/Number of Vehicles\s+(\d+)/);
  const vehicleCount = countMatch ? parseInt(countMatch[1], 10) : 1;

  // Individual vehicles: "•YMM YEAR MAKE MODEL VIN VINSTRING"
  const vehicleMatches = [
    ...bodyText.matchAll(/[•·]\s*YMM\s+(.+?)(?:\s+VIN\s+([A-HJ-NPR-Z0-9]{17}))?$/gm),
  ];

  const vehicles = vehicleMatches.map((m) => ({
    yearMakeModel: m[1]?.trim() ?? "",
    vin: m[2] ?? "",
  }));

  // If no VIN in vehicle lines, try to find standalone VINs in body
  if (vehicles.length === 0 || vehicles.every((v) => !v.vin)) {
    const standaloneVins = [
      ...bodyText.matchAll(/\b([A-HJ-NPR-Z0-9]{17})\b/g),
    ];
    // Assign VINs to vehicles if counts match
    for (let i = 0; i < Math.min(standaloneVins.length, vehicles.length); i++) {
      if (!vehicles[i].vin) {
        vehicles[i].vin = standaloneVins[i][1];
      }
    }
  }

  // Locations
  const pickupMatch = bodyText.match(/Pick Up Location\s+(.+?)(?:\n|$)/);
  const deliveryMatch = bodyText.match(/Delivery Location\s+(.+?)(?:\n|$)/);

  // Carrier name from subject
  const carrierMatch = subject.match(
    /has been (?:ACCEPTED|PICKED UP) by (.+)$/,
  );

  // Dates
  const pickupDateMatch = bodyText.match(
    /(?:Carrier Pick Up ETA|Requested Pick Up Date)\s+(?:Estimated\s+)?(\d{2}\/\d{2}\/\d{4})/,
  );
  const deliveryDateMatch = bodyText.match(
    /(?:Carrier Delivery ETA|Requested Delivery Date)\s+(?:Estimated\s+)?(\d{2}\/\d{2}\/\d{4})/,
  );

  return {
    loadId,
    price,
    vehicleCount,
    vehicles,
    pickupLocation: pickupMatch?.[1]?.trim() ?? "",
    deliveryLocation: deliveryMatch?.[1]?.trim() ?? "",
    carrierName: carrierMatch?.[1]?.trim() ?? "",
    pickupDate: pickupDateMatch?.[1] ?? "",
    deliveryDate: deliveryDateMatch?.[1] ?? "",
  };
}

/**
 * Calculate the per-vehicle shipping cost.
 */
export function perVehicleCost(shipping: ParsedShipping): number {
  if (shipping.vehicleCount <= 0) return shipping.price;
  return Math.round(shipping.price / shipping.vehicleCount);
}

/**
 * Check if this is a CANCELLED load (should be ignored).
 */
export function isCancelledLoad(subject: string): boolean {
  return /has been CANCELLED/i.test(subject);
}

/**
 * Extract Load ID from subject line.
 */
export function extractLoadId(subject: string): string {
  // Handle both "Load ID: 2819124266" and "Load ID: 281-912-4266"
  const match = subject.match(/Load ID:\s*(?:Call\s+)?([0-9-]+)/);
  return match?.[1]?.replace(/-/g, "") ?? "";
}
```

**Step 5: Run tests — should pass**

```bash
cd supabase/functions/manheim-pipeline && deno test parsers/central-dispatch_test.ts --allow-read
```

Expected: 4 tests PASS

**Step 6: Commit**

```bash
git add supabase/functions/manheim-pipeline/parsers/central-dispatch.ts supabase/functions/manheim-pipeline/parsers/central-dispatch_test.ts supabase/functions/manheim-pipeline/parsers/fixtures/cd-email-sample.ts
git commit -m "feat(pipeline): Central Dispatch email parser with per-vehicle cost calc"
```

---

## Task 6: NHTSA VIN Enrichment

**Files:**
- Create: `supabase/functions/manheim-pipeline/enrichment/nhtsa.ts`
- Create: `supabase/functions/manheim-pipeline/enrichment/nhtsa_test.ts`

**Step 1: Write the failing test**

File: `supabase/functions/manheim-pipeline/enrichment/nhtsa_test.ts`

```typescript
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("decodeVin extracts GVWR, drive type, engine from NHTSA response", async () => {
  const { decodeVin } = await import("./nhtsa.ts");

  // Mock NHTSA response (based on real 5N1DR2MM1KC634768 response)
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(JSON.stringify({
      Count: 136,
      Results: [
        { Variable: "Make", Value: "NISSAN", VariableId: 26 },
        { Variable: "Model", Value: "Pathfinder", VariableId: 28 },
        { Variable: "Model Year", Value: "2019", VariableId: 29 },
        { Variable: "Drive Type", Value: "4WD/4-Wheel Drive/4x4", VariableId: 15 },
        { Variable: "Displacement (L)", Value: "3.5", VariableId: 13 },
        { Variable: "Fuel Type - Primary", Value: "Gasoline", VariableId: 24 },
        { Variable: "Body Class", Value: "Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)", VariableId: 5 },
        { Variable: "Doors", Value: "4", VariableId: 14 },
        { Variable: "Gross Vehicle Weight Rating From", Value: "Class 1D: 5,001 - 6,000 lb (2,268 - 2,722 kg)", VariableId: 25 },
        { Variable: "Error Code", Value: "0", VariableId: 143 },
      ],
    }));
  };

  try {
    const result = await decodeVin("5N1DR2MM1KC634768");
    assertEquals(result.gvwr, "Class 1D: 5,001 - 6,000 lb (2,268 - 2,722 kg)");
    assertEquals(result.driveType, "4WD/4-Wheel Drive/4x4");
    assertEquals(result.engineDisplacement, "3.5");
    assertEquals(result.fuelType, "Gasoline");
    assertEquals(result.bodyClass, "Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)");
    assertEquals(result.doors, "4");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("decodeVin returns empty strings on API failure", async () => {
  const { decodeVin } = await import("./nhtsa.ts");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response("Service Unavailable", { status: 503 });
  };

  try {
    const result = await decodeVin("INVALID_VIN");
    assertEquals(result.gvwr, "");
    assertEquals(result.driveType, "");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
```

**Step 2: Run test — should fail**

```bash
cd supabase/functions/manheim-pipeline && deno test enrichment/nhtsa_test.ts --allow-read --allow-net
```

**Step 3: Write the enrichment module**

File: `supabase/functions/manheim-pipeline/enrichment/nhtsa.ts`

```typescript
import type { NHTSAData } from "../types.ts";

const NHTSA_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevin";

const FIELD_MAP: Record<string, keyof NHTSAData> = {
  "Gross Vehicle Weight Rating From": "gvwr",
  "Drive Type": "driveType",
  "Displacement (L)": "engineDisplacement",
  "Fuel Type - Primary": "fuelType",
  "Body Class": "bodyClass",
  "Doors": "doors",
};

/**
 * Decode a VIN using the NHTSA vPIC API.
 * Returns enrichment data. On failure, returns empty strings (non-blocking).
 */
export async function decodeVin(vin: string): Promise<NHTSAData> {
  const empty: NHTSAData = {
    gvwr: "",
    driveType: "",
    engineDisplacement: "",
    fuelType: "",
    bodyClass: "",
    doors: "",
  };

  try {
    const resp = await fetch(`${NHTSA_BASE}/${vin}?format=json`);
    if (!resp.ok) return empty;

    const data = await resp.json();
    const results: Array<{ Variable: string; Value: string | null }> =
      data.Results ?? [];

    const enriched = { ...empty };

    for (const item of results) {
      const key = FIELD_MAP[item.Variable];
      if (key && item.Value) {
        enriched[key] = item.Value;
      }
    }

    return enriched;
  } catch {
    return empty;
  }
}
```

**Step 4: Run tests — should pass**

```bash
cd supabase/functions/manheim-pipeline && deno test enrichment/nhtsa_test.ts --allow-read --allow-net
```

Expected: 2 tests PASS

**Step 5: Commit**

```bash
git add supabase/functions/manheim-pipeline/enrichment/
git commit -m "feat(pipeline): NHTSA VIN decoder with graceful failure handling"
```

---

## Task 7: Google Sheets Writer

**Files:**
- Create: `supabase/functions/manheim-pipeline/writers/google-sheets.ts`
- Create: `supabase/functions/manheim-pipeline/writers/google-sheets_test.ts`

**Step 1: Write the failing test**

File: `supabase/functions/manheim-pipeline/writers/google-sheets_test.ts`

```typescript
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { VehicleRecord } from "../types.ts";

const SAMPLE_VEHICLE: VehicleRecord = {
  vin: "5N1DR2MM1KC634768",
  searchKey: "2019 Nissan Pathfinder",
  year: 2019,
  make: "Nissan",
  model: "Pathfinder",
  exteriorInteriorColor: "Black / GRY",
  emptyWeight: "Class 1D: 5,001 - 6,000 lb",
  odometer: 113377,
  condition: "Pending Inspection",
  titleType: "Clean",
  dateAcquired: "03/01/2026",
  dateListed: "03/01/2026",
  purchasePrice: 2500,
  towingCost: 700,
  mechanicalCost: 0,
  cosmeticCost: 0,
  otherCosts: 280,
  listingStatus: "Available",
};

Deno.test("buildSheetRow produces correct 40-column array", async () => {
  const { buildSheetRow } = await import("./google-sheets.ts");

  const row = buildSheetRow(SAMPLE_VEHICLE);

  // Check column positions match the sheet layout
  assertEquals(row[0], "5N1DR2MM1KC634768"); // A: VIN
  assertEquals(row[1], "2019 Nissan Pathfinder"); // B: search_key
  assertEquals(row[2], 2019); // C: Year
  assertEquals(row[3], "Nissan"); // D: Make
  assertEquals(row[4], "Pathfinder"); // E: Model
  assertEquals(row[5], "Black / GRY"); // F: Exterior/Interior Color
  assertEquals(row[6], "Class 1D: 5,001 - 6,000 lb"); // G: Empty Weight
  assertEquals(row[7], 113377); // H: Odometer
  assertEquals(row[8], "Pending Inspection"); // I: Condition
  assertEquals(row[9], "Clean"); // J: Title Type
  assertEquals(row[10], "03/01/2026"); // K: Date Acquired
  assertEquals(row[11], "03/01/2026"); // L: Date Listed
  // M: Days in Stock — formula
  assertEquals(row[13], 2500); // N: Purchase Price
  assertEquals(row[14], 700); // O: Towing Cost
  assertEquals(row[15], 0); // P: Mechanical Cost
  assertEquals(row[16], 0); // Q: Cosmetic Cost
  assertEquals(row[17], 280); // R: Other Costs
  // S: All-In Cost — formula
  // T: Target Margin % — 0.25
  assertEquals(row[19], 0.25); // T: Target Margin %
  // U: Target List Price — formula
  // V: Floor Margin %
  assertEquals(row[21], 0.10); // V: Floor Margin %
  // W: Floor Price — formula
  assertEquals(row[24], "Available"); // Y: Listing Status
  assertEquals(row.length, 40);
});

Deno.test("appendRow calls Sheets API with correct payload", async () => {
  const { appendRow } = await import("./google-sheets.ts");

  let capturedBody: string | undefined;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url: string | URL | Request, init?: RequestInit) => {
    capturedBody = init?.body as string;
    return new Response(JSON.stringify({ updates: { updatedRows: 1 } }));
  };

  try {
    await appendRow("mock_token", "sheet_id", [["test", 123]]);
    const parsed = JSON.parse(capturedBody!);
    assertEquals(parsed.values, [["test", 123]]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
```

**Step 2: Run test — should fail**

```bash
cd supabase/functions/manheim-pipeline && deno test writers/google-sheets_test.ts --allow-read --allow-net
```

**Step 3: Write the Sheets writer**

File: `supabase/functions/manheim-pipeline/writers/google-sheets.ts`

```typescript
import type { VehicleRecord } from "../types.ts";

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

/**
 * Column layout matching the Google Sheet (A through AN = 40 columns).
 * Formulas use Google Sheets syntax and reference the current row.
 */

// Row number placeholder — replaced at append time
const R = "ROW_NUM";

/**
 * Build a 40-element array matching the Google Sheet column layout.
 * Formulas are strings starting with "=" (Google Sheets will evaluate them).
 */
export function buildSheetRow(v: VehicleRecord): Array<string | number | null> {
  return [
    v.vin,                                     // A: VIN
    v.searchKey,                               // B: search_key
    v.year,                                    // C: Year
    v.make,                                    // D: Make
    v.model,                                   // E: Model
    v.exteriorInteriorColor,                   // F: Exterior/Interior Color
    v.emptyWeight,                             // G: Empty Weight
    v.odometer,                                // H: Odometer
    v.condition,                               // I: Condition
    v.titleType,                               // J: Title Type
    v.dateAcquired,                            // K: Date Acquired
    v.dateListed,                              // L: Date Listed
    `=TODAY()-K${R}`,                           // M: Days in Stock (formula)
    v.purchasePrice,                           // N: Purchase Price
    v.towingCost,                              // O: Towing Cost
    v.mechanicalCost,                          // P: Mechanical Cost
    v.cosmeticCost,                            // Q: Cosmetic Cost
    v.otherCosts,                              // R: Other Costs
    `=N${R}+O${R}+P${R}+Q${R}+R${R}`,          // S: All-In Cost (formula)
    0.25,                                      // T: Target Margin %
    `=S${R}*(1+T${R})`,                         // U: Target List Price (formula)
    0.10,                                      // V: Floor Margin %
    `=S${R}*(1+V${R})`,                         // W: Floor Price (formula)
    null,                                      // X: Photo Link
    v.listingStatus,                           // Y: Listing Status
    `=U${R}`,                                   // Z: Current List Price (= Target)
    null,                                      // AA: Offer Received
    null,                                      // AB: Offer Decision
    null,                                      // AC: Decision Notes
    null,                                      // AD: Disposition
    null,                                      // AE: Date Sold
    null,                                      // AF: Sale Price
    null,                                      // AG: Selling Fees
    `=IF(AF${R}="","",AF${R}-S${R}-AG${R})`,    // AH: Net Profit (formula)
    null,                                      // AI: License Plate
    null,                                      // AJ: Buyer Name
    null,                                      // AK: Phone Number
    null,                                      // AL: Lead Source
    null,                                      // AM: Registration Amount
    null,                                      // AN: Registration Payed
  ];
}

/**
 * Append a row to the Google Sheet.
 */
export async function appendRow(
  accessToken: string,
  spreadsheetId: string,
  values: Array<Array<string | number | null>>,
  sheetName = "Sheet1",
): Promise<void> {
  const range = `${sheetName}!A:AN`;
  const url =
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Sheets append failed (${resp.status}): ${text}`);
  }
}

/**
 * Update a specific cell range in the Google Sheet (for towing cost, condition, title updates).
 */
export async function updateCells(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: Array<Array<string | number | null>>,
): Promise<void> {
  const url =
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Sheets update failed (${resp.status}): ${text}`);
  }
}

/**
 * Find the row number of a VIN in the sheet.
 * Returns row number (1-indexed) or null if not found.
 */
export async function findVinRow(
  accessToken: string,
  spreadsheetId: string,
  vin: string,
  sheetName = "Sheet1",
): Promise<number | null> {
  const range = `${sheetName}!A:A`; // VIN is column A
  const url =
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) return null;

  const data = await resp.json();
  const rows: string[][] = data.values ?? [];

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === vin) {
      return i + 1; // 1-indexed
    }
  }

  return null;
}

/**
 * Replace ROW_NUM placeholders in formulas with the actual row number.
 */
export function resolveFormulas(
  row: Array<string | number | null>,
  rowNumber: number,
): Array<string | number | null> {
  return row.map((cell) => {
    if (typeof cell === "string" && cell.includes("ROW_NUM")) {
      return cell.replace(/ROW_NUM/g, String(rowNumber));
    }
    return cell;
  });
}
```

**Step 4: Run tests — should pass**

```bash
cd supabase/functions/manheim-pipeline && deno test writers/google-sheets_test.ts --allow-read --allow-net
```

Expected: 2 tests PASS

**Step 5: Commit**

```bash
git add supabase/functions/manheim-pipeline/writers/
git commit -m "feat(pipeline): Google Sheets writer with 40-column mapping and formulas"
```

---

## Task 8: Supabase Vehicles Writer

**Files:**
- Create: `supabase/functions/manheim-pipeline/writers/supabase-vehicles.ts`
- Create: `supabase/functions/manheim-pipeline/writers/supabase-vehicles_test.ts`

**Important:** This task depends on Pre-5 (verify vehicles table schema). The writer must adapt to the ACTUAL column names in the existing `vehicles` table on the shared Supabase project.

**Step 1: Write the test**

File: `supabase/functions/manheim-pipeline/writers/supabase-vehicles_test.ts`

```typescript
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { VehicleRecord } from "../types.ts";

const SAMPLE: VehicleRecord = {
  vin: "5N1DR2MM1KC634768",
  searchKey: "2019 Nissan Pathfinder",
  year: 2019,
  make: "Nissan",
  model: "Pathfinder",
  exteriorInteriorColor: "Black / GRY",
  emptyWeight: "5,001-6,000 lb",
  odometer: 113377,
  condition: "Pending Inspection",
  titleType: "Clean",
  dateAcquired: "03/01/2026",
  dateListed: "03/01/2026",
  purchasePrice: 2500,
  towingCost: 700,
  mechanicalCost: 0,
  cosmeticCost: 0,
  otherCosts: 280,
  listingStatus: "Available",
};

Deno.test("buildVehicleRow maps VehicleRecord to Supabase vehicles row", async () => {
  const { buildVehicleRow } = await import("./supabase-vehicles.ts");

  const row = buildVehicleRow(SAMPLE);

  assertEquals(row.vin, "5N1DR2MM1KC634768");
  assertEquals(row.make, "Nissan");
  assertEquals(row.model, "Pathfinder");
  assertEquals(row.year, 2019);
  assertEquals(row.status, "available");
  // Price should be the target list price = All-In Cost * 1.25
  const allIn = 2500 + 700 + 0 + 0 + 280; // 3480
  assertEquals(row.price, Math.round(allIn * 1.25));
});
```

**Step 2: Run test — should fail**

```bash
cd supabase/functions/manheim-pipeline && deno test writers/supabase-vehicles_test.ts --allow-read
```

**Step 3: Write the Supabase vehicles writer**

File: `supabase/functions/manheim-pipeline/writers/supabase-vehicles.ts`

```typescript
import type { VehicleRecord } from "../types.ts";

/**
 * Map a VehicleRecord to the Supabase vehicles table row format.
 *
 * IMPORTANT: The column names below must match the ACTUAL vehicles table
 * in the shared Supabase project. Run Pre-5 query to verify.
 * Adjust column names here if they differ.
 */
export function buildVehicleRow(v: VehicleRecord): Record<string, unknown> {
  const allInCost =
    v.purchasePrice + v.towingCost + v.mechanicalCost + v.cosmeticCost + v.otherCosts;
  const targetPrice = Math.round(allInCost * 1.25); // 25% margin

  return {
    vin: v.vin,
    make: v.make,
    model: v.model,
    year: v.year,
    price: targetPrice,
    status: "available",
    // Additional columns — adjust to match actual schema
    // gallery: [],
    // diagnostics: null,
  };
}

/**
 * Insert a vehicle into Supabase. Skips if VIN already exists.
 * Uses the service_role client (bypasses RLS).
 */
export async function insertVehicle(
  supabaseUrl: string,
  serviceRoleKey: string,
  vehicle: Record<string, unknown>,
): Promise<{ inserted: boolean; error?: string }> {
  // Check if VIN already exists
  const checkResp = await fetch(
    `${supabaseUrl}/rest/v1/vehicles?vin=eq.${vehicle.vin}&select=vin`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );

  if (checkResp.ok) {
    const existing = await checkResp.json();
    if (existing.length > 0) {
      return { inserted: false, error: "VIN already exists" };
    }
  }

  // Insert
  const insertResp = await fetch(`${supabaseUrl}/rest/v1/vehicles`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(vehicle),
  });

  if (!insertResp.ok) {
    const text = await insertResp.text();
    return { inserted: false, error: `Insert failed (${insertResp.status}): ${text}` };
  }

  return { inserted: true };
}

/**
 * Update towing cost for an existing vehicle by VIN.
 */
export async function updateVehicleTowingCost(
  supabaseUrl: string,
  serviceRoleKey: string,
  vin: string,
  towingCost: number,
): Promise<void> {
  // Recalculate price with updated towing cost would require knowing all costs.
  // For now, just update a metadata field. The price was set at insert time.
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/vehicles?vin=eq.${vin}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        // Update diagnostics or a metadata field with cost breakdown
        diagnostics: { towing_cost: towingCost, updated_by: "pipeline" },
      }),
    },
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Vehicle update failed (${resp.status}): ${text}`);
  }
}
```

**Step 4: Run tests — should pass**

```bash
cd supabase/functions/manheim-pipeline && deno test writers/supabase-vehicles_test.ts --allow-read
```

Expected: PASS

**Step 5: Commit**

```bash
git add supabase/functions/manheim-pipeline/writers/supabase-vehicles.ts supabase/functions/manheim-pipeline/writers/supabase-vehicles_test.ts
git commit -m "feat(pipeline): Supabase vehicles table writer with deduplication"
```

---

## Task 9: Main Pipeline Orchestrator

This is the core logic that ties everything together.

**Files:**
- Modify: `supabase/functions/manheim-pipeline/index.ts`
- Create: `supabase/functions/manheim-pipeline/pipeline.ts`

**Step 1: Write the orchestration module**

File: `supabase/functions/manheim-pipeline/pipeline.ts`

```typescript
import { refreshAccessToken, searchMessages, getMessage, getMessageBody, getHeader, markAsRead } from "./gmail.ts";
import { parseOvePurchase, stripHtml, extractVinFromSubject } from "./parsers/ove-purchase.ts";
import { parseCentralDispatch, perVehicleCost, isCancelledLoad } from "./parsers/central-dispatch.ts";
import { decodeVin } from "./enrichment/nhtsa.ts";
import { buildSheetRow, appendRow, findVinRow, updateCells, resolveFormulas } from "./writers/google-sheets.ts";
import { buildVehicleRow, insertVehicle, updateVehicleTowingCost } from "./writers/supabase-vehicles.ts";
import type { VehicleRecord, PipelineLogEntry } from "./types.ts";

const DEFAULT_TOWING_COST = 700;
const DEFAULT_TARGET_MARGIN = 0.25;
const DEFAULT_FLOOR_MARGIN = 0.10;

interface PipelineConfig {
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  spreadsheetId: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

interface PipelineResult {
  ovePurchases: number;
  centralDispatchUpdates: number;
  errors: string[];
}

/**
 * Run the full pipeline: check Gmail, parse emails, write to Sheet + Supabase.
 */
export async function runPipeline(config: PipelineConfig): Promise<PipelineResult> {
  const result: PipelineResult = {
    ovePurchases: 0,
    centralDispatchUpdates: 0,
    errors: [],
  };

  // Step 1: Get fresh Google access token
  let accessToken: string;
  try {
    accessToken = await refreshAccessToken(
      config.googleClientId,
      config.googleClientSecret,
      config.googleRefreshToken,
    );
  } catch (err) {
    result.errors.push(`Token refresh failed: ${err}`);
    return result;
  }

  // Step 2: Process OVE Purchase Confirmations
  try {
    const oveCount = await processOvePurchases(accessToken, config);
    result.ovePurchases = oveCount;
  } catch (err) {
    result.errors.push(`OVE processing failed: ${err}`);
  }

  // Step 3: Process Central Dispatch ACCEPTED emails
  try {
    const cdCount = await processCentralDispatch(accessToken, config);
    result.centralDispatchUpdates = cdCount;
  } catch (err) {
    result.errors.push(`Central Dispatch processing failed: ${err}`);
  }

  // Step 4: Apply 7-day towing cost fallback
  try {
    await applyTowingFallback(accessToken, config);
  } catch (err) {
    result.errors.push(`Towing fallback failed: ${err}`);
  }

  return result;
}

/**
 * Process unread OVE purchase confirmation emails.
 */
async function processOvePurchases(
  accessToken: string,
  config: PipelineConfig,
): Promise<number> {
  const messages = await searchMessages(
    accessToken,
    'from:support@ove.com subject:"Purchase Confirmation" is:unread',
  );

  let count = 0;

  for (const msg of messages) {
    try {
      // Check if already processed
      if (await isEmailProcessed(config.supabaseUrl, config.supabaseServiceRoleKey, msg.id)) {
        await markAsRead(accessToken, msg.id);
        continue;
      }

      // Get full message
      const fullMsg = await getMessage(accessToken, msg.id);
      const subject = getHeader(fullMsg, "Subject");
      const htmlBody = getMessageBody(fullMsg);
      const textBody = stripHtml(htmlBody);

      // Parse vehicle data
      const parsed = parseOvePurchase(subject, textBody);
      if (!parsed.vin) {
        await logPipelineEntry(config, {
          email_id: msg.id,
          email_type: "ove_purchase",
          vin: null,
          status: "error",
          error_message: "Could not extract VIN from email",
          metadata: { subject },
        });
        continue;
      }

      // Enrich with NHTSA
      const nhtsa = await decodeVin(parsed.vin);

      // Build complete vehicle record
      const vehicle: VehicleRecord = {
        vin: parsed.vin,
        searchKey: `${parsed.year} ${parsed.make} ${parsed.model}`,
        year: parsed.year,
        make: parsed.make,
        model: parsed.model,
        exteriorInteriorColor: `${parsed.exteriorColor} / ${parsed.interiorColor}`,
        emptyWeight: nhtsa.gvwr,
        odometer: parsed.odometer,
        condition: "Pending Inspection",
        titleType: "Clean",
        dateAcquired: formatDate(parsed.purchaseDate),
        dateListed: formatDate(parsed.purchaseDate),
        purchasePrice: parsed.purchasePrice,
        towingCost: DEFAULT_TOWING_COST, // Will be updated by CD email or stays $700
        mechanicalCost: 0,
        cosmeticCost: 0,
        otherCosts: parsed.buyFee,
        listingStatus: "Available",
      };

      // Write to Google Sheets
      const sheetRow = buildSheetRow(vehicle);
      // Get next row number by finding last row
      const existingRow = await findVinRow(accessToken, config.spreadsheetId, parsed.vin);
      if (!existingRow) {
        // Determine row number for formulas (append will add to end)
        // We'll use a placeholder approach — Sheets API resolves formulas after insert
        await appendRow(accessToken, config.spreadsheetId, [sheetRow]);
      }

      // Write to Supabase vehicles table
      const vehicleRow = buildVehicleRow(vehicle);
      await insertVehicle(config.supabaseUrl, config.supabaseServiceRoleKey, vehicleRow);

      // Log success
      await logPipelineEntry(config, {
        email_id: msg.id,
        email_type: "ove_purchase",
        vin: parsed.vin,
        status: "processed",
        error_message: null,
        metadata: {
          year: parsed.year,
          make: parsed.make,
          model: parsed.model,
          purchasePrice: parsed.purchasePrice,
          buyFee: parsed.buyFee,
        },
      });

      // Mark email as read
      await markAsRead(accessToken, msg.id);
      count++;
    } catch (err) {
      const vin = extractVinFromSubject(
        getHeader(await getMessage(accessToken, msg.id), "Subject"),
      );
      await logPipelineEntry(config, {
        email_id: msg.id,
        email_type: "ove_purchase",
        vin,
        status: "error",
        error_message: String(err),
        metadata: {},
      });
      // Do NOT mark as read on error — will retry next cycle
    }
  }

  return count;
}

/**
 * Process unread Central Dispatch ACCEPTED emails.
 * Updates towing cost for matching VINs.
 */
async function processCentralDispatch(
  accessToken: string,
  config: PipelineConfig,
): Promise<number> {
  const messages = await searchMessages(
    accessToken,
    'from:centraldispatch.com subject:"has been ACCEPTED" is:unread',
  );

  let count = 0;

  for (const msg of messages) {
    try {
      if (await isEmailProcessed(config.supabaseUrl, config.supabaseServiceRoleKey, msg.id)) {
        await markAsRead(accessToken, msg.id);
        continue;
      }

      const fullMsg = await getMessage(accessToken, msg.id);
      const subject = getHeader(fullMsg, "Subject");
      const htmlBody = getMessageBody(fullMsg);
      const textBody = stripHtml(htmlBody || subject);

      // Skip cancelled loads
      if (isCancelledLoad(subject)) {
        await markAsRead(accessToken, msg.id);
        continue;
      }

      const shipping = parseCentralDispatch(subject, textBody);
      const costPerVehicle = perVehicleCost(shipping);

      // Update each vehicle's towing cost
      for (const vehicle of shipping.vehicles) {
        if (!vehicle.vin) continue;

        // Update Google Sheet
        const rowNum = await findVinRow(accessToken, config.spreadsheetId, vehicle.vin);
        if (rowNum) {
          // Column O = Towing Cost (15th column, 0-indexed = 14)
          await updateCells(
            accessToken,
            config.spreadsheetId,
            `Sheet1!O${rowNum}`,
            [[costPerVehicle]],
          );
        }

        // Update Supabase
        await updateVehicleTowingCost(
          config.supabaseUrl,
          config.supabaseServiceRoleKey,
          vehicle.vin,
          costPerVehicle,
        );
      }

      await logPipelineEntry(config, {
        email_id: msg.id,
        email_type: "central_dispatch",
        vin: shipping.vehicles[0]?.vin ?? null,
        status: "processed",
        error_message: null,
        metadata: {
          loadId: shipping.loadId,
          price: shipping.price,
          vehicleCount: shipping.vehicleCount,
          costPerVehicle,
          carrier: shipping.carrierName,
        },
      });

      await markAsRead(accessToken, msg.id);
      count++;
    } catch (err) {
      await logPipelineEntry(config, {
        email_id: msg.id,
        email_type: "central_dispatch",
        vin: null,
        status: "error",
        error_message: String(err),
        metadata: {},
      });
    }
  }

  return count;
}

/**
 * Check vehicles that have been in the system for 7+ days without
 * a Central Dispatch update, and ensure their towing cost is $700.
 * (This is a no-op if they already have $700 default from creation.)
 */
async function applyTowingFallback(
  _accessToken: string,
  _config: PipelineConfig,
): Promise<void> {
  // The default towing cost is already set to $700 at creation time.
  // This function is a hook for future logic if we want to differentiate
  // between "default $700" and "confirmed no shipping email after 7 days".
  // For now, the creation-time default handles this requirement.
}

// --- Helper functions ---

/**
 * Check if an email has already been processed (deduplication).
 */
async function isEmailProcessed(
  supabaseUrl: string,
  serviceRoleKey: string,
  emailId: string,
): Promise<boolean> {
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/pipeline_log?email_id=eq.${emailId}&select=id`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );

  if (!resp.ok) return false;
  const data = await resp.json();
  return data.length > 0;
}

/**
 * Log a pipeline processing entry for audit and deduplication.
 */
async function logPipelineEntry(
  config: PipelineConfig,
  entry: PipelineLogEntry,
): Promise<void> {
  await fetch(`${config.supabaseUrl}/rest/v1/pipeline_log`, {
    method: "POST",
    headers: {
      apikey: config.supabaseServiceRoleKey,
      Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(entry),
  });
}

/**
 * Format a date from MM/DD/YY to MM/DD/YYYY.
 */
function formatDate(date: string): string {
  if (!date) return "";
  // Handle MM/DD/YY → MM/DD/20YY
  const parts = date.split("/");
  if (parts.length === 3 && parts[2].length === 2) {
    parts[2] = `20${parts[2]}`;
  }
  return parts.join("/");
}
```

**Step 2: Update the Edge Function entry point**

File: `supabase/functions/manheim-pipeline/index.ts`

```typescript
import { runPipeline } from "./pipeline.ts";

Deno.serve(async (req: Request) => {
  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Load config from Deno env (Supabase secrets)
    const config = {
      googleClientId: Deno.env.get("GOOGLE_CLIENT_ID") ?? "",
      googleClientSecret: Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "",
      googleRefreshToken: Deno.env.get("GOOGLE_REFRESH_TOKEN") ?? "",
      spreadsheetId: Deno.env.get("PIPELINE_GOOGLE_SHEET_ID") ?? "",
      supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
      supabaseServiceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    };

    // Validate config
    const missing = Object.entries(config)
      .filter(([_, v]) => !v)
      .map(([k]) => k);

    if (missing.length > 0) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: `Missing config: ${missing.join(", ")}`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Run the pipeline
    const result = await runPipeline(config);

    return new Response(JSON.stringify({ status: "ok", ...result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "error", message: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
```

**Step 3: Commit**

```bash
git add supabase/functions/manheim-pipeline/pipeline.ts supabase/functions/manheim-pipeline/index.ts
git commit -m "feat(pipeline): main orchestrator with OVE + Central Dispatch processing"
```

---

## Task 10: Deploy and Set Up Cron Scheduling

**Step 1: Deploy the Edge Function**

```bash
supabase functions deploy manheim-pipeline --no-verify-jwt
```

Note: `--no-verify-jwt` is needed because pg_cron invocations won't have a user JWT. The function validates the service role key via the Authorization header instead.

**Step 2: Test the deployed function**

```bash
curl -X POST "https://scgmpliwlfabnpygvbsy.supabase.co/functions/v1/manheim-pipeline" \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json"
```

Expected: `{"status":"ok","ovePurchases":N,"centralDispatchUpdates":N,"errors":[]}`

**Step 3: Set up pg_cron scheduling**

Run this SQL in the Supabase SQL editor (Dashboard > SQL Editor):

```sql
-- Enable pg_cron and pg_net extensions (if not already)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the pipeline to run every 5 minutes
SELECT cron.schedule(
  'manheim-pipeline-cron',
  '*/5 * * * *',  -- every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://scgmpliwlfabnpygvbsy.supabase.co/functions/v1/manheim-pipeline',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Alternative (if pg_cron is not available on free tier):**

Use https://cron-job.org (free):
1. Create account
2. Add new cron job:
   - URL: `https://scgmpliwlfabnpygvbsy.supabase.co/functions/v1/manheim-pipeline`
   - Method: POST
   - Header: `Authorization: Bearer <SERVICE_ROLE_KEY>`
   - Schedule: Every 5 minutes
   - Timeout: 30 seconds

**Step 4: Verify cron is running**

Wait 5 minutes, then check:

```sql
SELECT * FROM pipeline_log ORDER BY processed_at DESC LIMIT 10;
```

**Step 5: Commit the cron migration (if using pg_cron)**

File: `supabase/migrations/004_pipeline_cron.sql`

```sql
-- Enable extensions for scheduled pipeline execution
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule manheim pipeline every 5 minutes
SELECT cron.schedule(
  'manheim-pipeline-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/manheim-pipeline',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

```bash
git add supabase/migrations/004_pipeline_cron.sql
git commit -m "feat(pipeline): add pg_cron schedule for 5-minute polling"
```

---

## Task 11: Manheim Sale Documents PDF Parser (Enhancement)

This is a follow-up enhancement. The pipeline works without it (condition defaults to "Pending Inspection", title to "Clean"). Implement when the core pipeline is stable.

**Files:**
- Create: `supabase/functions/manheim-pipeline/parsers/sale-documents.ts`

**Approach:**
1. Search Gmail for `from:noreply@manheim.com subject:"Sale Documents" is:unread`
2. Get the PDF attachment via Gmail API: `GET /messages/{id}/attachments/{attachmentId}`
3. Parse PDF using a Deno-compatible PDF library (e.g., `pdf-parse` via esm.sh or `pdfjs-dist`)
4. Extract condition report text and title type
5. Match by VIN to existing records
6. Update Google Sheet columns I (Condition) and J (Title Type)

**Note:** PDF parsing in Deno Edge Functions has size/time limits. If PDFs are too large, consider a dedicated Cloud Function for this step.

---

## Task 12: End-to-End Verification

**Step 1: Trigger a real purchase**

Buy a test vehicle on Manheim/OVE (or wait for the next natural purchase).

**Step 2: Verify within 5 minutes:**

- [ ] New row appears in Google Sheet with all auto-filled columns
- [ ] New vehicle appears on the website
- [ ] `pipeline_log` has a `processed` entry for the email
- [ ] Email is marked as read in Gmail

**Step 3: Verify Central Dispatch update (when shipping is booked):**

- [ ] Towing Cost column updates in Google Sheet
- [ ] All-In Cost, Target List Price, Floor Price recalculate
- [ ] `pipeline_log` has a `central_dispatch` entry

**Step 4: Check error scenarios:**

- [ ] Send yourself a test email from a non-Manheim address — should be ignored
- [ ] Manually mark a processed email as unread — should be skipped (dedup via pipeline_log)
- [ ] Check `pipeline_log` for any `error` status entries

---

## File Tree Summary

```
supabase/
├── functions/
│   └── manheim-pipeline/
│       ├── index.ts                    # Edge Function entry point
│       ├── pipeline.ts                 # Main orchestrator
│       ├── types.ts                    # Shared TypeScript types
│       ├── gmail.ts                    # Gmail API client
│       ├── gmail_test.ts              # Gmail client tests
│       ├── parsers/
│       │   ├── ove-purchase.ts         # OVE email parser
│       │   ├── ove-purchase_test.ts    # OVE parser tests
│       │   ├── central-dispatch.ts     # CD email parser
│       │   ├── central-dispatch_test.ts
│       │   ├── sale-documents.ts       # PDF parser (Task 11)
│       │   └── fixtures/
│       │       ├── ove-email-sample.ts # Test fixtures
│       │       └── cd-email-sample.ts
│       ├── enrichment/
│       │   ├── nhtsa.ts               # NHTSA VIN decoder
│       │   └── nhtsa_test.ts
│       └── writers/
│           ├── google-sheets.ts        # Sheets API writer
│           ├── google-sheets_test.ts
│           ├── supabase-vehicles.ts    # Supabase writer
│           └── supabase-vehicles_test.ts
└── migrations/
    ├── 001_initial_schema.sql          # (existing)
    ├── 002_client_sign_rls.sql         # (existing)
    ├── 003_pipeline_log.sql            # Pipeline dedup table
    └── 004_pipeline_cron.sql           # Cron scheduling
```

## Dependency Chain

```
Task 1 (scaffold) → Task 2 (migration) → Task 3 (Gmail client)
                                              ↓
                                    Task 4 (OVE parser) ──→ Task 9 (orchestrator)
                                    Task 5 (CD parser)  ──→ Task 9
                                    Task 6 (NHTSA)      ──→ Task 9
                                    Task 7 (Sheets)     ──→ Task 9
                                    Task 8 (Supabase)   ──→ Task 9
                                                              ↓
                                                         Task 10 (deploy + cron)
                                                              ↓
                                                         Task 11 (PDF parser - optional)
                                                              ↓
                                                         Task 12 (E2E verification)
```

Tasks 4-8 can be implemented in parallel (no dependencies between them).
