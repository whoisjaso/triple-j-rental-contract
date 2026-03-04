# Remove Login + Add Gold Crest Branding — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all auth gating so the app loads straight to the agreement list, and add the gold JJAI crest logo throughout admin nav and client signing pages.

**Architecture:** Strip the AuthProvider/login layer entirely. Admin pages become unguarded. Supabase remains for data CRUD but auth calls are removed. The gold crest PNG is copied to `public/` and referenced as a static asset. CRUD functions that accepted `userId` get a hardcoded fallback.

**Tech Stack:** React 19, React Router 7, Supabase (data only), Tailwind CSS 4, Vite 6

---

### Task 1: Create `public/` directory and copy logo

**Files:**
- Create: `public/logo-crest.png` (copy from `D:/GoldTripleJLogo.png`)

**Step 1: Create public directory and copy logo**

```bash
mkdir -p D:/triple-j-auto-investment-agreement/public
cp "D:/GoldTripleJLogo.png" "D:/triple-j-auto-investment-agreement/public/logo-crest.png"
```

**Step 2: Verify the file exists**

```bash
ls -la D:/triple-j-auto-investment-agreement/public/logo-crest.png
```

Expected: File exists, ~2.6MB

**Step 3: Commit**

```bash
git add public/logo-crest.png
git commit -m "asset: add gold JJAI crest logo to public/"
```

---

### Task 2: Remove auth — strip AuthProvider from App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Replace App.tsx contents**

Remove the `AuthProvider` import and wrapping. The file should become:

```tsx
import { RouterProvider } from 'react-router/dom'
import { router } from './router'

export default function App() {
  return <RouterProvider router={router} />
}
```

**Step 2: Verify dev server still loads (no crash)**

Open `http://localhost:5174/` — it will still redirect to `/admin` which still has the auth guard, so it'll redirect to `/login`. That's fine — we fix that next.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: remove AuthProvider wrapping from App"
```

---

### Task 3: Remove auth — update router (remove /login, keep /admin as root)

**Files:**
- Modify: `src/router.tsx`

**Step 1: Update router.tsx**

Remove the `/login` route and the `AdminLogin` import. Keep the root `/` redirect to `/admin`:

```tsx
import { createBrowserRouter, Navigate } from 'react-router'
import AdminLayout from './pages/AdminLayout'
import AgreementList from './pages/AgreementList'
import AgreementCreate from './pages/AgreementCreate'
import AgreementEdit from './pages/AgreementEdit'
import ExpiredPage from './pages/ExpiredPage'
import ClientSign from './pages/ClientSign'
import ClientSignComplete from './pages/ClientSignComplete'

export const router = createBrowserRouter([
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AgreementList /> },
      { path: 'agreements/new', element: <AgreementCreate /> },
      { path: 'agreements/:id', element: <AgreementEdit /> },
    ],
  },
  // Public client signing routes — NOT nested under /admin layout
  // /sign/expired registered BEFORE /sign/:token to prevent 'expired' matching as a token (D-0201-3)
  {
    path: '/sign/expired',
    element: <ExpiredPage />,
  },
  {
    path: '/sign/:token',
    element: <ClientSign />,
  },
  {
    path: '/sign/:token/complete',
    element: <ClientSignComplete />,
  },
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },
])
```

**Step 2: Commit**

```bash
git add src/router.tsx
git commit -m "refactor: remove /login route from router"
```

---

### Task 4: Remove auth — update AdminLayout (remove guard, add logo)

**Files:**
- Modify: `src/pages/AdminLayout.tsx`

**Step 1: Rewrite AdminLayout.tsx**

Remove all auth imports/checks. Add the gold crest logo (60px) to the nav. Remove Sign Out button:

```tsx
import { Outlet } from 'react-router'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-luxury-bg">
      <nav className="bg-white border-b border-luxury-ink/10 px-6 py-3 flex items-center gap-3">
        <img
          src="/logo-crest.png"
          alt="JJAI"
          className="h-[60px] w-auto"
        />
        <span className="text-lg font-bold text-luxury-ink tracking-wide">
          Triple J Auto Investment
        </span>
      </nav>
      <Outlet />
    </div>
  )
}
```

**Step 2: Verify in browser**

Navigate to `http://localhost:5174/admin` — should show the gold crest in the nav with no login redirect.

