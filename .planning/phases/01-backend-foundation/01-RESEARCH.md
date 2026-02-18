# Phase 1: Backend Foundation - Research

**Researched:** 2026-02-18
**Domain:** Supabase backend + React SPA restructuring (auth, database, routing, state management)
**Confidence:** HIGH

## Summary

Phase 1 transforms the existing client-side-only React/TypeScript/Vite SPA into a full-stack application with persistent storage, authentication, routing, and audit logging. The backend is Supabase (hosted PostgreSQL + Auth + Row Level Security), the frontend adds React Router v7 for admin/client route separation, Zustand for state management, and Tailwind CSS v4 via the @tailwindcss/vite build plugin (replacing the CDN).

The key technical challenges are: (1) designing the PostgreSQL schema to store agreement data as JSONB while keeping queryable fields as structured columns, (2) implementing append-only audit logging that cannot be modified after creation, (3) generating sequential agreement numbers in TJ-YYYY-NNNN format using PostgreSQL sequences, and (4) wiring Supabase Auth with React Router to protect admin routes while leaving client routes public.

**Primary recommendation:** Use Supabase's client SDK (`@supabase/supabase-js`) for all database operations, Supabase Auth (email/password) for the single admin user, PostgreSQL sequences + trigger functions for agreement numbering, and a dedicated `audit_log` table with RLS policies that deny UPDATE and DELETE to enforce append-only behavior.

## Standard Stack

The established libraries/tools for this phase:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.49+ | Supabase client SDK for database, auth, storage | Official SDK. Handles all Supabase interactions from the React frontend. TypeScript support with generated types. |
| react-router | ^7.13.0 | Client-side routing (admin vs client views) | React Router v7 Data Mode with `createBrowserRouter`. Standard for React SPAs. Supports loaders, actions, nested routes. |
| zustand | ^5.0.11 | Global state management | 3KB, zero boilerplate. Replaces the monolithic `useState` in App.tsx. Selector pattern prevents re-renders in form-heavy views. Use `create<T>()()` pattern for TypeScript. |
| tailwindcss | ^4.1+ | Utility-first CSS (build-time) | Replaces CDN play mode. No more `cdn.tailwindcss.com` script tag. Uses CSS-first `@theme` configuration instead of JS config. |
| @tailwindcss/vite | ^4.1+ | Vite plugin for Tailwind v4 | First-party Vite integration. Zero-config: add plugin + `@import "tailwindcss"` in CSS file. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| supabase (CLI) | latest | Local development, type generation, migrations | Dev dependency. Run `supabase init`, `supabase gen types`, `supabase db push`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Auth | Simple PIN/bcrypt | PIN auth has no JWT, no RLS integration, requires custom middleware. Supabase Auth is more setup but secures the entire API layer automatically. |
| JSONB data column | Fully normalized tables | Normalizing 100+ fields across 13 nested objects would create 10+ tables. JSONB is pragmatic for this data shape; structured columns handle the fields we query/filter on. |
| React Router Data Mode | Declarative Mode | Data Mode adds loaders/actions which pair well with Supabase queries. Small overhead but better data-fetching patterns. |

**Installation:**
```bash
# Frontend dependencies
npm install react-router @supabase/supabase-js zustand

# Tailwind CSS migration (replace CDN)
npm install tailwindcss @tailwindcss/vite

# Dev tooling
npm install -D supabase
```

## Architecture Patterns

### Recommended Project Structure

```
triple-j-auto-investment-agreement/
  src/
    components/          # Existing: InputLine, Section, SignaturePad, etc.
    pages/               # NEW: Route-level components
      AdminLogin.tsx     # Login form with email/password
      AdminLayout.tsx    # Protected layout wrapper (auth check + Outlet)
      AgreementCreate.tsx # Admin creates new agreement (refactored from App.tsx)
      AgreementList.tsx  # Placeholder for Phase 4 dashboard
    lib/
      supabase.ts        # Supabase client initialization
      auth.tsx           # AuthProvider context + useAuth hook
    stores/
      agreementStore.ts  # Zustand store for agreement form state
    router.tsx           # createBrowserRouter configuration
    App.tsx              # Becomes thin shell: just <RouterProvider>
    types.ts             # Keep existing AgreementData type (shared with DB)
    main.css             # NEW: @import "tailwindcss" + theme overrides
  index.html             # Simplified: remove CDN scripts, keep Google Fonts
  index.tsx              # Entry: render App
  vite.config.ts         # Add @tailwindcss/vite plugin, add Supabase env
  .env.local             # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
```

