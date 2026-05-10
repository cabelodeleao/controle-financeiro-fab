import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getAnnualSummary, formatCurrency, exportToCSV } from '../utils/calculations';
import { MONTH_LABELS } from '../types';
import { Trophy, TrendingDown, TrendingUp, DollarSign, PiggyBank, Download, Star, Zap } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';

export const AnnualSummary: React.FC = () => {
  const { transactions, settings } = useApp();
  const summary = useMemo(() => getAnnualSummary(transactions, settings), [transactions, settings]);

  const barData = summary.monthlyBalances.map(m => ({
    month: MONTH_LABELS[m.month].slice(0, 3),
    Receita: m.income,
    Extra: m.extra,
    Despesas: m.expenses,
    Investido: m.invested,
    Saldo: m.balance,
  }));

  const topCategories = Object.entries(summary.categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxCatValue = topCategories[0]?.[1] || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Resumo Anual 2026</h2>
          <p className="text-sm text-slate-500 mt-0.5">Período: Maio a Dezembro</p>
        </div>
        <button
          onClick={() => exportToCSV(transactions)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Receita Acumulada', value: summary.totalIncome, icon: <DollarSign size={20} />, color: 'bg-blue-600', text: 'text-blue-600' },
          { label: 'Extra Acumulado', value: summary.totalExtra, icon: <Zap size={20} />, color: 'bg-emerald-500', text: 'text-emerald-600' },
          { label: 'Despesas Acumuladas', value: summary.totalExpenses, icon: <TrendingDown size={20} />, color: 'bg-red-500', text: 'text-red-500' },
          { label: 'Total Investido', value: summary.totalInvested, icon: <PiggyBank size={20} />, color: 'bg-purple-600', text: 'text-purple-600' },
          { label: 'Saldo Acumulado', value: summary.accumulatedBalance, icon: <TrendingUp size={20} />, color: summary.accumulatedBalance >= 0 ? 'bg-green-600' : 'bg-red-600', text: summary.accumulatedBalance >= 0 ? 'text-green-600' : 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${s.text}`}>{formatCurrency(s.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Receita breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Salário', value: summary.totalSalarioFAB, emoji: '🎖️' },
          { label: 'Total Pensão', value: summary.totalPensao, emoji: '💰' },
          { label: 'Total 13º Salário', value: summary.totalDecimo, emoji: '🎉' },
          { label: 'Total Extra', value: summary.totalExtra, emoji: '⚡' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <span className="text-2xl">{s.emoji}</span>
            <div>
              <p className="text-xs font-semibold text-slate-500">{s.label}</p>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(s.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Best / worst month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
            <Trophy size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-green-700 uppercase">Melhor Mês</p>
            <p className="text-xl font-bold text-green-800">{MONTH_LABELS[summary.bestMonth.month]}</p>
            <p className="text-sm text-green-600">Saldo: {formatCurrency(summary.bestMonth.balance)}</p>
          </div>
          <Star size={20} className="text-green-400 ml-auto" />
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-red-700 uppercase">Pior Mês</p>
            <p className="text-xl font-bold text-red-800">{MONTH_LABELS[summary.worstMonth.month]}</p>
            <p className="text-sm text-red-600">Saldo: {formatCurrency(summary.worstMonth.balance)}</p>
          </div>
        </div>
      </div>

      {/* Monthly breakdown chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Visão Geral Mensal</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} />
            <Tooltip formatter={(v) => formatCurrency(v as number)} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="Receita" fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Extra" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Despesas" fill="#ef4444" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Investido" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Saldo" radius={[3, 3, 0, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.Saldo >= 0 ? '#10b981' : '#f97316'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Resultado Mensal Detalhado</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Mês</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Receita</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Extra</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Despesas</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Investido</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {summary.monthlyBalances.map(m => (
                <tr key={m.month} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                  m.month === summary.bestMonth.month ? 'bg-green-50' : m.month === summary.worstMonth.month ? 'bg-red-50' : ''
                }`}>
                  <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                    {MONTH_LABELS[m.month]}
                    {m.month === summary.bestMonth.month && <span className="text-xs text-green-600">⭐ melhor</span>}
                    {m.month === summary.worstMonth.month && <span className="text-xs text-red-600">↓ pior</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600 font-mono font-semibold">{formatCurrency(m.income)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-mono font-semibold">{m.extra > 0 ? formatCurrency(m.extra) : '—'}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-mono font-semibold">{formatCurrency(m.expenses)}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-mono font-semibold">{formatCurrency(m.invested)}</td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${m.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {m.balance >= 0 ? '+' : ''}{formatCurrency(m.balance)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-800 text-white">
                <td className="px-4 py-3 font-bold">TOTAL</td>
                <td className="px-4 py-3 text-right font-bold font-mono">{formatCurrency(summary.totalIncome)}</td>
                <td className="px-4 py-3 text-right font-bold font-mono text-emerald-300">{formatCurrency(summary.totalExtra)}</td>
                <td className="px-4 py-3 text-right font-bold font-mono">{formatCurrency(summary.totalExpenses)}</td>
                <td className="px-4 py-3 text-right font-bold font-mono">{formatCurrency(summary.totalInvested)}</td>
                <td className={`px-4 py-3 text-right font-bold font-mono ${summary.accumulatedBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {summary.accumulatedBalance >= 0 ? '+' : ''}{formatCurrency(summary.accumulatedBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Total Gasto por Categoria (Anual)</h3>
        {topCategories.length === 0
          ? <p className="text-sm text-slate-400 text-center py-8">Sem gastos lançados ainda</p>
          : (
            <div className="space-y-3">
              {topCategories.map(([cat, val]) => (
                <div key={cat} className="flex items-center gap-4">
                  <span className="text-xs font-medium text-slate-600 w-36 flex-shrink-0 truncate">{cat}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(val / maxCatValue) * 100}%`, backgroundColor: '#1565C0' }} />
                  </div>
                  <span className="text-sm font-bold text-slate-800 w-28 text-right flex-shrink-0">{formatCurrency(val)}</span>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};
