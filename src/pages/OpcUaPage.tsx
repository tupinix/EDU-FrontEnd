import { useTranslation } from 'react-i18next';
import { OpcUaConnections } from '../components/OpcUa';

export function OpcUaPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{t('industrial.opcua.title')}</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">{t('industrial.opcua.subtitle')}</p>
      </div>
      <OpcUaConnections />
    </div>
  );
}
