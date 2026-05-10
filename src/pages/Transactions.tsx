import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Transaction, TransactionType, MoneySource, PaymentMethod, Month } from '../types';
import {
  MONTHS, MONTH_LABELS, TRANSACTION_TYPE_LABELS, MONEY_SOURCE_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../types';
import { formatCurrency, formatDate, exportToCSV } from '../utils/calculations';
import { Modal } from '../components/ui/Modal';
import { StatusBadge, TypeBadge } from '../components/ui/Badge';
import { Plus, Edit2, Trash2, Download, Search, X } from 'lucide-react';

const EMPTY_FORM: Omit<Transaction, 'id'> = {
  date: new Date().toISOString().slice(0, 10),
  description: '',
  type: 'despesa-fixa',
  source: 'salario-fab',
  category: 'outros',
  plannedValue: 0,
  realizedValue: 0,
  paymentMethod: 'pix',
  account: 'Conta Principal',
  status: 'pendente',
  month: 'maio',
  isRecurring: false,
  observations: '',
};

export const Transactions: React.FC = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, settings, currentMonth, setCurrentMonth } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Transaction, 'id'>>(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'todos'>('todos');
  const [filterStatus, setFilterStatus] = useState<'pago' | 'pendente' | 'todos'>('todos');

  const handleFilterMonth = (month: Month) => {
    setCurrentMonth(month);
  };

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (t.month !== currentMonth) return false;
        if (filterType !== 'todos' && t.type !== filterType) return false;
        if (filterStatus !== 'todos' && t.status !== filterStatus) return false;
        if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const mOrder = MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month);
        if (mOrder !== 0) return mOrder;
        return b.date.localeCompare(a.date);
      });
  }, [transactions, currentMonth, filterType, filterStatus, search]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, month: currentMonth });
    setIsModalOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setEditingId(t.id);
    setForm({ ...t });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.description.trim()) return;
    if (editingId) {
      updateTransaction(editingId, form);
    } else {
      addTransaction(form);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir este lançamento?')) deleteTransaction(id);
  };

  const toggleStatus = (t: Transaction) => {
    updateTransaction(t.id, { status: t.status === 'pago' ? 'pendente' : 'pago' });
  };

  const upd = (field: keyof Omit<Transaction, 'id'>, value: string | number | boolean) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      if (field === 'realizedValue' && (value as number) > 0) {
        updated.status = 'pago';
      }
      if (field === 'type' && value !== 'despesa-fixa') {
        updated.plannedValue = 0;
      }
      return updated;
    });
  };

  const totalFiltered = filtered.reduce((sum, t) => {
    return t.type === 'receita' ? sum + (t.realizedValue || t.plannedValue) : sum - (t.realizedValue || t.plannedValue);
  }, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#1565C0' }}>
          <Plus size={16} /> Novo Lançamento
        </button>
        <button onClick={() => exportToCSV(filtered)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
          <Download size={16} /> Exportar CSV
        </button>

        <div className="flex-1 relative min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar lançamento..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select value={currentMonth} onChange={e => handleFilterMonth(e.target.value as Month)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {MONTHS.map(m => <option key={m} value={m}>{MONTH_LABELS[m]}</option>)}
          </select>

          <select value={filterType} onChange={e => setFilterType(e.target.value as TransactionType | 'todos')}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todos os tipos</option>
            {(Object.keys(TRANSACTION_TYPE_LABELS) as TransactionType[]).map(t => (
              <option key={t} value={t}>{TRANSACTION_TYPE_LABELS[t]}</option>
            ))}
          </select>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'pago' | 'pendente' | 'todos')}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todos os status</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 flex items-center gap-6 flex-wrap">
        <span className="text-sm text-slate-500">{filtered.length} lançamento(s)</span>
        <span className={`text-sm font-bold ${totalFiltered >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          Saldo filtrado: {formatCurrency(totalFiltered)}
        </span>
        <span className="text-sm text-slate-500">
          Pendentes: {formatCurrency(filtered.filter(t => t.status === 'pendente' && t.type !== 'receita').reduce((s, t) => s + t.plannedValue, 0))}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Mês</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Origem</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Previsto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Realizado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Nenhum lançamento encontrado
                  </td>
                </tr>
              )}
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(t)} className="hover:opacity-75 transition-opacity">
                      <StatusBadge status={t.status} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{MONTH_LABELS[t.month]}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{t.description}</div>
                    {t.observations && <div className="text-xs text-slate-400 truncate max-w-48">{t.observations}</div>}
                  </td>
                  <td className="px-4 py-3"><TypeBadge type={t.type} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{MONEY_SOURCE_LABELS[t.source]}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-slate-600">{formatCurrency(t.plannedValue)}</td>
                  <td className={`px-4 py-3 text-right font-mono text-sm font-semibold ${
                    t.type === 'receita' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {t.type === 'receita' ? '+' : '-'}{formatCurrency(t.realizedValue || t.plannedValue)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Lançamento' : 'Novo Lançamento'} size="lg">
        <div className="p-6 space-y-4" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && form.description.trim()) handleSave(); }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mês *</label>
              <select value={form.month} onChange={e => upd('month', e.target.value as Month)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MONTHS.map(m => <option key={m} value={m}>{MONTH_LABELS[m]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Data</label>
              <input type="date" value={form.date} onChange={e => upd('date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Descrição *</label>
            <input type="text" value={form.description} onChange={e => upd('description', e.target.value)}
              placeholder="Ex: Almoço no refeitório"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tipo *</label>
              <select value={form.type} onChange={e => upd('type', e.target.value as TransactionType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {(Object.entries(TRANSACTION_TYPE_LABELS) as [TransactionType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Origem do Dinheiro *</label>
              <select value={form.source} onChange={e => upd('source', e.target.value as MoneySource)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {(Object.entries(MONEY_SOURCE_LABELS) as [MoneySource, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Categoria</label>
              <select value={form.category} onChange={e => upd('category', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {settings.categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
              <select value={form.status} onChange={e => upd('status', e.target.value as 'pago' | 'pendente')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>

          <div className={`grid gap-4 ${form.type === 'despesa-fixa' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {form.type === 'despesa-fixa' && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Valor Previsto (R$)</label>
                <input type="number" min="0" step="0.01" value={form.plannedValue}
                  onChange={e => upd('plannedValue', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Valor Realizado (R$)</label>
              <input type="number" min="0" step="0.01" value={form.realizedValue}
                onChange={e => upd('realizedValue', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Forma de Pagamento</label>
              <select value={form.paymentMethod} onChange={e => upd('paymentMethod', e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Conta / Carteira</label>
              <select value={form.account} onChange={e => upd('account', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {settings.accounts.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Observações</label>
            <textarea value={form.observations || ''} onChange={e => upd('observations', e.target.value)}
              rows={2} placeholder="Informações adicionais..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsModalOpen(false)}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave}
              disabled={!form.description.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1565C0' }}>
              {editingId ? 'Salvar Alterações' : 'Adicionar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
