import { DataModelList } from '../components/DataModels';

export function DataModelsPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">Data Models</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">Transform and enrich MQTT data for the Unified Namespace</p>
      </div>
      <DataModelList />
    </div>
  );
}
