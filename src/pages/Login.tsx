import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ArrowRight, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../hooks/useStore';
import { authApi } from '../services/api';
import { LanguageSelector } from '../components/LanguageSelector';
import { type EditionMode } from '../config/edition';

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
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E14] text-white relative overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 0.5px, transparent 0.5px),' +
            'linear-gradient(90deg, rgba(255,255,255,1) 0.5px, transparent 0.5px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent 80%)',
        }}
      />
      {/* Glows */}
      <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[140px] pointer-events-none" />

      {/* Top bar — back to site + language */}
      <div className="absolute top-5 left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[12px] text-gray-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          {t('auth.backToSite')}
        </Link>
      </div>
      <div className="absolute top-5 right-6 z-20">
        <LanguageSelector variant="minimal" />
      </div>

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-[420px] mx-4 transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="text-center mb-7">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="EDU Home"
            className="block mx-auto mb-7 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 transition-opacity hover:opacity-80"
          >
            <img
              src="/edu-logo.png"
              alt="EDU"
              className="h-12 w-auto select-none"
              draggable={false}
            />
          </button>
          <h1 className="text-[30px] font-semibold text-white tracking-tight leading-tight">
            {t('auth.loginTitle')}
          </h1>
          <p className="text-[14.5px] text-gray-400 mt-2 font-light">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Form card — white island on dark */}
        <div className="bg-white rounded-2xl border border-white/10 shadow-2xl shadow-emerald-500/10 overflow-hidden">
          {/* Edition toggle */}
          <div className="px-7 pt-6 pb-1">
            <span className="text-[10px] font-semibold text-gray-500 tracking-[0.18em] uppercase block mb-2.5">
              {t('auth.edition')}
            </span>
            <div className="flex rounded-xl bg-gray-100/80 p-1 gap-1">
              {([
                { mode: 'standard' as EditionMode, img: '/edu-cloud.png', alt: 'Cloud' },
                { mode: 'edge' as EditionMode, img: '/edu-edge.png', alt: 'Edge' },
              ]).map(({ mode, img, alt }) => {
                const isSelected = selectedEdition === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedEdition(mode)}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? 'bg-white shadow-sm'
                        : 'opacity-40 hover:opacity-70'
                    }`}
                  >
                    <img
                      src={img}
                      alt={alt}
                      className="h-5 w-auto select-none"
                      draggable={false}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-red-50 border border-red-100 text-[13px] text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[10.5px] font-semibold text-gray-500 tracking-[0.14em] uppercase">
                {t('common.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-[14.5px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none transition-all placeholder:text-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5"
                placeholder={t('auth.emailPlaceholder')}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-[10.5px] font-semibold text-gray-500 tracking-[0.14em] uppercase">
                {t('common.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 text-[14.5px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none transition-all placeholder:text-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5"
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
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
              className="group w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-[14px] font-semibold rounded-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-gray-300/50 hover:shadow-lg hover:-translate-y-0.5 disabled:translate-y-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {t('auth.loginTitle')}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-500 mt-7 tracking-[0.14em] uppercase font-mono">
          EDU Platform · v1.0
        </p>
      </div>

    </div>
  );
}
