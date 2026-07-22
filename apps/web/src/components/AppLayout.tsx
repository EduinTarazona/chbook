import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from './Logo';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/miembros', label: 'Miembros' },
  { to: '/cultos', label: 'Cultos' },
  { to: '/eventos', label: 'Calendario' },
];

export function AppLayout() {
  const { church, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (!loading && !church) return <Navigate to="/registro-iglesia" replace />;

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="flex w-60 flex-col bg-sage-dark text-white">
        <div className="border-b border-white/10 p-5">
          <div className="[&_span:last-child]:text-white">
            <Logo size="sm" />
          </div>
          {church && (
            <p className="mt-3 truncate text-sm text-white/70">{church.name}</p>
          )}
          {church?.code && (
            <p className="font-mono text-xs text-white/50">{church.code}</p>
          )}
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {church && (
          <a
            href={`/iglesia/${church.slug}`}
            target="_blank"
            rel="noreferrer"
            className="mx-3 rounded-lg px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Ver perfil público ↗
          </a>
        )}
        <button
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
          className="m-3 rounded-lg px-4 py-2.5 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Cerrar sesión
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
