import type { Product } from '@dealforge/shared';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, type Page } from '../../api/client';

export const PAGE_SIZE = 20;

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly page: Page<readonly Product[]> };

export function useProductPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    api
      .page<readonly Product[]>(`/products?page=${pageNumber}&limit=${PAGE_SIZE}`)
      .then((page) => !cancelled && setState({ status: 'ready', page }))
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof ApiError && error.status === 403
            ? 'You do not have access to the product catalog.'
            : 'Could not load products. Try again.';
        setState({ status: 'error', message });
      });
    return () => {
      cancelled = true;
    };
  }, [pageNumber, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { state, pageNumber, setPageNumber, reload };
}
