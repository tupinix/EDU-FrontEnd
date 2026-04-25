import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, Upload, Loader2, Check } from 'lucide-react';
import { useAuthStore } from '../../hooks/useStore';
import { licensesApi } from '../../services/api';
import type { LicenseStatus } from '../../types';

export function LicenseBanner() {
  const { editionMode } = useAuthStore();
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = () => {
    licensesApi.getStatus().then(setStatus).catch(() => {});
  };

  useEffect(() => {
    if (editionMode !== 'edge') return;
    fetchStatus();
  }, [editionMode]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const key = await file.text();
      const result = await licensesApi.uploadKey(key.trim());
      setUploadSuccess(true);
      setStatus(result);
      setTimeout(() => { setUploadSuccess(false); setDismissed(true); }, 2000);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Invalid license file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Only show in Edge edition
  if (editionMode !== 'edge' || !status || dismissed) return null;

  // Valid license, not trial — no banner needed
  if (status.valid && !status.trial) return null;

  const isTrial = status.trial;
  const isExpired = !status.valid && !status.trial;

  if (!isTrial && !isExpired) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] px-4 py-2.5 text-center text-[13px] font-medium flex items-center justify-center gap-3 ${
        isExpired ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900'
      }`}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />

      {isTrial && (
        <span>Trial mode — {status.trialDaysRemaining} days remaining.</span>
      )}
      {isExpired && <span>License expired.</span>}

      {/* Upload button */}
      <label className={`flex items-center gap-1.5 px-3 py-1 rounded-lg cursor-pointer transition-colors text-[12px] font-semibold ${
        isExpired
          ? 'bg-white/20 hover:bg-white/30 text-white'
          : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-900'
      }`}>
        {uploading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : uploadSuccess ? (
          <Check className="w-3 h-3" />
        ) : (
          <Upload className="w-3 h-3" />
        )}
        {uploadSuccess ? 'Activated!' : 'Upload license.key'}
        <input
          ref={fileInputRef}
          type="file"
          accept=".key,.txt"
          onChange={handleUpload}
          className="hidden"
        />
      </label>

      {uploadError && (
        <span className={`text-[11px] ${isExpired ? 'text-red-200' : 'text-red-700'}`}>
          {uploadError}
        </span>
      )}

      <span className="text-[11px] opacity-70">
        or visit{' '}
        <a href="https://espacodedadosunificado.com.br" target="_blank" rel="noopener noreferrer" className="underline">
          espacodedadosunificado.com.br
        </a>
      </span>

      <button
        onClick={() => setDismissed(true)}
        className={`ml-1 p-0.5 rounded hover:opacity-80 ${
          isExpired ? 'text-white/80' : 'text-amber-700'
        }`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
