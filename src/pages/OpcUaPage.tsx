import { OpcUaConnections } from '../components/OpcUa';

export function OpcUaPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">OPC-UA</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">Connect OPC-UA servers to the Unified Namespace pipeline</p>
      </div>
      <OpcUaConnections />
    </div>
  );
}
