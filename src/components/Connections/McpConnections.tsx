import { useState } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  Copy,
  Check,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { useMcpTokens, useDeleteMcpToken } from '../../hooks/useMcpConnections';
import { McpConnectionForm } from './McpConnectionForm';
import { McpTokenCreated } from '../../types';
import { cn } from '@/lib/utils';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function isExpired(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function getMcpEndpointUrl(): string {
  const mcpUrl = import.meta.env.VITE_MCP_URL;
  if (mcpUrl) return mcpUrl.replace(/\/+$/, '');
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    if (apiUrl.startsWith('/')) {
      const port = import.meta.env.VITE_BACKEND_PORT || '3005';
      return `${window.location.protocol}//${window.location.hostname}:${port}/mcp`;
    }
    return `${apiUrl.replace(/\/api\/?$/, '')}/mcp`;
  }
  return `${window.location.origin}/mcp`;
}

function getConnectorUrl(token: string): string {
  return `${getMcpEndpointUrl()}?token=${token.replace(/\s+/g, '')}`;
}

export function McpConnections() {
  const { data: tokens, isLoading, error } = useMcpTokens();
  const deleteMutation = useDeleteMcpToken();
  const [showForm, setShowForm] = useState(false);
  const [createdToken, setCreatedToken] = useState<McpTokenCreated | null>(null);
  const [copied, setCopied] = useState<'token' | 'config' | 'cli' | null>(null);
  const [showToken, setShowToken] = useState(false);

  const handleCopy = async (text: string, type: 'token' | 'config' | 'cli') => {
    try { await navigator.clipboard.writeText(text); }
    catch { /* fallback */ const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] text-red-500">
        Failed to load MCP connections: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-400">
          MCP tokens allow Claude Desktop to access your industrial data
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Connection
        </button>
      </div>

      {/* Form dialog */}
      {showForm && (
        <McpConnectionForm
          onClose={() => setShowForm(false)}
          onCreated={(token) => { setShowForm(false); setCreatedToken(token); setShowToken(false); }}
        />
      )}

      {/* Token reveal modal */}
      {createdToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setCreatedToken(null)} />
          <div className="relative bg-white rounded-2xl border border-gray-200/60 shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-gray-900">Token Created</h3>
                <button onClick={() => setCreatedToken(null)} className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[12px] text-gray-400 mt-1">Copy this token now — it won't be shown again.</p>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
              {/* MCP Server URL */}
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500">MCP Server URL</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3.5 py-2.5">
                    <code className="text-[11px] text-gray-600 font-mono break-all select-all leading-relaxed">
                      {showToken ? getConnectorUrl(createdToken.token) : `${getMcpEndpointUrl()}?token=${'•'.repeat(16)}`}
                    </code>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => setShowToken(!showToken)}
                      className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg transition-colors"
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopy(getConnectorUrl(createdToken.token), 'config')}
                      className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg transition-colors"
                    >
                      {copied === 'config' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Claude Code CLI */}
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500">Claude Code (terminal)</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3.5 py-2.5">
                    <code className="text-[10px] text-gray-600 font-mono break-all select-all leading-relaxed">
                      {showToken
                        ? `claude mcp add edu-platform --transport http ${getMcpEndpointUrl()} --header "Authorization:Bearer ${createdToken.token.replace(/^mcp_/, '')}"`
                        : `claude mcp add edu-platform --transport http ${getMcpEndpointUrl()} --header "Authorization:Bearer ${'•'.repeat(16)}"`}
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopy(
                      `claude mcp add edu-platform --transport http ${getMcpEndpointUrl()} --header "Authorization:Bearer ${createdToken.token.replace(/^mcp_/, '')}"`,
                      'cli'
                    )}
                    className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg transition-colors shrink-0"
                  >
                    {copied === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Raw token */}
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-400">Token (reference)</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3.5 py-2">
                    <code className="text-[10px] text-gray-400 font-mono break-all select-all">
                      {showToken ? createdToken.token : `${createdToken.token.slice(0, 10)}${'•'.repeat(24)}`}
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopy(createdToken.token, 'token')}
                    className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg transition-colors shrink-0"
                  >
                    {copied === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-[12px] text-amber-600">
                  <strong>Important:</strong> Store this URL securely — it contains the access token and won't be shown again.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setCreatedToken(null)}
                className="w-full py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token list */}
      {(!tokens || tokens.length === 0) ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 px-6 py-12 text-center">
          <p className="text-[14px] text-gray-400">No MCP connections configured</p>
          <p className="text-[12px] text-gray-300 mt-1">Create a connection to use Claude with your industrial data</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden divide-y divide-gray-50">
          {tokens.map((token) => {
            const expired = isExpired(token.expiresAt);
            return (
              <div key={token.id} className={cn('px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3', expired && 'opacity-50')}>
                {/* Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', expired ? 'bg-red-400' : 'bg-emerald-400')} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-gray-900">{token.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-[11px] text-gray-400 font-mono">{token.keyPrefix}...</span>
                      <span className={cn('text-[11px]', expired ? 'text-red-400' : 'text-gray-400')}>
                        {expired ? 'Expired' : `Expires ${formatDate(token.expiresAt)}`}
                      </span>
                      {token.lastUsedAt && (
                        <span className="text-[11px] text-gray-300">
                          Last used {formatDate(token.lastUsedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-4 sm:ml-0 shrink-0">
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded mr-1">
                    read-only
                  </span>
                  <button
                    onClick={() => {
                      if (confirm('Revoke this token? Existing connections will stop working.')) {
                        deleteMutation.mutate(token.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                    title="Revoke"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
