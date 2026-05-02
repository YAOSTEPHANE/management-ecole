'use client';

import { FiX } from 'react-icons/fi';
import { inactiveModuleIconClass } from '../../lib/navModuleIconClass';

export type AdminNavTab = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
};

interface AdminSidebarProps {
  mainTabs: AdminNavTab[];
  bottomTabs: AdminNavTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const AdminSidebar = ({
  mainTabs,
  bottomTabs,
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
}: AdminSidebarProps) => {
  const closeOnNavigate = (id: string) => {
    onTabChange(id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden cursor-default border-0 p-0"
          onClick={onToggle}
          aria-label="Fermer le menu"
        />
      )}

      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-50 transition-transform duration-300 ease-in-out w-[min(16rem,calc(100vw-2rem))]
          bg-white/90 backdrop-blur-xl border-r border-slate-200/80 shadow-sm
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between px-2.5 py-2 border-b border-slate-200/80 shrink-0 lg:hidden">
            <div>
              <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Navigation</p>
              <h2 className="text-sm font-bold text-slate-900">Administration</h2>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Fermer le menu"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          <div className="px-2 py-2 flex flex-col flex-1 min-h-0">
            <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 shrink-0 hidden lg:block">
              Menu
            </p>
            <nav className="space-y-0.5 flex-1 overflow-y-auto min-h-0 pr-0.5 overscroll-contain text-[10px] leading-tight">
              {mainTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => closeOnNavigate(tab.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md font-medium transition-all min-h-[36px] lg:min-h-0 lg:py-1.5 ${
                      isActive
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-sm`
                        : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 active:bg-slate-100'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-white' : inactiveModuleIconClass(tab.color)
                      }`}
                    />
                    <span className="truncate text-left">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="pt-2 mt-auto border-t border-slate-200/70 shrink-0">
              <nav className="space-y-0.5 text-[10px] leading-tight">
                {bottomTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => closeOnNavigate(tab.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md font-medium transition-all min-h-[36px] lg:min-h-0 lg:py-1.5 ${
                        isActive
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-sm`
                          : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 active:bg-slate-100'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-white' : inactiveModuleIconClass(tab.color)
                        }`}
                      />
                      <span className="truncate text-left">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
