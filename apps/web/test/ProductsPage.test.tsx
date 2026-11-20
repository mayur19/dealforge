import type { Role, SessionUser } from '@dealforge/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../src/auth/AuthProvider';
import { AppShell } from '../src/components/AppShell';
import { ProductsPage } from '../src/pages/products/ProductsPage';

const product = {
  id: '00000000-0000-4000-8000-000000000001',
  sku: 'EPS-SEAT',
  name: 'Managed endpoint security seat',
  category: 'Security',
  description: '',
  type: 'RECURRING',
  unit: 'seat/month',
  listPriceMinor: 1200,
  unitCostMinor: 700,
  currencyCode: 'USD',
  active: true,
  createdAt: '2026-11-20T00:00:00.000Z',
  updatedAt: '2026-11-20T00:00:00.000Z',
};

function user(role: Role): SessionUser {
  return {
    id: '00000000-0000-4000-8000-0000000000u1',
    organizationId: '00000000-0000-4000-8000-0000000000aa',
    organizationName: 'Helix Managed Services',
    currencyCode: 'USD',
    email: 'u@helix.example',
    displayName: 'Test User',
    role,
  };
}

function renderWith(role: Role, ui: React.ReactNode) {
  const value: AuthContextValue = {
    state: { status: 'authenticated', user: user(role) },
    login: vi.fn(),
    logout: vi.fn(async () => undefined),
  };
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthContext.Provider>,
  );
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => vi.unstubAllGlobals());

describe('ProductsPage', () => {
  it('lists products read-only for sales reps', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        json(200, {
          success: true,
          data: [product],
          error: null,
          meta: { total: 1, page: 1, limit: 20 },
        }),
      ),
    );
    renderWith('SALES_REP', <ProductsPage />);
    expect(await screen.findByText('EPS-SEAT')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1 · 1 products')).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'New product' })).not.toBeInTheDocument();
  });

  it('shows an access message when the API forbids the catalog', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        json(403, { success: false, data: null, error: { code: 'FORBIDDEN', message: 'no' } }),
      ),
    );
    renderWith('SALES_REP', <ProductsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('You do not have access');
  });

  it('lets pricing managers create a product and posts integer minor units', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? json(201, { success: true, data: { ...product, sku: 'NEW-1' }, error: null })
        : json(200, {
            success: true,
            data: [],
            error: null,
            meta: { total: 0, page: 1, limit: 20 },
          }),
    );
    vi.stubGlobal('fetch', fetchMock);
    renderWith('PRICING_MANAGER', <ProductsPage />);
    expect(await screen.findByText('No products yet.')).toBeInTheDocument();

    const fill = (label: string, value: string) =>
      fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
    fill('SKU', 'new-1');
    fill('Name', 'Workshop');
    fill('Category', 'Services');
    fill('Unit', 'session');
    fill('List price (USD)', '1,250.10');
    fill('Unit cost (USD)', '800.05');
    fireEvent.click(screen.getByRole('button', { name: 'Create product' }));

    expect(await screen.findByText('Created NEW-1.')).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(JSON.parse(String(post[1]!.body))).toMatchObject({
      sku: 'NEW-1',
      listPriceMinor: 125_010,
      unitCostMinor: 80_005,
    });
  });

  it('shows field errors without calling the API and surfaces conflicts', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? json(409, {
            success: false,
            data: null,
            error: { code: 'CONFLICT', message: 'A product with SKU X-1 already exists' },
          })
        : json(200, {
            success: true,
            data: [],
            error: null,
            meta: { total: 0, page: 1, limit: 20 },
          }),
    );
    vi.stubGlobal('fetch', fetchMock);
    renderWith('SALES_ADMIN', <ProductsPage />);
    await screen.findByText('No products yet.');
    fireEvent.click(screen.getByRole('button', { name: 'Create product' }));
    expect(await screen.findAllByText('Required')).not.toHaveLength(0);
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);

    const fill = (label: string, value: string) =>
      fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
    fill('SKU', 'X-1');
    fill('Name', 'X');
    fill('Category', 'C');
    fill('Unit', 'u');
    fill('List price (USD)', '1');
    fill('Unit cost (USD)', '1');
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'RECURRING' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create product' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
  });
});

describe('AppShell', () => {
  it('groups navigation by section and shows only permitted screens', async () => {
    renderWith('FINANCE_APPROVER', <AppShell />);
    expect(screen.getByText('Finance Approver')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Approval inbox/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Quote builder/ })).not.toBeInTheDocument();
    expect(screen.getByText('Approvals')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument(),
    );
  });
});
