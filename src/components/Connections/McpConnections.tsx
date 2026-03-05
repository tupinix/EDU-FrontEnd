import { useState } from 'react';
import {
  Cable,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Eye,
  EyeOff,
  Globe,
  Terminal,
} from 'lucide-react';
import { useMcpTokens, useDeleteMcpToken } from '../../hooks/useMcpConnections';
import { McpConnectionForm } from './McpConnectionForm';
import { McpTokenCreated } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isExpired(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function getMcpEndpointUrl(): string {
  // If a public MCP URL is explicitly set (e.g. ngrok HTTPS tunnel), use it directly
  const mcpUrl = import.meta.env.VITE_MCP_URL;
  if (mcpUrl) {
    return mcpUrl.replace(/\/+$/, ''); // strip trailing slashes
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    if (apiUrl.startsWith('/')) {
      // Relative URL — need to resolve to actual backend, not frontend dev server
      // In dev mode with Vite proxy, the backend is on a different port
      const backendPort = import.meta.env.VITE_BACKEND_PORT || '3005';
      const host = window.location.hostname;
      const proto = window.location.protocol;
      return `${proto}//${host}:${backendPort}/mcp`;
    }
    // Absolute URL — strip /api suffix and append /mcp
    const base = apiUrl.replace(/\/api\/?$/, '');
    return `${base}/mcp`;
  }
  return `${window.location.origin}/mcp`;
}

function getConnectorUrl(token: string): string {
  const cleanToken = token.replace(/\s+/g, '');
  return `${getMcpEndpointUrl()}?token=${cleanToken}`;
}

export function McpConnections() {
  const { data: tokens, isLoading, error } = useMcpTokens();
  const deleteMutation = useDeleteMcpToken();
  const [showForm, setShowForm] = useState(false);
  const [createdToken, setCreatedToken] = useState<McpTokenCreated | null>(null);
  const [copied, setCopied] = useState<'token' | 'config' | null>(null);
  const [showToken, setShowToken] = useState(false);

  const handleCopy = async (text: string, type: 'token' | 'config') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-4 flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Erro ao carregar conexões MCP: {error.message}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Cable className="h-5 w-5 text-primary" />
          Conexões MCP
        </h3>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conexão
        </Button>
      </div>

      {/* Informational card */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p>
            O <strong>MCP (Model Context Protocol)</strong> permite conectar o{' '}
            <strong>Claude Desktop</strong> diretamente à plataforma EDU via connector remoto.
            Gere relatórios, consulte dados de MQTT, Modbus e OPC-UA pelo chat.
            Basta criar um token, copiar a URL e colar em{' '}
            <strong>Settings → MCP → Add custom connector</strong> no Claude Desktop.
          </p>
        </CardContent>
      </Card>

      {showForm && (
        <McpConnectionForm
          onClose={() => setShowForm(false)}
          onCreated={(token) => {
            setShowForm(false);
            setCreatedToken(token);
            setShowToken(false);
          }}
        />
      )}

      {/* Token reveal dialog — shown once after creation */}
      {createdToken && (
        <Dialog open onOpenChange={(open) => !open && setCreatedToken(null)}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                Token Gerado com Sucesso
              </DialogTitle>
              <DialogDescription>
                Copie o token abaixo. Ele <strong>não será exibido novamente</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
              {/* Full Connector URL — ready to paste */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-blue-500" />
                  URL do MCP Server
                </label>
                <p className="text-xs text-muted-foreground">
                  Use esta URL para conectar ao MCP server. Para o <strong>Claude Desktop (connector remoto)</strong>, é necessário HTTPS — use um túnel (ex: ngrok) e substitua o host:porta pela URL HTTPS do túnel.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 bg-muted p-2.5 rounded-md">
                    <code className="text-[11px] break-all font-mono select-all leading-relaxed">
                      {showToken ? getConnectorUrl(createdToken.token) : `${getMcpEndpointUrl()}?token=${'•'.repeat(20)}`}
                    </code>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowToken(!showToken)}
                      title={showToken ? 'Ocultar' : 'Mostrar'}
                    >
                      {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopy(getConnectorUrl(createdToken.token), 'config')}
                      title="Copiar URL completa"
                    >
                      {copied === 'config' ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Claude Code command */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-purple-500" />
                  Claude Code (via terminal)
                </label>
                <p className="text-xs text-muted-foreground">
                  Execute no terminal para adicionar como MCP server no Claude Code:
                </p>
                <div className="bg-muted p-2.5 rounded-md">
                  <code className="text-[10px] break-all font-mono select-all leading-relaxed">
                    {showToken
                      ? `claude mcp add edu-platform --transport http ${getMcpEndpointUrl()} --header "Authorization:Bearer ${createdToken.token.replace(/^mcp_/, '')}"`
                      : `claude mcp add edu-platform --transport http ${getMcpEndpointUrl()} --header "Authorization:Bearer ${'•'.repeat(20)}"`
                    }
                  </code>
                </div>
              </div>

              {/* Raw token for reference */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Token (referência)</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 bg-muted p-2 rounded-md">
                    <code className="text-[10px] break-all font-mono select-all leading-relaxed text-muted-foreground">
                      {showToken ? createdToken.token : `${createdToken.token.slice(0, 10)}${'•'.repeat(30)}`}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => handleCopy(createdToken.token, 'token')}
                    title="Copiar token"
                  >
                    {copied === 'token' ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 text-xs text-yellow-700 dark:text-yellow-400">
                <strong>Atenção:</strong> Guarde esta URL com segurança — ela contém o token de acesso. Ela <strong>não será exibida novamente</strong>.
              </div>
            </div>

            <DialogFooter className="flex-shrink-0">
              <Button onClick={() => setCreatedToken(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Token list */}
      {(!tokens || tokens.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Cable className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma conexão MCP configurada</p>
            <p className="text-sm mt-1">
              Crie uma conexão para começar a usar o Claude Desktop com seus dados industriais
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => {
            const expired = isExpired(token.expiresAt);
            return (
              <Card
                key={token.id}
                className={`hover:border-primary/30 transition-colors ${expired ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${expired ? 'bg-red-500' : 'bg-green-500'}`}
                      />
                      <div>
                        <p className="text-sm font-medium">{token.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Prefixo: <code className="font-mono">{token.keyPrefix}...</code>
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Criado: {formatDate(token.createdAt)}
                          </span>
                          <Badge
                            variant={expired ? 'destructive' : 'secondary'}
                            className="text-[10px]"
                          >
                            {expired ? 'Expirado' : `Expira: ${formatDate(token.expiresAt)}`}
                          </Badge>
                          {token.lastUsedAt && (
                            <span className="text-xs text-muted-foreground">
                              Último uso: {formatDate(token.lastUsedAt)}
                            </span>
                          )}
                        </div>
                        {token.createdBy && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Por: {token.createdBy}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        somente-leitura
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja revogar este token? Conexões usando-o deixarão de funcionar.')) {
                            deleteMutation.mutate(token.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        title="Revogar token"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
