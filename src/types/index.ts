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
  | 'lazer' | 'investimento' | 'reserva' | 'divida' | 'extra';

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  'receita': 'Receita',
  'despesa-fixa': 'Despesa Fixa',
  'despesa-variavel': 'Despesa Variável',
  'lazer': 'Lazer e Estilo de Vida',
  'investimento': 'Investimento',
  'reserva': 'Reserva',
  'divida': 'Dívida',
  'extra': 'Extra',
};

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  'receita': '#22c55e',
  'despesa-fixa': '#ef4444',
  'despesa-variavel': '#f97316',
  'lazer': '#8b5cf6',
  'investimento': '#3b82f6',
  'reserva': '#06b6d4',
  'divida': '#dc2626',
  'extra': '#64748b',
};

export type MoneySource =
  | 'salario-fab' | 'pensao'
  | 'decimo-terceiro-fab' | 'decimo-terceiro-pensao' | 'extra';

export const MONEY_SOURCE_LABELS: Record<MoneySource, string> = {
  'salario-fab': 'Salário FAB',
  'pensao': 'Pensão',
  'decimo-terceiro-fab': '13º Salário FAB',
  'decimo-terceiro-pensao': '13º Pensão',
  'extra': 'Extra',
};

export type Category =
  | 'salario-fab' | 'pensao' | 'decimo-terceiro'
  | 'comissao-formatura' | 'lavanderia' | 'telefone'
  | 'assinatura-gpt' | 'cedula-afa' | 'cartao-credito'
  | 'cachorra' | 'manutencao-carro' | 'moradia'
  | 'alimentacao' | 'transporte' | 'saude'
  | 'estudos' | 'lazer' | 'investimento' | 'reserva' | 'outros';

export const CATEGORY_LABELS: Record<Category, string> = {
  'salario-fab': 'Salário FAB',
  'pensao': 'Pensão',
  'decimo-terceiro': '13º Salário',
  'comissao-formatura': 'Comissão de Formatura',
  'lavanderia': 'Lavanderia',
  'telefone': 'Telefone',
  'assinatura-gpt': 'Assinatura GPT',
  'cedula-afa': 'Cédula AFA',
  'cartao-credito': 'Cartão de Crédito',
  'cachorra': 'Cachorra',
  'manutencao-carro': 'Manutenção do Carro',
  'moradia': 'Moradia',
  'alimentacao': 'Alimentação',
  'transporte': 'Transporte',
  'saude': 'Saúde',
  'estudos': 'Estudos',
  'lazer': 'Lazer',
  'investimento': 'Investimento',
  'reserva': 'Reserva',
  'outros': 'Outros',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  'salario-fab': '#1565C0', 'pensao': '#7C3AED', 'decimo-terceiro': '#0891b2',
  'comissao-formatura': '#dc2626', 'lavanderia': '#ea580c', 'telefone': '#ca8a04',
  'assinatura-gpt': '#16a34a', 'cedula-afa': '#9333ea', 'cartao-credito': '#e11d48',
  'cachorra': '#d97706', 'manutencao-carro': '#475569', 'moradia': '#0f766e',
  'alimentacao': '#c2410c', 'transporte': '#1d4ed8', 'saude': '#0d9488',
  'estudos': '#7c3aed', 'lazer': '#db2777', 'investimento': '#2563eb',
  'reserva': '#0284c7', 'outros': '#64748b',
};

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
  category: Category;
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
  category: Category;
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
}

export interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'success' | 'info';
  message: string;
}
