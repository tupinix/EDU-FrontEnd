import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ArrowRight, Loader2, Server, Cpu } from 'lucide-react';
import { useAuthStore } from '../hooks/useStore';
import { authApi } from '../services/api';
import { LanguageSelector } from '../components/LanguageSelector';
import { editionLabels, type EditionMode } from '../config/edition';

export function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setAuth, setEditionMode, editionMode, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState<EditionMode>(editionMode);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);
      const user = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role as 'admin' | 'engineer' | 'viewer',
        tenantId: 'default',
        status: 'active' as const,
      };
      setEditionMode(selectedEdition);
      setAuth(user, response.token);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#f5f5f7] to-[#e8e8ed]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-emerald-50/40 to-transparent rounded-full blur-3xl" />

      {/* Language */}
      <div className="absolute top-5 right-6 z-20">
        <LanguageSelector variant="minimal" />
      </div>

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-[400px] mx-4 transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-950 mb-5">
            <span className="text-white font-bold text-lg tracking-tight">E</span>
          </div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">
            {t('auth.loginTitle')}
          </h1>
          <p className="text-[15px] text-gray-400 mt-1.5 font-normal">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm shadow-gray-100/50 overflow-hidden">
          {/* Edition toggle */}
          <div className="px-7 pt-7 pb-1">
            <div className="flex rounded-xl bg-gray-50 p-1 gap-1">
              {(Object.keys(editionLabels) as EditionMode[]).map((mode) => {
                const isSelected = selectedEdition === mode;
                const Icon = mode === 'standard' ? Server : Cpu;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedEdition(mode)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-400 hover:text-gray-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {editionLabels[mode].title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
            {/* Error */}
            {error && (
              <div className="text-[13px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[13px] font-medium text-gray-500">
                {t('common.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-[15px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none transition-all placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                placeholder={t('auth.emailPlaceholder')}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[13px] font-medium text-gray-500">
                {t('common.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-11 text-[15px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none transition-all placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-400 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white text-[15px] font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {t('auth.loginTitle')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Credentials hint */}
          <div className="px-7 pb-6">
            <div className="flex items-center justify-center gap-3 text-[12px] text-gray-300">
              <span>{t('auth.defaultCredentials')}:</span>
              <code className="text-gray-400 font-mono">admin@tupinix.com</code>
              <span className="text-gray-200">/</span>
              <code className="text-gray-400 font-mono">admin123</code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] text-gray-300 mt-6 tracking-wide">
          EDU Platform v1.0 &middot; Tupinix Engineering
        </p>
      </div>
    </div>
  );
}
