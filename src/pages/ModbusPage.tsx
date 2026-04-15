import { ModbusConnections } from '../components/Modbus';

export function ModbusPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Modbus TCP</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">Connect PLCs to the Unified Namespace pipeline</p>
      </div>
      <ModbusConnections />
    </div>
  );
}
