import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  History,
  Settings,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { getCurrentUser, clearSession } from '../../lib/api';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/batches', label: 'Lotes Enviados', icon: FolderOpen },
  { to: '/batches/new', label: 'Criar Novo Lote', icon: PlusCircle },
  { to: '/history', label: 'Histórico', icon: History },
  { to: '/billing', label: 'Faturamento', icon: CreditCard },
  { to: '/settings', label: 'Configurações', icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = getCurrentUser();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  // "Lotes Enviados" also covers batch detail pages, but not the creation form
  const isActive = (to: string) =>
    to === '/batches'
      ? pathname === '/batches' || (pathname.startsWith('/batches/') && pathname !== '/batches/new')
      : pathname === to || pathname.startsWith(`${to}/`);

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active
        ? 'bg-white/10 text-white border border-white/10'
        : 'text-white/60 hover:bg-white/5 hover:text-white/80'
    }`;

  // Trial badge for self-service accounts (the internal team / admins are never billed)
  const trialDaysLeft = user?.trialEndsAt
    ? Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000)
    : null;
  const showTrial =
    user?.role !== 'ADMIN' && user?.subscriptionStatus === 'TRIAL' && trialDaysLeft !== null;

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <aside className="w-64 bg-glass backdrop-blur-xl border-r border-glass-border flex flex-col">
        <div className="p-6 border-b border-glass-border">
          <h1 className="text-xl font-semibold text-text-primary">AdReviewOS</h1>
          <p className="text-sm text-text-muted mt-1">Painel Interno</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} className={navLinkClass(isActive(to))}>
                  <Icon size={20} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-glass-border">
          {user && (
            <div className="px-4 pb-3">
              <p className="text-sm font-medium text-text-primary truncate">{user.fullName}</p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
              {showTrial && (
                <Link to="/billing" className="badge badge-warning mt-2">
                  {trialDaysLeft > 0 ? `Teste grátis: ${trialDaysLeft} dias` : 'Teste encerrado'}
                </Link>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white/80 w-full transition-all duration-200"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
