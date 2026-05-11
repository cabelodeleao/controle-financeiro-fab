import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Transaction, RecurringExpense, AppSettings, Month } from '../types';
import { DEFAULT_CATEGORIES } from '../types';
import { generateId, generateRecurringForMonth } from '../utils/calculations';
import { INITIAL_SETTINGS, INITIAL_RECURRING_EXPENSES, generateInitialTransactions } from '../data/initialData';
import {
  fetchTransactions, upsertTransaction, upsertTransactions, deleteTransactionDb, deleteAllTransactions,
  fetchRecurringExpenses, upsertRecurringExpense, upsertRecurringExpenses, deleteRecurringExpenseDb, deleteAllRecurringExpenses,
  fetchSettings, upsertSettings,
} from '../lib/db';

interface AppContextType {
  transactions: Transaction[];
  recurringExpenses: RecurringExpense[];
  settings: AppSettings;
  currentMonth: Month;
  dbLoading: boolean;
  dbError: string | null;
  clearDbError: () => void;
  setCurrentMonth: (month: Month) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addRecurringExpense: (e: Omit<RecurringExpense, 'id'>) => void;
  updateRecurringExpense: (id: string, updates: Partial<RecurringExpense>) => void;
  deleteRecurringExpense: (id: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  generateRecurringForCurrentMonth: () => number;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode; userId: string }> = ({ children, userId }) => {
  const [settings, setSettings] = useState<AppSettings>({ ...INITIAL_SETTINGS, categories: DEFAULT_CATEGORIES });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [currentMonth, setCurrentMonthState] = useState<Month>('maio');
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const clearDbError = useCallback(() => setDbError(null), []);

  const reportError = useCallback((prefix: string, err: unknown) => {
    let msg = 'erro desconhecido';
    if (err instanceof Error) {
      msg = err.message;
    } else if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>;
      const parts = [
        e.message ? String(e.message) : null,
        e.code ? `[${e.code}]` : null,
        e.details ? String(e.details) : null,
        e.hint ? `hint: ${e.hint}` : null,
      ].filter(Boolean);
      msg = parts.length > 0 ? parts.join(' — ') : JSON.stringify(err);
    } else {
      msg = String(err);
    }
    console.error(prefix, err);
    setDbError(`${prefix}: ${msg}`);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [dbTxs, dbRecs, dbSettings] = await Promise.all([
          fetchTransactions(userId),
          fetchRecurringExpenses(userId),
          fetchSettings(userId),
        ]);
        if (dbTxs.length > 0) setTransactions(dbTxs);
        if (dbRecs.length > 0) setRecurringExpenses(dbRecs);
        if (dbSettings) setSettings(dbSettings);
      } catch (err) {
        reportError('Falha ao carregar dados', err);
      } finally {
        setDbLoading(false);
      }
    };
    load();
  }, [userId]);

  const setCurrentMonth = useCallback((month: Month) => setCurrentMonthState(month), []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const newTx = { ...t, id: generateId() };
    setTransactions(prev => [...prev, newTx]);
    upsertTransaction(newTx, userId).catch(err => reportError('Erro ao salvar lançamento', err));
  }, [userId, reportError]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      const updated = next.find(t => t.id === id);
      if (updated) upsertTransaction(updated, userId).catch(err => reportError('Erro ao atualizar lançamento', err));
      return next;
    });
  }, [userId, reportError]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    deleteTransactionDb(id).catch(err => reportError('Erro ao excluir lançamento', err));
  }, [reportError]);

  const addRecurringExpense = useCallback((e: Omit<RecurringExpense, 'id'>) => {
    const newExp = { ...e, id: generateId() };
    setRecurringExpenses(prev => [...prev, newExp]);
    upsertRecurringExpense(newExp, userId).catch(err => reportError('Erro ao salvar recorrente', err));
  }, [userId, reportError]);

  const updateRecurringExpense = useCallback((id: string, updates: Partial<RecurringExpense>) => {
    setRecurringExpenses(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...updates } : e);
      const updated = next.find(e => e.id === id);
      if (updated) upsertRecurringExpense(updated, userId).catch(err => reportError('Erro ao atualizar recorrente', err));
      return next;
    });
  }, [userId, reportError]);

  const deleteRecurringExpense = useCallback((id: string) => {
    setRecurringExpenses(prev => prev.filter(e => e.id !== id));
    deleteRecurringExpenseDb(id).catch(err => reportError('Erro ao excluir recorrente', err));
  }, [reportError]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      upsertSettings(next, userId).catch(err => reportError('Erro ao salvar configurações', err));
      return next;
    });
  }, [userId, reportError]);

  const generateRecurringForCurrentMonth = useCallback(() => {
    const newTxs = generateRecurringForMonth(recurringExpenses, transactions, currentMonth);
    if (newTxs.length > 0) {
      const withIds = newTxs.map(t => ({ ...t, id: generateId() }));
      setTransactions(prev => [...prev, ...withIds]);
      upsertTransactions(withIds, userId).catch(err => reportError('Erro ao gerar recorrentes', err));
    }
    return newTxs.length;
  }, [recurringExpenses, transactions, currentMonth, userId, reportError]);

  const resetAllData = useCallback(() => {
    const freshSettings = { ...INITIAL_SETTINGS, categories: DEFAULT_CATEGORIES };
    const freshTransactions = generateInitialTransactions(freshSettings);
    const freshRecurring = INITIAL_RECURRING_EXPENSES;

    setSettings(freshSettings);
    setTransactions(freshTransactions);
    setRecurringExpenses(freshRecurring);
    setCurrentMonthState('maio');

    Promise.all([
      deleteAllTransactions(userId),
      deleteAllRecurringExpenses(userId),
    ]).then(() => Promise.all([
      upsertTransactions(freshTransactions, userId),
      upsertRecurringExpenses(freshRecurring, userId),
      upsertSettings(freshSettings, userId),
    ])).catch(err => reportError('Erro ao resetar dados', err));
  }, [userId]);

  if (dbLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a1628' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      transactions, recurringExpenses, settings, currentMonth, dbLoading,
      dbError, clearDbError,
      setCurrentMonth, addTransaction, updateTransaction, deleteTransaction,
      addRecurringExpense, updateRecurringExpense, deleteRecurringExpense,
      updateSettings, generateRecurringForCurrentMonth, resetAllData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
