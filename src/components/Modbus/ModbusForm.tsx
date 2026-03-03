import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { useCreateModbusConnection } from '../../hooks/useModbus';

interface ModbusFormProps {
  onClose: () => void;
}

export function ModbusForm({ onClose }: ModbusFormProps) {
  const createMutation = useCreateModbusConnection();
  const [form, setForm] = useState({
    name: '',
    host: '',
    port: 502,
    unitId: 1,
    timeoutMs: 5000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        name: form.name,
        host: form.host,
        port: form.port,
        unitId: form.unitId,
        timeoutMs: form.timeoutMs,
      });
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="border border-primary-200 bg-primary-50/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">Nova Conexão Modbus TCP</h4>
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
              placeholder="PLC Linha 1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Host / IP</label>
            <input
              type="text"
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="192.168.1.100"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Porta TCP</label>
            <input
              type="number"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 502 })}
              min={1} max={65535}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit ID (Slave)</label>
            <input
              type="number"
              value={form.unitId}
              onChange={(e) => setForm({ ...form, unitId: parseInt(e.target.value) || 1 })}
              min={0} max={247}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (ms)</label>
            <input
              type="number"
              value={form.timeoutMs}
              onChange={(e) => setForm({ ...form, timeoutMs: parseInt(e.target.value) || 5000 })}
              min={100} max={30000} step={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
