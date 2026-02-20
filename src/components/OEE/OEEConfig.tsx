import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, X, Gauge, ToggleLeft, ToggleRight, ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { OEEDefinition } from '../../types';
import { useOEEDefinitions, useCreateOEE, useUpdateOEE, useDeleteOEE } from '../../hooks/useOEE';
import { CreateOEEInput } from '../../services/api';

const EMPTY_FORM: CreateOEEInput = {
  name: '',
  statusTopic: '',
  statusRunningValue: '1',
  statusFormat: 'numeric',
  countTopic: '',
  idealCycleSeconds: 1.0,
  rejectTopic: '',
  plannedHoursPerDay: 8.0,
  enabled: true,
};

export function OEEConfig() {
  const { t } = useTranslation();
  const { data: definitions = [], isLoading } = useOEEDefinitions();
  const createOEE = useCreateOEE();
  const updateOEE = useUpdateOEE();
  const deleteOEE = useDeleteOEE();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<OEEDefinition | null>(null);
  const [form, setForm] = useState<CreateOEEInput>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showPerf, setShowPerf] = useState(false);
  const [showQuality, setShowQuality] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowPerf(false);
    setShowQuality(false);
    setShowModal(true);
  };

  const openEdit = (def: OEEDefinition) => {
    setEditing(def);
    setForm({
      name: def.name,
      statusTopic: def.statusTopic,
      statusRunningValue: def.statusRunningValue,
      statusFormat: def.statusFormat,
      countTopic: def.countTopic ?? '',
      idealCycleSeconds: def.idealCycleSeconds,
      rejectTopic: def.rejectTopic ?? '',
      plannedHoursPerDay: def.plannedHoursPerDay,
      enabled: def.enabled,
    });
    setShowPerf(!!def.countTopic);
    setShowQuality(!!def.rejectTopic);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.statusTopic.trim()) return;
    const payload: CreateOEEInput = {
      ...form,
      countTopic: showPerf && form.countTopic?.trim() ? form.countTopic.trim() : undefined,
      rejectTopic: showQuality && form.rejectTopic?.trim() ? form.rejectTopic.trim() : undefined,
    };
    if (editing) {
      await updateOEE.mutateAsync({ id: editing.id, updates: payload });
    } else {
      await createOEE.mutateAsync(payload);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    await deleteOEE.mutateAsync(id);
    setDeleteConfirm(null);
  };

  const isSaving = createOEE.isPending || updateOEE.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{t('oee.config.subtitle')}</p>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('oee.config.new')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500 text-sm">{t('common.loading')}</div>
      ) : definitions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Gauge className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('oee.config.noDefinitions')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['oee.config.col.name', 'oee.config.col.statusTopic', 'oee.config.col.format', 'oee.config.col.planned', 'common.status', 'common.actions'].map((k) => (
                  <th key={k} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {definitions.map((def) => (
                <tr key={def.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{def.name}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-300">{def.statusTopic}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {def.statusFormat === 'numeric' ? t('oee.config.numeric') : t('oee.config.string')}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{def.plannedHoursPerDay}h</td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      def.enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    )}>
                      {def.enabled ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(def)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title={t('common.edit')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {deleteConfirm === def.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(def.id)}
                            className="text-xs text-red-600 hover:underline font-medium"
                          >
                            {t('common.confirm')}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(def.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Gauge className="h-5 w-5 text-blue-500" />
                {editing ? t('oee.config.edit') : t('oee.config.new')}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('oee.config.field.name')} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input w-full"
                  placeholder={t('oee.config.field.namePlaceholder')}
                />
              </div>

              {/* Status section */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-1">
                  {t('oee.config.section.availability')}
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('oee.config.field.statusTopic')} *
                  </label>
                  <input
                    type="text"
                    value={form.statusTopic}
                    onChange={(e) => setForm({ ...form, statusTopic: e.target.value })}
                    className="input w-full font-mono text-sm"
                    placeholder="factory/machine1/status"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('oee.config.field.format')}
                    </label>
                    <select
                      value={form.statusFormat}
                      onChange={(e) => setForm({ ...form, statusFormat: e.target.value as 'numeric' | 'string' })}
                      className="input w-full"
                    >
                      <option value="numeric">{t('oee.config.numeric')}</option>
                      <option value="string">{t('oee.config.string')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('oee.config.field.runningValue')}
                    </label>
                    <input
                      type="text"
                      value={form.statusRunningValue}
                      onChange={(e) => setForm({ ...form, statusRunningValue: e.target.value })}
                      className="input w-full"
                      placeholder={form.statusFormat === 'numeric' ? '1' : 'running'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('oee.config.field.plannedHours')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    step={0.5}
                    value={form.plannedHoursPerDay}
                    onChange={(e) => setForm({ ...form, plannedHoursPerDay: parseFloat(e.target.value) || 8 })}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Performance section (collapsible) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPerf(!showPerf)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 w-full border-b border-gray-200 dark:border-gray-700 pb-1"
                >
                  {showPerf ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {t('oee.config.section.performance')}
                  <span className="text-xs text-gray-400 font-normal ml-1">{t('oee.config.optional')}</span>
                </button>
                {showPerf && (
                  <div className="pt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('oee.config.field.countTopic')}
                      </label>
                      <input
                        type="text"
                        value={form.countTopic ?? ''}
                        onChange={(e) => setForm({ ...form, countTopic: e.target.value })}
                        className="input w-full font-mono text-sm"
                        placeholder="factory/machine1/parts"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('oee.config.field.idealCycle')} (s)
                      </label>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={form.idealCycleSeconds}
                        onChange={(e) => setForm({ ...form, idealCycleSeconds: parseFloat(e.target.value) || 1 })}
                        className="input w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Quality section (collapsible) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowQuality(!showQuality)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 w-full border-b border-gray-200 dark:border-gray-700 pb-1"
                >
                  {showQuality ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {t('oee.config.section.quality')}
                  <span className="text-xs text-gray-400 font-normal ml-1">{t('oee.config.optional')}</span>
                </button>
                {showQuality && (
                  <div className="pt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('oee.config.field.rejectTopic')}
                    </label>
                    <input
                      type="text"
                      value={form.rejectTopic ?? ''}
                      onChange={(e) => setForm({ ...form, rejectTopic: e.target.value })}
                      className="input w-full font-mono text-sm"
                      placeholder="factory/machine1/rejects"
                    />
                  </div>
                )}
              </div>

              {/* Enabled toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('oee.config.field.enabled')}</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, enabled: !form.enabled })}
                  className={clsx('transition-colors', form.enabled ? 'text-green-600' : 'text-gray-400')}
                >
                  {form.enabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.statusTopic.trim() || isSaving}
                className="btn btn-primary"
              >
                {isSaving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
