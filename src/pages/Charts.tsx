import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  getMonthIncome, getMonthExpenses, getMonthInvested, getMonthBalance,
  calculate702010, getRegra702010Usage, formatCurrency,
} from '../utils/calculations';
import { MONTHS, MONTH_LABELS, CATEGORY_LABELS } from '../types';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';

const COLORS = ['#1565C0', '#D4AF37', '#ef4444', '#8b5cf6', '#22c55e', '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#f43f5e'];
const currency = (v: unknown) => formatCurrency(v as number);

export const Charts: React.FC = () => {
  const { transactions, settings, currentMonth } = useApp();

  const monthlyData = useMemo(() => MONTHS.map(month => {
    const inc = getMonthIncome(transactions, month, settings);
    const exp = getMonthExpenses(transactions, month);
    const inv = getMonthInvested(transactions, month);
    const bal = getMonthBalance(transactions, month, settings);
    return {
      month: MONTH_LABELS[month].slice(0, 3),
      receita: inc.total,
      despesas: exp.paid + exp.pending,
      investido: inv,
      saldo: bal,
      pendente: exp.pending,
    };
  }), [transactions, settings]);

  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => ['despesa-fixa', 'despesa-variavel', 'lazer', 'divida'].includes(t.type))
      .forEach(t => {
        const label = CATEGORY_LABELS[t.category];
        map[label] = (map[label] || 0) + (t.realizedValue || t.plannedValue);
      });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const pieByStatus = useMemo(() => {
    const paid = transactions
      .filter(t => t.status === 'pago' && t.type !== 'receita')
      .reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0);
    const pending = transactions
      .filter(t => t.status === 'pendente' && t.type !== 'receita')
      .reduce((s, t) => s + t.plannedValue, 0);
    return [
      { name: 'Pagos', value: paid },
      { name: 'Pendentes', value: pending },
    ];
  }, [transactions]);

  const usage702010 = useMemo(() => {
    const limits = calculate702010(settings.salarioFAB, settings.regraPorcentagem);
    const u = getRegra702010Usage(transactions, currentMonth, settings);
    return [
      { name: 'Essenciais', previsto: limits.essenciais, realizado: u.essenciais, fill: '#1565C0' },
      { name: 'Lazer', previsto: limits.lazer, realizado: u.lazer, fill: '#8b5cf6' },
      { name: 'Investimento', previsto: limits.investimento, realizado: u.investimento, fill: '#D4AF37' },
    ];
  }, [transactions, settings, currentMonth]);

  const incomeBreakdown = useMemo(() => MONTHS.map(month => {
    const inc = getMonthIncome(transactions, month, settings);
    return {
      month: MONTH_LABELS[month].slice(0, 3),
      'Sal. FAB': inc.salarioFAB,
      'Pensão': inc.pensao,
      '13º': inc.decimoTerceiro,
    };
  }), [transactions, settings]);

  const ChartCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Gráficos e Análises</h2>
        <p className="text-sm text-slate-500 mt-0.5">Visualizações de maio a dezembro de 2025</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita x Despesas mensais */}
        <ChartCard title="Receita × Despesas por Mês" subtitle="Comparativo mensal">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={currency} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="receita" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="investido" name="Investido" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Saldo mensal */}
        <ChartCard title="Evolução do Saldo" subtitle="Saldo disponível mês a mês">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1565C0" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} />
              <Tooltip formatter={currency} />
              <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#1565C0" fill="url(#gradSaldo)" strokeWidth={2} dot={{ r: 4, fill: '#1565C0' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie por categoria */}
        <ChartCard title="Gastos por Categoria (geral)" subtitle="Todos os meses • Proporção das despesas">
          {pieData.length === 0
            ? <p className="text-sm text-slate-400 text-center py-16">Sem gastos lançados</p>
            : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="40%" cy="50%" outerRadius={100} innerRadius={55}
                    dataKey="value" paddingAngle={2} nameKey="name">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={currency} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
        </ChartCard>

        {/* Pagos x Pendentes */}
        <ChartCard title="Pagos × Pendentes" subtitle="Todos os meses • Total geral">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieByStatus} cx="50%" cy="50%" outerRadius={100} innerRadius={60}
                dataKey="value" paddingAngle={3}>
                <Cell fill="#22c55e" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip formatter={currency} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-8 mt-2">
            <div className="text-center">
              <p className="text-xs text-slate-500">Total Pago</p>
              <p className="text-base font-bold text-green-600">{formatCurrency(pieByStatus[0]?.value || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Pendente</p>
              <p className="text-base font-bold text-amber-600">{formatCurrency(pieByStatus[1]?.value || 0)}</p>
            </div>
          </div>
        </ChartCard>

        {/* 70/20/10 */}
        <ChartCard
          title={`Regra 70/20/10 — ${MONTH_LABELS[currentMonth]}`}
          subtitle="Previsto × Realizado do salário FAB">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={usage702010} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v.toFixed(0)}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} width={80} />
              <Tooltip formatter={currency} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="previsto" name="Limite" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
              <Bar dataKey="realizado" name="Realizado" radius={[0, 4, 4, 0]}>
                {usage702010.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Origem da receita */}
        <ChartCard title="Composição da Receita por Mês" subtitle="Salário FAB, Pensão e 13º">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeBreakdown} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} />
              <Tooltip formatter={currency} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Sal. FAB" stackId="a" fill="#1565C0" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Pensão" stackId="a" fill="#7c3aed" radius={[0, 0, 0, 0]} />
              <Bar dataKey="13º" stackId="a" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};
