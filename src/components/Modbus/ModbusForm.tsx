import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useCreateModbusConnection } from '../../hooks/useModbus';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface ModbusFormProps {
  onClose: () => void;
}

export function ModbusForm({ onClose }: ModbusFormProps) {
  const createMutation = useCreateModbusConnection();
  const [form, setForm] = useState({
    name: '',
    host: '',
    port: 502,
    unitId: 1,
    timeoutMs: 5000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        name: form.name,
        host: form.host,
        port: form.port,
        unitId: form.unitId,
        timeoutMs: form.timeoutMs,
      });
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Conexão Modbus TCP</DialogTitle>
          <DialogDescription>
            Configure os parâmetros de conexão com o dispositivo Modbus.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="PLC Linha 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="host">Host / IP</Label>
              <Input
                id="host"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="192.168.1.100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="port">Porta TCP</Label>
              <Input
                id="port"
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 502 })}
                min={1}
                max={65535}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitId">Unit ID (Slave)</Label>
              <Input
                id="unitId"
                type="number"
                value={form.unitId}
                onChange={(e) => setForm({ ...form, unitId: parseInt(e.target.value) || 1 })}
                min={0}
                max={247}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                value={form.timeoutMs}
                onChange={(e) => setForm({ ...form, timeoutMs: parseInt(e.target.value) || 5000 })}
                min={100}
                max={30000}
                step={500}
              />
            </div>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-destructive">
              Erro: {createMutation.error instanceof Error ? createMutation.error.message : 'Falha ao criar conexão'}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="gap-2">
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
