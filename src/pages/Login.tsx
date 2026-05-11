import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ArrowRight, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../hooks/useStore';
import { useTenant } from '../hooks/useTenant';
import { authApi } from '../services/api';
import { LanguageSelector } from '../components/LanguageSelector';

type ProductView = 'cloud' | 'edge';

const ROOT_DOMAIN = 'espacodedadosunificado.com.br';

/**
 * Decide whether the post-login flow should redirect to the tenant's
 * subdomain. We only redirect when:
 *   - We're on production-style hosts ending in espacodedadosunificado.com.br
 *   - The current hostname is NOT already the tenant subdomain
 * Local/preview/dev hosts (localhost, IPs, *.vercel.app preview URLs)
 * stay where they are — keeps developer flow simple.
 */
function shouldRedirectToTenantHost(tenantSubdomain: string): boolean {
  const host = window.location.hostname.toLowerCase();
  if (!host.endsWith(ROOT_DOMAIN)) return false;
  const target = `${tenantSubdomain}.${ROOT_DOMAIN}`;
  return host !== target;
}

export function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setAuth, isAuthenticated } = useAuthStore();
  const { isTenantSubdomain } = useTenant();

  const [view, setView] = useState<ProductView>('cloud');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

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
      const tenant = response.user.tenant ?? null;
      const user = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role as 'admin' | 'engineer' | 'viewer',
        tenantId: tenant?.id ?? 'default',
        status: 'active' as const,
        tenant,
      };
      setAuth(user, response.token);

      // Sprint 2 — subdomain routing. If the user belongs to a tenant
      // and is currently on a different host than their tenant subdomain,
      // redirect there. The cross-subdomain HttpOnly cookie set by
      // /auth/login (Domain=.espaco…) travels automatically; the new
      // host calls /auth/me on load and rehydrates from it.
      if (tenant?.subdomain && shouldRedirectToTenantHost(tenant.subdomain)) {
        const target = `${window.location.protocol}//${tenant.subdomain}.espacodedadosunificado.com.br/`;
        window.location.replace(target);
        return;
      }

      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E14] text-white relative overflow-hidden py-10">
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

      {/* Top bar — back to site + language.
          Only shown on the apex domain. On tenant subdomains
          (highbyte.espaco…), "back to site" links to /, which would
          land the user on /login again (RootRoute redirects guests
          there), and the marketing language picker is decoration
          that doesn't fit the in-org login context. */}
      {!isTenantSubdomain && (
        <>
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
        </>
      )}

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-[460px] mx-4 transition-all duration-700 ease-out ${
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
            {view === 'cloud' ? t('auth.loginTitle') : t('auth.edge.title')}
          </h1>
          <p className="text-[14.5px] text-gray-400 mt-2 font-light">
            {view === 'cloud' ? t('auth.loginSubtitle') : t('auth.edge.subtitle')}
          </p>
        </div>

        {/* Form card — white island on dark */}
        <div className="bg-white rounded-2xl border border-white/10 shadow-2xl shadow-emerald-500/10 overflow-hidden">
          {/* Product toggle (Cloud / Edge) */}
          <div className="px-7 pt-6 pb-1">
            <span className="text-[10px] font-semibold text-gray-500 tracking-[0.18em] uppercase block mb-2.5">
              {t('auth.edition')}
            </span>
            <div className="flex rounded-xl bg-gray-100/80 p-1 gap-1">
              {([
                { mode: 'cloud' as ProductView, img: '/edu-cloud.png', alt: 'EDU Cloud' },
                { mode: 'edge'  as ProductView, img: '/edu-edge.png',  alt: 'EDU Edge' },
              ]).map(({ mode, img, alt }) => {
                const isSelected = view === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setView(mode)}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? 'bg-white shadow-sm'
                        : 'opacity-40 hover:opacity-70'
                    }`}
                    aria-pressed={isSelected}
                    aria-label={alt}
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

          {view === 'cloud' ? (
            /* Cloud → login form */
            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
              {error && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-red-50 border border-red-100 text-[13px] text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

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
          ) : (
            /* Edge → download panel */
            <EdgeDownloadPanel />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-500 mt-7 tracking-[0.14em] uppercase font-mono">
          EDU Platform · v1.0
        </p>
      </div>
    </div>
  );
}

function EdgeDownloadPanel() {
  const { t } = useTranslation();

  // Pitch points shown at the top of the Edge tab. Two short lines that
  // sell what makes Edge different from Cloud: it's a real desktop app
  // (or browser-accessible from any machine on the local network),
  // and it processes data locally before forwarding to Cloud.
  const pitch: string[] = [
    t('auth.edge.pitchNative'),
    t('auth.edge.pitchLocalFirst'),
  ];

  // Distribution is invite-only for now (the binary is gated behind a
  // license server). We funnel interested users to the waitlist on the
  // marketing page (Landing has an id="demo" section with the form).
  const requirements: Array<{ label: string; min: string; rec: string }> = [
    { label: t('auth.edge.reqCpu'), min: t('auth.edge.reqCpuMin'), rec: t('auth.edge.reqCpuRec') },
    { label: t('auth.edge.reqRam'), min: t('auth.edge.reqRamMin'), rec: t('auth.edge.reqRamRec') },
    { label: t('auth.edge.reqGpu'), min: t('auth.edge.reqGpuMin'), rec: t('auth.edge.reqGpuRec') },
  ];

  return (
    <div className="px-7 py-6 space-y-5">
      {/* Pitch — what is Edge? */}
      <ul className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
        {pitch.map((line) => (
          <li key={line} className="flex gap-2.5">
            <span className="text-emerald-500 shrink-0" aria-hidden>·</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {/* CTA — contact for installation (Landing #demo anchor hosts the
          waitlist form; invite-only launch means we don't expose a
          direct download). */}
      <a
        href="/#demo"
        className="group w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-[14px] font-semibold rounded-xl hover:bg-black transition-all shadow-md shadow-gray-300/50 hover:shadow-lg hover:-translate-y-0.5"
      >
        {t('auth.edge.contactCta')}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </a>

      {/* Requirements table — CPU / RAM / GPU only */}
      <div className="pt-2">
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="text-[10.5px] font-semibold text-gray-500 tracking-[0.14em] uppercase">
            {t('auth.edge.requirementsTitle')}
          </span>
        </div>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3.5 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-semibold text-gray-500 tracking-[0.14em] uppercase">
            <span></span>
            <span className="text-right w-[110px]">{t('auth.edge.min')}</span>
            <span className="text-right w-[140px]">{t('auth.edge.recommended')}</span>
          </div>
          {requirements.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1fr_auto_auto] gap-x-3 px-3.5 py-2.5 text-[12.5px] ${
                i < requirements.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span className="text-gray-700 font-medium">{row.label}</span>
              <span className="text-right text-gray-500 w-[110px] tabular-nums">{row.min}</span>
              <span className="text-right text-gray-900 w-[140px] tabular-nums">{row.rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

