import { useState, useEffect, useCallback, ReactNode } from 'react';
import { KeyRound, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { licensesApi } from '../services/api';

interface LicenseStatus {
  valid: boolean;
  reason?: string;
  plan?: string;
  edition?: string;
  customer?: string;
  expiresAt?: string;
  daysLeft?: number;
}

const REASON_TEXT: Record<string, string> = {
  missing: 'Nenhuma licença ativa. Cole a sua chave para liberar o EDU Edge.',
  expired: 'A sua licença expirou. Cole uma chave válida para continuar.',
  bad_signature: 'Chave de licença inválida.',
  wrong_edition: 'Esta licença não é para o EDU Edge.',
  no_public_key: 'Instalação sem chave pública de verificação. Contate o suporte.',
};

/**
 * Gates EDU Edge behind a valid license. On Cloud (or while the license is
 * valid) it just renders the app. When Edge is unlicensed it shows an
 * activation screen; the backend enforces the same rule on every API call.
 */
export function LicenseGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      const s = await licensesApi.getStatus();
      setStatus(s as LicenseStatus);
    } catch {
      // If the status endpoint itself fails, don't hard-block (fail open to the
      // normal app / login, where the backend gate still applies per request).
      setStatus({ valid: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  const activate = useCallback(async () => {
    if (!key.trim() || activating) return;
    setActivating(true);
    setError(null);
    try {
      await licensesApi.uploadKey(key.trim());
      await check();
    } catch (e: any) {
      setError(e?.response?.data?.error === 'expired' ? 'Licença expirada.' : 'Chave inválida. Confira e tente de novo.');
    } finally {
      setActivating(false);
    }
  }, [key, activating, check]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Not Edge, or already licensed → normal app.
  if (!status || status.edition !== 'edge' || status.valid) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Ativar o EDU Edge</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Instalação local licenciada</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          {REASON_TEXT[status.reason || 'missing'] || REASON_TEXT.missing}
        </p>

        <label className="mb-1 block text-xs font-medium text-gray-500">Chave de licença</label>
        <textarea
          value={key}
          onChange={(e) => setKey(e.target.value)}
          rows={4}
          placeholder="Cole aqui a chave que você recebeu ao se cadastrar"
          className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />

        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" /> {error}
          </p>
        )}

        <button
          onClick={activate}
          disabled={activating || !key.trim()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Ativar licença
        </button>

        <p className="mt-4 text-center text-[11px] text-gray-400">
          Não tem uma licença? Cadastre-se em espacodedadosunificado.com.br para receber a sua.
        </p>
      </div>
    </div>
  );
}
