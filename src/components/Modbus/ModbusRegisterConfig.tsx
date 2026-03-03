import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Loader2, ListChecks, Save } from 'lucide-react';
import { useModbusRegisters, useCreateModbusRegister, useDeleteModbusRegister } from '../../hooks/useModbus';
import { ModbusConnection } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';
import { cn } from '@/lib/utils';

interface Props {
  connection: ModbusConnection;
  onBack: () => void;
}

const REGISTER_TYPES = ['holding', 'input', 'coil', 'discrete_input'] as const;
const DATA_TYPES = ['uint16', 'int16', 'int32', 'float32', 'boolean'] as const;

const registerTypeLabel: Record<string, string> = {
  holding: 'Holding (FC03)',
  input: 'Input (FC04)',
  coil: 'Coil (FC01)',
  discrete_input: 'Discrete Input (FC02)',
};

const dataTypeLabel: Record<string, string> = {
  uint16: 'UInt16 (0–65535)',
  int16: 'Int16 (-32768–32767)',
  int32: 'Int32 / DINT (±2 bilhões)',
  float32: 'Float32 (IEEE 754)',
  boolean: 'Boolean',
};

const defaultForm = {
  name: '',
  registerType: 'holding' as (typeof REGISTER_TYPES)[number],
  address: 0,
  dataType: 'uint16' as (typeof DATA_TYPES)[number],
  scaleFactor: 1,
  mqttTopic: '',
  samplingIntervalMs: 1000,
  brokerId: '',
  enabled: true,
};

export function ModbusRegisterConfig({ connection, onBack }: Props) {
  const { data: registers, isLoading } = useModbusRegisters(connection.id);
  const createMutation = useCreateModbusRegister(connection.id);
  const deleteMutation = useDeleteModbusRegister(connection.id);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        name: form.name,
        registerType: form.registerType,
        address: form.address,
        dataType: form.dataType,
        scaleFactor: form.scaleFactor,
        mqttTopic: form.mqttTopic,
        samplingIntervalMs: form.samplingIntervalMs,
        brokerId: form.brokerId || undefined,
        enabled: form.enabled,
      });
      setShowForm(false);
      setForm({ ...defaultForm });
    } catch {
      // handled by mutation
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <ListChecks className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Registradores — {connection.name}</h3>
        <Button onClick={() => setShowForm(true)} className="ml-auto gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {/* Add Register Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Registrador</DialogTitle>
            <DialogDescription>
              Configure um registrador Modbus para monitoramento.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Nome</Label>
                <Input
                  id="reg-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Temperatura Motor"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-mqtt">Tópico MQTT</Label>
                <Input
                  id="reg-mqtt"
                  value={form.mqttTopic}
                  onChange={(e) => setForm({ ...form, mqttTopic: e.target.value })}
                  placeholder="Modbus/PLC1/Temperature"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Registro</Label>
                <Select
                  value={form.registerType}
                  onValueChange={(v) => setForm({ ...form, registerType: v as typeof form.registerType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGISTER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {registerTypeLabel[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-addr">Endereço</Label>
                <Input
                  id="reg-addr"
                  type="number"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: parseInt(e.target.value) || 0 })}
                  min={0}
                  max={65535}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Dado</Label>
                <Select
                  value={form.dataType}
                  onValueChange={(v) => setForm({ ...form, dataType: v as typeof form.dataType })}
                  disabled={form.registerType === 'coil' || form.registerType === 'discrete_input'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {dataTypeLabel[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-scale">Fator Escala</Label>
                <Input
                  id="reg-scale"
                  type="number"
                  value={form.scaleFactor}
                  onChange={(e) => setForm({ ...form, scaleFactor: parseFloat(e.target.value) || 1 })}
                  step="0.001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reg-interval">Intervalo de Polling (ms)</Label>
                <Input
                  id="reg-interval"
                  type="number"
                  value={form.samplingIntervalMs}
                  onChange={(e) => setForm({ ...form, samplingIntervalMs: parseInt(e.target.value) || 1000 })}
                  min={100}
                  max={60000}
                  step={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-broker">Broker ID (opcional)</Label>
                <Input
                  id="reg-broker"
                  value={form.brokerId}
                  onChange={(e) => setForm({ ...form, brokerId: e.target.value })}
                  placeholder="deixe em branco para broker ativo"
                />
              </div>
            </div>

            {createMutation.isError && (
              <p className="text-sm text-destructive">
                Erro: {createMutation.error instanceof Error ? createMutation.error.message : 'Falha ao criar registrador'}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Registers table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !registers || registers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ListChecks className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum registrador configurado</p>
            <p className="text-sm mt-1">Adicione registradores para monitorar endereços Modbus</p>
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
                <TableHead>Dado</TableHead>
                <TableHead>Escala</TableHead>
                <TableHead>Tópico MQTT</TableHead>
                <TableHead>Intervalo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {registers.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-medium">{reg.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {registerTypeLabel[reg.registerType] ?? reg.registerType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{reg.address}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {reg.dataType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{reg.scaleFactor}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate" title={reg.mqttTopic}>
                    {reg.mqttTopic}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{reg.samplingIntervalMs}ms</TableCell>
                  <TableCell>
                    <Badge variant={reg.enabled ? 'success' : 'secondary'}>
                      {reg.enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Excluir registrador?')) {
                          deleteMutation.mutate(reg.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
