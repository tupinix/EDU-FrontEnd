import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Play, X, Pencil, Loader2 } from 'lucide-react';
import { virtualSensorsApi } from '../services/api';
import { VirtualSensor, VirtualSensorInput, VirtualSensorInputForm } from '../types';
import { cn } from '@/lib/utils';

const emptyForm: VirtualSensorInputForm = {
  name: '',
  outputTopic: '',
  expression: '',
  inputs: [{ var: 'a', topic: '', field: 'value' }],
  unit: '',
  intervalMs: 5000,
  enabled: true,
};

export function VirtualSensorsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: sensors, isLoading, error } = useQuery<VirtualSensor[], Error>({
    queryKey: ['virtual-sensors'],
    queryFn: virtualSensorsApi.list,
    refetchInterval: 5000,
  });

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<VirtualSensorInputForm>(emptyForm);
  const [testResult, setTestResult] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['virtual-sensors'] });
  const createMut = useMutation({
    mutationFn: (f: VirtualSensorInputForm) => (editId ? virtualSensorsApi.update(editId, f) : virtualSensorsApi.create(f)),
    onSuccess: () => { invalidate(); closeForm(); },
  });
  const deleteMut = useMutation({ mutationFn: virtualSensorsApi.remove, onSuccess: invalidate });

  function closeForm() { setShowForm(false); setEditId(null); setForm(emptyForm); setTestResult(null); }
  function openCreate() { setForm({ ...emptyForm, inputs: [{ var: 'a', topic: '', field: 'value' }] }); setEditId(null); setTestResult(null); setShowForm(true); }
  function openEdit(s: VirtualSensor) {
    setEditId(s.id);
    setForm({ name: s.name, outputTopic: s.outputTopic, expression: s.expression, inputs: s.inputs.length ? s.inputs : [{ var: 'a', topic: '', field: 'value' }], unit: s.unit ?? '', intervalMs: s.intervalMs, enabled: s.enabled });
    setTestResult(null); setShowForm(true);
  }

  async function runTest() {
    try {
      const scope: Record<string, number> = {};
      form.inputs.forEach((i) => { if (i.var) scope[i.var] = 1; });
      const r = await virtualSensorsApi.test(form.expression, scope);
      setTestResult(t('virtualSensors.form.testOk', { result: r.result }));
    } catch (e) { setTestResult(e instanceof Error ? e.message : t('virtualSensors.form.invalidExpression')); }
  }

  const setInput = (idx: number, patch: Partial<VirtualSensorInput>) =>
    setForm({ ...form, inputs: form.inputs.map((i, k) => (k === idx ? { ...i, ...patch } : i)) });
  const addInput = () => setForm({ ...form, inputs: [...form.inputs, { var: nextVar(form.inputs), topic: '', field: 'value' }] });
  const removeInput = (idx: number) => setForm({ ...form, inputs: form.inputs.filter((_, k) => k !== idx) });
  const saving = createMut.isPending;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{t('virtualSensors.title')}</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">{t('virtualSensors.subtitle')}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
            <Plus className="w-3.5 h-3.5" /> {t('virtualSensors.newSensor')}
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{editId ? t('virtualSensors.form.editTitle') : t('virtualSensors.form.createTitle')}</h3>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('common.name')}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="OEE Linha 1" className={inputCls} /></Field>
              <Field label={t('virtualSensors.form.outputTopic')}><input value={form.outputTopic} onChange={(e) => setForm({ ...form, outputTopic: e.target.value })} placeholder="virtual/oee" className={cn(inputCls, 'font-mono')} /></Field>
              <Field label={t('virtualSensors.form.expression')}><input value={form.expression} onChange={(e) => setForm({ ...form, expression: e.target.value })} placeholder="a * b / 100" className={cn(inputCls, 'font-mono')} /></Field>
              <Field label={t('virtualSensors.form.unit')}><input value={form.unit ?? ''} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="%" className={inputCls} /></Field>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{t('virtualSensors.form.inputs')}</span>
                <button onClick={addInput} className="text-[12px] text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"><Plus className="w-3 h-3" /> {t('virtualSensors.form.addInput')}</button>
              </div>
              <div className="space-y-2">
                {form.inputs.map((i, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input value={i.var} onChange={(e) => setInput(idx, { var: e.target.value })} placeholder="a" className={cn(inputCls, 'w-16 text-center')} />
                    <span className="text-gray-300">=</span>
                    <input value={i.topic} onChange={(e) => setInput(idx, { topic: e.target.value })} placeholder="machines/l1/oee_avail" className={cn(inputCls, 'flex-1 font-mono')} />
                    <input value={i.field ?? ''} onChange={(e) => setInput(idx, { field: e.target.value || undefined })} placeholder="value" className={cn(inputCls, 'w-24')} />
                    <button onClick={() => removeInput(idx)} className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('virtualSensors.form.interval')}><input type="number" min={1000} value={form.intervalMs} onChange={(e) => setForm({ ...form, intervalMs: Number(e.target.value) })} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-gray-300 self-end pb-2">
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> {t('common.active')}
              </label>
            </div>

            {testResult && <p className={cn('text-[12px]', testResult.startsWith('OK') ? 'text-emerald-500' : 'text-red-500')}>{testResult}</p>}
            {createMut.error && <p className="text-[12px] text-red-500">{createMut.error.message}</p>}

            <div className="flex justify-end gap-2">
              <button onClick={runTest} className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><Play className="w-3.5 h-3.5" /> {t('virtualSensors.form.test')}</button>
              <button onClick={closeForm} className="px-3.5 py-2 text-[13px] text-gray-500 hover:text-gray-700">{t('common.cancel')}</button>
              <button onClick={() => createMut.mutate(form)} disabled={saving || !form.name || !form.expression || !form.outputTopic} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl disabled:opacity-50">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {editId ? t('common.save') : t('virtualSensors.form.create')}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-3 text-[13px] text-red-500">{t('virtualSensors.loadError', { message: error.message })}</div>
        ) : !sensors || sensors.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-12 text-center">
            <p className="text-[14px] text-gray-400">{t('virtualSensors.empty')}</p>
            <p className="text-[12px] text-gray-300 mt-1">{t('virtualSensors.emptyHint')} <span className="font-mono">OEE = a * b / 100</span></p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/50">
            {sensors.map((s) => (
              <div key={s.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', s.status?.lastError ? 'bg-red-400' : s.enabled ? 'bg-emerald-400' : 'bg-gray-300')} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100">{s.name}</p>
                      {!s.enabled && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-gray-100 text-gray-400 dark:bg-gray-800">{t('virtualSensors.paused')}</span>}
                    </div>
                    <p className="text-[12px] text-gray-400 font-mono truncate mt-0.5">{s.expression} → {s.outputTopic}</p>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      {s.inputs.map((i) => `${i.var}=${i.topic}`).join(' · ') || t('virtualSensors.noInputs')} · {t('virtualSensors.every', { seconds: s.intervalMs / 1000 })}
                      {s.status?.lastError
                        ? <span className="ml-1 text-red-400">· {s.status.lastError}</span>
                        : s.status?.lastValue != null && <span className="ml-1 text-gray-400">· {t('virtualSensors.lastValue')} {s.status.lastValue}{s.unit ? ` ${s.unit}` : ''}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4 sm:ml-0 shrink-0">
                  <button onClick={() => openEdit(s)} title={t('common.edit')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (confirm(t('virtualSensors.confirmDelete'))) deleteMut.mutate(s.id); }} disabled={deleteMut.isPending} title={t('common.delete')} className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function nextVar(inputs: VirtualSensorInput[]): string {
  const used = new Set(inputs.map((i) => i.var));
  for (let c = 97; c < 123; c++) { const v = String.fromCharCode(c); if (!used.has(v)) return v; }
  return `v${inputs.length}`;
}
