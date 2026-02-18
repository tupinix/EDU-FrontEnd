import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { useCreateOpcUaConnection } from '../../hooks/useOpcUa';

interface OpcUaFormProps {
  onClose: () => void;
}

export function OpcUaForm({ onClose }: OpcUaFormProps) {
  const createMutation = useCreateOpcUaConnection();
  const [form, setForm] = useState({
    name: '',
    endpointUrl: 'opc.tcp://',
    securityMode: 'None',
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        name: form.name,
        endpointUrl: form.endpointUrl,
        securityMode: form.securityMode,
        username: form.username || undefined,
        password: form.password || undefined,
      });
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="border border-primary-200 bg-primary-50/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">Nova Conexão OPC-UA</h4>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Servidor PLC #1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Segurança</label>
            <select
              value={form.securityMode}
              onChange={(e) => setForm({ ...form, securityMode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="None">None</option>
              <option value="Sign">Sign</option>
              <option value="SignAndEncrypt">Sign & Encrypt</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
          <input
            type="text"
            value={form.endpointUrl}
            onChange={(e) => setForm({ ...form, endpointUrl: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="opc.tcp://192.168.1.100:4840"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuário (opcional)</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha (opcional)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="••••••"
            />
          </div>
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-600">
            Erro: {createMutation.error instanceof Error ? createMutation.error.message : 'Falha ao criar conexão'}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