**Step 3: Commit**

```bash
git add src/pages/AdminLayout.tsx
git commit -m "refactor: remove auth guard from AdminLayout, add gold crest logo"
```

---

### Task 5: Remove auth — update AgreementCreate (remove useAuth)

**Files:**
- Modify: `src/pages/AgreementCreate.tsx`

**Step 1: Remove useAuth import and usage**

Remove `import { useAuth } from '../lib/auth'` and `const { user } = useAuth()`.
Remove the `if (!user) return` guard in `handleSave`.
Pass `'admin'` as the userId to `createAgreement`:

Change `handleSave` to:

```tsx
async function handleSave() {
  setSaving(true)
  setError(null)
  try {
    const { id } = await createAgreement(data, 'admin')
    navigate(`/admin/agreements/${id}`)
  } catch (err: any) {
    setError(err.message || 'Failed to save agreement')
  } finally {
    setSaving(false)
  }
}
```

**Step 2: Commit**

```bash
git add src/pages/AgreementCreate.tsx
git commit -m "refactor: remove useAuth from AgreementCreate, use hardcoded admin id"
```

---

### Task 6: Remove auth — update AgreementEdit (remove useAuth)

**Files:**
- Modify: `src/pages/AgreementEdit.tsx`

**Step 1: Remove useAuth import and usage**

Remove `import { useAuth } from '../lib/auth'` and `const { user } = useAuth()`.
Remove the `if (!user || !id) return` guard — change to `if (!id) return`.
Pass `'admin'` as the userId to `updateAgreement`:

Change `handleSave` to:

```tsx
async function handleSave() {
  if (!id) return
  setSaving(true)
  setError(null)
  setSaveSuccess(false)
  try {
    await updateAgreement(id, data, 'admin')
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
    const log = await getAuditLog(id)
    setAuditLog(log as AuditEntry[])
  } catch (err: any) {
    setError(err.message || 'Failed to save changes')
  } finally {
    setSaving(false)
  }
}
```

**Step 2: Commit**

```bash
git add src/pages/AgreementEdit.tsx
git commit -m "refactor: remove useAuth from AgreementEdit, use hardcoded admin id"
```

---

### Task 7: Delete AdminLogin.tsx and auth.tsx

**Files:**
- Delete: `src/pages/AdminLogin.tsx`
- Delete: `src/lib/auth.tsx`

**Step 1: Delete the files**

```bash
rm src/pages/AdminLogin.tsx src/lib/auth.tsx
```

**Step 2: Verify no remaining imports of auth**

Search for any remaining references to `from '../lib/auth'` or `from './lib/auth'` in `src/`. There should be none after Tasks 4-6.

```bash
grep -r "lib/auth" src/
```

Expected: No results

**Step 3: Verify dev server compiles without errors**

Check the Vite terminal — no import errors.

**Step 4: Commit**

```bash
git add -u src/pages/AdminLogin.tsx src/lib/auth.tsx
git commit -m "refactor: delete AdminLogin and auth module"
```

---

### Task 8: Add gold crest to ClientSign loading + error states

**Files:**
- Modify: `src/pages/ClientSign.tsx`

**Step 1: Replace text "JJAI" with crest image in loading state**

In the loading state (line ~136), replace:
```tsx
<div className="text-3xl font-bold text-luxury-gold tracking-widest mb-1">JJAI</div>
<div className="text-sm font-semibold text-luxury-ink mb-8">Triple J Auto Investment LLC</div>
```

With:
```tsx
<img src="/logo-crest.png" alt="JJAI" className="h-[120px] w-auto mb-2" />
<div className="text-sm font-semibold text-luxury-ink mb-8">Triple J Auto Investment LLC</div>
```

**Step 2: Same replacement in error state**

In the error state (line ~150), make the same replacement.

**Step 3: Replace text "JJAI" with crest image in the main header**

In the branded header (line ~171), replace:
```tsx
<div className="text-2xl font-bold text-luxury-gold tracking-widest leading-none">JJAI</div>
<div className="text-sm font-semibold text-luxury-ink mt-0.5">Triple J Auto Investment LLC</div>
```

With:
```tsx
<img src="/logo-crest.png" alt="JJAI" className="h-[48px] w-auto" />
<div className="text-sm font-semibold text-luxury-ink mt-0.5">Triple J Auto Investment LLC</div>
```

