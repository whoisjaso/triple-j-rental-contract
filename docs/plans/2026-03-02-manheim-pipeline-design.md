# Manheim-to-Website Autonomous Pipeline — Design Document

**Date:** 2026-03-02
**Status:** Approved
**Author:** Claude + Jason Obawemimo

## Problem

Vehicle data from Manheim auction purchases is manually entered into a Google Sheet and then manually synced to the Triple J Auto Investment website. This process is slow, error-prone, and requires repeated data entry.

## Solution

An autonomous pipeline that monitors Gmail for Manheim purchase confirmation emails, parses vehicle data, enriches it via NHTSA VIN decode, and simultaneously writes to both Google Sheets and the Supabase `vehicles` table — with zero manual intervention.

## Architecture

```
Gmail Inbox (triplejautoinvestment@gmail.com)
  │
  ├─ 1. OVE Purchase Confirmation (support@ove.com)
  │     Subject: "Manheim.com Purchase Confirmation (YEAR MAKE MODEL VIN SELLER)"
  │     Trigger: New email detected
  │     │
  │     └──→ PARSE email HTML ──→ Extract vehicle + purchase data
  │           │
  │           ├──→ NHTSA VIN Decode (enrich: weight, drive type, engine, body class)
  │           │
  │           ├──→ Google Sheets API: Append new row (26 of 40 columns auto-filled)
  │           │
  │           ├──→ Supabase: INSERT into vehicles table
  │           │
  │           └──→ Gmail API: Mark email as read (prevent reprocessing)
  │
  ├─ 2. Central Dispatch ACCEPTED (do-not-reply@centraldispatch.com)
  │     Subject: "Load ID: XXXXXXX has been ACCEPTED by CARRIER"
  │     │
  │     └──→ PARSE email ──→ Extract VINs, load price, vehicle count
  │           │
  │           └──→ Match VINs to existing records
  │                 │
  │                 ├──→ Google Sheets: Update "Towing Cost" = load_price ÷ num_vehicles
  │                 └──→ Supabase: UPDATE vehicles SET towing_cost = ...
  │
  ├─ 3. Manheim Sale Documents (noreply@manheim.com)
  │     Subject: "5537922 Sale Documents from Manheim"
  │     │
  │     └──→ PARSE PDF attachment ──→ Extract condition report + title type
  │           │
  │           ├──→ Google Sheets: Update "Condition" and "Title Type" columns
  │           └──→ Supabase: UPDATE vehicles SET condition, title_type = ...
  │
  └─ 4. No Central Dispatch match after 7 days
        │
        └──→ Default Towing Cost = $700
```

## Email Sources (Verified from Live Gmail Data)

### Source 1: OVE Purchase Confirmation
- **From:** `support@ove.com`
- **Subject pattern:** `Manheim.com Purchase Confirmation (YEAR MAKE MODEL VIN SELLER)`
- **Format:** Structured HTML with labeled fields
- **Fields available:**
  - Year, Make, Model, Trim (e.g., "2019 Nissan Pathfinder SV Hard Top")
  - VIN (e.g., "5N1DR2MM1KC634768")
  - Mileage (e.g., "113,377 mi")
  - Exterior Color (e.g., "Black ext")
  - Interior Color (e.g., "GRY int")
  - Purchase Amount (e.g., "$2,500")
  - Buy Fee (e.g., "$280")
  - Total Amount (e.g., "$2,780")
  - Purchase Date (e.g., "03/01/26")
  - Pick-Up Location (e.g., "Clarksville, IN 47129")
  - Seller (e.g., "SANTANDER CONSUMER")
  - Facilitating Location name, address, phone, email

### Source 2: Central Dispatch ACCEPTED
- **From:** `do-not-reply@centraldispatch.com`
- **Subject pattern:** `Load ID: XXXXXXX has been ACCEPTED by CARRIER_NAME`
- **Format:** Plain text with labeled fields
- **Fields available:**
  - Load ID
  - Pick Up Location
  - Delivery Location (Houston, TX 77075)
  - Requested Pick Up / Delivery Dates
  - Carrier Pick Up / Delivery ETA
  - Price (per load, e.g., "$750.00")
  - Number of Vehicles
  - Per-vehicle: Year, Make, Model + VIN
