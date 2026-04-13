import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuthStore } from '../../hooks/useStore';
import { licensesApi } from '../../services/api';
import type { LicenseStatus } from '../../types';

export function LicenseBanner() {
  const { editionMode } = useAuthStore();
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (editionMode !== 'edge') return;

    licensesApi.getStatus()
      .then(setStatus)
      .catch(() => {
        // If endpoint not available, assume trial
      });
  }, [editionMode]);

  // Only show in Edge edition
  if (editionMode !== 'edge' || !status || dismissed) return null;

  // Valid license, not trial — no banner
  if (status.valid && !status.trial) return null;

  const isTrial = status.trial;
  const isExpired = !status.valid && !status.trial;

  if (!isTrial && !isExpired) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] px-4 py-2.5 text-center text-[13px] font-medium flex items-center justify-center gap-2 ${
        isExpired
          ? 'bg-red-500 text-white'
          : 'bg-amber-400 text-amber-900'
      }`}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      {isTrial && (
        <span>
          Trial mode — {status.trialDaysRemaining} days remaining.
          Get a license at{' '}
          <a
            href="https://edu.tupinix.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold"
          >
            edu.tupinix.com
          </a>
        </span>
      )}
      {isExpired && (
        <span>
          License expired. Contact{' '}
          <a
            href="https://edu.tupinix.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold"
          >
            edu.tupinix.com
          </a>
        </span>
      )}
      <button
        onClick={() => setDismissed(true)}
        className={`ml-2 p-0.5 rounded hover:opacity-80 transition-opacity ${
          isExpired ? 'text-white/80 hover:text-white' : 'text-amber-700 hover:text-amber-900'
        }`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
