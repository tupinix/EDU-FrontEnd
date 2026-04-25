import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Loader2, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useModbusRegisters, useCreateModbusRegister, useDeleteModbusRegister } from '../../hooks/useModbus';
import { ModbusConnection, BrokerConfig } from '../../types';
import apiClient from '../../services/api';
import { cn } from '@/lib/utils';

interface Props { connection: ModbusConnection; onBack: () => void; }

const REGISTER_TYPES = ['holding', 'input', 'coil', 'discrete_input'] as const;
const DATA_TYPES = ['uint16', 'int16', 'int32', 'float32', 'boolean'] as const;

const regLabel: Record<string, string> = { holding: 'Holding (FC03)', input: 'Input (FC04)', coil: 'Coil (FC01)', discrete_input: 'Discrete (FC02)' };
const dtLabel: Record<string, string> = { uint16: 'UInt16', int16: 'Int16', int32: 'Int32', float32: 'Float32', boolean: 'Bool' };

const defaultForm = { name: '', registerType: 'holding' as (typeof REGISTER_TYPES)[number], address: 0, dataType: 'uint16' as (typeof DATA_TYPES)[number], scaleFactor: 1, mqttTopic: '', samplingIntervalMs: 1000, brokerId: '', enabled: true };

export function ModbusRegisterConfig({ connection, onBack }: Props) {
  const { data: registers, isLoading } = useModbusRegisters(connection.id);
  const createMutation = useCreateModbusRegister(connection.id);
  const deleteMutation = useDeleteModbusRegister(connection.id);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });

  const { data: brokersRaw } = useQuery<{ success: boolean; data?: BrokerConfig[] }>({
    queryKey: ['brokers-list-modal'],
    queryFn: async () => { const { data } = await apiClient.get('/brokers'); return data; },
    staleTime: 15000,
  });
  const brokers: BrokerConfig[] = brokersRaw?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brokerId) return;
    try { await createMutation.mutateAsync({ ...form }); setShowForm(false); setForm({ ...defaultForm }); } catch { /* handled */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">Registers — {connection.name}</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">{connection.host}:{connection.port}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[12px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
          <Plus className="w-3 h-3" /> Add Register
        </button>
      </div>

      {/* Add Register Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowForm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-xl w-full max-w-2xl">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">New Register</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name *"><input type="text" required placeholder="Motor Temperature" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-clean" /></Field>
                <Field label="MQTT Broker *">
                  {brokers.length === 0 ? (
                    <p className="text-[12px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">No brokers configured. Add one in MQTT Brokers.</p>
                  ) : (
                    <select value={form.brokerId} onChange={(e) => setForm({ ...form, brokerId: e.target.value })} className="input-clean" required>
                      <option value="">— Select a broker —</option>
                      {brokers.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.host}:{b.port}){b.status === 'connected' ? ' ✓' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              </div>
              <Field label="MQTT Topic *"><input type="text" required placeholder="Modbus/PLC1/Temperature" value={form.mqttTopic} onChange={(e) => setForm({ ...form, mqttTopic: e.target.value })} className="input-clean font-mono" /></Field>
              <div className="grid grid-cols-4 gap-3">
                <Field label="Register Type">
                  <select value={form.registerType} onChange={(e) => setForm({ ...form, registerType: e.target.value as typeof form.registerType })} className="input-clean">
                    {REGISTER_TYPES.map(t => <option key={t} value={t}>{regLabel[t]}</option>)}
                  </select>
                </Field>
                <Field label="Address"><input type="number" value={form.address} onChange={(e) => setForm({ ...form, address: parseInt(e.target.value) || 0 })} min={0} max={65535} className="input-clean" /></Field>
                <Field label="Data Type">
                  <select value={form.dataType} onChange={(e) => setForm({ ...form, dataType: e.target.value as typeof form.dataType })} disabled={form.registerType === 'coil' || form.registerType === 'discrete_input'} className="input-clean disabled:opacity-40">
                    {DATA_TYPES.map(t => <option key={t} value={t}>{dtLabel[t]}</option>)}
                  </select>
                </Field>
                <Field label="Scale"><input type="number" value={form.scaleFactor} onChange={(e) => setForm({ ...form, scaleFactor: parseFloat(e.target.value) || 1 })} step="0.001" className="input-clean" /></Field>
              </div>
              <Field label="Polling (ms)"><input type="number" value={form.samplingIntervalMs} onChange={(e) => setForm({ ...form, samplingIntervalMs: parseInt(e.target.value) || 1000 })} min={100} max={60000} step={100} className="input-clean" /></Field>
              {createMutation.isError && <p className="text-[13px] text-red-500">{createMutation.error instanceof Error ? createMutation.error.message : 'Error'}</p>}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[13px] font-medium text-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || !form.brokerId} className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40">
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
      ) : !registers || registers.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-12 text-center">
          <p className="text-[14px] text-gray-400">No registers configured</p>
          <p className="text-[12px] text-gray-300 mt-1">Add registers to monitor Modbus addresses</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-[11px] font-medium text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                <th className="text-left px-5 py-2.5">Name</th>
                <th className="text-left px-5 py-2.5">Type</th>
                <th className="text-left px-5 py-2.5">Addr</th>
                <th className="text-left px-5 py-2.5">Data</th>
                <th className="text-left px-5 py-2.5">Scale</th>
                <th className="text-left px-5 py-2.5">MQTT Topic</th>
                <th className="text-left px-5 py-2.5">Interval</th>
                <th className="text-left px-5 py-2.5">Status</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {registers.map(reg => (
                <tr key={reg.id} className="border-t border-gray-50 dark:border-gray-800/50">
                  <td className="px-5 py-2 font-medium text-gray-700 dark:text-gray-300">{reg.name}</td>
                  <td className="px-5 py-2"><span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded">{regLabel[reg.registerType] ?? reg.registerType}</span></td>
                  <td className="px-5 py-2 font-mono text-gray-400">{reg.address}</td>
                  <td className="px-5 py-2"><span className="text-[10px] font-mono text-gray-400">{reg.dataType}</span></td>
                  <td className="px-5 py-2 font-mono text-gray-400">{reg.scaleFactor}</td>
                  <td className="px-5 py-2 font-mono text-gray-400 max-w-[180px] truncate" title={reg.mqttTopic}>{reg.mqttTopic}</td>
                  <td className="px-5 py-2 text-gray-400">{reg.samplingIntervalMs}ms</td>
                  <td className="px-5 py-2">
                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', reg.enabled ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400')}>
                      {reg.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-2 text-right">
                    <button onClick={() => { if (confirm('Delete register?')) deleteMutation.mutate(reg.id); }} disabled={deleteMutation.isPending} className="p-1.5 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                      <Trash2 className="w-3 h-3" />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-gray-500">{label}</label>{children}</div>;
}
