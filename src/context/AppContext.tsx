import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

const STORAGE_KEYS = {
  transactions: 'fab-finance-transactions',
  recurring: 'fab-finance-recurring',
  settings: 'fab-finance-settings',
  currentMonth: 'fab-finance-current-month',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export const AppProvider: React.FC<{ children: ReactNode; userId?: string }> = ({ children, userId }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = loadFromStorage(STORAGE_KEYS.settings, INITIAL_SETTINGS);
    if (!stored.categories) return { ...stored, categories: DEFAULT_CATEGORIES };
    return stored;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage(STORAGE_KEYS.transactions, generateInitialTransactions(INITIAL_SETTINGS)),
  );

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() =>
    loadFromStorage(STORAGE_KEYS.recurring, INITIAL_RECURRING_EXPENSES),
  );

  const [currentMonth, setCurrentMonthState] = useState<Month>(() =>
    loadFromStorage(STORAGE_KEYS.currentMonth, 'maio' as Month),
  );

  // true while loading initial data from Supabase
  const [dbLoading, setDbLoading] = useState(!!userId);

  // Refs to access current state inside the load effect without adding them as deps
  const txRef = useRef(transactions);
  const recRef = useRef(recurringExpenses);
  const settingsRef = useRef(settings);
  useEffect(() => { txRef.current = transactions; }, [transactions]);
  useEffect(() => { recRef.current = recurringExpenses; }, [recurringExpenses]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Load from Supabase when userId becomes available
  useEffect(() => {
    if (!userId) {
      setDbLoading(false);
      return;
    }
    setDbLoading(true);

    const load = async () => {
      try {
        const [dbTxs, dbRecs, dbSettings] = await Promise.all([
          fetchTransactions(userId),
          fetchRecurringExpenses(userId),
          fetchSettings(userId),
        ]);

        const isFirstLogin = dbTxs.length === 0 && dbRecs.length === 0 && !dbSettings;
        if (isFirstLogin) {
          // Migrate existing localStorage data to Supabase
          await Promise.all([
            upsertTransactions(txRef.current, userId),
            upsertRecurringExpenses(recRef.current, userId),
            upsertSettings(settingsRef.current, userId),
          ]);
        } else {
          // Use cloud data (trust Supabase as source of truth)
          if (dbTxs.length > 0) setTransactions(dbTxs);
          if (dbRecs.length > 0) setRecurringExpenses(dbRecs);
          if (dbSettings) setSettings(dbSettings);
        }
      } catch (err) {
        console.error('Falha ao sincronizar com Supabase:', err);
      } finally {
        setDbLoading(false);
      }
    };

    load();
  }, [userId]);

  // localStorage sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  }, [transactions]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.recurring, JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currentMonth, JSON.stringify(currentMonth));
  }, [currentMonth]);

  const setCurrentMonth = useCallback((month: Month) => {
    setCurrentMonthState(month);
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const newTx = { ...t, id: generateId() };
    setTransactions(prev => [...prev, newTx]);
    if (userId) upsertTransaction(newTx, userId).catch(console.error);
  }, [userId]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      if (userId) {
        const updated = next.find(t => t.id === id);
        if (updated) upsertTransaction(updated, userId).catch(console.error);
      }
      return next;
    });
  }, [userId]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (userId) deleteTransactionDb(id).catch(console.error);
  }, [userId]);

  const addRecurringExpense = useCallback((e: Omit<RecurringExpense, 'id'>) => {
    const newExp = { ...e, id: generateId() };
    setRecurringExpenses(prev => [...prev, newExp]);
    if (userId) upsertRecurringExpense(newExp, userId).catch(console.error);
  }, [userId]);

  const updateRecurringExpense = useCallback((id: string, updates: Partial<RecurringExpense>) => {
    setRecurringExpenses(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...updates } : e);
      if (userId) {
        const updated = next.find(e => e.id === id);
        if (updated) upsertRecurringExpense(updated, userId).catch(console.error);
      }
      return next;
    });
  }, [userId]);

  const deleteRecurringExpense = useCallback((id: string) => {
    setRecurringExpenses(prev => prev.filter(e => e.id !== id));
    if (userId) deleteRecurringExpenseDb(id).catch(console.error);
  }, [userId]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      if (userId) upsertSettings(next, userId).catch(console.error);
      return next;
    });
  }, [userId]);

  const generateRecurringForCurrentMonth = useCallback(() => {
    const newTxs = generateRecurringForMonth(recurringExpenses, transactions, currentMonth);
    if (newTxs.length > 0) {
      const withIds = newTxs.map(t => ({ ...t, id: generateId() }));
      setTransactions(prev => [...prev, ...withIds]);
      if (userId) upsertTransactions(withIds, userId).catch(console.error);
    }
    return newTxs.length;
  }, [recurringExpenses, transactions, currentMonth, userId]);

  const resetAllData = useCallback(() => {
    const freshSettings = { ...INITIAL_SETTINGS, categories: DEFAULT_CATEGORIES };
    const freshTransactions = generateInitialTransactions(freshSettings);
    const freshRecurring = INITIAL_RECURRING_EXPENSES;

    setSettings(freshSettings);
    setTransactions(freshTransactions);
    setRecurringExpenses(freshRecurring);
    setCurrentMonthState('maio');

    if (userId) {
      Promise.all([
        deleteAllTransactions(userId),
        deleteAllRecurringExpenses(userId),
      ]).then(() => Promise.all([
        upsertTransactions(freshTransactions, userId),
        upsertRecurringExpenses(freshRecurring, userId),
        upsertSettings(freshSettings, userId),
      ])).catch(console.error);
    }
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
