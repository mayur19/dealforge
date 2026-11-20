import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, setCsrfToken } from '../src/api/client';

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  setCsrfToken(null);
});

describe('api client', () => {
  it('unwraps the success envelope', async () => {
    mockFetch(200, { success: true, data: { ok: 1 }, error: null });
    await expect(api.get('/x')).resolves.toEqual({ ok: 1 });
  });

  it('throws ApiError carrying the error envelope', async () => {
    mockFetch(403, { success: false, data: null, error: { code: 'FORBIDDEN', message: 'no' } });
    await expect(api.get('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('returns page metadata for paginated collections', async () => {
    const meta = { total: 7, page: 1, limit: 20 };
    mockFetch(200, { success: true, data: [1, 2], error: null, meta });
    await expect(api.page('/x')).resolves.toEqual({ data: [1, 2], meta });
    mockFetch(200, { success: true, data: [], error: null });
    await expect(api.page('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('attaches the CSRF token only to unsafe methods', async () => {
    const fetchMock = mockFetch(200, { success: true, data: null, error: null });
    setCsrfToken('tok');
    await api.get('/x');
    await api.post('/x', { a: 1 });
    const headersOf = (i: number) =>
      (fetchMock.mock.calls[i] as unknown as [string, RequestInit])[1].headers as Headers;
    expect(headersOf(0).get('X-CSRF-Token')).toBeNull();
    expect(headersOf(1).get('X-CSRF-Token')).toBe('tok');
  });
});
