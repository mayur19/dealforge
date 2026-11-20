import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductTable } from '../src/pages/products/ProductTable';

const product = {
  id: '00000000-0000-4000-8000-000000000001',
  sku: 'EPS-SEAT',
  name: 'Managed endpoint security seat',
  category: 'Security',
  description: '',
  type: 'RECURRING' as const,
  unit: 'seat/month',
  listPriceMinor: 1200,
  unitCostMinor: 700,
  currencyCode: 'USD',
  active: true,
  createdAt: '2026-11-20T00:00:00.000Z',
  updatedAt: '2026-11-20T00:00:00.000Z',
};

describe('ProductTable', () => {
  it('formats integer money and list margin for display', () => {
    render(
      <ProductTable
        products={[
          product,
          { ...product, id: 'x', sku: 'FREE', listPriceMinor: 0, unitCostMinor: 0, active: false },
        ]}
      />,
    );
    expect(screen.getByText('$12.00')).toBeInTheDocument();
    expect(screen.getByText('$7.00')).toBeInTheDocument();
    expect(screen.getByText('41.67%')).toBeInTheDocument();
    expect(screen.getByText('n/a')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders an empty state', () => {
    render(<ProductTable products={[]} />);
    expect(screen.getByText('No products yet.')).toBeInTheDocument();
  });
});
