import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, X, Save } from 'lucide-react';
import {
  Rule,
  RuleCondition,
  RuleAction,
  RuleLogic,
  RuleOperator,
  RuleActionType,
  CreateRuleInput,
} from '../../types';
import { useCreateRule, useUpdateRule } from '../../hooks/useRules';
import { clsx } from 'clsx';

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

const OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: '>',        label: '> maior que' },
  { value: '<',        label: '< menor que' },
  { value: '>=',       label: '>= maior ou igual' },
  { value: '<=',       label: '<= menor ou igual' },
  { value: '==',       label: '= igual a' },
  { value: '!=',       label: '≠ diferente de' },
  { value: 'contains', label: 'contém' },
  { value: 'between',  label: 'entre' },
];

const ACTION_TYPES: { value: RuleActionType; label: string }[] = [
  { value: 'log',          label: 'Log (registrar no servidor)' },
  { value: 'webhook',      label: 'Webhook (HTTP POST)' },
  { value: 'mqtt_publish', label: 'Publicar em tópico MQTT' },
  { value: 'alarm',        label: 'Disparar alarme' },
];

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

const emptyCondition = (): RuleCondition => ({
  topic: '',
  operator: '>',
  value: 0,
});

const emptyAction = (): RuleAction => ({
  type: 'log',
  config: {},
});

// -------------------------------------------------------
// Props
// -------------------------------------------------------

