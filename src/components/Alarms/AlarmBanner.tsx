import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAlarmSummary } from '../../hooks/useAlarms';

export function AlarmBanner() {
  const navigate = useNavigate();
  const { data: summary } = useAlarmSummary();

  const urgent = (summary?.critical ?? 0) + (summary?.high ?? 0);
  const total = summary?.total ?? 0;

  if (total === 0) return null;

  return (
    <button
      onClick={() => navigate('/alarms')}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
      title={`${total} alarme(s) ativo(s)`}
    >
      <Bell className={`w-4 h-4 ${urgent > 0 ? 'text-red-600 animate-pulse' : 'text-yellow-600'}`} />
      <span className={`text-sm font-semibold ${urgent > 0 ? 'text-red-700' : 'text-yellow-700'}`}>
        {total}
      </span>
      {urgent > 0 && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
      )}
    </button>
  );
}