**Key change from current:** All source files move into a `src/` directory. The existing `components/` folder moves to `src/components/`. This follows Vite's recommended structure and separates source from config.

### Pattern 1: Supabase Client Initialization

**What:** Single Supabase client instance shared across the app.
**When to use:** Every file that needs database access or auth.

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types' // generated by supabase CLI

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**Source:** [Supabase React Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs) (HIGH confidence)

### Pattern 2: Auth Provider + Protected Routes

**What:** React context that tracks auth state; route wrapper that redirects unauthenticated users.
**When to use:** All admin routes require authentication.

```typescript
// src/lib/auth.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContext {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthCtx = createContext<AuthContext | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthCtx.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

```typescript
// src/pages/AdminLayout.tsx
import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../lib/auth'

export function AdminLayout() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
```

**Source:** [Supabase Auth with React](https://supabase.com/docs/guides/auth/quickstarts/react), [React Router Protected Routes with Supabase](https://medium.com/@seojeek/protected-routes-in-react-router-6-with-supabase-authentication-and-oauth-599047e08163) (HIGH confidence)

### Pattern 3: React Router v7 Data Mode Configuration

**What:** Centralized router with nested routes separating admin (protected) and public routes.
**When to use:** App entry point.

```typescript
// src/router.tsx
import { createBrowserRouter } from 'react-router'
import { AdminLayout } from './pages/AdminLayout'
import { AdminLogin } from './pages/AdminLogin'
import { AgreementCreate } from './pages/AgreementCreate'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,  // auth-protected wrapper
    children: [
      { index: true, element: <AgreementList /> },
      { path: 'agreements/new', element: <AgreementCreate /> },
      { path: 'agreements/:id', element: <AgreementEdit /> },
    ],
  },
  // Future: public client signing routes
  // { path: '/sign/:token', element: <ClientSigningPage /> },
])
```

```typescript
// src/App.tsx (becomes thin shell)
import { RouterProvider } from 'react-router/dom'
import { AuthProvider } from './lib/auth'
import { router } from './router'

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
```

**Source:** [React Router v7 Data Mode Installation](https://reactrouter.com/start/data/installation) (HIGH confidence)

### Pattern 4: Zustand Store for Agreement Form State

**What:** Zustand store replacing the monolithic `useState<AgreementData>` in App.tsx.
**When to use:** Any component that reads or writes agreement form data.

```typescript
// src/stores/agreementStore.ts
import { create } from 'zustand'
import type { AgreementData } from '../types'

interface AgreementStore {
  data: AgreementData
  isDirty: boolean
  setData: (data: AgreementData) => void
  updateField: (section: keyof AgreementData, field: string, value: unknown) => void
  reset: () => void
}

const initialData: AgreementData = {
  // ... same initial data as current App.tsx lines 10-55
}

export const useAgreementStore = create<AgreementStore>()((set) => ({
  data: { ...initialData },
  isDirty: false,

  setData: (data) => set({ data, isDirty: false }),

  updateField: (section, field, value) =>
    set((state) => ({
      data: {
        ...state.data,
        [section]: {
          ...(state.data[section] as Record<string, unknown>),
          [field]: value,
        },
      },
      isDirty: true,
    })),

  reset: () => set({ data: { ...initialData }, isDirty: false }),
}))
```

**Usage in components:**
```typescript
// In any component (no prop drilling needed)
const yearMakeModel = useAgreementStore((s) => s.data.vehicle.yearMakeModel)
const updateField = useAgreementStore((s) => s.updateField)

