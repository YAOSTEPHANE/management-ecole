import { FiAward, FiAlertCircle, FiFileText, FiCalendar, FiShield, FiCreditCard, FiUsers, FiLayout, FiX, FiBook, FiMessageCircle } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { inactiveModuleIconClass } from '../../lib/navModuleIconClass';

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
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-50 transition-transform duration-300 ease-in-out w-64
          bg-white/80 backdrop-blur-xl border-r border-slate-200/80 shadow-sm
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-2.5 py-2 border-b border-slate-200/80 shrink-0">
            <div>
              <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
              <h2 className="text-sm font-bold text-slate-900">Espace parent</h2>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
              aria-label="Fermer le menu"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5 min-h-0 text-[10px] leading-tight">
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
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md font-medium transition-all min-h-[34px] ${
                    isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-sm`
                      : isDisabled
                        ? 'text-slate-400 cursor-not-allowed bg-slate-50'
                        : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                  }`}
                  title={isDisabled ? 'Sélectionnez d’abord un enfant' : item.label}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isDisabled
                        ? 'text-slate-400'
                        : isActive
                          ? 'text-white scale-105'
                          : inactiveModuleIconClass(item.color)
                    }`}
                  />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" aria-hidden />}
                </button>
              );
            })}
          </nav>

          {selectedChild && (
            <div className="px-2.5 py-2 border-t border-slate-200/80 bg-amber-50/50 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" aria-hidden />
                <p className="text-[9px] font-semibold text-slate-700">Enfant sélectionné</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default ParentSidebar;
