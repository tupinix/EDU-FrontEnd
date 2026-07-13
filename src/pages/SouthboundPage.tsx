import { SouthboundPanel } from '../components/Southbound';

export function SouthboundPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Southbound</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">Comandos IT → máquina (workorder, boxchange, receita) com arm/disarm e ACK/NACK</p>
      </div>
      <SouthboundPanel />
    </div>
  );
}
