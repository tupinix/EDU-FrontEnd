import { Cpu } from 'lucide-react';
import { ModbusConnections } from '../components/Modbus';

export function ModbusPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-50 rounded-xl">
          <Cpu className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modbus TCP</h1>
          <p className="text-gray-500 text-sm">
            Gateway Modbus TCP — conecte PLCs e CLPs ao pipeline do Unified Namespace
          </p>
        </div>
      </div>

      {/* Connections (manages register config and monitor as sub-views) */}
      <ModbusConnections />
    </div>
  );
}
