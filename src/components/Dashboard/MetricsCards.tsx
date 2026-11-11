import { useTranslation } from 'react-i18next';

interface MetricsCardsProps {
  messagesPerDay: number;
  messagesPerMinute: number;
  totalTopics: number;
  errorRate: number;
  /** Messages per minute sampled while this page is open, oldest first. */
  perMinuteHistory?: number[];
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 24}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="mb-2 h-8 w-24 shrink-0" aria-hidden>
      <polyline points={points} fill="none" stroke="#12a8b7" strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Metric({ label, value, suffix, children }: { label: string; value: string; suffix?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white px-5 py-4 dark:bg-gray-900 sm:px-6 sm:py-5">
      <p className="text-[13px] text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-[26px] font-semibold tracking-tight text-gray-950 dark:text-gray-50 sm:text-[30px]">
          {value}
          {suffix && <span className="ml-0.5 text-[18px] font-medium text-gray-400">{suffix}</span>}
        </p>
        {children}
      </div>
    </div>
  );
}

export function MetricsCards({ messagesPerDay, messagesPerMinute, totalTopics, errorRate, perMinuteHistory = [] }: MetricsCardsProps) {
  const { t, i18n } = useTranslation();
  const fmt = (n: number) => n.toLocaleString(i18n.language);

  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200/80 bg-gray-100 dark:border-gray-800 dark:bg-gray-800 lg:grid-cols-4">
      <Metric label={t('dashboard.metrics.perMinute')} value={fmt(messagesPerMinute)}>
        {perMinuteHistory.length >= 3 && <Sparkline data={perMinuteHistory} />}
      </Metric>
      <Metric label={t('dashboard.metrics.perDay')} value={fmt(messagesPerDay)} />
      <Metric label={t('dashboard.metrics.topics')} value={fmt(totalTopics)} />
      <Metric label={t('dashboard.metrics.errorRate')} value={errorRate.toFixed(2)} suffix="%" />
    </section>
  );
}
