import React from 'react';
import type { TransactionStatus, TransactionType } from '../../types';
import { TRANSACTION_TYPE_LABELS } from '../../types';

interface StatusBadgeProps { status: TransactionStatus; }
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
    status === 'pago'
      ? 'bg-green-100 text-green-700'
      : 'bg-yellow-100 text-yellow-700'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${status === 'pago' ? 'bg-green-500' : 'bg-yellow-500'}`} />
    {status === 'pago' ? 'Pago' : 'Pendente'}
  </span>
);

interface TypeBadgeProps { type: TransactionType; }
export const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => {
  const colorMap: Record<TransactionType, string> = {
    'receita': 'bg-green-100 text-green-700',
    'despesa-fixa': 'bg-red-100 text-red-700',
    'despesa-variavel': 'bg-orange-100 text-orange-700',
    'lazer': 'bg-purple-100 text-purple-700',
    'investimento': 'bg-blue-100 text-blue-700',
    'reserva': 'bg-cyan-100 text-cyan-700',
    'divida': 'bg-rose-100 text-rose-700',
    'extra': 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${colorMap[type]}`}>
      {TRANSACTION_TYPE_LABELS[type]}
    </span>
  );
};

interface AlertBadgeProps {
  type: 'warning' | 'danger' | 'success' | 'info';
  message: string;
}
export const AlertBadge: React.FC<AlertBadgeProps> = ({ type, message }) => {
  const styles = {
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  const icons = { warning: '⚠️', danger: '🚨', success: '✅', info: 'ℹ️' };
  return (
    <div className={`flex items-start gap-2 px-4 py-3 rounded-lg border text-sm ${styles[type]}`}>
      <span className="mt-0.5 flex-shrink-0">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
};
