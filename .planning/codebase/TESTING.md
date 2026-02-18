# Testing Patterns

**Analysis Date:** 2026-02-17

## Test Framework

**Runner:**
- Not configured. No test framework is installed or set up.
- No `jest`, `vitest`, `mocha`, `@testing-library/react`, or any other test dependency in `package.json`
- No test configuration files exist (`jest.config.*`, `vitest.config.*`, etc.)
- No test scripts in `package.json` -- only `dev`, `build`, and `preview`

**Assertion Library:**
- None installed

**Run Commands:**
```bash
# No test commands exist. These would need to be added:
# npm test           # Not configured
# npm run test       # Not configured
```

## Test File Organization

**Location:**
- No test files exist anywhere in the codebase
- No `*.test.*` or `*.spec.*` files found
- No `__tests__/` directories

**Naming:**
- No convention established. Recommended pattern for this project:
  - Co-located tests: `components/InputLine.test.tsx` alongside `components/InputLine.tsx`
  - Or dedicated directory: `__tests__/components/InputLine.test.tsx`

**Structure:**
```
# Current (no tests):
components/
  InputLine.tsx
  Section.tsx
  ...

# Recommended co-located pattern:
components/
  InputLine.tsx
  InputLine.test.tsx
  Section.tsx
  Section.test.tsx
  ...
App.tsx
App.test.tsx
```

## Test Structure

**Suite Organization:**
- No existing patterns to reference. Recommended structure for this React + Vite project:

```typescript
// Recommended: Use Vitest (natural fit with Vite) + @testing-library/react
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputLine } from './InputLine';

describe('InputLine', () => {
  it('renders label when provided', () => {
    render(<InputLine label="Full Name" value="" onChange={() => {}} />);
    expect(screen.getByText('Full Name')).toBeInTheDocument();
  });

  it('calls onChange with input value', async () => {
    const handleChange = vi.fn();
    render(<InputLine value="" onChange={handleChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'John');
    expect(handleChange).toHaveBeenCalledWith('J');
  });
});
```

**Patterns:**
- No setup/teardown patterns established
- No assertion patterns established

## Mocking

**Framework:**
- None configured

**Patterns:**
- No mocking patterns exist. Key areas that would need mocking:

```typescript
// window.html2pdf (global CDN library used in App.tsx)
// Recommended approach:
vi.stubGlobal('html2pdf', () => ({
  set: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  save: vi.fn().mockResolvedValue(undefined),
}));

// window.print (used in handlePrint)
vi.stubGlobal('print', vi.fn());

// Canvas 2D context (used in SignaturePad.tsx)
// Would need HTMLCanvasElement.getContext mock
```

**What to Mock:**
- `window.html2pdf` -- CDN-loaded PDF generation library
- `window.print` -- browser print dialog
- `HTMLCanvasElement.getContext('2d')` -- canvas drawing in SignaturePad
- `HTMLCanvasElement.toDataURL` -- signature export in SignaturePad

**What NOT to Mock:**
- React state and props -- test through rendered output
- Component composition (Section, InputLine, etc.) -- render the real components
- Tailwind CSS classes -- don't assert on class names, assert on visible behavior

## Fixtures and Factories

**Test Data:**
- No test fixtures exist. The `initialData` object in `App.tsx` (lines 10-55) serves as a de-facto empty state fixture:

```typescript
// Recommended: Extract to a shared test utility
// test/fixtures/agreementData.ts
import { AgreementData } from '../types';

export const emptyAgreementData: AgreementData = {
  agreementNumber: '',
  agreementDate: '',
  renter: {
    fullName: '', dob: '', dlNumber: '', dlExp: '',
    address: '', cityStateZip: '', phonePrimary: '', phoneSecondary: '',
    email: '', emergencyName: '', emergencyPhone: '', emergencyRelation: '',
    employerName: '', employerPhone: '', monthlyIncome: ''
  },
  // ... (mirror initialData from App.tsx)
};

export const filledAgreementData: AgreementData = {
  agreementNumber: 'AGR-2026-001',
  agreementDate: '02/17/2026',
  renter: {
    fullName: 'John Doe',
    dob: '01/15/1990',
    // ... filled values for integration testing
  },
  // ...
};
```

**Location:**
- No fixtures directory exists. Recommended: `test/fixtures/` or co-located `__fixtures__/`

## Coverage

**Requirements:** None enforced. No coverage tooling configured.

**View Coverage:**
```bash
# Not configured. After adding Vitest:
# npx vitest run --coverage
```

## Test Types

**Unit Tests:**
- None exist. High-value targets for unit testing:
  - `components/InputLine.tsx` -- prop rendering, onChange callback
  - `components/Section.tsx` -- title/number rendering, critical border styling
  - `components/InitialsBox.tsx` -- maxLength enforcement, onChange callback
  - `components/AcknowledgmentBox.tsx` -- text rendering, initials integration
  - `types.ts` -- type-level tests with `tsd` or similar (optional)

**Integration Tests:**
- None exist. High-value targets:
  - `App.tsx` -- form state management via the `update()` helper
  - `App.tsx` -- PDF generation flow (mocked html2pdf)
  - `SignaturePad.tsx` -- canvas interaction and signature save/clear flow

**E2E Tests:**
- Not configured. No Playwright, Cypress, or similar framework.
- Recommended for this form-heavy application: Playwright for testing complete agreement fill-out and PDF generation workflows

## Common Patterns

**Async Testing:**
```typescript
// Recommended pattern for PDF generation test:
import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App PDF generation', () => {
  it('generates PDF when download button clicked', async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('html2pdf', () => ({
      set: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      save: mockSave,
    }));

    render(<App />);
    const pdfButton = screen.getByText('PDF');
    await userEvent.click(pdfButton);

    expect(mockSave).toHaveBeenCalled();
  });
});
```

**Error Testing:**
```typescript
// Recommended pattern for error handling test:
describe('App PDF error handling', () => {
  it('shows alert when html2pdf is unavailable', async () => {
    vi.stubGlobal('html2pdf', undefined);
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<App />);
    const pdfButton = screen.getByText('PDF');
    await userEvent.click(pdfButton);

    expect(alertMock).toHaveBeenCalledWith('PDF generator is unavailable.');
  });
});
```

## Recommended Setup

To add testing to this project, install:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

Create `vitest.config.ts` (or extend `vite.config.ts`):
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
});
```

Create `test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

---

*Testing analysis: 2026-02-17*
