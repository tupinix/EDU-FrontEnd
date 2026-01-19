import { useTranslation } from 'react-i18next';

const LEGEND_ITEMS = [
  { key: 'enterprise', color: '#059669' },
  { key: 'site', color: '#10b981' },
  { key: 'area', color: '#34d399' },
  { key: 'line', color: '#6ee7b7' },
  { key: 'cell', color: '#a7f3d0' },
  { key: 'device', color: '#d1fae5' },
];

export function GraphLegend() {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-3">
      <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">{t('discovery.legend')}</h4>
      <div className="space-y-1.5">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-300">
              {t(`discovery.levels.${item.key}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
