import { EthernetIpConnections } from '../components/EthernetIp';

export function EthernetIpPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">EtherNet/IP</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">Allen-Bradley PLC connections via CIP protocol</p>
      </div>
      <EthernetIpConnections />
    </div>
  );
}