// Update: same pattern as before, but through store
updateField('vehicle', 'yearMakeModel', newValue)
```

**Source:** [Zustand v5 TypeScript patterns](https://jsdev.space/howto/zustand5-react/), [Zustand npm](https://www.npmjs.com/package/zustand) (HIGH confidence)

### Pattern 5: Database Schema (Supabase PostgreSQL)

**What:** PostgreSQL tables for agreements, audit log, and agreement number sequence.
**When to use:** Supabase SQL editor or migration file.

```sql
-- Agreement number sequence
CREATE SEQUENCE agreement_number_seq START WITH 1;

-- Function to generate formatted agreement numbers
CREATE OR REPLACE FUNCTION generate_agreement_number()
RETURNS text AS $$
BEGIN
  RETURN 'TJ-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(nextval('agreement_number_seq')::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Agreements table
CREATE TABLE agreements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_number text NOT NULL UNIQUE DEFAULT generate_agreement_number(),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'completed', 'expired')),

  -- Full agreement data as JSONB (mirrors AgreementData TypeScript type)
  data jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Shareable link token (populated when admin sends to client, Phase 2)
  token text UNIQUE,
  token_expires_at timestamptz,

  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agreements_updated_at
  BEFORE UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Audit log table (append-only)
CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  agreement_id uuid REFERENCES agreements(id) ON DELETE SET NULL,
  action text NOT NULL
    CHECK (action IN ('created', 'updated', 'sent', 'viewed', 'signed', 'pdf_generated', 'downloaded', 'expired')),
  actor_type text NOT NULL DEFAULT 'admin'
    CHECK (actor_type IN ('admin', 'client', 'system')),
  actor_id uuid,  -- auth.users id for admin, null for client/system
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CRITICAL: Make audit_log append-only by denying UPDATE and DELETE
-- RLS policies will enforce this
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated users (admin creating agreements)
CREATE POLICY "Allow insert for authenticated" ON audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow inserts from anon role (client viewing/signing via token)
CREATE POLICY "Allow insert for anon" ON audit_log
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow admin to read all audit logs
CREATE POLICY "Allow select for authenticated" ON audit_log
  FOR SELECT TO authenticated
  USING (true);

-- NO UPDATE or DELETE policies = append-only enforcement via RLS

-- Agreements RLS
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- Admin can do everything on agreements
CREATE POLICY "Admin full access" ON agreements
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anonymous users can read agreements by token (for Phase 2 client signing)
CREATE POLICY "Public read by token" ON agreements
  FOR SELECT TO anon
  USING (token IS NOT NULL AND token_expires_at > now());

-- Index for token lookup (Phase 2)
CREATE INDEX idx_agreements_token ON agreements(token) WHERE token IS NOT NULL;

-- Index for audit log queries
CREATE INDEX idx_audit_log_agreement ON audit_log(agreement_id);
CREATE INDEX idx_audit_log_created ON audit_log USING brin(created_at);
```

**Source:** [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security), [PostgreSQL Sequences](https://www.postgresql.org/docs/current/sql-createsequence.html), [Supabase Postgres Audit](https://supabase.com/blog/postgres-audit) (HIGH confidence)

### Pattern 6: Capturing Client IP for Audit Log

**What:** Get the client's IP address from the request headers for audit logging.
**When to use:** Every audit log insert that needs IP attribution.

In Supabase, when using the PostgREST API (which `@supabase/supabase-js` uses), request headers are available via `current_setting('request.headers', true)` in PostgreSQL functions. The IP is in the `x-forwarded-for` header.

```sql
-- Helper function to extract client IP from request headers
CREATE OR REPLACE FUNCTION get_client_ip()
RETURNS text AS $$
DECLARE
  headers jsonb;
  forwarded text;
BEGIN
  headers := current_setting('request.headers', true)::jsonb;
  forwarded := headers->>'x-forwarded-for';
  IF forwarded IS NOT NULL THEN
    -- x-forwarded-for may contain multiple IPs; take the first one
    RETURN split_part(forwarded, ',', 1);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to extract user agent
CREATE OR REPLACE FUNCTION get_user_agent()
RETURNS text AS $$
BEGIN
  RETURN current_setting('request.headers', true)::jsonb->>'user-agent';
