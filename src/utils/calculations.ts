import type {
  Transaction, RecurringExpense, AppSettings, Month,
  TransactionType, Alert,
} from '../types';
import { MONTHS, MONTH_LABELS } from '../types';

export const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const calculate702010 = (salarioFAB: number, percentages: AppSettings['regraPorcentagem']) => ({
  essenciais: (salarioFAB * percentages.essenciais) / 100,
  lazer: (salarioFAB * percentages.lazer) / 100,
  investimento: (salarioFAB * percentages.investimento) / 100,
});

export const getMonthIncome = (transactions: Transaction[], month: Month, settings: AppSettings) => {
  const monthTxs = transactions.filter(t => t.month === month && (t.type === 'receita' || t.type === 'extra'));
  const salarioFAB = monthTxs
    .filter(t => t.source === 'salario-fab')
    .reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0) || settings.salarioFAB;
  const pensao = monthTxs
    .filter(t => t.source === 'pensao')
    .reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0) || settings.pensao;
  const decimoTerceiro = monthTxs
    .filter(t => t.source === 'decimo-terceiro-fab' || t.source === 'decimo-terceiro-pensao')
    .reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0);
  const extra = monthTxs
    .filter(t => t.source === 'extra')
    .reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0);
  return { salarioFAB, pensao, decimoTerceiro, extra, total: salarioFAB + pensao + decimoTerceiro + extra };
};

export const getMonthExpenses = (transactions: Transaction[], month: Month) => {
  const expTypes: TransactionType[] = ['despesa-fixa', 'despesa-variavel', 'lazer', 'divida'];
  const monthExpenses = transactions.filter(t => t.month === month && expTypes.includes(t.type));
  const paid = monthExpenses.filter(t => t.status === 'pago').reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0);
  const pending = monthExpenses.filter(t => t.status === 'pendente').reduce((s, t) => s + t.plannedValue, 0);
  const planned = monthExpenses.reduce((s, t) => s + t.plannedValue, 0);
  return { paid, pending, total: paid + pending, planned };
};

export const getMonthInvested = (transactions: Transaction[], month: Month) => {
  return transactions
    .filter(t => t.month === month && t.type === 'investimento')
    .reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0);
};

export const getMonthBalance = (transactions: Transaction[], month: Month, settings: AppSettings) => {
  const income = getMonthIncome(transactions, month, settings);
  const expenses = getMonthExpenses(transactions, month);
  const invested = getMonthInvested(transactions, month);
  return income.total - expenses.total - invested;
};

export const getCategoryBreakdown = (transactions: Transaction[], month?: Month) => {
  const filtered = month
    ? transactions.filter(t => t.month === month)
    : transactions;
  const expTypes: TransactionType[] = ['despesa-fixa', 'despesa-variavel', 'lazer', 'divida'];
  return filtered
    .filter(t => expTypes.includes(t.type))
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + (t.realizedValue || t.plannedValue);
      return acc;
    }, {});
};

export const getRegra702010Usage = (transactions: Transaction[], month: Month, settings: AppSettings) => {
  const limits = calculate702010(settings.salarioFAB, settings.regraPorcentagem);
  const monthTxs = transactions.filter(t => t.month === month);

  const essenciais = monthTxs
    .filter(t => (t.type === 'despesa-fixa' || t.type === 'despesa-variavel') && t.source === 'salario-fab')
    .reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0);

  const lazer = monthTxs
    .filter(t => t.type === 'lazer')
    .reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0);

  const investimento = monthTxs
    .filter(t => t.type === 'investimento')
    .reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0);

  return { essenciais, lazer, investimento, limits };
};

export const generateAlerts = (
  transactions: Transaction[],
  recurringExpenses: RecurringExpense[],
  month: Month,
  settings: AppSettings,
): Alert[] => {
  const alerts: Alert[] = [];
  const usage = getRegra702010Usage(transactions, month, settings);
  const income = getMonthIncome(transactions, month, settings);
  const expenses = getMonthExpenses(transactions, month);
  const balance = income.total - expenses.total - getMonthInvested(transactions, month);

  if (usage.lazer > usage.limits.lazer) {
    alerts.push({ id: 'lazer-over', type: 'danger', message: `Você ultrapassou o limite de lazer deste mês (${formatCurrency(usage.lazer)} / ${formatCurrency(usage.limits.lazer)})` });
  }
  if (usage.essenciais > usage.limits.essenciais) {
    alerts.push({ id: 'ess-over', type: 'warning', message: `Gastos essenciais acima do orçamento (${formatCurrency(usage.essenciais)} / ${formatCurrency(usage.limits.essenciais)})` });
  }
  if (expenses.pending > 0) {
    alerts.push({ id: 'pending', type: 'warning', message: `Há ${transactions.filter(t => t.month === month && t.status === 'pendente' && t.type !== 'receita').length} despesa(s) pendente(s) de ${formatCurrency(expenses.pending)}` });
  }
  if (balance > 0) {
    alerts.push({ id: 'positive', type: 'success', message: `Seu saldo está positivo: ${formatCurrency(balance)}` });
  } else if (balance < 0) {
    alerts.push({ id: 'negative', type: 'danger', message: `Seu saldo está negativo: ${formatCurrency(balance)}` });
  }
  if (usage.investimento >= usage.limits.investimento) {
    alerts.push({ id: 'invest-ok', type: 'success', message: `Parabéns! Você cumpriu a meta de investimento de ${formatCurrency(usage.limits.investimento)}` });
  } else {
    alerts.push({ id: 'invest-miss', type: 'info', message: `Meta de investimento: ${formatCurrency(usage.investimento)} de ${formatCurrency(usage.limits.investimento)} (faltam ${formatCurrency(usage.limits.investimento - usage.investimento)})` });
  }

  const cartaoTx = transactions.find(t => t.month === month && t.category === 'cartao-credito');
  if (cartaoTx) {
    const pct = ((cartaoTx.realizedValue || cartaoTx.plannedValue) / settings.salarioFAB) * 100;
    if (pct > 30) {
      alerts.push({ id: 'cartao', type: 'warning', message: `A fatura do cartão representa ${pct.toFixed(0)}% do seu salário neste mês` });
    }
  }

  const activeRec = recurringExpenses.filter(r => r.active && r.months.includes(month) && r.plannedValue === 0);
  if (activeRec.length > 0) {
    alerts.push({ id: 'rec-empty', type: 'info', message: `${activeRec.length} gasto(s) recorrente(s) ativo(s) ainda sem valor preenchido` });
  }

  return alerts;
};

