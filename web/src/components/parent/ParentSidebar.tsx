import { FiAward, FiAlertCircle, FiFileText, FiCalendar, FiShield, FiCreditCard, FiUsers, FiLayout, FiX, FiBook, FiMessageCircle } from 'react-icons/fi';
import type { IconType } from 'react-icons';

export type ParentNavItem = {
  id: string;
  label: string;
  icon: IconType;
  requiresChild: boolean;
  /** Classes Tailwind pour le dégradé actif, ex. from-orange-500 to-amber-600 */
  color: string;
};

interface ParentSidebarProps {
  items: ParentNavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedChild: string | null;
  isOpen: boolean;
  onToggle: () => void;
}

const ParentSidebar = ({ items, activeTab, onTabChange, selectedChild, isOpen, onToggle }: ParentSidebarProps) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
          aria-hidden
        />
      )}

      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-50 transition-transform duration-300 ease-in-out w-72
          bg-white/80 backdrop-blur-xl border-r border-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.25)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-200/80 shrink-0">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em]">Menu</p>
              <h2 className="text-lg font-bold text-slate-900">Espace parent</h2>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
              aria-label="Fermer le menu"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isDisabled = item.requiresChild && !selectedChild;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!isDisabled) {
                      onTabChange(item.id);
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        onToggle();
                      }
                    }
                  }}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-orange-500/20`
                      : isDisabled
                        ? 'text-slate-400 cursor-not-allowed bg-slate-50'
                        : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                  }`}
                  title={isDisabled ? 'Sélectionnez d’abord un enfant' : item.label}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'scale-105' : ''} transition-transform`} />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-white shrink-0" aria-hidden />}
                </button>
              );
            })}
          </nav>

          {selectedChild && (
            <div className="p-4 border-t border-slate-200/80 bg-amber-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" aria-hidden />
                <p className="text-xs font-semibold text-slate-700">Enfant sélectionné</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default ParentSidebar;
