import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { AuthProvider } from '../src/auth/AuthProvider';

const sessionUser = {
  id: '00000000-0000-4000-8000-000000000001',
  organizationId: '00000000-0000-4000-8000-0000000000aa',
  organizationName: 'Helix Managed Services',
  currencyCode: 'USD',
  email: 'rep@helix.example',
  displayName: 'Ravi Rep',
  role: 'SALES_REP',
};
const session = { user: sessionUser, csrfToken: 'c'.repeat(43) };

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const unauthenticated = () =>
  json(401, {
    success: false,
    data: null,
    error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
  });

function renderApp(path: string, handler: (url: string, init?: RequestInit) => Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => handler(url, init)),
  );
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('App routing and authentication', () => {
  it('sends anonymous users to login, signs in and lands on the dashboard', async () => {
    renderApp('/quotes', (url) =>
      url.endsWith('/auth/login')
        ? json(200, { success: true, data: session, error: null })
        : unauthenticated(),
    );
    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'rep@helix.example' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'DemoPassword!2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { name: 'Quotes' })).toBeInTheDocument();
    expect(screen.getByText('DF-033')).toBeInTheDocument();
  });

  it('shows a generic error for invalid credentials', async () => {
    renderApp('/login', () => unauthenticated());
    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'rep@helix.example' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  it('reports non-auth failures differently', async () => {
    renderApp('/login', (url) =>
      url.endsWith('/auth/login')
        ? json(500, { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: 'x' } })
        : unauthenticated(),
    );
    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'rep@helix.example' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'whatever' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in failed. Try again.');
  });

  it('restores an existing session, shows the dashboard and signs out', async () => {
    renderApp('/', (url) => {
      if (url.endsWith('/auth/session'))
        return json(200, { success: true, data: session, error: null });
      if (url.endsWith('/auth/logout'))
        return json(200, { success: true, data: { loggedOut: true }, error: null });
      return unauthenticated();
    });
    expect(await screen.findByRole('heading', { name: 'Welcome, Ravi Rep' })).toBeInTheDocument();
    expect(screen.getByText('DF-049')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });
});