export const getAnnualSummary = (transactions: Transaction[], settings: AppSettings) => {
  const monthlyBalances = MONTHS.map(month => {
    const income = getMonthIncome(transactions, month, settings);
    const expenses = getMonthExpenses(transactions, month);
    const invested = getMonthInvested(transactions, month);
    const balance = income.total - expenses.total - invested;
    return { month, income: income.total, expenses: expenses.total, invested, balance };
  });

  const totalIncome = monthlyBalances.reduce((s, m) => s + m.income, 0);
  const totalExpenses = monthlyBalances.reduce((s, m) => s + m.expenses, 0);
  const totalInvested = monthlyBalances.reduce((s, m) => s + m.invested, 0);
  const accumulatedBalance = monthlyBalances.reduce((s, m) => s + m.balance, 0);

  const bestMonth = monthlyBalances.reduce((a, b) => a.balance > b.balance ? a : b);
  const worstMonth = monthlyBalances.reduce((a, b) => a.balance < b.balance ? a : b);

  const totalSalarioFAB = transactions
    .filter(t => t.source === 'salario-fab' && t.type === 'receita')
    .reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0);

  const totalPensao = transactions
    .filter(t => t.source === 'pensao' && t.type === 'receita')
    .reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0);

  const totalDecimo = transactions
    .filter(t => (t.source === 'decimo-terceiro-fab' || t.source === 'decimo-terceiro-pensao') && t.type === 'receita')
    .reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0);

  const totalExtra = transactions
    .filter(t => t.type === 'extra')
    .reduce((s, t) => s + (t.realizedValue || t.plannedValue), 0);

  const categoryBreakdown = getCategoryBreakdown(transactions);

  return {
    monthlyBalances, totalIncome, totalExpenses, totalInvested,
    accumulatedBalance, bestMonth, worstMonth,
    totalSalarioFAB, totalPensao, totalDecimo, totalExtra, categoryBreakdown,
  };
};

const FIRST_BUSINESS_DAYS_2026: Record<Month, string> = {
  maio:      '2026-05-04',
  junho:     '2026-06-01',
  julho:     '2026-07-01',
  agosto:    '2026-08-03',
  setembro:  '2026-09-01',
  outubro:   '2026-10-01',
  novembro:  '2026-11-03',
  dezembro:  '2026-12-01',
};

export const generateRecurringForMonth = (
  recurringExpenses: RecurringExpense[],
  existingTransactions: Transaction[],
  month: Month,
): Omit<Transaction, 'id'>[] => {
  const activeExpenses = recurringExpenses.filter(e => e.active && e.months.includes(month));
  const existingRecurringIds = new Set(
    existingTransactions.filter(t => t.month === month && t.isRecurring).map(t => t.recurringId),
  );

  return activeExpenses
    .filter(e => !existingRecurringIds.has(e.id))
    .map(e => ({
      date: FIRST_BUSINESS_DAYS_2026[month] ?? '',
      description: e.name,
      type: e.type,
      source: e.source,
      category: e.category,
      plannedValue: e.plannedValue,
      realizedValue: 0,
      paymentMethod: 'debito-automatico' as const,
      account: 'Conta Principal',
      status: 'pendente' as const,
      month,
      isRecurring: true,
      recurringId: e.id,
      observations: e.observations,
    }));
};

export const exportToCSV = (transactions: Transaction[]): void => {
  const headers = [
    'Mês', 'Data', 'Descrição', 'Tipo', 'Origem', 'Categoria',
    'Valor Previsto', 'Valor Realizado', 'Forma de Pagamento',
    'Conta', 'Status', 'Observações',
  ];

  const rows = transactions.map(t => [
    MONTH_LABELS[t.month], t.date, t.description, t.type, t.source,
    t.category, t.plannedValue.toFixed(2).replace('.', ','),
    t.realizedValue.toFixed(2).replace('.', ','),
    t.paymentMethod, t.account, t.status, t.observations || '',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n');

  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `controle-financeiro-fab-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
