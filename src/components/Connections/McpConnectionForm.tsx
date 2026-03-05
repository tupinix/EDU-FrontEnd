import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useCreateMcpToken } from '../../hooks/useMcpConnections';
import { McpTokenCreated } from '../../types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface McpConnectionFormProps {
  onClose: () => void;
  onCreated: (token: McpTokenCreated) => void;
}

export function McpConnectionForm({ onClose, onCreated }: McpConnectionFormProps) {
  const createMutation = useCreateMcpToken();
  const [form, setForm] = useState({
    name: '',
    expiresIn: '365d',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createMutation.mutateAsync({
        name: form.name,
        expiresIn: form.expiresIn,
      });
      onCreated(result);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Conexão MCP</DialogTitle>
          <DialogDescription>
            Gere um token para conectar o Claude Desktop (ou outro cliente MCP) à plataforma EDU.
            O token será exibido apenas uma vez.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Conexão</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Claude Desktop - João"
              required
              minLength={2}
            />
            <p className="text-xs text-muted-foreground">
              Um nome descritivo para identificar esta conexão.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresIn">Validade</Label>
            <Select
              value={form.expiresIn}
              onValueChange={(value) => setForm({ ...form, expiresIn: value })}
            >
              <SelectTrigger id="expiresIn">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="365d">1 ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-destructive">
              Erro: {createMutation.error instanceof Error ? createMutation.error.message : 'Falha ao gerar token'}
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
              Gerar Token
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
