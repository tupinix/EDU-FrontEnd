import { ModbusConnections } from '../components/Modbus';
import { PageHeader } from '../components/ui/page-header';

export function ModbusPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Modbus TCP"
        description="Gateway Modbus TCP — conecte PLCs e CLPs ao pipeline do Unified Namespace"
      />
      <ModbusConnections />
    </div>
  );
}
