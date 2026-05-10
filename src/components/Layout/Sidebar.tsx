import React from 'react';
import {
  LayoutDashboard, CalendarDays, ListChecks, BarChart3,
  FileText, Settings, ChevronLeft, ChevronRight, TrendingUp, Plane,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'transactions', label: 'Lançamentos', icon: <ListChecks size={20} /> },
  { id: 'planning', label: 'Planejamento', icon: <CalendarDays size={20} /> },
  { id: 'months', label: 'Controle Mensal', icon: <TrendingUp size={20} /> },
  { id: 'charts', label: 'Gráficos', icon: <BarChart3 size={20} /> },
  { id: 'annual', label: 'Resumo Anual', icon: <FileText size={20} /> },
  { id: 'settings', label: 'Configurações', icon: <Settings size={20} /> },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, collapsed, onToggle }) => {
  return (
    <aside className={`
      flex flex-col bg-fab-900 text-white transition-all duration-300 ease-in-out flex-shrink-0
      ${collapsed ? 'w-16' : 'w-60'}
    `} style={{ minHeight: '100vh', backgroundColor: '#0a1628' }}>

      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#D4AF37' }}>
          <Plane size={16} className="text-white" style={{ transform: 'rotate(45deg)' }} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white leading-tight">CONTROLE</p>
            <p className="text-xs font-bold leading-tight" style={{ color: '#D4AF37' }}>FINANCEIRO</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 text-left
                ${isActive
                  ? 'text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
                }
              `}
              style={isActive ? { backgroundColor: '#1565C0' } : {}}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#D4AF37' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: '#1565C0', color: '#fff' }}>
              L
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Leonardo</p>
              <p className="text-xs text-white/50">2026</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
