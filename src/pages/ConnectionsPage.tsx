import { McpConnections } from '../components/Connections';
import { PageHeader } from '../components/ui/page-header';

export function ConnectionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Conexões"
        description="Gerencie conexões MCP para integrar assistentes de IA com a plataforma EDU"
      />
      <McpConnections />
    </div>
  );
}
