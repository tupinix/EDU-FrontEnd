import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, X } from 'lucide-react';
import { AlarmEvent } from '../../types';
import { useAcknowledgeAlarm } from '../../hooks/useAlarms';

interface Props {
  event: AlarmEvent;
  onClose: () => void;
}

export function AlarmAcknowledge({ event, onClose }: Props) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const acknowledge = useAcknowledgeAlarm();
  const requireNotes = event.priority === 'critical';

  const handleConfirm = async () => {
    if (requireNotes && !notes.trim()) return;
    await acknowledge.mutateAsync({ id: event.id, notes: notes.trim() || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            {t('alarms.acknowledge')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-1">
          <p><span className="font-medium">{t('alarms.fields.alarm')}:</span> {event.alarmName}</p>
          <p><span className="font-medium">{t('alarms.fields.topic')}:</span> {event.topic}</p>
          {event.triggeredValue !== undefined && (
            <p><span className="font-medium">{t('alarms.fields.value')}:</span> {event.triggeredValue}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('alarms.fields.notes')}
            {requireNotes && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={requireNotes ? t('alarms.notesRequired') : t('alarms.notesOptional')}
            className="input w-full resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn btn-secondary">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={acknowledge.isPending || (requireNotes && !notes.trim())}
            className="btn btn-primary"
          >
            {acknowledge.isPending ? t('common.loading') : t('alarms.acknowledge')}
          </button>
        </div>
      </div>
    </div>
  );
}
