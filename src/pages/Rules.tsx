import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, History, Plus, Zap } from 'lucide-react';
import { RuleList, RuleBuilder, RuleHistory } from '../components/Rules';
import { useRules } from '../hooks/useRules';
import { Rule } from '../types';
import { clsx } from 'clsx';

type Tab = 'rules' | 'history' | 'new';

export function Rules() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('rules');
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [historyRule, setHistoryRule] = useState<Rule | null>(null);

  const { data: rules = [], isLoading } = useRules();

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setTab('new');
  };

  const handleViewHistory = (rule: Rule) => {
    setHistoryRule(rule);
    setTab('history');
  };

  const handleCloseBuilder = () => {
    setEditingRule(null);
    setTab('rules');
  };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'rules',   label: t('rules.title'),   icon: List,    count: rules.length },
    { id: 'history', label: t('rules.history'),  icon: History },
    { id: 'new',     label: editingRule ? t('rules.editRule') : t('rules.newRule'), icon: Plus },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-50 rounded-xl">
          <Zap className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('rules.pageTitle')}</h1>
          <p className="text-gray-500 text-sm">{t('rules.pageSubtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id !== 'new') setEditingRule(null);
                setTab(item.id);
              }}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                tab === item.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={clsx(
                    'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                    tab === item.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600',
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {tab === 'rules' && (
          <RuleList
            rules={rules}
            isLoading={isLoading}
            onEdit={handleEdit}
            onViewHistory={handleViewHistory}
          />
        )}

        {tab === 'history' && <RuleHistory rule={historyRule} />}

        {tab === 'new' && (
          <RuleBuilder rule={editingRule} onClose={handleCloseBuilder} />
        )}
      </div>
    </div>
  );
}
