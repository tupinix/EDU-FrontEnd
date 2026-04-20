import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useCreateModbusConnection } from '../../hooks/useModbus';

export interface ModbusFormInitial {
  name?: string;
  host?: string;
  port?: number;
  unitId?: number;
  timeoutMs?: number;
}

interface ModbusFormProps {
  onClose: () => void;
  initialValues?: ModbusFormInitial;
}

export function ModbusForm({ onClose, initialValues }: ModbusFormProps) {
  const createMutation = useCreateModbusConnection();
  const [form, setForm] = useState({
    name: initialValues?.name ?? (initialValues?.host ? `Modbus ${initialValues.host}` : ''),
    host: initialValues?.host ?? '',
    port: initialValues?.port ?? 502,
    unitId: initialValues?.unitId ?? 1,
    timeoutMs: initialValues?.timeoutMs ?? 5000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await createMutation.mutateAsync(form); onClose(); } catch { /* handled */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-xl w-full max-w-lg">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">New Modbus Connection</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">Configure Modbus TCP device parameters</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name *"><input type="text" required placeholder="PLC Line 1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-clean" /></Field>
            <Field label="Host / IP *"><input type="text" required placeholder="192.168.1.100" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} className="input-clean font-mono" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="TCP Port *"><input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 502 })} min={1} max={65535} className="input-clean" /></Field>
            <Field label="Unit ID"><input type="number" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: parseInt(e.target.value) || 1 })} min={0} max={247} className="input-clean" /></Field>
            <Field label="Timeout (ms)"><input type="number" value={form.timeoutMs} onChange={(e) => setForm({ ...form, timeoutMs: parseInt(e.target.value) || 5000 })} min={100} max={30000} step={500} className="input-clean" /></Field>
          </div>
          {createMutation.isError && <p className="text-[13px] text-red-500">{createMutation.error instanceof Error ? createMutation.error.message : 'Failed to create connection'}</p>}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40">
              {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-gray-500">{label}</label>{children}</div>;
}
