import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Lock } from 'lucide-react';
import { useCreateOpcUaConnection, useUpdateOpcUaConnection } from '../../hooks/useOpcUa';

export interface OpcUaFormInitial {
  name?: string;
  endpointUrl?: string;
  securityMode?: string;
  username?: string;
  password?: string;
  machineId?: string;
  site?: string;
  area?: string;
  euromapEnabled?: boolean;
  statusNodeId?: string;
}

interface OpcUaFormProps {
  onClose: () => void;
  initialValues?: OpcUaFormInitial;
  // When set, edits an existing connection (PUT) instead of creating one.
  editId?: string;
}

const SECURITY_MODES = ['None', 'Sign', 'SignAndEncrypt'] as const;

function defaultName(endpoint: string | undefined): string {
  if (!endpoint) return '';
  const m = endpoint.match(/opc\.tcp:\/\/([^:/]+)/i);
  return m ? `OPC-UA ${m[1]}` : '';
}

export function OpcUaForm({ onClose, initialValues, editId }: OpcUaFormProps) {
  const { t } = useTranslation();
  const createMutation = useCreateOpcUaConnection();
  const updateMutation = useUpdateOpcUaConnection();
  const isEdit = !!editId;
  const mutation = isEdit ? updateMutation : createMutation;
  const [form, setForm] = useState({
    name: initialValues?.name ?? defaultName(initialValues?.endpointUrl),
    endpointUrl: initialValues?.endpointUrl ?? 'opc.tcp://',
    securityMode: initialValues?.securityMode ?? 'None',
    username: initialValues?.username ?? '',
    password: initialValues?.password ?? '',
    euromapEnabled: initialValues?.euromapEnabled ?? false,
    machineId: initialValues?.machineId ?? '',
    site: initialValues?.site ?? '',
    area: initialValues?.area ?? '',
    statusNodeId: initialValues?.statusNodeId ?? '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        // Send username/password verbatim: an emptied field means "clear the
        // credentials" (back to Anonymous), not "keep the old value".
        username: form.username,
        password: form.password,
        machineId: form.machineId || undefined,
        site: form.site || undefined,
        area: form.area || undefined,
        statusNodeId: form.statusNodeId || undefined,
      };
      if (isEdit) await updateMutation.mutateAsync({ id: editId!, ...payload });
      else await createMutation.mutateAsync(payload);
      onClose();
    } catch { /* handled */ }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{isEdit ? t('opcua.form.editTitle') : t('opcua.form.createTitle')}</h3>
        <button onClick={onClose} className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('opcua.form.name')}><input type="text" required placeholder="PLC Server #1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-clean" /></Field>
          <Field label={t('opcua.form.security')}>
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
        <Field label={t('opcua.form.endpointUrl')}><input type="text" required placeholder="opc.tcp://192.168.1.100:4840" value={form.endpointUrl} onChange={(e) => setForm({ ...form, endpointUrl: e.target.value })} className="input-clean font-mono" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('opcua.form.username')}><input type="text" placeholder="admin" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input-clean" /></Field>
          <Field label={t('opcua.form.password')}><input type="password" placeholder="••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-clean" /></Field>
        </div>
        {/* EUROMAP 77 (Columbus) */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">{t('opcua.form.euromapMachine')}</span>
            <button type="button" onClick={() => setForm({ ...form, euromapEnabled: !form.euromapEnabled })}
              className={`relative w-9 h-5 rounded-full transition-colors ${form.euromapEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.euromapEnabled ? 'translate-x-4' : ''}`} />
            </button>
          </label>
          {form.euromapEnabled && (
            <>
              <p className="text-[11px] text-gray-400">{t('opcua.form.euromapHint')}</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="machineId"><input type="text" placeholder="IMM-01" value={form.machineId} onChange={(e) => setForm({ ...form, machineId: e.target.value })} className="input-clean" /></Field>
                <Field label="site"><input type="text" placeholder="LBT" value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} className="input-clean" /></Field>
                <Field label="area"><input type="text" placeholder="IMM" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="input-clean" /></Field>
              </div>
              <Field label={t('opcua.form.statusNodeId')}><input type="text" placeholder="ns=6;s=..." value={form.statusNodeId} onChange={(e) => setForm({ ...form, statusNodeId: e.target.value })} className="input-clean font-mono" /></Field>
            </>
          )}
        </div>

        {mutation.isError && <p className="text-[13px] text-red-500">{mutation.error instanceof Error ? mutation.error.message : t('opcua.form.saveFailed')}</p>}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">{t('common.cancel')}</button>
          <button type="submit" disabled={mutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40">
            {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-gray-500">{label}</label>{children}</div>;
}