- **Note:** Price is per-LOAD. Must divide by vehicle count for per-vehicle towing cost.
- **Note:** Multiple carriers may accept/cancel for same load. Track final accepted carrier.
- **Statuses observed:** ACCEPTED, PICKED UP, CANCELLED

### Source 3: Manheim Sale Documents
- **From:** `noreply@manheim.com`
- **Subject pattern:** `5537922 Sale Documents from Manheim`
- **Format:** Email body contains VIN(s). PDF attachment contains sale documents.
- **PDF filename pattern:** `MM-DD-YYYY_ACCOUNT_Vehicle_Sale_Documents.pdf`
- **PDF contains:** Invoice, condition report, title information

### Source 4: Super Dispatch BOL (informational, not parsed)
- **From:** `CARRIER <paperless@superdispatch.com>`
- **Subject pattern:** `Bill Of Lading for Load ID: XXXXXXX`
- **Contains:** PDF BOL with inspection photos
- **Use:** Future enhancement for delivery confirmation photos

## Column Mapping (Google Sheet)

### Auto-Filled from OVE Email (13 columns)
| Column | Source | Example |
|--------|--------|---------|
| VIN | Email body | 5N1DR2MM1KC634768 |
| search_key | Generated: "YEAR MAKE MODEL" | 2019 Nissan Pathfinder |
| Year | Email subject/body | 2019 |
| Make | Email subject/body | Nissan |
| Model | Email subject/body | Pathfinder SV |
| Exterior/Interior Color | Email body | Black / GRY |
| Odometer | Email body | 113,377 |
| Date Acquired | Purchase Date from email | 03/01/2026 |
| Purchase Price | Purchase Amount (before fees) | $2,500 |
| Other Costs | Buy Fee from email | $280 |
| Date Listed | = Date Acquired | 03/01/2026 |
| Listing Status | Default | Available |
| Current List Price | = Target List Price | Calculated |

### Auto-Filled from NHTSA VIN Decode (1 column)
| Column | Source | Example |
|--------|--------|---------|
| Empty Weight | GVWR from NHTSA | 5,001-6,000 lb |

### Auto-Filled from Central Dispatch (1 column)
| Column | Source | Example |
|--------|--------|---------|
| Towing Cost | Load price ÷ vehicle count | $375 |

### Auto-Filled from Manheim Sale Docs PDF (2 columns)
| Column | Source | Fallback |
|--------|--------|----------|
| Condition | PDF condition report | "Pending Inspection" |
| Title Type | PDF title section | "Clean" |

### Auto-Calculated Formulas (7 columns)
| Column | Formula |
|--------|---------|
| Days in Stock | `=TODAY() - Date Acquired` |
| All-In Cost | `=Purchase Price + Towing + Mechanical + Cosmetic + Other` |
| Target Margin % | Default 25% |
| Target List Price | `=All-In Cost × (1 + Target Margin %)` |
| Floor Margin % | Default 10% |
| Floor Price | `=All-In Cost × (1 + Floor Margin %)` |
| Net Profit | `=Sale Price - All-In Cost - Selling Fees` |

### Defaulted to $0 (2 columns)
| Column | Default | Notes |
|--------|---------|-------|
| Mechanical Cost | $0 | User updates after inspection |
| Cosmetic Cost | $0 | User updates after inspection |

### Blank — Post-Sale/Registration Fields (14 columns)
Photo Link, Offer Received, Offer Decision, Decision Notes, Disposition,
Date Sold, Sale Price, Selling Fees, License Plate, Buyer Name,
Phone Number, Lead Source, Registration Amount, Registration Payed

**Total: 26 of 40 columns auto-filled. 14 are post-sale fields that cannot exist yet.**

## Tech Stack

