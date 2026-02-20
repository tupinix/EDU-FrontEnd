import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Trash2, Pencil, ToggleLeft, ToggleRight, Clock, Zap } from 'lucide-react';
import { Rule } from '../../types';
import { useDeleteRule, useUpdateRule } from '../../hooks/useRules';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  rules: Rule[];
  isLoading: boolean;
  onEdit: (rule: Rule) => void;
  onViewHistory: (rule: Rule) => void;
}

export function RuleList({ rules, isLoading, onEdit, onViewHistory }: Props) {
  const { t, i18n } = useTranslation();
  const deleteRule = useDeleteRule();
  const updateRule = useUpdateRule();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const locale = i18n.language === 'pt' ? ptBR : undefined;

  const handleToggle = (rule: Rule) => {
    updateRule.mutate({ id: rule.id, updates: { enabled: !rule.enabled } });
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteRule.mutate(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Zap className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">{t('rules.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className={clsx(
            'border rounded-xl p-4 flex items-start justify-between gap-4 transition-colors',
            rule.enabled
              ? 'border-gray-200 bg-white hover:border-primary-200'
              : 'border-gray-100 bg-gray-50',
          )}
        >
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={clsx(
                  'inline-block w-2 h-2 rounded-full flex-shrink-0',
                  rule.enabled ? 'bg-emerald-500' : 'bg-gray-300',
                )}
              />
              <h3 className="font-semibold text-gray-900 truncate">{rule.name}</h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {rule.logic}
              </span>
            </div>

            {rule.description && (
              <p className="text-xs text-gray-500 mb-2 truncate">{rule.description}</p>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {rule.conditions.length} {t('rules.conditions')} → {rule.actions.length}{' '}
                {t('rules.actions')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t('rules.throttle')}: {rule.throttleSeconds}s
              </span>
              {rule.triggerCount > 0 && (
                <span className="font-medium text-emerald-600">
                  {t('rules.triggered')} {rule.triggerCount}×
                </span>
              )}
              {rule.lastTriggeredAt && (
                <span>
                  {t('rules.lastTrigger')}:{' '}
                  {formatDistanceToNow(new Date(rule.lastTriggeredAt), {
                    addSuffix: true,
                    locale,
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onViewHistory(rule)}
              title={t('rules.viewHistory')}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(rule)}
              title={t('common.edit')}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToggle(rule)}
              title={rule.enabled ? t('common.disable') : t('common.enable')}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                rule.enabled
                  ? 'text-emerald-500 hover:bg-emerald-50'
                  : 'text-gray-400 hover:bg-gray-100',
              )}
            >
              {rule.enabled ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => handleDelete(rule.id)}
              title={
                confirmDelete === rule.id ? t('common.confirmDelete') : t('common.delete')
              }
              className={clsx(
                'p-2 rounded-lg transition-colors',
                confirmDelete === rule.id
                  ? 'text-white bg-red-500 hover:bg-red-600'
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50',
              )}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