END;
$$ LANGUAGE plpgsql STABLE;
```

**Alternative (application-side):** Pass IP and user agent as part of the JSONB metadata when inserting audit log entries from the client:

```typescript
// In your React code when creating an agreement:
const { error } = await supabase.from('audit_log').insert({
  agreement_id: agreementId,
  action: 'created',
  actor_type: 'admin',
  actor_id: user.id,
  // IP will be captured server-side via the helper function
  // or passed from a Supabase Edge Function
  metadata: { source: 'admin_dashboard' }
})
```

**Source:** [Supabase Discussion #27002](https://github.com/orgs/supabase/discussions/27002), [PostgREST header hacking](https://github.com/burggraf/postgrest-header-hacking) (MEDIUM confidence -- the `current_setting('request.headers')` approach works but needs testing to confirm exact header names in the latest Supabase version)

### Pattern 7: Tailwind CSS v4 Migration

**What:** Replace CDN play mode with build-time Tailwind v4 via Vite plugin.
**When to use:** Project restructure step.

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
})
```

```css
/* src/main.css */
@import "tailwindcss";

/* Custom theme (replaces inline Tailwind config from index.html) */
@theme {
  --color-forest-green: #1A472A;
  --color-gold: #C5A059;
  --color-alert-red: #8B1A1A;
  --color-charcoal: #2C2C2C;
  --color-light-gray: #F5F5F5;

  --font-sans: 'Inter', sans-serif;
  --font-serif: 'Lora', serif;
}
```

**Critical migration notes:**
- In Tailwind v4, the old `tailwind.config.js` is replaced by CSS-first `@theme` directives
- `@tailwind base; @tailwind components; @tailwind utilities;` is replaced by `@import "tailwindcss"`
- Custom color names change from `forestGreen` to `forest-green` (CSS variable naming convention uses kebab-case)
- The existing class names like `bg-forestGreen` become `bg-forest-green`
- All existing Tailwind classes in components need to be updated to match the new naming
- Remove the CDN script tag, import map, and inline Tailwind config from index.html

