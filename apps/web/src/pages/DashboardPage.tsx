import { useAuth } from '../auth/useAuth';
import { PendingPage } from './PendingPage';

/** TODO(DF-049): pipeline stages, pending approvals, expiring quotes, value by stage. */
export function DashboardPage() {
  const { state } = useAuth();
  const name = state.status === 'authenticated' ? state.user.displayName : '';
  return (
    <>
      <h1>Welcome, {name}</h1>
      <PendingPage title="Sales dashboard" ticket="DF-049" headingLevel={2} />
    </>
  );
}
