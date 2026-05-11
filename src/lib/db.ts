import { supabase } from './supabase';
import type { Transaction, RecurringExpense, AppSettings } from '../types';
import { DEFAULT_CATEGORIES } from '../types';

async function logSupabaseError(operation: string, error: unknown, payload?: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  const authUid = session?.user?.id ?? null;
  const expiresAt = session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null;

  console.group(`[Supabase] ${operation} FAILED`);
  console.error('error:', error);
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    console.error('error.message:', e.message);
    console.error('error.code:', e.code);
    console.error('error.details:', e.details);
    console.error('error.hint:', e.hint);
    console.error('error.status:', e.status);
  }
  console.error('JWT auth.uid():', authUid);
  console.error('session expires_at:', expiresAt);
  if (payload) {
    const p = payload as Record<string, unknown>;
    console.error('payload.user_id:', p.user_id, '(type:', typeof p.user_id, ')');
    console.error('user_id matches auth.uid():', p.user_id === authUid);
    console.error('full payload:', payload);
  }
  console.groupEnd();
}

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
  if (error) {
    await logSupabaseError('fetchTransactions', error, { user_id: userId });
    throw error;
  }
  return (data ?? []).map(rowToTransaction);
}

export async function upsertTransaction(t: Transaction, userId: string): Promise<void> {
  const row = transactionToRow(t, userId);
  console.log('[Supabase] upsertTransaction →', { user_id: userId, id: t.id });
  const { error } = await supabase.from('transactions').upsert(row);
  if (error) {
    await logSupabaseError('upsertTransaction', error, row);
    throw error;
  }
}

export async function upsertTransactions(ts: Transaction[], userId: string): Promise<void> {
  if (ts.length === 0) return;
  const rows = ts.map(t => transactionToRow(t, userId));
  const { error } = await supabase.from('transactions').upsert(rows);
  if (error) {
    await logSupabaseError('upsertTransactions', error, rows[0]);
    throw error;
  }
}

export async function deleteTransactionDb(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) {
    await logSupabaseError('deleteTransactionDb', error, { id });
    throw error;
  }
}

export async function deleteAllTransactions(userId: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('user_id', userId);
  if (error) {
    await logSupabaseError('deleteAllTransactions', error, { user_id: userId });
    throw error;
  }
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
  if (error) {
    await logSupabaseError('fetchRecurringExpenses', error, { user_id: userId });
    throw error;
  }
  return (data ?? []).map(rowToRecurring);
}

export async function upsertRecurringExpense(e: RecurringExpense, userId: string): Promise<void> {
  const row = recurringToRow(e, userId);
  const { error } = await supabase.from('recurring_expenses').upsert(row);
  if (error) {
    await logSupabaseError('upsertRecurringExpense', error, row);
    throw error;
  }
}

export async function upsertRecurringExpenses(es: RecurringExpense[], userId: string): Promise<void> {
  if (es.length === 0) return;
  const rows = es.map(e => recurringToRow(e, userId));
  const { error } = await supabase.from('recurring_expenses').upsert(rows);
  if (error) {
    await logSupabaseError('upsertRecurringExpenses', error, rows[0]);
    throw error;
  }
}

export async function deleteRecurringExpenseDb(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
  if (error) {
    await logSupabaseError('deleteRecurringExpenseDb', error, { id });
    throw error;
  }
}

export async function deleteAllRecurringExpenses(userId: string): Promise<void> {
  const { error } = await supabase.from('recurring_expenses').delete().eq('user_id', userId);
  if (error) {
    await logSupabaseError('deleteAllRecurringExpenses', error, { user_id: userId });
    throw error;
  }
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
  if (error && error.code !== 'PGRST116') {
    await logSupabaseError('fetchSettings', error, { user_id: userId });
    throw error;
  }
  if (!data) return null;
  return rowToSettings(data);
}

export async function upsertSettings(settings: AppSettings, userId: string): Promise<void> {
  const row = {
    user_id: userId,
    salario_fab: settings.salarioFAB,
    pensao: settings.pensao,
    regra_porcentagem: settings.regraPorcentagem,
    accounts: settings.accounts,
    categories: settings.categories,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('user_settings').upsert(row);
  if (error) {
    await logSupabaseError('upsertSettings', error, row);
    throw error;
  }
}
