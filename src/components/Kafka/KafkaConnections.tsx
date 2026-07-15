import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Plug, Unplug, Trash2, Loader2, Pencil, Star, X, Gauge } from 'lucide-react';
import { kafkaApi } from '../../services/api';
import { KafkaConnector, KafkaConnectorInput, KafkaSecurityProtocol, KafkaConnectorDirection } from '../../types';
import { cn } from '@/lib/utils';

const statusDot: Record<string, string> = {
  connected: 'bg-emerald-400',
  connecting: 'bg-amber-400 animate-pulse',
  error: 'bg-red-400',
  disconnected: 'bg-gray-300',
};

const directionBadge: Record<string, string> = {
  producer: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  consumer: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  both: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
};

const emptyForm: KafkaConnectorInput = {
  name: '',
  bootstrapServers: '',
  securityProtocol: 'PLAINTEXT',
  direction: 'producer',
  saslMechanism: 'scram-sha-256',
  produceTopics: [],
  consumeTopics: [],
};

export function KafkaConnections() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: connectors, isLoading, error } = useQuery<KafkaConnector[], Error>({
    queryKey: ['kafka-connectors'],
    queryFn: kafkaApi.getConnectors,
    refetchInterval: 5000,
  });

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<KafkaConnectorInput>(emptyForm);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  const invalidate = () => qc.invalidateQueries({ queryKey: ['kafka-connectors'] });

  const createMut = useMutation({ mutationFn: kafkaApi.create, onSuccess: () => { invalidate(); closeForm(); } });
  const updateMut = useMutation({
    mutationFn: ({ id, ...u }: { id: string } & Partial<KafkaConnectorInput>) => kafkaApi.update(id, u),
    onSuccess: () => { invalidate(); closeForm(); },
  });
  const deleteMut = useMutation({ mutationFn: kafkaApi.remove, onSuccess: invalidate });
  const connectMut = useMutation({ mutationFn: kafkaApi.connect, onSuccess: invalidate });
  const disconnectMut = useMutation({ mutationFn: kafkaApi.disconnect, onSuccess: invalidate });
  const activateMut = useMutation({ mutationFn: kafkaApi.activate, onSuccess: invalidate });
  const testMut = useMutation({
    mutationFn: kafkaApi.test,
    onSuccess: (r, id) => setTestResult((p) => ({ ...p, [id]: r.ok ? `OK · ${r.latencyMs}ms` : (r.error ?? t('kafka.connections.testFailed')) })),
    onError: (e: Error, id) => setTestResult((p) => ({ ...p, [id]: e.message })),
  });

  function closeForm() { setShowForm(false); setEditId(null); setForm(emptyForm); }
  function openCreate() { setForm(emptyForm); setEditId(null); setShowForm(true); }
  function openEdit(c: KafkaConnector) {
    setEditId(c.id);
    setForm({
      name: c.name, bootstrapServers: c.bootstrapServers, securityProtocol: c.securityProtocol,
      saslMechanism: c.saslMechanism, saslUsername: c.saslUsername, direction: c.direction,
      consumerGroupId: c.consumerGroupId, produceTopics: c.produceTopics, consumeTopics: c.consumeTopics,
    });
    setShowForm(true);
  }
  function submit() {
    if (editId) updateMut.mutate({ id: editId, ...form });
    else createMut.mutate(form);
  }

  const isSasl = form.securityProtocol === 'SASL_PLAINTEXT' || form.securityProtocol === 'SASL_SSL';
  const isConsumer = form.direction === 'consumer' || form.direction === 'both';
  const saving = createMut.isPending || updateMut.isPending;

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>;
  if (error) return <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-3 text-[13px] text-red-500">{t('kafka.connections.loadError', { message: error.message })}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
          <Plus className="w-3.5 h-3.5" /> {t('kafka.connections.newConnector')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{editId ? t('kafka.form.editTitle') : t('kafka.form.createTitle')}</h3>
            <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('common.name')}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="redpanda-prod" className={inputCls} /></Field>
            <Field label={t('kafka.form.bootstrapServers')}><input value={form.bootstrapServers} onChange={(e) => setForm({ ...form, bootstrapServers: e.target.value })} placeholder="localhost:9092" className={inputCls} /></Field>
            <Field label={t('kafka.form.securityProtocol')}>
              <select value={form.securityProtocol} onChange={(e) => setForm({ ...form, securityProtocol: e.target.value as KafkaSecurityProtocol })} className={inputCls}>
                {(['PLAINTEXT', 'SASL_PLAINTEXT', 'SASL_SSL', 'SSL'] as const).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label={t('kafka.form.direction')}>
              <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as KafkaConnectorDirection })} className={inputCls}>
                {(['producer', 'consumer', 'both'] as const).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            {isSasl && (
              <>
                <Field label={t('kafka.form.saslMechanism')}>
                  <select value={form.saslMechanism} onChange={(e) => setForm({ ...form, saslMechanism: e.target.value as KafkaConnectorInput['saslMechanism'] })} className={inputCls}>
                    {(['plain', 'scram-sha-256', 'scram-sha-512'] as const).map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label={t('kafka.form.saslUsername')}><input value={form.saslUsername ?? ''} onChange={(e) => setForm({ ...form, saslUsername: e.target.value })} className={inputCls} /></Field>
                <Field label={t('kafka.form.saslPassword')}><input type="password" value={form.saslPassword ?? ''} onChange={(e) => setForm({ ...form, saslPassword: e.target.value })} placeholder={editId ? t('kafka.form.keepPassword') : ''} className={inputCls} /></Field>
              </>
            )}
            {isConsumer && (
              <Field label={t('kafka.form.consumerGroup')}><input value={form.consumerGroupId ?? ''} onChange={(e) => setForm({ ...form, consumerGroupId: e.target.value })} placeholder="edu-consumer" className={inputCls} /></Field>
            )}
            <Field label={t('kafka.form.produceTopics')}><input value={(form.produceTopics ?? []).join(',')} onChange={(e) => setForm({ ...form, produceTopics: csv(e.target.value) })} className={inputCls} /></Field>
            <Field label={t('kafka.form.consumeTopics')}><input value={(form.consumeTopics ?? []).join(',')} onChange={(e) => setForm({ ...form, consumeTopics: csv(e.target.value) })} className={inputCls} /></Field>
          </div>
          {(createMut.error || updateMut.error) && <p className="text-[12px] text-red-500">{(createMut.error || updateMut.error)?.message}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={closeForm} className="px-3.5 py-2 text-[13px] text-gray-500 hover:text-gray-700">{t('common.cancel')}</button>
            <button onClick={submit} disabled={saving || !form.name || !form.bootstrapServers} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl disabled:opacity-50">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {editId ? t('common.save') : t('kafka.form.create')}
            </button>
          </div>
        </div>
      )}

      {(!connectors || connectors.length === 0) ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-12 text-center">
          <p className="text-[14px] text-gray-400">{t('kafka.connections.empty')}</p>
          <p className="text-[12px] text-gray-300 mt-1">{t('kafka.connections.emptyHint')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/50">
          {connectors.map((c) => (
            <div key={c.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot[c.status])} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-medium', directionBadge[c.direction])}>{c.direction}</span>
                    {c.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-current" /> {t('kafka.connections.active')}</span>}
                  </div>
                  <p className="text-[12px] text-gray-400 font-mono truncate mt-0.5">{c.bootstrapServers}</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    {c.securityProtocol}{c.hasSaslPassword ? ` · SASL ${c.saslMechanism}` : ''} · {c.messageCount} msgs
                    {testResult[c.id] && <span className="ml-2 text-gray-400">· test: {testResult[c.id]}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4 sm:ml-0 shrink-0">
                <button onClick={() => testMut.mutate(c.id)} disabled={testMut.isPending} title={t('kafka.connections.testConnection')} className="px-2.5 py-1.5 text-[11px] font-medium text-gray-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1">
                  <Gauge className="w-3 h-3" /> {t('kafka.connections.test')}
                </button>
                {!c.isActive && <button onClick={() => activateMut.mutate(c.id)} title={t('kafka.connections.setActive')} className="p-2 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Star className="w-3.5 h-3.5" /></button>}
                {c.status === 'connected'
                  ? <button onClick={() => disconnectMut.mutate(c.id)} disabled={disconnectMut.isPending} title={t('kafka.connections.disconnect')} className="p-2 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Unplug className="w-3.5 h-3.5" /></button>
                  : <button onClick={() => connectMut.mutate(c.id)} disabled={connectMut.isPending} title={t('kafka.connections.connect')} className="p-2 rounded-lg text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">{connectMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />}</button>}
                <button onClick={() => openEdit(c)} title={t('common.edit')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm(t('kafka.connections.confirmDelete'))) deleteMut.mutate(c.id); }} disabled={deleteMut.isPending} title={t('common.delete')} className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
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

function csv(v: string): string[] {
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}
