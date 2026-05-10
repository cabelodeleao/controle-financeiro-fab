export type Month =
  | 'maio' | 'junho' | 'julho' | 'agosto'
  | 'setembro' | 'outubro' | 'novembro' | 'dezembro';

export const MONTHS: Month[] = [
  'maio', 'junho', 'julho', 'agosto',
  'setembro', 'outubro', 'novembro', 'dezembro',
];

export const MONTH_LABELS: Record<Month, string> = {
  maio: 'Maio', junho: 'Junho', julho: 'Julho', agosto: 'Agosto',
  setembro: 'Setembro', outubro: 'Outubro', novembro: 'Novembro', dezembro: 'Dezembro',
};

export const MONTH_NUMBERS: Record<Month, number> = {
  maio: 5, junho: 6, julho: 7, agosto: 8,
  setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

export type TransactionType =
  | 'receita' | 'despesa-fixa' | 'despesa-variavel'
  | 'lazer' | 'investimento' | 'divida' | 'extra';

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  'receita': 'Receita',
  'despesa-fixa': 'Despesa Fixa',
  'despesa-variavel': 'Despesa Variável',
  'lazer': 'Lazer e Estilo de Vida',
  'investimento': 'Investimento',
  'divida': 'Dívida',
  'extra': 'Extra',
};

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  'receita': '#22c55e',
  'despesa-fixa': '#ef4444',
  'despesa-variavel': '#f97316',
  'lazer': '#8b5cf6',
  'investimento': '#3b82f6',
  'divida': '#dc2626',
  'extra': '#22c55e',
};

export type MoneySource =
  | 'salario-fab' | 'pensao'
  | 'decimo-terceiro-fab' | 'decimo-terceiro-pensao' | 'extra';

export const MONEY_SOURCE_LABELS: Record<MoneySource, string> = {
  'salario-fab': 'Salário',
  'pensao': 'Pensão',
  'decimo-terceiro-fab': '13º Salário',
  'decimo-terceiro-pensao': '13º Pensão',
  'extra': 'Extra',
};

export type Category = string;

export interface CategoryDefinition {
  id: string;
  label: string;
  color: string;
}

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { id: 'salario-fab', label: 'Salário', color: '#1565C0' },
  { id: 'pensao', label: 'Pensão', color: '#7C3AED' },
  { id: 'decimo-terceiro', label: '13º Salário', color: '#0891b2' },
  { id: 'comissao-formatura', label: 'Comissão de Formatura', color: '#dc2626' },
  { id: 'lavanderia', label: 'Lavanderia', color: '#ea580c' },
  { id: 'telefone', label: 'Telefone', color: '#ca8a04' },
  { id: 'assinatura-gpt', label: 'Assinatura GPT', color: '#16a34a' },
  { id: 'cedula-afa', label: 'Cédula AFA', color: '#9333ea' },
  { id: 'cartao-credito', label: 'Cartão de Crédito', color: '#e11d48' },
  { id: 'cachorra', label: 'Cachorra', color: '#d97706' },
  { id: 'manutencao-carro', label: 'Manutenção do Carro', color: '#475569' },
  { id: 'moradia', label: 'Moradia', color: '#0f766e' },
  { id: 'alimentacao', label: 'Alimentação', color: '#c2410c' },
  { id: 'transporte', label: 'Transporte', color: '#1d4ed8' },
  { id: 'saude', label: 'Saúde', color: '#0d9488' },
  { id: 'estudos', label: 'Estudos', color: '#7c3aed' },
  { id: 'lazer', label: 'Lazer', color: '#db2777' },
  { id: 'investimento', label: 'Investimento', color: '#2563eb' },
  { id: 'reserva', label: 'Reserva', color: '#0284c7' },
  { id: 'outros', label: 'Outros', color: '#64748b' },
];

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map(c => [c.id, c.label])
);

export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map(c => [c.id, c.color])
);

export function getCategoryLabel(id: string, categories: CategoryDefinition[]): string {
  return categories.find(c => c.id === id)?.label ?? id;
}

export function getCategoryColor(id: string, categories: CategoryDefinition[]): string {
  return categories.find(c => c.id === id)?.color ?? '#64748b';
}

export type PaymentMethod =
  | 'dinheiro' | 'pix' | 'cartao-debito'
  | 'cartao-credito' | 'transferencia' | 'debito-automatico';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  'dinheiro': 'Dinheiro',
  'pix': 'PIX',
  'cartao-debito': 'Cartão de Débito',
  'cartao-credito': 'Cartão de Crédito',
  'transferencia': 'Transferência',
  'debito-automatico': 'Débito Automático',
};

export type TransactionStatus = 'pago' | 'pendente';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  source: MoneySource;
  category: string;
  plannedValue: number;
  realizedValue: number;
  paymentMethod: PaymentMethod;
  account: string;
  status: TransactionStatus;
  month: Month;
  observations?: string;
  isRecurring: boolean;
  recurringId?: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  type: TransactionType;
  source: MoneySource;
  category: string;
  plannedValue: number;
  dueDay: number;
  months: Month[];
  active: boolean;
  observations?: string;
}

export interface AppSettings {
  salarioFAB: number;
  pensao: number;
  regraPorcentagem: {
    essenciais: number;
    lazer: number;
    investimento: number;
  };
  accounts: string[];
  categories: CategoryDefinition[];
}

export interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'success' | 'info';
  message: string;
}
