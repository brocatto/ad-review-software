import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, PlusCircle, LogOut, CreditCard } from 'lucide-react';

export function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      isActive
        ? 'bg-white/10 text-white border border-white/10'
        : 'text-white/60 hover:bg-white/5 hover:text-white/80'
    }`;

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
            <li>
              <NavLink to="/dashboard" className={navLinkClass}>
                <LayoutDashboard size={20} />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/batches" className={navLinkClass}>
                <FolderOpen size={20} />
                Lotes Enviados
              </NavLink>
            </li>
            <li>
              <NavLink to="/batches/new" className={navLinkClass}>
                <PlusCircle size={20} />
                Criar Novo Lote
              </NavLink>
            </li>
            <li>
              <NavLink to="/billing" className={navLinkClass}>
                <CreditCard size={20} />
                Faturamento
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-glass-border">
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
