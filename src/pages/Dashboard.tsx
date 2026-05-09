import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  getMonthIncome, getMonthExpenses, getMonthInvested, getMonthBalance,
  getRegra702010Usage, calculate702010, generateAlerts, formatCurrency,
} from '../utils/calculations';
import { MONTH_LABELS, CATEGORY_LABELS } from '../types';
import { AlertBadge, StatusBadge, TypeBadge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Clock, CheckCircle,
  DollarSign, Target,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const StatCard: React.FC<{
  title: string; value: string; subtitle?: string;
  icon: React.ReactNode; color: string; trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, subtitle, icon, color, trend }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-slate-800 mt-0.5 truncate">{value}</p>
      {subtitle && <p className={`text-xs mt-1 ${trend === 'down' ? 'text-red-500' : trend === 'up' ? 'text-green-500' : 'text-slate-500'}`}>{subtitle}</p>}
    </div>
    {trend === 'up' && <TrendingUp size={16} className="text-green-500 flex-shrink-0 mt-1" />}
    {trend === 'down' && <TrendingDown size={16} className="text-red-500 flex-shrink-0 mt-1" />}
  </div>
);

export const Dashboard: React.FC = () => {
  const { transactions, settings, currentMonth, recurringExpenses } = useApp();

  const income = useMemo(() => getMonthIncome(transactions, currentMonth, settings), [transactions, currentMonth, settings]);
  const expenses = useMemo(() => getMonthExpenses(transactions, currentMonth), [transactions, currentMonth]);
  const invested = useMemo(() => getMonthInvested(transactions, currentMonth), [transactions, currentMonth]);
  const balance = useMemo(() => getMonthBalance(transactions, currentMonth, settings), [transactions, currentMonth, settings]);
  const usage = useMemo(() => getRegra702010Usage(transactions, currentMonth, settings), [transactions, currentMonth, settings]);
  const limits = useMemo(() => calculate702010(settings.salarioFAB, settings.regraPorcentagem), [settings]);
  const alerts = useMemo(() => generateAlerts(transactions, recurringExpenses, currentMonth, settings), [transactions, recurringExpenses, currentMonth, settings]);

  const budgetUsedPct = income.total > 0 ? ((expenses.total + invested) / income.total) * 100 : 0;

  const recentTransactions = useMemo(() =>
    transactions
      .filter(t => t.month === currentMonth && t.type !== 'receita')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6),
    [transactions, currentMonth],
  );

  const pieData = useMemo(() => {
    const expTypes = ['despesa-fixa', 'despesa-variavel', 'lazer', 'divida'] as const;
    const categoryMap: Record<string, number> = {};
    transactions
      .filter(t => t.month === currentMonth && expTypes.includes(t.type as any))
      .forEach(t => {
        const label = CATEGORY_LABELS[t.category] || t.category;
        categoryMap[label] = (categoryMap[label] || 0) + (t.realizedValue || t.plannedValue);
      });
    return Object.entries(categoryMap)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions, currentMonth]);

  const PIE_COLORS = ['#1565C0', '#D4AF37', '#ef4444', '#8b5cf6', '#22c55e', '#f97316', '#06b6d4', '#ec4899'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {MONTH_LABELS[currentMonth]} 2025
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Visão geral das suas finanças</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: budgetUsedPct > 90 ? '#fee2e2' : '#f0fdf4', color: budgetUsedPct > 90 ? '#dc2626' : '#16a34a' }}>
          <Target size={14} />
          {budgetUsedPct.toFixed(0)}% do orçamento usado
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 4).map(alert => (
            <AlertBadge key={alert.id} type={alert.type} message={alert.message} />
          ))}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Total"
          value={formatCurrency(income.total)}
          subtitle={`Sal: ${formatCurrency(income.salarioFAB)} + Pen: ${formatCurrency(income.pensao)}`}
          icon={<DollarSign size={22} className="text-white" />}
          color="bg-blue-600"
          trend="neutral"
        />
        <StatCard
          title="Despesas Pagas"
          value={formatCurrency(expenses.paid)}
          subtitle={`Pendente: ${formatCurrency(expenses.pending)}`}
          icon={<TrendingDown size={22} className="text-white" />}
          color="bg-red-500"
          trend="neutral"
        />
        <StatCard
          title="Investido / Reserva"
          value={formatCurrency(invested)}
          subtitle={`Meta: ${formatCurrency(limits.investimento)}`}
          icon={<PiggyBank size={22} className="text-white" />}
          color="bg-purple-600"
          trend={invested >= limits.investimento ? 'up' : 'neutral'}
        />
        <StatCard
          title="Saldo Disponível"
          value={formatCurrency(balance)}
          subtitle={balance >= 0 ? 'Dentro do orçamento' : 'Atenção: saldo negativo'}
          icon={<Wallet size={22} className="text-white" />}
          color={balance >= 0 ? 'bg-green-600' : 'bg-red-600'}
          trend={balance >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Receita breakdown */}
      {income.decimoTerceiro > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-bold text-amber-800">13º Salário em {MONTH_LABELS[currentMonth]}!</p>
            <p className="text-xs text-amber-700">
              FAB: {formatCurrency(settings.salarioFAB / 2)} + Pensão: {formatCurrency(settings.pensao / 2)} = {formatCurrency(income.decimoTerceiro)}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regra 70/20/10 */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: '#1565C0' }}>70</div>
            <div>
              <p className="text-sm font-bold text-slate-800">Regra 70/20/10</p>
              <p className="text-xs text-slate-500">Somente sobre o Salário FAB</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Essenciais */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-aero-600" style={{ backgroundColor: '#1565C0' }} />
                  <span className="text-xs font-semibold text-slate-700">Essenciais (70%)</span>
                </div>
                <span className={`text-xs font-bold ${usage.essenciais > limits.essenciais ? 'text-red-600' : 'text-slate-700'}`}>
                  {formatCurrency(usage.essenciais)} / {formatCurrency(limits.essenciais)}
                </span>
              </div>
              <ProgressBar value={usage.essenciais} max={limits.essenciais} color="bg-blue-600" size="sm" />
              <p className="text-xs text-slate-400 mt-0.5">
                Resta: {formatCurrency(Math.max(0, limits.essenciais - usage.essenciais))}
              </p>
            </div>

            {/* Lazer */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-xs font-semibold text-slate-700">Lazer (20%)</span>
                </div>
                <span className={`text-xs font-bold ${usage.lazer > limits.lazer ? 'text-red-600' : 'text-slate-700'}`}>
                  {formatCurrency(usage.lazer)} / {formatCurrency(limits.lazer)}
                </span>
              </div>
              <ProgressBar value={usage.lazer} max={limits.lazer} color="bg-purple-500" size="sm" />
              <p className="text-xs text-slate-400 mt-0.5">
                Resta: {formatCurrency(Math.max(0, limits.lazer - usage.lazer))}
              </p>
            </div>

            {/* Investimento */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#D4AF37' }} />
                  <span className="text-xs font-semibold text-slate-700">Investimento (10%)</span>
                </div>
                <span className={`text-xs font-bold ${usage.investimento >= limits.investimento ? 'text-green-600' : 'text-slate-700'}`}>
                  {formatCurrency(usage.investimento)} / {formatCurrency(limits.investimento)}
                </span>
              </div>
              <ProgressBar value={usage.investimento} max={limits.investimento} color="bg-yellow-500" size="sm" />
              {usage.investimento >= limits.investimento
                ? <p className="text-xs text-green-600 mt-0.5 font-semibold">✓ Meta cumprida!</p>
                : <p className="text-xs text-slate-400 mt-0.5">Faltam: {formatCurrency(limits.investimento - usage.investimento)}</p>
              }
            </div>

            <div className="mt-2 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Pensão ({formatCurrency(income.pensao)}) é gerida separadamente da regra 70/20/10.
              </p>
            </div>
          </div>
        </div>

        {/* Pie chart */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Gastos por Categoria</p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              Sem gastos lançados ainda
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={2}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v as number)} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent transactions */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Lançamentos Recentes</p>
          {recentTransactions.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm flex-col gap-2">
              <Clock size={24} />
              <span>Nenhum lançamento em {MONTH_LABELS[currentMonth]}</span>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    t.status === 'pago' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {t.status === 'pago'
                      ? <CheckCircle size={14} className="text-green-600" />
                      : <Clock size={14} className="text-yellow-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{t.description}</p>
                    <TypeBadge type={t.type} />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'receita' ? '+' : '-'}{formatCurrency(t.realizedValue || t.plannedValue)}
                    </p>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Budget usage bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-800">Uso do Orçamento Total</p>
          <span className="text-sm font-bold text-slate-600">{budgetUsedPct.toFixed(1)}%</span>
        </div>
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${budgetUsedPct > 90 ? 'bg-red-500' : budgetUsedPct > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Receita: {formatCurrency(income.total)}</span>
          <span>Gastos + Invest: {formatCurrency(expenses.total + invested)}</span>
          <span>Livre: {formatCurrency(balance)}</span>
        </div>
      </div>
    </div>
  );
};
