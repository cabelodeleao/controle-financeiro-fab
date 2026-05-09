import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  getMonthIncome, getMonthExpenses, getMonthInvested, getMonthBalance,
  getRegra702010Usage, calculate702010, formatCurrency, formatDate,
} from '../utils/calculations';
import type { TransactionType } from '../types';
import { MONTHS, MONTH_LABELS, CATEGORY_LABELS } from '../types';
import { StatusBadge, TypeBadge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { CheckCircle, Clock, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export const Months: React.FC = () => {
  const { transactions, settings, currentMonth, setCurrentMonth, updateTransaction } = useApp();

  const income = useMemo(() => getMonthIncome(transactions, currentMonth, settings), [transactions, currentMonth, settings]);
  const expenses = useMemo(() => getMonthExpenses(transactions, currentMonth), [transactions, currentMonth]);
  const invested = useMemo(() => getMonthInvested(transactions, currentMonth), [transactions, currentMonth]);
  const balance = useMemo(() => getMonthBalance(transactions, currentMonth, settings), [transactions, currentMonth, settings]);
  const usage = useMemo(() => getRegra702010Usage(transactions, currentMonth, settings), [transactions, currentMonth, settings]);
  const limits = useMemo(() => calculate702010(settings.salarioFAB, settings.regraPorcentagem), [settings]);

  const monthTransactions = useMemo(() =>
    transactions
      .filter(t => t.month === currentMonth)
      .sort((a, b) => {
        if (a.type === 'receita' && b.type !== 'receita') return -1;
        if (a.type !== 'receita' && b.type === 'receita') return 1;
        return b.date.localeCompare(a.date);
      }),
    [transactions, currentMonth],
  );

  const categoryBreakdown = useMemo(() => {
    const expTypes: TransactionType[] = ['despesa-fixa', 'despesa-variavel', 'lazer', 'divida'];
    const map: Record<string, number> = {};
    monthTransactions
      .filter(t => expTypes.includes(t.type))
      .forEach(t => {
        const label = CATEGORY_LABELS[t.category];
        map[label] = (map[label] || 0) + (t.realizedValue || t.plannedValue);
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthTransactions]);

  const totalCategoryExpenses = categoryBreakdown.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Month tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 flex-nowrap">
        {MONTHS.map(m => {
          const bal = getMonthBalance(transactions, m, settings);
          const isActive = m === currentMonth;
          return (
            <button key={m} onClick={() => setCurrentMonth(m)}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive ? 'text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              style={isActive ? { backgroundColor: '#0a1628' } : {}}>
              <span>{MONTH_LABELS[m]}</span>
              <span className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : bal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {bal >= 0 ? '+' : ''}{formatCurrency(bal)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats for current month */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Receita', value: formatCurrency(income.total), color: 'text-blue-600', bg: 'bg-blue-50', icon: <DollarSign size={18} className="text-blue-600" /> },
          { label: 'Despesas Pagas', value: formatCurrency(expenses.paid), color: 'text-red-600', bg: 'bg-red-50', icon: <TrendingDown size={18} className="text-red-600" /> },
          { label: 'Investido', value: formatCurrency(invested), color: 'text-purple-600', bg: 'bg-purple-50', icon: <TrendingUp size={18} className="text-purple-600" /> },
          { label: 'Saldo Final', value: formatCurrency(balance), color: balance >= 0 ? 'text-green-600' : 'text-red-600', bg: balance >= 0 ? 'bg-green-50' : 'bg-red-50', icon: balance >= 0 ? <CheckCircle size={18} className="text-green-600" /> : <Clock size={18} className="text-red-600" /> },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white`}>
            <div className="flex items-center gap-2 mb-1">
              {s.icon}
              <span className="text-xs font-semibold text-slate-500 uppercase">{s.label}</span>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 70/20/10 for this month */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Regra 70/20/10 — {MONTH_LABELS[currentMonth]}</h3>
          <div className="space-y-4">
            {[
              { label: `Essenciais (${settings.regraPorcentagem.essenciais}%)`, value: usage.essenciais, limit: limits.essenciais, color: 'bg-blue-500' },
              { label: `Lazer (${settings.regraPorcentagem.lazer}%)`, value: usage.lazer, limit: limits.lazer, color: 'bg-purple-500' },
              { label: `Investimento (${settings.regraPorcentagem.investimento}%)`, value: usage.investimento, limit: limits.investimento, color: 'bg-yellow-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600">{item.label}</span>
                  <span className={`font-bold ${item.value > item.limit ? 'text-red-600' : 'text-slate-700'}`}>
                    {formatCurrency(item.value)} / {formatCurrency(item.limit)}
                  </span>
                </div>
                <ProgressBar value={item.value} max={item.limit} color={item.color} size="sm" />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Pensão ({formatCurrency(income.pensao)}) tratada separadamente</p>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Gastos por Categoria</h3>
          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sem gastos lançados</p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map(([cat, val]) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600 truncate">{cat}</span>
                    <span className="font-bold text-slate-800 flex-shrink-0 ml-2">{formatCurrency(val)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${(val / totalCategoryExpenses) * 100}%`,
                      backgroundColor: '#1565C0',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Planned vs realized */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Previsto × Realizado</h3>
          <div className="space-y-3">
            {[
              { label: 'Receita', planned: income.total, realized: income.total },
              { label: 'Despesas', planned: expenses.planned, realized: expenses.paid + expenses.pending },
              { label: 'Pendente', planned: expenses.pending, realized: 0 },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 w-20 flex-shrink-0">{item.label}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Previsto</span>
                    <span className="font-medium">{formatCurrency(item.planned)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Realizado</span>
                    <span className="font-medium">{formatCurrency(item.realized)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Todos os Lançamentos — {MONTH_LABELS[currentMonth]}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{monthTransactions.length} lançamento(s)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Previsto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Realizado</th>
              </tr>
            </thead>
            <tbody>
              {monthTransactions.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Nenhum lançamento em {MONTH_LABELS[currentMonth]}</td></tr>
              )}
              {monthTransactions.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => updateTransaction(t.id, { status: t.status === 'pago' ? 'pendente' : 'pago' })}>
                      <StatusBadge status={t.status} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(t.date)}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{t.description}</p>
                    <p className="text-xs text-slate-400">{CATEGORY_LABELS[t.category]}</p>
                  </td>
                  <td className="px-4 py-3"><TypeBadge type={t.type} /></td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500 font-mono">{formatCurrency(t.plannedValue)}</td>
                  <td className={`px-4 py-3 text-right font-bold font-mono text-sm ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'receita' ? '+' : '-'}{formatCurrency(t.realizedValue || t.plannedValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
