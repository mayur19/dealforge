import { ROLE_LABELS } from '@dealforge/shared';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { PRODUCT_NAME } from '../config';
import { navItemsFor, type NavItem, type NavSection } from '../routes/navigation';

function groupBySection(items: readonly NavItem[]): readonly [NavSection, readonly NavItem[]][] {
  const sections = [...new Set(items.map((item) => item.section))];
  return sections.map((section) => [section, items.filter((item) => item.section === section)]);
}

export function AppShell() {
  const { state, logout } = useAuth();
  if (state.status !== 'authenticated') return null;
  const { user } = state;
  const groups = groupBySection(navItemsFor(user.role));

  return (
    <div className="shell">
      <aside className="shell__sidebar" aria-label="Primary">
        <div className="shell__brand">{PRODUCT_NAME}</div>
        <nav>
          {groups.map(([section, items]) => (
            <div key={section} className="nav__group">
              <p className="nav__section">{section}</p>
              <ul className="nav">
                {items.map((item) => (
                  <li key={item.path}>
                    <NavLink to={item.path} end className="nav__link">
                      {item.label}
                      {item.ticket ? <span className="badge badge--pending">Pending</span> : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <div className="shell__main">
        <header className="topbar">
          <span className="topbar__org">{user.organizationName}</span>
          <span className="topbar__user">
            {user.displayName} · <span className="muted">{ROLE_LABELS[user.role]}</span>
          </span>
          <button type="button" className="btn btn--ghost" onClick={() => void logout()}>
            Sign out
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
