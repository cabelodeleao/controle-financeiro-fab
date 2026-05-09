import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, calculate702010 } from '../utils/calculations';
import { Save, RotateCcw, Plus, X, AlertTriangle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetAllData } = useApp();
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [newAccount, setNewAccount] = useState('');
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const limits = calculate702010(localSettings.salarioFAB, localSettings.regraPorcentagem);
  const pctTotal = localSettings.regraPorcentagem.essenciais + localSettings.regraPorcentagem.lazer + localSettings.regraPorcentagem.investimento;

  const handleSave = () => {
    if (pctTotal !== 100) return;
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addAccount = () => {
    if (!newAccount.trim()) return;
    setLocalSettings(s => ({ ...s, accounts: [...s.accounts, newAccount.trim()] }));
    setNewAccount('');
  };

  const removeAccount = (acc: string) => {
    setLocalSettings(s => ({ ...s, accounts: s.accounts.filter(a => a !== acc) }));
  };

  const upd = (field: string, value: unknown) => {
    setLocalSettings(s => ({ ...s, [field]: value }));
  };

  const updPct = (field: string, value: number) => {
    setLocalSettings(s => ({ ...s, regraPorcentagem: { ...s.regraPorcentagem, [field]: value } }));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
        <p className="text-sm text-slate-500 mt-0.5">Personalize o aplicativo conforme sua necessidade</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm flex items-center gap-2">
          ✅ Configurações salvas com sucesso!
        </div>
      )}

      {/* Rendimentos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">Rendimentos Mensais</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Salário FAB (R$)</label>
            <input
              type="number" min="0" step="0.01"
              value={localSettings.salarioFAB}
              onChange={e => upd('salarioFAB', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">Atual: {formatCurrency(settings.salarioFAB)}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pensão (R$)</label>
            <input
              type="number" min="0" step="0.01"
              value={localSettings.pensao}
              onChange={e => upd('pensao', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">Atual: {formatCurrency(settings.pensao)}</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-600">13º Salário (calculado automaticamente)</p>
          <p className="text-xs text-slate-500 mt-1">
            Junho e Dezembro: 50% do sal. FAB ({formatCurrency(localSettings.salarioFAB / 2)}) + 50% da pensão ({formatCurrency(localSettings.pensao / 2)}) = {formatCurrency((localSettings.salarioFAB + localSettings.pensao) / 2)}
          </p>
        </div>
      </div>

      {/* Regra 70/20/10 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">Regra de Distribuição do Salário FAB</h3>

        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'essenciais', label: 'Essenciais (%)', color: 'border-blue-300 focus:ring-blue-500' },
            { key: 'lazer', label: 'Lazer (%)', color: 'border-purple-300 focus:ring-purple-500' },
            { key: 'investimento', label: 'Investimento (%)', color: 'border-yellow-300 focus:ring-yellow-500' },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
              <input
                type="number" min="0" max="100" step="1"
                value={localSettings.regraPorcentagem[key as keyof typeof localSettings.regraPorcentagem]}
                onChange={e => updPct(key, parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${color}`}
              />
            </div>
          ))}
        </div>

        {pctTotal !== 100 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle size={14} className="text-red-600 flex-shrink-0" />
            <p className="text-xs text-red-600">A soma dos percentuais deve ser 100%. Atual: {pctTotal}%</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-2">
          {[
            { label: 'Essenciais', value: limits.essenciais, color: 'text-blue-700 bg-blue-50' },
            { label: 'Lazer', value: limits.lazer, color: 'text-purple-700 bg-purple-50' },
            { label: 'Investimento', value: limits.investimento, color: 'text-yellow-700 bg-yellow-50' },
          ].map(s => (
            <div key={s.label} className={`rounded-lg p-3 ${s.color}`}>
              <p className="text-xs font-semibold uppercase">{s.label}</p>
              <p className="text-base font-bold mt-0.5">{formatCurrency(s.value)}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">⚠️ A pensão não entra na regra de distribuição.</p>
      </div>

      {/* Contas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">Contas / Carteiras</h3>
        <div className="flex flex-wrap gap-2">
          {localSettings.accounts.map(acc => (
            <span key={acc} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700">
              {acc}
              <button onClick={() => removeAccount(acc)} className="text-slate-400 hover:text-red-500 transition-colors ml-1">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text" value={newAccount} onChange={e => setNewAccount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addAccount()}
            placeholder="Nova conta..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={addAccount}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-1 hover:opacity-90 transition-colors"
            style={{ backgroundColor: '#1565C0' }}>
            <Plus size={14} /> Adicionar
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={pctTotal !== 100}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#1565C0' }}>
          <Save size={16} /> Salvar Configurações
        </button>
        <button
          onClick={() => setLocalSettings({ ...settings })}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
          <RotateCcw size={16} /> Descartar Alterações
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-red-700 border-b border-red-100 pb-3 flex items-center gap-2">
          <AlertTriangle size={16} /> Zona de Perigo
        </h3>
        <p className="text-sm text-slate-600">Redefinir todos os dados apaga todos os lançamentos e restaura as configurações iniciais. Esta ação não pode ser desfeita.</p>
        {!showReset ? (
          <button onClick={() => setShowReset(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
            <RotateCcw size={14} /> Redefinir Todos os Dados
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-red-600 font-semibold">Tem certeza?</p>
            <button onClick={() => { resetAllData(); setShowReset(false); setLocalSettings(settings); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors">
              Sim, redefinir
            </button>
            <button onClick={() => setShowReset(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Sobre o App</h3>
        <div className="space-y-1 text-xs text-slate-500">
          <p>• Dados salvos localmente no navegador (localStorage)</p>
          <p>• Período de controle: Maio a Dezembro de 2025</p>
          <p>• Regra 70/20/10 aplicada apenas sobre o Salário FAB</p>
          <p>• Exportação disponível em formato CSV</p>
          <p>• Desenvolvido para cadetes da Força Aérea Brasileira 🛩️</p>
        </div>
      </div>
    </div>
  );
};
