import { supabase } from './supabase';
import type { Transaction, RecurringExpense, AppSettings } from '../types';
import { DEFAULT_CATEGORIES } from '../types';

// ─── Transactions ────────────────────────────────────────────────────────────

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    date: row.date as string,
    description: row.description as string,
    type: row.type as Transaction['type'],
    source: row.source as Transaction['source'],
    category: row.category as string,
    plannedValue: Number(row.planned_value),
    realizedValue: Number(row.realized_value),
    paymentMethod: row.payment_method as Transaction['paymentMethod'],
    account: row.account as string,
    status: row.status as Transaction['status'],
    month: row.month as Transaction['month'],
    isRecurring: Boolean(row.is_recurring),
    recurringId: (row.recurring_id as string) ?? undefined,
    observations: (row.observations as string) ?? undefined,
  };
}

function transactionToRow(t: Transaction, userId: string): Record<string, unknown> {
  return {
    id: t.id,
    user_id: userId,
    date: t.date,
    description: t.description,
    type: t.type,
    source: t.source,
    category: t.category,
    planned_value: t.plannedValue,
    realized_value: t.realizedValue,
    payment_method: t.paymentMethod,
    account: t.account,
    status: t.status,
    month: t.month,
    is_recurring: t.isRecurring,
    recurring_id: t.recurringId ?? null,
    observations: t.observations ?? null,
  };
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map(rowToTransaction);
}

export async function upsertTransaction(t: Transaction, userId: string): Promise<void> {
  const { error } = await supabase.from('transactions').upsert(transactionToRow(t, userId));
  if (error) throw error;
}

export async function upsertTransactions(ts: Transaction[], userId: string): Promise<void> {
  if (ts.length === 0) return;
  const { error } = await supabase
    .from('transactions')
    .upsert(ts.map(t => transactionToRow(t, userId)));
  if (error) throw error;
}

export async function deleteTransactionDb(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllTransactions(userId: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('user_id', userId);
  if (error) throw error;
}

// ─── Recurring Expenses ───────────────────────────────────────────────────────

function rowToRecurring(row: Record<string, unknown>): RecurringExpense {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as RecurringExpense['type'],
    source: row.source as RecurringExpense['source'],
    category: row.category as string,
    plannedValue: Number(row.planned_value),
    dueDay: Number(row.due_day),
    months: row.months as RecurringExpense['months'],
    active: Boolean(row.active),
    observations: (row.observations as string) ?? undefined,
  };
}

function recurringToRow(e: RecurringExpense, userId: string): Record<string, unknown> {
  return {
    id: e.id,
    user_id: userId,
    name: e.name,
    type: e.type,
    source: e.source,
    category: e.category,
    planned_value: e.plannedValue,
    due_day: e.dueDay,
    months: e.months,
    active: e.active,
    observations: e.observations ?? null,
  };
}

export async function fetchRecurringExpenses(userId: string): Promise<RecurringExpense[]> {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map(rowToRecurring);
}

export async function upsertRecurringExpense(e: RecurringExpense, userId: string): Promise<void> {
  const { error } = await supabase.from('recurring_expenses').upsert(recurringToRow(e, userId));
  if (error) throw error;
}

export async function upsertRecurringExpenses(es: RecurringExpense[], userId: string): Promise<void> {
  if (es.length === 0) return;
  const { error } = await supabase
    .from('recurring_expenses')
    .upsert(es.map(e => recurringToRow(e, userId)));
  if (error) throw error;
}

export async function deleteRecurringExpenseDb(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllRecurringExpenses(userId: string): Promise<void> {
  const { error } = await supabase.from('recurring_expenses').delete().eq('user_id', userId);
  if (error) throw error;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function rowToSettings(row: Record<string, unknown>): AppSettings {
  return {
    salarioFAB: Number(row.salario_fab),
    pensao: Number(row.pensao),
    regraPorcentagem: row.regra_porcentagem as AppSettings['regraPorcentagem'],
    accounts: row.accounts as string[],
    categories: (row.categories as AppSettings['categories']) ?? DEFAULT_CATEGORIES,
  };
}

export async function fetchSettings(userId: string): Promise<AppSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  // PGRST116 = no rows found (first login)
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return rowToSettings(data);
}

export async function upsertSettings(settings: AppSettings, userId: string): Promise<void> {
  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    salario_fab: settings.salarioFAB,
    pensao: settings.pensao,
    regra_porcentagem: settings.regraPorcentagem,
    accounts: settings.accounts,
    categories: settings.categories,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
