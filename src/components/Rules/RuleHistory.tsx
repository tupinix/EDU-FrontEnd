import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Rule } from '../../types';
import { useRuleExecutions } from '../../hooks/useRules';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';

interface Props {
  rule: Rule | null;
}

export function RuleHistory({ rule }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'pt' ? ptBR : undefined;

  const { data: executions = [], isLoading } = useRuleExecutions(rule?.id);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
        {rule ? t('rules.noExecutions') : t('rules.selectRule')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rule && (
        <p className="text-sm text-gray-500 mb-3">
          {t('rules.executionHistory')}: <span className="font-medium text-gray-700">{rule.name}</span>
        </p>
      )}
      {executions.map((exec) => {
        const allOk = exec.actionsExecuted.every((a) => a.success);
        return (
          <div
            key={exec.id}
            className={clsx(
              'flex items-start gap-3 p-3 rounded-lg border text-sm',
              allOk ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100',
            )}
          >
            <div className="mt-0.5">
              {allOk ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gray-700">
                  {exec.actionsExecuted.map((a) => a.type).join(', ')}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDistanceToNow(new Date(exec.triggeredAt), {
                    addSuffix: true,
                    locale,
                  })}
                </span>
              </div>

              {/* Condition values */}
              <div className="mt-1 flex flex-wrap gap-2">
                {Object.entries(exec.conditionValues).map(([topic, val]) => (
                  <span
                    key={topic}
                    className="text-xs bg-white/70 border border-gray-200 rounded px-1.5 py-0.5 font-mono"
                  >
                    {topic.split('/').pop()}: {String(val)}
                  </span>
                ))}
              </div>

              {/* Failed actions */}
              {exec.actionsExecuted.some((a) => !a.success) && (
                <div className="mt-1 text-xs text-red-600">
                  {exec.actionsExecuted
                    .filter((a) => !a.success)
                    .map((a) => `${a.type}: ${a.error}`)
                    .join(' | ')}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
