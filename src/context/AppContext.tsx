import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Transaction, RecurringExpense, AppSettings, Month } from '../types';
import { generateId, generateRecurringForMonth } from '../utils/calculations';
import { INITIAL_SETTINGS, INITIAL_RECURRING_EXPENSES, generateInitialTransactions } from '../data/initialData';

interface AppContextType {
  transactions: Transaction[];
  recurringExpenses: RecurringExpense[];
  settings: AppSettings;
  currentMonth: Month;
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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadFromStorage(STORAGE_KEYS.settings, INITIAL_SETTINGS),
  );

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage(STORAGE_KEYS.transactions, generateInitialTransactions(INITIAL_SETTINGS)),
  );

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() =>
    loadFromStorage(STORAGE_KEYS.recurring, INITIAL_RECURRING_EXPENSES),
  );

  const [currentMonth, setCurrentMonthState] = useState<Month>(() =>
    loadFromStorage(STORAGE_KEYS.currentMonth, 'maio' as Month),
  );

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
    setTransactions(prev => [...prev, { ...t, id: generateId() }]);
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const addRecurringExpense = useCallback((e: Omit<RecurringExpense, 'id'>) => {
    setRecurringExpenses(prev => [...prev, { ...e, id: generateId() }]);
  }, []);

  const updateRecurringExpense = useCallback((id: string, updates: Partial<RecurringExpense>) => {
    setRecurringExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const deleteRecurringExpense = useCallback((id: string) => {
    setRecurringExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const generateRecurringForCurrentMonth = useCallback(() => {
    const newTxs = generateRecurringForMonth(recurringExpenses, transactions, currentMonth);
    if (newTxs.length > 0) {
      setTransactions(prev => [...prev, ...newTxs.map(t => ({ ...t, id: generateId() }))]);
    }
    return newTxs.length;
  }, [recurringExpenses, transactions, currentMonth]);

  const resetAllData = useCallback(() => {
    const freshSettings = INITIAL_SETTINGS;
    setSettings(freshSettings);
    setTransactions(generateInitialTransactions(freshSettings));
    setRecurringExpenses(INITIAL_RECURRING_EXPENSES);
    setCurrentMonthState('maio');
  }, []);

  return (
    <AppContext.Provider value={{
      transactions, recurringExpenses, settings, currentMonth,
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
