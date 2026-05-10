import type { AppSettings, RecurringExpense, Transaction, Month } from '../types';
import { MONTHS, DEFAULT_CATEGORIES } from '../types';

export const INITIAL_SETTINGS: AppSettings = {
  salarioFAB: 1516.39,
  pensao: 2000.00,
  regraPorcentagem: { essenciais: 70, lazer: 20, investimento: 10 },
  accounts: ['Conta Principal', 'Poupança', 'Investimento', 'Cartão de Crédito'],
  categories: DEFAULT_CATEGORIES,
};

export const INITIAL_RECURRING_EXPENSES: RecurringExpense[] = [
  {
    id: 'rec-001', name: 'Comissão de Formatura',
    type: 'despesa-fixa', source: 'salario-fab', category: 'comissao-formatura',
    plannedValue: 0, dueDay: 10, months: MONTHS, active: true,
    observations: 'Desconto automático no salário',
  },
  {
    id: 'rec-002', name: 'Lavanderia',
    type: 'despesa-fixa', source: 'salario-fab', category: 'lavanderia',
    plannedValue: 0, dueDay: 10, months: MONTHS, active: true,
  },
  {
    id: 'rec-003', name: 'Plano de Telefone',
    type: 'despesa-fixa', source: 'salario-fab', category: 'telefone',
    plannedValue: 0, dueDay: 5, months: MONTHS, active: true,
  },
  {
    id: 'rec-004', name: 'Assinatura GPT',
    type: 'despesa-fixa', source: 'salario-fab', category: 'assinatura-gpt',
    plannedValue: 0, dueDay: 1, months: MONTHS, active: true,
  },
  {
    id: 'rec-005', name: 'Cédula AFA',
    type: 'despesa-fixa', source: 'salario-fab', category: 'cedula-afa',
    plannedValue: 0, dueDay: 10, months: MONTHS, active: true,
    observations: 'Desconto no contracheque',
  },
  {
    id: 'rec-006', name: 'Fatura do Cartão de Crédito',
    type: 'despesa-fixa', source: 'salario-fab', category: 'cartao-credito',
    plannedValue: 0, dueDay: 15, months: MONTHS, active: true,
  },
  {
    id: 'rec-007', name: 'Apoio à Cachorra',
    type: 'despesa-variavel', source: 'pensao', category: 'cachorra',
    plannedValue: 0, dueDay: 5, months: MONTHS, active: true,
    observations: 'Gasto pago com a pensão',
  },
  {
    id: 'rec-008', name: 'Manutenção do Carro',
    type: 'despesa-variavel', source: 'pensao', category: 'manutencao-carro',
    plannedValue: 0, dueDay: 15, months: MONTHS, active: true,
    observations: 'Gasto pago com a pensão',
  },
];

export function generateInitialTransactions(settings: AppSettings): Transaction[] {
  const transactions: Transaction[] = [];

  MONTHS.forEach((month) => {
    const mm = String(getMonthNumber(month)).padStart(2, '0');

    transactions.push({
      id: `sal-${month}`, date: `2026-${mm}-10`,
      description: 'Salário', type: 'receita', source: 'salario-fab',
      category: 'salario-fab', plannedValue: settings.salarioFAB,
      realizedValue: settings.salarioFAB, paymentMethod: 'transferencia',
      account: 'Conta Principal', status: 'pago', month, isRecurring: false,
    });

    transactions.push({
      id: `pen-${month}`, date: `2026-${mm}-05`,
      description: 'Pensão', type: 'receita', source: 'pensao',
      category: 'pensao', plannedValue: settings.pensao,
      realizedValue: settings.pensao, paymentMethod: 'transferencia',
      account: 'Conta Principal', status: 'pago', month, isRecurring: false,
    });

    if (month === 'junho' || month === 'dezembro') {
      const mid13Fab = settings.salarioFAB / 2;
      const mid13Pen = settings.pensao / 2;

      transactions.push({
        id: `13fab-${month}`, date: `2026-${mm}-15`,
        description: '13º Salário (1ª Parcela)', type: 'receita',
        source: 'decimo-terceiro-fab', category: 'decimo-terceiro',
        plannedValue: mid13Fab, realizedValue: mid13Fab,
        paymentMethod: 'transferencia', account: 'Conta Principal',
        status: 'pago', month, isRecurring: false,
      });

      transactions.push({
        id: `13pen-${month}`, date: `2026-${mm}-15`,
        description: '13º Pensão (1ª Parcela)', type: 'receita',
        source: 'decimo-terceiro-pensao', category: 'decimo-terceiro',
        plannedValue: mid13Pen, realizedValue: mid13Pen,
        paymentMethod: 'transferencia', account: 'Conta Principal',
        status: 'pago', month, isRecurring: false,
      });
    }
  });

  return transactions;
}

function getMonthNumber(month: Month): number {
  const map: Record<Month, number> = {
    maio: 5, junho: 6, julho: 7, agosto: 8,
    setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
  };
  return map[month];
}
