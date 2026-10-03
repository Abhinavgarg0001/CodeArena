import { NavLink } from 'react-router';
import { useSelector } from 'react-redux';

const baseNavItems = [
  { path: '/', label: 'Problems', icon: '📋' },
  { path: '/submissions', label: 'Submissions', icon: '📝' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

const adminNavItem = { path: '/admin', label: 'Admin', icon: '🛠️' };

export function Layout({ children, title }) {
  const { user } = useSelector((state) => state.auth);

  const navItems = user?.role === 'admin' ? [...baseNavItems, adminNavItem] : baseNavItems;

  const closeDrawer = () => {
    const checkbox = document.getElementById('app-drawer-toggle');
    if (checkbox) checkbox.checked = false;
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-base-100">
      <div className="px-4 py-5 border-b border-base-300">
        <NavLink to="/" className="flex items-center gap-2.5" onClick={closeDrawer}>
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center text-lg font-black shadow-md shadow-primary/20">L</span>
          <span className="leading-tight">
            <span className="block font-bold text-lg text-base-content">CodeArena</span>
            <span className="block text-[11px] font-normal text-base-content/40">Practice & Compete</span>
          </span>
        </NavLink>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-base-content/40">
          Menu
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={closeDrawer}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-content shadow-md shadow-primary/20'
                  : 'text-base-content/70 hover:bg-base-200 hover:text-base-content hover:translate-x-0.5'
              }`
            }
          >
            <span className="text-lg w-6 text-center">{item.icon}</span>
            <span>{item.label}</span>
            {item.path === '/admin' && (
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wide opacity-70">Admin</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-base-300">
        {user && (
          <NavLink
            to="/profile"
            onClick={closeDrawer}
            className="flex items-center gap-3 rounded-xl bg-base-200/60 hover:bg-base-200 p-2.5 transition-colors"
            title="View profile"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-primary font-bold shrink-0 ring-1 ring-primary/20">
              {user.firstname?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate leading-tight">{user.firstname}</p>
              <p className="text-xs text-base-content/50 truncate leading-tight">{user.emailID}</p>
            </div>
            {user.role === 'admin' && (
              <span className="badge badge-warning badge-xs shrink-0">Admin</span>
            )}
          </NavLink>
        )}
        <p className="text-center text-[11px] text-base-content/30 mt-3">
          Solve · Submit · Improve
        </p>
      </div>
    </div>
  );

  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200">
      <input id="app-drawer-toggle" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-base-100/90 backdrop-blur border-b border-base-300">
          <div className="flex items-center gap-2 h-16 px-4">
            <label htmlFor="app-drawer-toggle" className="btn btn-ghost btn-circle lg:hidden">
              ☰
            </label>
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="font-semibold text-base-content truncate">{title}</h1>
              )}
            </div>
            {user?.role === 'admin' && (
              <span className="badge badge-warning badge-sm hidden sm:inline-flex">Admin mode</span>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success rounded-full text-xs font-medium whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Online
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      <div className="drawer-side z-40">
        <label htmlFor="app-drawer-toggle" aria-label="close sidebar" className="drawer-overlay" />
        <aside className="w-72 min-h-full">
          {sidebar}
        </aside>
      </div>
    </div>
  );
}