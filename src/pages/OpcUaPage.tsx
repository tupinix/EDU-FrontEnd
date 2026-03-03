import { OpcUaConnections } from '../components/OpcUa';
import { PageHeader } from '../components/ui/page-header';

export function OpcUaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="OPC-UA"
        description="Conecte servidores OPC-UA ao pipeline do Unified Namespace"
      />
      <OpcUaConnections />
    </div>
  );
}
