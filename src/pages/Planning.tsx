import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { RecurringExpense, TransactionType, MoneySource, Month, CategoryDefinition } from '../types';
import { MONTHS, MONTH_LABELS, TRANSACTION_TYPE_LABELS, MONEY_SOURCE_LABELS, getCategoryLabel } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Modal } from '../components/ui/Modal';
import { TypeBadge } from '../components/ui/Badge';
import { Plus, Edit2, Trash2, RefreshCw, CheckCircle, XCircle, Calendar } from 'lucide-react';

const EMPTY_FORM: Omit<RecurringExpense, 'id'> = {
  name: '',
  type: 'despesa-fixa',
  source: 'salario-fab',
  category: 'outros',
  plannedValue: 0,
  dueDay: 10,
  months: [...MONTHS],
  active: true,
  observations: '',
};

export const Planning: React.FC = () => {
  const { recurringExpenses, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense, generateRecurringForCurrentMonth, currentMonth, settings } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<RecurringExpense, 'id'>>(EMPTY_FORM);
  const [generateMsg, setGenerateMsg] = useState('');

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const openEdit = (e: RecurringExpense) => {
    setEditingId(e.id);
    setForm({ ...e });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateRecurringExpense(editingId, form);
    } else {
      addRecurringExpense(form);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir este gasto recorrente?')) deleteRecurringExpense(id);
  };

  const toggleActive = (e: RecurringExpense) => {
    updateRecurringExpense(e.id, { active: !e.active });
  };

  const handleGenerate = () => {
    const count = generateRecurringForCurrentMonth();
    setGenerateMsg(typeof count === 'number' && count > 0
      ? `${count} lançamento(s) gerado(s) para ${MONTH_LABELS[currentMonth]}!`
      : `Todos os recorrentes já foram gerados para ${MONTH_LABELS[currentMonth]}.`
    );
    setTimeout(() => setGenerateMsg(''), 4000);
  };

  const toggleMonth = (month: Month) => {
    setForm(f => ({
      ...f,
      months: f.months.includes(month)
        ? f.months.filter(m => m !== month)
        : [...f.months, month],
    }));
  };

  const upd = (field: keyof Omit<RecurringExpense, 'id'>, value: unknown) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const activeCount = recurringExpenses.filter(e => e.active).length;
  const totalPlanned = recurringExpenses.filter(e => e.active).reduce((s, e) => s + e.plannedValue, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#1565C0' }}>
          <Plus size={16} /> Novo Gasto Recorrente
        </button>
        <button onClick={handleGenerate} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#D4AF37', color: '#0a1628' }}>
          <RefreshCw size={16} /> Gerar para {MONTH_LABELS[currentMonth]}
        </button>
      </div>

      {generateMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} /> {generateMsg}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Recorrentes</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{recurringExpenses.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Ativos</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Mensal Previsto</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalPlanned)}</p>
        </div>
      </div>

      {/* FAB expenses */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1565C0' }} />
          <h3 className="text-sm font-bold text-slate-800">Gastos do Salário</h3>
        </div>
        <RecurringTable
          expenses={recurringExpenses.filter(e => e.source === 'salario-fab')}
          categories={settings.categories}
          onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive}
        />
      </div>

      {/* Pensão expenses */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <h3 className="text-sm font-bold text-slate-800">Gastos da Pensão</h3>
        </div>
        <RecurringTable
          expenses={recurringExpenses.filter(e => e.source !== 'salario-fab')}
          onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive}
        />
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Gasto Recorrente' : 'Novo Gasto Recorrente'} size="lg">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nome *</label>
            <input type="text" value={form.name} onChange={e => upd('name', e.target.value)}
              placeholder="Ex: Academia"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tipo</label>
              <select value={form.type} onChange={e => upd('type', e.target.value as TransactionType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {(Object.entries(TRANSACTION_TYPE_LABELS) as [TransactionType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Origem do Dinheiro</label>
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Dia de Vencimento</label>
              <input type="number" min="1" max="31" value={form.dueDay}
                onChange={e => upd('dueDay', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Valor Previsto (R$)</label>
            <input type="number" min="0" step="0.01" value={form.plannedValue}
              onChange={e => upd('plannedValue', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {form.plannedValue === 0 && (
              <p className="text-xs text-amber-600 mt-1">⚠️ Valor 0 — lembre de preencher antes de usar</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Meses em que se repete</label>
            <div className="flex flex-wrap gap-2">
              {MONTHS.map(m => (
                <button key={m} type="button"
                  onClick={() => toggleMonth(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    form.months.includes(m)
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                  style={form.months.includes(m) ? { backgroundColor: '#1565C0' } : {}}>
                  {MONTH_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Ativo</label>
            <button type="button" onClick={() => upd('active', !form.active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.active ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${form.active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-xs text-slate-500">{form.active ? 'Sim' : 'Não'}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Observações</label>
            <textarea value={form.observations || ''} onChange={e => upd('observations', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsModalOpen(false)}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={!form.name.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1565C0' }}>
              {editingId ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const RecurringTable: React.FC<{
  expenses: RecurringExpense[];
  categories: CategoryDefinition[];
  onEdit: (e: RecurringExpense) => void;
  onDelete: (id: string) => void;
  onToggle: (e: RecurringExpense) => void;
}> = ({ expenses, categories, onEdit, onDelete, onToggle }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-100">
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ativo</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nome</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tipo</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Categoria</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Venc.</th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Valor</th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Meses</th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Ações</th>
        </tr>
      </thead>
      <tbody>
        {expenses.length === 0 && (
          <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">Nenhum gasto recorrente</td></tr>
        )}
        {expenses.map(e => (
          <tr key={e.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${!e.active ? 'opacity-50' : ''}`}>
            <td className="px-4 py-3">
              <button onClick={() => onToggle(e)}>
                {e.active
                  ? <CheckCircle size={18} className="text-green-500" />
                  : <XCircle size={18} className="text-slate-400" />
                }
              </button>
            </td>
            <td className="px-4 py-3">
              <p className="font-semibold text-slate-800">{e.name}</p>
              {e.observations && <p className="text-xs text-slate-400">{e.observations}</p>}
            </td>
            <td className="px-4 py-3"><TypeBadge type={e.type} /></td>
            <td className="px-4 py-3 text-xs text-slate-600">{getCategoryLabel(e.category, categories)}</td>
            <td className="px-4 py-3 text-xs text-slate-500 flex items-center gap-1">
              <Calendar size={12} /> Dia {e.dueDay}
            </td>
            <td className={`px-4 py-3 text-right font-bold font-mono text-sm ${e.plannedValue === 0 ? 'text-amber-500' : 'text-slate-800'}`}>
              {e.plannedValue === 0 ? '— a preencher' : formatCurrency(e.plannedValue)}
            </td>
            <td className="px-4 py-3 text-center">
              <span className="text-xs text-slate-500">{e.months.length}/8 meses</span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => onEdit(e)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => onDelete(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
