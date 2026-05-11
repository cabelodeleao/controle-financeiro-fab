import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MONTH_LABELS, MONTHS } from '../../types';
import { useApp } from '../../context/AppContext';
import { Menu, ChevronDown, AlertTriangle, X } from 'lucide-react';

interface LayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
  title: string;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard', transactions: 'Lançamentos', planning: 'Planejamento',
  months: 'Controle Mensal', charts: 'Gráficos', annual: 'Resumo Anual', settings: 'Configurações',
};

export const Layout: React.FC<LayoutProps> = ({ currentPage, onNavigate, children, title }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentMonth, setCurrentMonth, dbError, clearDbError } = useApp();

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:flex">
        <Sidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(p => !p)}
        />
      </div>

      {/* Sidebar mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          currentPage={currentPage}
          onNavigate={(p) => { onNavigate(p); setMobileOpen(false); }}
          collapsed={false}
          onToggle={() => setMobileOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-800">{title || PAGE_TITLES[currentPage]}</h1>
          </div>

          {/* Month selector - prominent */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 hidden sm:block">Mês atual:</span>
            <div className="relative">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value as typeof currentMonth)}
                className="appearance-none pl-3 pr-8 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: '#0a1628' }}
              >
                {MONTHS.map(m => (
                  <option key={m} value={m}>{MONTH_LABELS[m]}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            </div>
          </div>

          {/* FAB emblem */}
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-700 leading-none">Leonardo</p>
              <p className="text-xs text-slate-400 leading-none">2026</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #1565C0, #0a1628)' }}>
              ✦
            </div>
          </div>
        </header>

        {/* DB error banner */}
        {dbError && (
          <div className="flex-shrink-0 flex items-start gap-3 bg-red-50 border-b border-red-200 px-4 py-3">
            <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="flex-1 text-xs text-red-700 font-medium">{dbError}</p>
            <button onClick={clearDbError} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
