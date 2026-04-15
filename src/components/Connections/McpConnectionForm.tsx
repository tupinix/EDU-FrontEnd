import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useCreateMcpToken } from '../../hooks/useMcpConnections';
import { McpTokenCreated } from '../../types';

interface McpConnectionFormProps {
  onClose: () => void;
  onCreated: (token: McpTokenCreated) => void;
}

const expiryOptions = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '365d', label: '1 year' },
];

export function McpConnectionForm({ onClose, onCreated }: McpConnectionFormProps) {
  const createMutation = useCreateMcpToken();
  const [form, setForm] = useState({ name: '', expiresIn: '365d' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createMutation.mutateAsync({ name: form.name, expiresIn: form.expiresIn });
      onCreated(result);
    } catch { /* handled by mutation */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">New Connection</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">Generate a token for Claude Desktop or other MCP clients</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-500">Connection Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Claude Desktop — John"
              required
              minLength={2}
              className="input-clean"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-500">Expiry</label>
            <div className="flex gap-2">
              {expiryOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, expiresIn: opt.value })}
                  className={`flex-1 py-2 text-[12px] font-medium rounded-lg border transition-colors ${
                    form.expiresIn === opt.value
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                      : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {createMutation.isError && (
            <p className="text-[13px] text-red-500">
              {createMutation.error instanceof Error ? createMutation.error.message : 'Failed to generate token'}
            </p>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40"
            >
              {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Generate Token
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
