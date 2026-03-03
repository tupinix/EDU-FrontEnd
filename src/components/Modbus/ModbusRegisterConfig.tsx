import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Loader2, ListChecks, Save, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useModbusRegisters, useCreateModbusRegister, useDeleteModbusRegister } from '../../hooks/useModbus';
import { ModbusConnection } from '../../types';

interface Props {
  connection: ModbusConnection;
  onBack: () => void;
}

const REGISTER_TYPES = ['holding', 'input', 'coil', 'discrete_input'] as const;
const DATA_TYPES = ['uint16', 'int16', 'int32', 'float32', 'boolean'] as const;

const registerTypeLabel: Record<string, string> = {
  holding: 'Holding (FC03)',
  input: 'Input (FC04)',
  coil: 'Coil (FC01)',
  discrete_input: 'Discrete Input (FC02)',
};

const dataTypeLabel: Record<string, string> = {
  uint16: 'UInt16 (0–65535)',
  int16: 'Int16 (-32768–32767)',
  int32: 'Int32 / DINT (±2 bilhões)',
  float32: 'Float32 (IEEE 754)',
  boolean: 'Boolean',
};

const defaultForm = {
  name: '',
  registerType: 'holding' as typeof REGISTER_TYPES[number],
  address: 0,
  dataType: 'uint16' as typeof DATA_TYPES[number],
  scaleFactor: 1,
  mqttTopic: '',
  samplingIntervalMs: 1000,
  brokerId: '',
  enabled: true,
};

export function ModbusRegisterConfig({ connection, onBack }: Props) {
  const { data: registers, isLoading } = useModbusRegisters(connection.id);
  const createMutation = useCreateModbusRegister(connection.id);
  const deleteMutation = useDeleteModbusRegister(connection.id);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        name: form.name,
        registerType: form.registerType,
        address: form.address,
        dataType: form.dataType,
        scaleFactor: form.scaleFactor,
        mqttTopic: form.mqttTopic,
        samplingIntervalMs: form.samplingIntervalMs,
        brokerId: form.brokerId || undefined,
        enabled: form.enabled,
      });
      setShowForm(false);
      setForm({ ...defaultForm });
    } catch {
      // handled by mutation
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <ListChecks className="w-5 h-5 text-primary-500" />
        <h3 className="font-semibold text-gray-900">Registradores — {connection.name}</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border border-primary-200 bg-primary-50/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 text-sm">Novo Registrador</h4>
            <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Temperatura Motor"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tópico MQTT</label>
                <input
                  type="text"
                  value={form.mqttTopic}
                  onChange={(e) => setForm({ ...form, mqttTopic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Modbus/PLC1/Temperature"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Registro</label>
                <select
                  value={form.registerType}
                  onChange={(e) => setForm({ ...form, registerType: e.target.value as typeof form.registerType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {REGISTER_TYPES.map(t => (
                    <option key={t} value={t}>{registerTypeLabel[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="number"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: parseInt(e.target.value) || 0 })}
                  min={0} max={65535}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Dado</label>
                <select
                  value={form.dataType}
                  onChange={(e) => setForm({ ...form, dataType: e.target.value as typeof form.dataType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={form.registerType === 'coil' || form.registerType === 'discrete_input'}
                >
                  {DATA_TYPES.map(t => (
                    <option key={t} value={t}>{dataTypeLabel[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fator Escala</label>
                <input
                  type="number"
                  value={form.scaleFactor}
                  onChange={(e) => setForm({ ...form, scaleFactor: parseFloat(e.target.value) || 1 })}
                  step="0.001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Intervalo de Polling (ms)</label>
                <input
                  type="number"
                  value={form.samplingIntervalMs}
                  onChange={(e) => setForm({ ...form, samplingIntervalMs: parseInt(e.target.value) || 1000 })}
                  min={100} max={60000} step={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Broker ID (opcional)</label>
                <input
                  type="text"
                  value={form.brokerId}
                  onChange={(e) => setForm({ ...form, brokerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="deixe em branco para broker ativo"
                />
              </div>
            </div>

            {createMutation.isError && (
              <p className="text-sm text-red-600">
                Erro: {createMutation.error instanceof Error ? createMutation.error.message : 'Falha ao criar registrador'}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Registers table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
        </div>
      ) : !registers || registers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ListChecks className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>Nenhum registrador configurado</p>
          <p className="text-sm mt-1">Adicione registradores para monitorar endereços Modbus</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Endereço</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Dado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Escala</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tópico MQTT</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Intervalo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {registers.map((reg) => (
                <tr key={reg.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{reg.name}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                      {registerTypeLabel[reg.registerType] ?? reg.registerType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-700">{reg.address}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {reg.dataType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 font-mono">{reg.scaleFactor}</td>
                  <td className="px-4 py-2.5 text-gray-500 font-mono text-xs max-w-[200px] truncate" title={reg.mqttTopic}>
                    {reg.mqttTopic}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{reg.samplingIntervalMs}ms</td>
                  <td className="px-4 py-2.5">
                    <span className={clsx(
                      'inline-block px-1.5 py-0.5 rounded text-xs font-medium',
                      reg.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {reg.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => {
                        if (confirm('Excluir registrador?')) {
                          deleteMutation.mutate(reg.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