| Component | Technology | Cost |
|-----------|-----------|------|
| Runtime | Supabase Edge Functions (Deno) | Free tier |
| Email Access | Gmail API (OAuth2 user-authorized) | Free |
| Sheet Access | Google Sheets API v4 | Free |
| VIN Enrichment | NHTSA vPIC API | Free, no auth |
| PDF Parsing | pdf-parse (Deno-compatible) | Free |
| Scheduler | Supabase pg_cron or cron-job.org | Free |
| Database | Existing Supabase project (scgmpliwlfabnpygvbsy) | Existing free tier |

## Scheduling & Polling

- **Frequency:** Every 5 minutes
- **Gmail query:** `from:support@ove.com subject:"Purchase Confirmation" is:unread`
- **Central Dispatch query:** `from:centraldispatch.com subject:"has been ACCEPTED" is:unread`
- **Sale Documents query:** `from:noreply@manheim.com subject:"Sale Documents" is:unread`
- **Deduplication:** Check VIN against existing records before inserting
- **Rate limits:** Gmail API = 250 quota units/sec (polling uses ~5 units/call)

## Fallback & Error Handling

| Scenario | Behavior |
|----------|----------|
| No Central Dispatch email within 7 days | Towing Cost = $700 |
| NHTSA VIN decode fails | Leave Empty Weight blank |
| Sale Documents PDF unparseable | Condition = "Pending Inspection", Title = "Clean" |
| Duplicate VIN detected | Skip insertion, log to audit_log |
| Email parsing error | Log error to audit_log, skip email, do NOT mark as read |
| Google Sheets API rate limit | Retry with exponential backoff (max 3 attempts) |
| Supabase write fails | Log error, Sheet write still proceeds (eventual consistency) |

## Security

- Gmail OAuth2 refresh token stored as Supabase secret (encrypted at rest)
- Google Sheets API service account key stored as Supabase secret
- No sensitive data in Edge Function source code
- Audit log captures all pipeline actions for debugging

## Data Flow Sequence

```
1. User wins auction on Manheim/OVE
2. OVE sends Purchase Confirmation email → triplejautoinvestment@gmail.com
3. Pipeline (next 5-min cycle):
   a. Detects unread email from support@ove.com
   b. Parses HTML: VIN, Year, Make, Model, Colors, Mileage, Price, Buy Fee
   c. Calls NHTSA API: /decodevin/{VIN} → GVWR, Drive Type
   d. Writes to Google Sheet (new row, 26 columns populated)
   e. Writes to Supabase vehicles table
   f. Marks email as read
4. Central Dispatch sends ACCEPTED email (hours/days later)
5. Pipeline:
   a. Detects unread CD email
   b. Parses: VINs, load price, vehicle count
   c. Calculates per-vehicle cost: $750 ÷ 2 = $375
   d. Updates Towing Cost in Sheet + Supabase
   e. Recalculates All-In Cost, Target List Price, Floor Price
   f. Marks email as read
6. Manheim sends Sale Documents email (hours/days later)
7. Pipeline:
   a. Detects unread Sale Docs email
   b. Downloads PDF attachment
   c. Parses for condition report + title type
   d. Updates Condition + Title Type in Sheet + Supabase
   e. Marks email as read
8. If no CD email after 7 days → default Towing Cost = $700
9. Vehicle appears on website immediately after step 3
10. Only manual step: user takes photos after car arrives
```

## Google Sheet Details

- **Spreadsheet ID:** `1ZJpUk9lsWkDOcuOTkKNcBbsywToFbfmF8I_7Gm60kuI`
- **Sheet GID:** `185291081`
- **Columns:** 40 (A through AN)
- **New rows appended to bottom**

## OAuth2 Setup Required (One-Time)

1. Create Google Cloud project (or reuse existing)
2. Enable Gmail API + Google Sheets API
3. Create OAuth2 credentials (web application type)
4. Authorize with triplejautoinvestment@gmail.com
5. Store refresh token as Supabase secret
6. Pipeline uses refresh token to get access tokens automatically
