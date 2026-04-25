import { McpConnections } from '../components/Connections';

export function ConnectionsPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">MCP Server</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
          Manage MCP tokens to let Claude Desktop and other AI assistants access your industrial data
        </p>
      </div>
      <McpConnections />
    </div>
  );
}
