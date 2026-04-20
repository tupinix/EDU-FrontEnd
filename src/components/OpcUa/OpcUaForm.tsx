import { useState } from 'react';
import { X, Loader2, Lock } from 'lucide-react';
import { useCreateOpcUaConnection } from '../../hooks/useOpcUa';

export interface OpcUaFormInitial {
  name?: string;
  endpointUrl?: string;
  securityMode?: string;
  username?: string;
  password?: string;
}

interface OpcUaFormProps {
  onClose: () => void;
  initialValues?: OpcUaFormInitial;
}

const SECURITY_MODES = ['None', 'Sign', 'SignAndEncrypt'] as const;

function defaultName(endpoint: string | undefined): string {
  if (!endpoint) return '';
  const m = endpoint.match(/opc\.tcp:\/\/([^:/]+)/i);
  return m ? `OPC-UA ${m[1]}` : '';
}

export function OpcUaForm({ onClose, initialValues }: OpcUaFormProps) {
  const createMutation = useCreateOpcUaConnection();
  const [form, setForm] = useState({
    name: initialValues?.name ?? defaultName(initialValues?.endpointUrl),
    endpointUrl: initialValues?.endpointUrl ?? 'opc.tcp://',
    securityMode: initialValues?.securityMode ?? 'None',
    username: initialValues?.username ?? '',
    password: initialValues?.password ?? '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ ...form, username: form.username || undefined, password: form.password || undefined });
      onClose();
    } catch { /* handled */ }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">New OPC-UA Connection</h3>
        <button onClick={onClose} className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name *"><input type="text" required placeholder="PLC Server #1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-clean" /></Field>
          <Field label="Security">
            <div className="flex gap-1.5">
              {SECURITY_MODES.map(m => (
                <button key={m} type="button" onClick={() => setForm({ ...form, securityMode: m })}
                  className={`flex-1 py-2 text-[11px] font-medium rounded-lg border transition-colors ${form.securityMode === m ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  {m === 'None' ? 'None' : m === 'Sign' ? <span className="flex items-center justify-center gap-1"><Lock className="w-3 h-3" />Sign</span> : <span className="flex items-center justify-center gap-1"><Lock className="w-3 h-3" />Encrypt</span>}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <Field label="Endpoint URL *"><input type="text" required placeholder="opc.tcp://192.168.1.100:4840" value={form.endpointUrl} onChange={(e) => setForm({ ...form, endpointUrl: e.target.value })} className="input-clean font-mono" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Username (optional)"><input type="text" placeholder="admin" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input-clean" /></Field>
          <Field label="Password (optional)"><input type="password" placeholder="••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-clean" /></Field>
        </div>
        {createMutation.isError && <p className="text-[13px] text-red-500">{createMutation.error instanceof Error ? createMutation.error.message : 'Failed to create connection'}</p>}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
          <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40">
            {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-gray-500">{label}</label>{children}</div>;
}