**Source:** [Tailwind CSS v4 Vite Installation](https://tailwindcss.com/docs), [Tailwind v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide) (HIGH confidence)

### Anti-Patterns to Avoid

- **Storing agreement data in multiple normalized tables:** The AgreementData type has 100+ fields in 13 nested sections. Normalizing this creates excessive joins for a single-user, low-volume app. Use JSONB for the bulk data; use structured columns only for fields you query on (status, agreement_number, token).

- **Building custom session management:** Supabase Auth handles JWT tokens, session refresh, and auth state. Do not build a separate session system with cookies or localStorage.

- **Putting auth logic in individual page components:** Use a single `AdminLayout` wrapper with `<Outlet />` that checks auth once. Do not scatter `if (!user) redirect` checks in every admin page.

- **Using Tailwind CDN in development "temporarily":** Migrate to @tailwindcss/vite immediately. Running both CDN and build-time Tailwind causes conflicts and double-applied styles.

- **Making audit_log table writable (UPDATE/DELETE):** The audit log MUST be append-only. RLS policies should only allow INSERT and SELECT, never UPDATE or DELETE.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication | Custom PIN/bcrypt auth | Supabase Auth (email/password) | JWT tokens integrate with RLS. Session management is handled. Token refresh is automatic. |
| Sequential IDs | Application-level counter | PostgreSQL SEQUENCE + trigger function | Database guarantees uniqueness even under concurrent inserts. No race conditions. |
| Timestamp management | `new Date().toISOString()` in app code | PostgreSQL `DEFAULT now()` + trigger for updated_at | Server-side timestamps are authoritative (clients can have wrong clocks). |
| Append-only enforcement | Application-level "don't call delete" | PostgreSQL RLS policies (no UPDATE/DELETE policy) | Database-level enforcement cannot be bypassed by application bugs. |
| Auth state management | Custom localStorage token handling | `supabase.auth.onAuthStateChange()` | Handles token refresh, session persistence, tab sync automatically. |
| Database type generation | Hand-written TypeScript interfaces for DB | `supabase gen types typescript` CLI command | Generates types directly from your database schema. Stays in sync with migrations. |

**Key insight:** Supabase's integrated stack means most "backend infrastructure" tasks are configuration, not code. The database schema, RLS policies, and auth setup replace what would otherwise be hundreds of lines of custom middleware and API routes.

## Common Pitfalls

### Pitfall 1: Tailwind v4 Class Name Changes Break Existing Components

**What goes wrong:** Migrating from Tailwind CDN (v3-like play mode) to Tailwind v4 build changes some class names and configuration patterns. The existing components use custom color names like `bg-forestGreen` and `text-gold` which were defined in the inline CDN config. In v4, custom colors defined via `@theme` use kebab-case CSS variable names, so classes become `bg-forest-green`, `text-gold` (gold stays the same since it is one word).
**Why it happens:** Tailwind v4 shifted from JavaScript config to CSS-first configuration with `@theme` blocks. Custom color names follow CSS custom property naming conventions.
**How to avoid:** During migration, do a global find-and-replace for all custom color class names. Test every component visually after migration. The standard Tailwind utility classes (bg-white, text-sm, etc.) are unchanged.
**Warning signs:** Components render without custom brand colors after migration. White/unstyled sections where green/gold should appear.

### Pitfall 2: JSONB Data Column Loses TypeScript Type Safety

**What goes wrong:** Agreement data stored as JSONB in PostgreSQL returns as `unknown` or `any` in TypeScript. Developers access nested fields without type checking, leading to runtime errors when field names change or data shapes evolve.
**Why it happens:** JSONB is inherently untyped from PostgreSQL's perspective. The Supabase SDK can generate types for table columns, but JSONB columns are typed as `Json` (a broad type).
**How to avoid:** After fetching agreement data, immediately cast the JSONB column to the `AgreementData` TypeScript type. Create a helper function: `function parseAgreementData(row: AgreementRow): AgreementData { return row.data as AgreementData }`. Consider using the `pg_jsonschema` extension to add JSON Schema validation at the database level for an extra safety net.
**Warning signs:** TypeScript `any` spreading through components. Runtime errors accessing undefined nested fields.

### Pitfall 3: Agreement Number Sequence Resets on Year Change

**What goes wrong:** The agreement number format is TJ-YYYY-NNNN where YYYY is the current year. If the sequence is global and never resets, by 2027 the numbers will be TJ-2027-0050 (continuing from where 2026 left off), which may be fine. But if the business wants numbering to restart at 0001 each year, the simple `nextval()` approach won't handle that.
**Why it happens:** PostgreSQL sequences are monotonically increasing. They have no concept of "reset on year boundary."
**How to avoid:** Design decision needed. Two options: (A) Accept globally incrementing numbers (TJ-2026-0001 through TJ-2027-0055 etc. -- simpler, guaranteed unique), or (B) Use a counter table that tracks the last number per year and increment in a transaction. Option A is recommended for simplicity.
**Warning signs:** Business owner expects 0001 at the start of each year but gets a continuing number.

### Pitfall 4: Supabase Anon Key Exposed in Client Bundle

**What goes wrong:** Developers panic when they realize `VITE_SUPABASE_ANON_KEY` is visible in the browser's network requests and bundled JavaScript. They think this is a security vulnerability.
**Why it happens:** Misunderstanding of Supabase's security model. The anon key is MEANT to be public. It only identifies the project and provides the `anon` role. Security comes from Row Level Security (RLS) policies, not from key secrecy.
**How to avoid:** Understand the model: the anon key gives the `anon` PostgreSQL role. RLS policies control what `anon` can do. The `service_role` key (which bypasses RLS) must NEVER be in client code. Keep `service_role` key only in Edge Functions and server-side code.
**Warning signs:** Someone adds `VITE_SUPABASE_SERVICE_ROLE_KEY` to the frontend env. This is a critical security error.

### Pitfall 5: Auth Loading State Causes Flash of Login Page

**What goes wrong:** On page load, `user` is null while `supabase.auth.getSession()` is still resolving. The protected route redirects to `/login`, then immediately redirects back to `/admin` once the session loads. This causes a visible flash/flicker.
**Why it happens:** Auth state is asynchronous. The initial render happens before the session is retrieved.
**How to avoid:** Use a `loading` boolean in the AuthProvider. While `loading` is true, render a loading spinner or blank page instead of redirecting. Only redirect to `/login` when `loading === false && user === null`.
**Warning signs:** Brief flash of login page on every page refresh when already authenticated.

## Code Examples

Verified patterns from official sources:

### Creating a Supabase Client with TypeScript Types

```typescript
// src/lib/supabase.ts
// Source: https://supabase.com/docs/reference/javascript/typescript-support
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Agreement CRUD Operations

```typescript
// Create a new agreement
async function createAgreement(data: Partial<AgreementData>, userId: string) {
  const { data: agreement, error } = await supabase
    .from('agreements')
    .insert({
      data: data as unknown as Json,  // JSONB column
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  // Log creation in audit trail
  await supabase.from('audit_log').insert({
    agreement_id: agreement.id,
    action: 'created',
    actor_type: 'admin',
    actor_id: userId,
    metadata: { agreement_number: agreement.agreement_number },
  })

  return agreement
}

// Read agreement by ID
async function getAgreement(id: string) {
  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Update agreement data (admin editing)
async function updateAgreement(id: string, data: Partial<AgreementData>, userId: string) {
  const { data: updated, error } = await supabase
    .from('agreements')
    .update({ data: data as unknown as Json })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await supabase.from('audit_log').insert({
    agreement_id: id,
    action: 'updated',
    actor_type: 'admin',
    actor_id: userId,
  })

  return updated
}

// List all agreements (for admin dashboard)
async function listAgreements() {
  const { data, error } = await supabase
    .from('agreements')
    .select('id, agreement_number, status, created_at, updated_at, data->renter->fullName')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
```

### Sign In and Sign Out

```typescript
// Source: https://supabase.com/docs/guides/auth/passwords
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@thetriplejauto.com',
  password: 'secure-password-here',
})

// Sign out
await supabase.auth.signOut()
```

### Zustand Store with TypeScript (v5 pattern)

```typescript
// Source: https://zustand.docs.pmnd.rs/migrations/migrating-to-v5
import { create } from 'zustand'

interface BearStore {
  bears: number
  increase: () => void
}

// Always use create<T>()() in TypeScript (double invocation)
const useBearStore = create<BearStore>()((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
}))

// Use with selector to prevent unnecessary re-renders
const bears = useBearStore((state) => state.bears)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind CDN play mode | @tailwindcss/vite plugin build | Tailwind v4 (Jan 2025) | Must migrate. CDN is dev-only, not production-ready. |
| tailwind.config.js (JS) | @theme CSS directive | Tailwind v4 | Config lives in CSS now, not JS. |
| @tailwind base/components/utilities | @import "tailwindcss" | Tailwind v4 | Single import replaces three directives. |
| react-router-dom package | react-router package | React Router v7 | `react-router-dom` is deprecated. Use `react-router` directly. Import `RouterProvider` from `react-router/dom`. |
| useState for all state | Zustand create()() | Zustand v5 | TypeScript requires double invocation `create<T>()()`. |
| supabase-js anon key | supabase-js publishable key | Supabase 2025 | New terminology: "publishable key" replaces "anon key" but they work identically. Both formats accepted. |

**Deprecated/outdated:**
- `react-router-dom` as a separate package: import from `react-router` instead
- `@tailwind base; @tailwind components; @tailwind utilities;` directives: use `@import "tailwindcss"` in v4
- `tailwind.config.js` / `tailwind.config.ts`: use `@theme` CSS block in v4
- CDN play mode `https://cdn.tailwindcss.com`: replace with @tailwindcss/vite for production

## Open Questions

Things that could not be fully resolved:

1. **Tailwind v4 custom color class name format**
   - What we know: v4 uses `@theme` with CSS custom properties. Standard utilities like `bg-white` are unchanged.
   - What's unclear: Whether `--color-forest-green` produces `bg-forest-green` or if the naming convention allows `--color-forestGreen` to produce `bg-forestGreen`. The v4 docs suggest kebab-case but this needs validation.
   - Recommendation: Test with a small example during implementation. If kebab-case is required, do a global search-replace across all component files.

2. **IP address extraction via `current_setting('request.headers')`**
   - What we know: PostgREST exposes request headers to PostgreSQL via `current_setting`. The `x-forwarded-for` header contains the client IP.
   - What's unclear: Whether this works reliably on the latest Supabase hosted platform, and whether the header name is lowercase or mixed-case in the JSONB.
   - Recommendation: Test with a simple RPC function after Supabase project setup. If unreliable, fall back to passing IP via a Supabase Edge Function that reads `req.headers.get('x-forwarded-for')`.

3. **Agreement number sequence behavior across years**
   - What we know: A PostgreSQL SEQUENCE with `lpad(nextval(...), 4, '0')` produces 0001, 0002, etc. The year comes from `EXTRACT(YEAR FROM NOW())`.
   - What's unclear: Whether the business wants numbering to reset to 0001 each January 1st, or if globally incrementing numbers are acceptable.
   - Recommendation: Default to globally incrementing (simpler, guaranteed unique). The year in the format already provides temporal context. Discuss with the business owner if this matters.

4. **Supabase free tier project pausing**
   - What we know: Supabase free tier pauses projects after 1 week of no API requests.
   - What's unclear: Whether the admin's regular usage (creating agreements weekly) is sufficient to prevent pausing, or if a keepalive mechanism is needed.
   - Recommendation: The admin dashboard will generate API requests naturally. If the business is inactive for a week (vacation), the project pauses but resumes instantly when the admin logs in. This is acceptable for a free tier.

## Sources

### Primary (HIGH confidence)
- [Supabase React Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs) - Client setup, environment variables, data querying
- [Supabase Auth - Password-based](https://supabase.com/docs/guides/auth/passwords) - signUp, signInWithPassword, signOut
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) - Policy syntax, role targeting
- [Supabase JSONB Documentation](https://supabase.com/docs/guides/database/json) - JSONB columns, querying, indexing
- [React Router v7 Data Mode Installation](https://reactrouter.com/start/data/installation) - createBrowserRouter, RouterProvider
- [React Router v7 Modes](https://reactrouter.com/start/modes) - Declarative vs Data vs Framework modes
- [Tailwind CSS v4 Vite Installation](https://tailwindcss.com/docs) - @tailwindcss/vite plugin setup
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) - Migration from v3/CDN to v4
- [Zustand npm](https://www.npmjs.com/package/zustand) - v5.0.11, create<T>()() TypeScript pattern
- [PostgreSQL CREATE SEQUENCE](https://www.postgresql.org/docs/current/sql-createsequence.html) - Sequence syntax

### Secondary (MEDIUM confidence)
- [Supabase Postgres Audit Blog](https://supabase.com/blog/postgres-audit) - Trigger-based audit trail in 150 lines of SQL
- [Supabase Discussion #27002](https://github.com/orgs/supabase/discussions/27002) - Getting IP address in RPC functions via current_setting
- [PostgREST header hacking repo](https://github.com/burggraf/postgrest-header-hacking) - Reading request headers in PostgreSQL functions
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks) - Triggering Edge Functions from DB events
- [React Router Protected Routes with Supabase (Medium)](https://medium.com/@seojeek/protected-routes-in-react-router-6-with-supabase-authentication-and-oauth-599047e08163) - Protected route pattern
- [Zustand v5 Getting Started](https://jsdev.space/howto/zustand5-react/) - v5 TypeScript patterns

### Tertiary (LOW confidence)
- [Supabase publishable key naming](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs) - New key naming (VITE_SUPABASE_PUBLISHABLE_KEY vs VITE_SUPABASE_ANON_KEY) -- the quickstart references "publishable key" but older docs still use "anon key". Both work. Needs validation during setup.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are locked decisions from prior research. Versions verified via npm registry and official docs.
- Architecture: HIGH - Supabase + React Router + Zustand patterns are well-documented with official examples for each combination.
- Database schema: HIGH - PostgreSQL sequences, JSONB, RLS, and triggers are core Postgres features with extensive documentation.
- Pitfalls: MEDIUM-HIGH - Most pitfalls verified from official docs and community discussions. IP address extraction pattern needs runtime validation.

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (30 days -- all technologies are stable/mature)