interface Props {
  rule?: Rule | null;
  onClose: () => void;
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------

export function RuleBuilder({ rule, onClose }: Props) {
  const { t } = useTranslation();
  const createRule = useCreateRule();
  const updateRule = useUpdateRule();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logic, setLogic] = useState<RuleLogic>('AND');
  const [throttle, setThrottle] = useState(60);
  const [enabled, setEnabled] = useState(true);
  const [conditions, setConditions] = useState<RuleCondition[]>([emptyCondition()]);
  const [actions, setActions] = useState<RuleAction[]>([emptyAction()]);
  const [error, setError] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description ?? '');
      setLogic(rule.logic);
      setThrottle(rule.throttleSeconds);
      setEnabled(rule.enabled);
      setConditions(rule.conditions.length ? rule.conditions : [emptyCondition()]);
      setActions(rule.actions.length ? rule.actions : [emptyAction()]);
    }
  }, [rule]);

  // ===================================================
  // Condition helpers
  // ===================================================

  const updateCondition = (i: number, patch: Partial<RuleCondition>) => {
    setConditions((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };

  const addCondition = () => setConditions((prev) => [...prev, emptyCondition()]);
  const removeCondition = (i: number) =>
    setConditions((prev) => prev.filter((_, idx) => idx !== i));

  // ===================================================
  // Action helpers
  // ===================================================

  const updateAction = (i: number, patch: Partial<RuleAction>) => {
    setActions((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  };

  const updateActionConfig = (i: number, key: string, val: string) => {
    setActions((prev) =>
      prev.map((a, idx) =>
        idx === i ? { ...a, config: { ...a.config, [key]: val } } : a,
      ),
    );
  };

  const addAction = () => setActions((prev) => [...prev, emptyAction()]);
  const removeAction = (i: number) =>
    setActions((prev) => prev.filter((_, idx) => idx !== i));

  // ===================================================
  // Submit
  // ===================================================

  const handleSubmit = async () => {
    setError('');

    if (!name.trim()) { setError('Nome obrigatório'); return; }
    if (conditions.some((c) => !c.topic.trim())) {
      setError('Todos os tópicos das condições são obrigatórios');
      return;
    }

    const input: CreateRuleInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      conditions,
      logic,
      actions,
      throttleSeconds: throttle,
      enabled,
    };

    try {
      if (rule) {
        await updateRule.mutateAsync({ id: rule.id, updates: input });
      } else {
        await createRule.mutateAsync(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar regra');
    }
  };

  const isPending = createRule.isPending || updateRule.isPending;

  // ===================================================
  // Render
  // ===================================================

  return (
    <div className="space-y-6">
      {/* ---- Basic Info ---- */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('rules.name')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ex: Pressão Alta Linha 2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('rules.description')}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Descrição opcional"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('rules.logic')}
            </label>
            <select
              value={logic}
              onChange={(e) => setLogic(e.target.value as RuleLogic)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="AND">AND — todas as condições</option>
              <option value="OR">OR — qualquer condição</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('rules.throttle')} (s)
            </label>
            <input
              type="number"
              min={0}
              max={86400}
              value={throttle}
              onChange={(e) => setThrottle(parseInt(e.target.value || '0', 10))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary-600"
              />
              <span className="text-sm font-medium text-gray-700">{t('rules.enabled')}</span>
            </label>
          </div>
        </div>
      </div>

      {/* ---- Conditions ---- */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800">{t('rules.conditions')}</h3>
          <button
            onClick={addCondition}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> {t('rules.addCondition')}
          </button>
        </div>
        <div className="space-y-2">
          {conditions.map((cond, i) => (
            <div
              key={i}
              className="flex items-end gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-0.5">{t('rules.topic')}</label>
                <input
                  type="text"
                  value={cond.topic}
                  onChange={(e) => updateCondition(i, { topic: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="plant/line/sensor"
                />
              </div>
              <div className="w-40">
                <label className="block text-xs text-gray-500 mb-0.5">{t('rules.operator')}</label>
                <select
                  value={cond.operator}
                  onChange={(e) => updateCondition(i, { operator: e.target.value as RuleOperator })}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-500 mb-0.5">{t('rules.value')}</label>
                <input
                  type={typeof cond.value === 'number' ? 'number' : 'text'}
                  value={String(cond.value)}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    updateCondition(i, {
                      value: isNaN(parsed) ? e.target.value : parsed,
                    });
                  }}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              {cond.operator === 'between' && (
                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-0.5">até</label>
                  <input
                    type="number"
                    value={cond.value2 ?? ''}
                    onChange={(e) =>
                      updateCondition(i, { value2: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              )}
              {conditions.length > 1 && (
                <button
                  onClick={() => removeCondition(i)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---- Actions ---- */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800">{t('rules.actions')}</h3>
          <button
            onClick={addAction}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> {t('rules.addAction')}
          </button>
        </div>
        <div className="space-y-2">
          {actions.map((action, i) => (
            <div
              key={i}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-0.5">Tipo de ação</label>
                  <select
                    value={action.type}
                    onChange={(e) =>
                      updateAction(i, { type: e.target.value as RuleActionType, config: {} })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {ACTION_TYPES.map((at) => (
                      <option key={at.value} value={at.value}>
                        {at.label}
                      </option>
                    ))}
                  </select>
                </div>
                {actions.length > 1 && (
                  <button
                    onClick={() => removeAction(i)}
                    className="mt-4 p-1.5 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Config per action type */}
              {action.type === 'webhook' && (
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/..."
                  value={(action.config.url as string) || ''}
                  onChange={(e) => updateActionConfig(i, 'url', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              )}
              {action.type === 'mqtt_publish' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tópico MQTT"
                    value={(action.config.topic as string) || ''}
                    onChange={(e) => updateActionConfig(i, 'topic', e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    placeholder="Payload (ex: 1)"
                    value={(action.config.payload as string) || ''}
                    onChange={(e) => updateActionConfig(i, 'payload', e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              )}
              {action.type === 'log' && (
                <input
                  type="text"
                  placeholder="Mensagem de log (opcional)"
                  value={(action.config.message as string) || ''}
                  onChange={(e) => updateActionConfig(i, 'message', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              )}
              {action.type === 'alarm' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nome do alarme"
                    value={(action.config.name as string) || ''}
                    onChange={(e) => updateActionConfig(i, 'name', e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <select
                    value={(action.config.priority as string) || 'medium'}
                    onChange={(e) => updateActionConfig(i, 'priority', e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="critical">Crítico</option>
                    <option value="high">Alto</option>
                    <option value="medium">Médio</option>
                    <option value="low">Baixo</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---- Error ---- */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* ---- Actions ---- */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          {t('common.cancel')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
            isPending
              ? 'bg-primary-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700',
          )}
        >
          <Save className="w-4 h-4" />
          {isPending ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  );
}
