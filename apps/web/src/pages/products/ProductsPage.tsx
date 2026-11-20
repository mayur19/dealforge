import { can } from '@dealforge/shared';
import { useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { ProductCreateForm } from './ProductCreateForm';
import { ProductTable } from './ProductTable';
import { PAGE_SIZE, useProductPage } from './useProductPage';

/**
 * PRD §4 screen 3 (DF-012). Search and filters arrive with DF-014; editing and
 * archiving with DF-013.
 */
export function ProductsPage() {
  const { state: auth } = useAuth();
  const { state, pageNumber, setPageNumber, reload } = useProductPage();
  const [notice, setNotice] = useState<string | null>(null);
  if (auth.status !== 'authenticated') return null;
  const { user } = auth;
  const totalPages =
    state.status === 'ready' ? Math.max(1, Math.ceil(state.page.meta.total / PAGE_SIZE)) : 1;

  return (
    <section className="stack">
      <header className="page-header">
        <h1>Product catalog</h1>
        <p className="muted">
          Prices and costs are stored as integer minor units in {user.currencyCode}.
        </p>
      </header>
      {can(user.role, 'catalog:write') ? (
        <ProductCreateForm
          currency={user.currencyCode}
          onCreated={(product) => {
            setNotice(`Created ${product.sku}.`);
            reload();
          }}
        />
      ) : null}
      {notice ? (
        <p className="alert alert--ok" role="status">
          {notice}
        </p>
      ) : null}
      {state.status === 'loading' ? <p role="status">Loading products…</p> : null}
      {state.status === 'error' ? (
        <p className="alert alert--error" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === 'ready' ? (
        <>
          <ProductTable products={state.page.data} />
          <nav className="pager" aria-label="Pagination">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber(pageNumber - 1)}
            >
              Previous
            </button>
            <span className="muted">
              Page {pageNumber} of {totalPages} · {state.page.meta.total} products
            </span>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber(pageNumber + 1)}
            >
              Next
            </button>
          </nav>
        </>
      ) : null}
    </section>
  );
}