**Step 4: Commit**

```bash
git add src/pages/ClientSign.tsx
git commit -m "style: replace text JJAI with gold crest logo on client signing pages"
```

---

### Task 9: Add hero crest to ClientReviewStep (Step 0)

**Files:**
- Modify: `src/components/ClientReviewStep.tsx`

**Step 1: Add hero crest above the review header**

Inside the component's return, add a centered hero crest block at the top of the card, before the existing header div. Replace the opening of the return:

```tsx
return (
  <div className="bg-white rounded-2xl shadow-sm border border-luxury-ink/10 overflow-hidden">
    {/* Hero brand crest */}
    <div className="flex flex-col items-center pt-8 pb-4">
      <img src="/logo-crest.png" alt="JJAI" className="h-[120px] w-auto mb-2" />
      <div className="text-base font-serif font-semibold text-luxury-gold tracking-wide">
        Triple J Auto Investment LLC
      </div>
    </div>

    {/* Header */}
    <div className="px-6 pt-2 pb-4 border-b border-luxury-ink/10">
```

Note: Changed `pt-6` to `pt-2` on the existing header div since the hero provides the top spacing now.

**Step 2: Verify in browser**

Navigate to a client signing link — Step 0 should show the large gold crest centered above "Review Your Agreement".

**Step 3: Commit**

```bash
git add src/components/ClientReviewStep.tsx
git commit -m "style: add hero gold crest to client review step"
```

---

### Task 10: Add crest to ClientSignComplete page

**Files:**
- Modify: `src/pages/ClientSignComplete.tsx`

**Step 1: Replace text "JJAI" in the header**

Replace the header (line ~13):
```tsx
<div className="text-2xl font-bold text-luxury-gold tracking-widest leading-none">JJAI</div>
<div className="text-sm font-semibold text-luxury-ink mt-0.5">Triple J Auto Investment LLC</div>
```

With:
```tsx
<img src="/logo-crest.png" alt="JJAI" className="h-[48px] w-auto" />
<div className="text-sm font-semibold text-luxury-ink mt-0.5">Triple J Auto Investment LLC</div>
```

**Step 2: Replace text "JJAI" brand mark in the success card**

Replace the brand mark section inside the card (line ~23):
```tsx
<div className="text-3xl font-bold text-luxury-gold tracking-widest leading-none">JJAI</div>
<div className="text-xs font-semibold text-luxury-ink mt-0.5 tracking-wide">
  Triple J Auto Investment LLC
</div>
```

With:
```tsx
<img src="/logo-crest.png" alt="JJAI" className="h-[80px] w-auto" />
<div className="text-xs font-semibold text-luxury-ink mt-1 tracking-wide">
  Triple J Auto Investment LLC
</div>
```

**Step 3: Commit**

```bash
git add src/pages/ClientSignComplete.tsx
git commit -m "style: replace text JJAI with gold crest on completion page"
```

---

### Task 11: Add crest to ExpiredPage

**Files:**
- Modify: `src/pages/ExpiredPage.tsx`

**Step 1: Read ExpiredPage.tsx to find all "JJAI" text references**

Read the file, find any text "JJAI" and replace with the crest image at 48px in headers, 80px in body cards (matching the patterns from Tasks 8-10).

**Step 2: Commit**

```bash
git add src/pages/ExpiredPage.tsx
git commit -m "style: replace text JJAI with gold crest on expired page"
```

---

### Task 12: Final verification

**Step 1: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 2: Verify build succeeds**

```bash
npm run build
```

Expected: Build completes successfully

**Step 3: Manual smoke test**

- Visit `http://localhost:5174/` → should redirect to `/admin` showing agreement list with gold crest in nav (60px)
- No login screen anywhere
- Click "New Agreement" → form works, save works (uses `'admin'` as userId)
- Client signing page loading state → 120px gold crest
- Client signing Step 0 → hero 120px gold crest above review
- Client signing Steps 1-5 → 48px crest in header
- Completion page → 48px header crest + 80px card crest
- Expired page → crest replaces text "JJAI"

**Step 4: Final commit (if any cleanup needed)**

```bash
git add -A
git commit -m "chore: remove login, add gold crest branding — complete"
```
