interface MetricsCardsProps {
  messagesPerDay: number;
  messagesPerMinute: number;
  totalTopics: number;
  errorRate: number;
}

function Metric({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="px-5 py-4 sm:px-6 sm:py-5">
      <p className="text-[12px] sm:text-[13px] text-gray-400 font-medium">{label}</p>
      <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight mt-1">
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        {suffix && <span className="text-xs sm:text-sm font-normal text-gray-300 dark:text-gray-600 ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

export function MetricsCards({ messagesPerDay, messagesPerMinute, totalTopics, errorRate }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800 overflow-hidden">
      <Metric label="Messages / Day" value={messagesPerDay} />
      <Metric label="Messages / Min" value={messagesPerMinute} />
      <Metric label="Topics" value={totalTopics} />
      <Metric label="Error Rate" value={errorRate.toFixed(2)} suffix="%" />
    </div>
  );
}
