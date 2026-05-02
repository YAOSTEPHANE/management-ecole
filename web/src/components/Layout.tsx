import Link from 'next/link';
import { useState } from 'react';
import Avatar from './ui/Avatar';
import { FiChevronDown, FiLogOut } from 'react-icons/fi';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  role: string;
}

const ROLE_ACCENTS: Record<
  string,
  { bar: string; badge: string; logo: string; label: string }
> = {
  ADMIN: {
    bar: 'from-indigo-500 via-violet-500 to-fuchsia-500',
    badge: 'bg-indigo-500/10 text-indigo-800 ring-1 ring-indigo-500/20',
    logo: 'from-indigo-600 to-violet-600',
    label: 'Administrateur',
  },
  TEACHER: {
    bar: 'from-emerald-500 via-teal-500 to-cyan-500',
    badge: 'bg-emerald-500/10 text-emerald-900 ring-1 ring-emerald-500/20',
    logo: 'from-emerald-600 to-teal-600',
    label: 'Enseignant',
  },
  STUDENT: {
    bar: 'from-fuchsia-500 via-purple-500 to-indigo-500',
    badge: 'bg-fuchsia-500/10 text-fuchsia-900 ring-1 ring-fuchsia-500/20',
    logo: 'from-fuchsia-600 to-purple-600',
    label: 'Élève',
  },
  PARENT: {
    bar: 'from-amber-500 via-orange-500 to-rose-500',
    badge: 'bg-orange-500/10 text-orange-900 ring-1 ring-orange-500/20',
    logo: 'from-amber-500 to-orange-600',
    label: 'Parent',
  },
  EDUCATOR: {
    bar: 'from-rose-500 via-pink-500 to-red-500',
    badge: 'bg-rose-500/10 text-rose-900 ring-1 ring-rose-500/20',
    logo: 'from-rose-600 to-pink-600',
    label: 'Éducateur',
  },
};

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, role }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const accent = ROLE_ACCENTS[role] ?? ROLE_ACCENTS.ADMIN;

  const getRolePath = () => {
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'TEACHER':
        return '/teacher';
      case 'STUDENT':
        return '/student';
      case 'PARENT':
        return '/parent';
      case 'EDUCATOR':
        return '/educator';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40">
        <div
          className={`h-1 w-full bg-gradient-to-r opacity-95 ${accent.bar}`}
          aria-hidden
        />
        <nav className="glass-nav">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex h-16 items-center justify-between gap-4">
              <Link
                href={getRolePath()}
                className="flex items-center gap-3 min-w-0 group"
              >
                <div
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.logo} text-white shadow-lg shadow-black/10 ring-2 ring-white/30 transition duration-300 group-hover:scale-[1.03] group-hover:shadow-xl`}
                >
                  <span className="font-display text-lg font-bold tracking-tight">É</span>
                  <span
                    className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/25"
                    aria-hidden
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                    Gestion scolaire
                  </p>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-500 truncate">
                    Espace sécurisé
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-3 sm:gap-4">
                <span
                  className={`hidden sm:inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${accent.badge}`}
                >
                  {accent.label}
                </span>

                <div className="hidden md:block text-right min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">{user?.email}</p>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-2 py-1.5 pr-3 shadow-sm backdrop-blur-sm transition hover:bg-white hover:shadow-md hover:border-slate-300/90"
                    aria-expanded={showUserMenu}
                    aria-haspopup="menu"
                  >
                    <span className="ring-2 ring-white rounded-full shadow-sm">
                      <Avatar
                        src={user?.avatar}
                        name={`${user?.firstName} ${user?.lastName}`}
                        size="md"
                      />
                    </span>
                    <FiChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showUserMenu && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 py-2 shadow-premium backdrop-blur-xl animate-fade-in z-50"
                    >
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-slate-500 break-all">{user?.email}</p>
                        <p className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:hidden ${accent.badge}`}>
                          {accent.label}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                      >
                        <FiLogOut className="h-4 w-4 shrink-0" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main className="animate-fade-in">{children}</main>

      {showUserMenu && (
        <button
          type="button"
          className="fixed inset-0 z-30 cursor-default bg-slate-900/10 backdrop-blur-[2px]"
          aria-label="Fermer le menu"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

export default Layout;
