import { useState } from 'react';
import { ArrowLeft, Activity, Search, Circle } from 'lucide-react';
import { useModbusLiveValues } from '../../hooks/useModbus';
import { useSocketStatus } from '../../hooks/useSocket';
import { ModbusConnection, ModbusLiveValue } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';

interface Props {
  connection: ModbusConnection;
  onBack: () => void;
}

function formatValue(value: number | boolean): string {
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/\.?0+$/, '');
  }
  return String(value);
}

function QualityBadge({ quality }: { quality: string }) {
  const variant = quality === 'good' ? 'success' : quality === 'uncertain' ? 'warning' : 'destructive';
  const label = quality === 'good' ? 'Boa' : quality === 'uncertain' ? 'Incerta' : 'Ruim';
  return (
    <Badge variant={variant} className="gap-1">
      <Circle className="h-1.5 w-1.5 fill-current" />
      {label}
    </Badge>
  );
}

export function ModbusMonitor({ connection, onBack }: Props) {
  const [search, setSearch] = useState('');
  const liveValues = useModbusLiveValues(connection.id);
  const { isConnected: wsConnected } = useSocketStatus();

  const filtered = liveValues.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.registerType.toLowerCase().includes(q) ||
      String(v.address).includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Monitor — {connection.name}</h3>
        <Badge variant={wsConnected ? 'success' : 'secondary'} className="ml-auto gap-1.5">
          <Circle className={cn('h-1.5 w-1.5 fill-current', wsConnected && 'animate-pulse')} />
          {wsConnected ? 'Ao vivo' : 'Desconectado'}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filtrar por nome, tipo ou endereço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {liveValues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum valor monitorado ainda.</p>
            <p className="text-xs mt-1">Conecte ao dispositivo e configure registradores para ver valores ao vivo aqui.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Raw</TableHead>
                <TableHead>Qualidade</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right w-[60px]">#</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <MonitorRow key={`${v.connectionId}::${v.registerId}`} value={v} />
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    Nenhum resultado para &quot;{search}&quot;
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-right">
        {filtered.length} de {liveValues.length} registrador(es)
      </p>
    </div>
  );
}

function MonitorRow({ value }: { value: ModbusLiveValue }) {
  const ts = value.timestamp
    ? (() => {
        const d = new Date(value.timestamp);
        const base = d.toLocaleTimeString('pt-BR', { hour12: false });
        const ms = String(d.getMilliseconds()).padStart(3, '0');
        return `${base}.${ms}`;
      })()
    : '—';

  return (
    <TableRow>
      <TableCell className="font-medium">{value.name}</TableCell>
      <TableCell>
        <Badge variant="secondary" className="font-mono text-[10px]">
          {value.registerType}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-muted-foreground">{value.address}</TableCell>
      <TableCell className="font-mono font-semibold">{formatValue(value.value)}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{value.rawValue}</TableCell>
      <TableCell>
        <QualityBadge quality={value.quality} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground font-mono">{ts}</TableCell>
      <TableCell className="text-right text-xs text-muted-foreground">{value.updateCount}</TableCell>
    </TableRow>
  );
}
