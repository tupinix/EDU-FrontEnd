import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, X, Bell, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { AlarmDefinition } from '../../types';
import { useAlarmDefinitions, useCreateAlarm, useUpdateAlarm, useDeleteAlarm } from '../../hooks/useAlarms';
import { CreateAlarmInput } from '../../services/api';
import { clsx } from 'clsx';

const EMPTY_FORM: CreateAlarmInput = {
  name: '',
  topic: '',
  conditionType: 'threshold',
  conditionConfig: { operator: '>', value: 0, deadband: 0 },
  priority: 'medium',
  enabled: true,
};

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
  info: 'bg-gray-100 text-gray-700',
};

export function AlarmConfig() {
  const { t } = useTranslation();
  const { data: definitions = [], isLoading } = useAlarmDefinitions();
  const createAlarm = useCreateAlarm();
  const updateAlarm = useUpdateAlarm();
  const deleteAlarm = useDeleteAlarm();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AlarmDefinition | null>(null);
  const [form, setForm] = useState<CreateAlarmInput>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (def: AlarmDefinition) => {
    setEditing(def);
    setForm({
      name: def.name,
      topic: def.topic,
      conditionType: def.conditionType,
      conditionConfig: def.conditionConfig,
      priority: def.priority,
      enabled: def.enabled,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.topic.trim()) return;
    if (editing) {
      await updateAlarm.mutateAsync({ id: editing.id, updates: form });
    } else {
      await createAlarm.mutateAsync(form);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    await deleteAlarm.mutateAsync(id);
    setDeleteConfirm(null);
  };

  const isThreshold = form.conditionType === 'threshold';
  const thresholdConfig = form.conditionConfig as { operator: string; value: number; deadband?: number };
  const badQualityConfig = form.conditionConfig as { timeoutSeconds: number };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{t('alarms.config.subtitle')}</p>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('alarms.config.new')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">{t('common.loading')}</div>
      ) : definitions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="font-medium text-gray-600">{t('alarms.config.noDefinitions')}</p>
          <p className="text-sm mt-1">{t('alarms.config.noDefinitionsHint')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {definitions.map((def) => (
            <div
              key={def.id}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={clsx(
                    'font-semibold text-sm',
                    def.enabled ? 'text-gray-900' : 'text-gray-400'
                  )}>
                    {def.name}
                  </span>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    PRIORITY_BADGE[def.priority]
                  )}>
                    {t(`alarms.priorities.${def.priority}`)}
                  </span>
                  {!def.enabled && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {t('alarms.config.disabled')}
                    </span>
                  )}
                  {def.currentState && def.currentState !== 'normal' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      {t(`alarms.states.${def.currentState}`)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="font-mono">{def.topic}</span>
                  <span>·</span>
                  <span>{t(`alarms.conditionTypes.${def.conditionType}`)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(def)}
                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title={t('common.edit')}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {deleteConfirm === def.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(def.id)}
                      disabled={deleteAlarm.isPending}
                      className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      {t('common.confirm')}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(def.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                {editing ? t('alarms.config.edit') : t('alarms.config.new')}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input w-full"
                  placeholder={t('alarms.config.namePlaceholder')}
                />
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('alarms.fields.topic')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="input w-full font-mono text-sm"
                  placeholder="factory/line1/sensor1"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('alarms.fields.priority')}
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as CreateAlarmInput['priority'] })}
                  className="input w-full"
                >
                  {(['critical', 'high', 'medium', 'low', 'info'] as const).map((p) => (
                    <option key={p} value={p}>{t(`alarms.priorities.${p}`)}</option>
                  ))}
                </select>
              </div>

              {/* Condition Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('alarms.fields.conditionType')}
                </label>
                <div className="flex gap-3">
                  {(['threshold', 'bad_quality'] as const).map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setForm({
                        ...form,
                        conditionType: ct,
                        conditionConfig: ct === 'threshold'
                          ? { operator: '>', value: 0, deadband: 0 }
                          : { timeoutSeconds: 60 },
                      })}
                      className={clsx(
                        'flex-1 py-2 rounded-lg border text-sm font-medium transition-colors',
                        form.conditionType === ct
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      {t(`alarms.conditionTypes.${ct}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Config */}
              {isThreshold ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('alarms.config.operator')}
                    </label>
                    <select
                      value={thresholdConfig.operator}
                      onChange={(e) => setForm({
                        ...form,
                        conditionConfig: { ...thresholdConfig, operator: e.target.value },
                      })}
                      className="input w-full"
                    >
                      {(['>', '<', '>=', '<='] as const).map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('alarms.config.threshold')}
                    </label>
                    <input
                      type="number"
                      value={thresholdConfig.value}
                      onChange={(e) => setForm({
                        ...form,
                        conditionConfig: { ...thresholdConfig, value: parseFloat(e.target.value) || 0 },
                      })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('alarms.config.deadband')}
                    </label>
                    <input
                      type="number"
                      value={thresholdConfig.deadband ?? 0}
                      onChange={(e) => setForm({
                        ...form,
                        conditionConfig: { ...thresholdConfig, deadband: parseFloat(e.target.value) || 0 },
                      })}
                      className="input w-full"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('alarms.config.timeoutSeconds')}
                  </label>
                  <input
                    type="number"
                    value={badQualityConfig.timeoutSeconds}
                    onChange={(e) => setForm({
                      ...form,
                      conditionConfig: { timeoutSeconds: parseInt(e.target.value) || 60 },
                    })}
                    className="input w-full"
                    min={5}
                  />
                </div>
              )}

              {/* Enabled toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('alarms.config.enabled')}</p>
                  <p className="text-xs text-gray-500">{t('alarms.config.enabledHint')}</p>
                </div>
                <button
                  onClick={() => setForm({ ...form, enabled: !form.enabled })}
                  className="text-primary-600 hover:text-primary-700"
                >
                  {form.enabled
                    ? <ToggleRight className="w-8 h-8" />
                    : <ToggleLeft className="w-8 h-8 text-gray-400" />
                  }
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={createAlarm.isPending || updateAlarm.isPending || !form.name.trim() || !form.topic.trim()}
                className="btn btn-primary"
              >
                {createAlarm.isPending || updateAlarm.isPending
                  ? t('common.saving')
                  : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
