import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../hooks/useStore';
import { useTenant } from '../hooks/useTenant';
import { authApi } from '../services/api';
import { LanguageSelector } from '../components/LanguageSelector';

const ROOT_DOMAIN = 'espacodedadosunificado.com.br';

// EDU Edge has no marketing site: the login is the entry point and there is no
// home to go back to.
const IS_EDGE = import.meta.env.VITE_EDU_EDITION === 'edge';

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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Reaching /login means "give me a fresh session, ignore whatever
  // cookie is sitting in this browser." Otherwise the cross-subdomain
  // edu_token cookie outlives a logout (HttpOnly, can't be touched
  // from JS) and the next navigate('/') silently rehydrates the user
  // via useCookieSessionRehydration, so clicking the EDU logo felt
  // like an instant login because RootRoute re-ran /auth/me.
  useEffect(() => {
    authApi.logout().catch(() => { /* fine if no session existed */ });
    localStorage.removeItem('edu_token');
    localStorage.removeItem('edu_refresh_token');
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

  const hasSite = !IS_EDGE && !isTenantSubdomain;

  const field = 'w-full h-11 px-3.5 text-[14.5px] text-foreground bg-background border border-input rounded-lg outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:opacity-60';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* Painel da marca: degrade verde-petroleo com a tela real de um dashboard do EDU,
          para quem chega ver o que vai encontrar depois de entrar. */}
      <aside
        className="relative overflow-hidden px-6 pb-8 pt-8 text-white sm:px-10 lg:w-[58%] lg:px-14 lg:pb-0 lg:pt-14"
        style={{ background: 'radial-gradient(120% 90% at 0% 0%, #0d5c4a 0%, #063a33 40%, #03140c 100%)' }}
      >
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#12a8b7] opacity-40 blur-[120px]" />
        <div className="relative">
          {/* Only the apex Cloud domain has a site behind the logo. On Edge and on
              tenant subdomains "/" sends guests straight back here. */}
          {hasSite ? (
            <Link to="/" aria-label={t('auth.backToSite')} className="block w-fit rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/40">
              <img src="/edu-logo.png" alt="EDU" className="h-8 w-auto select-none lg:h-9" draggable={false} />
            </Link>
          ) : (
            <img src="/edu-logo.png" alt="EDU" className="h-8 w-auto select-none lg:h-9" draggable={false} />
          )}
          <p className="mt-6 max-w-[18ch] text-[26px] font-semibold leading-[1.12] tracking-[-0.02em] lg:mt-10 lg:text-[42px]">
            {t('auth.heroTitle')}
          </p>
          <p className="mt-4 hidden max-w-[46ch] text-[15px] leading-relaxed text-white/65 lg:block">
            {t('auth.heroBody')}
          </p>
        </div>
        <div className="relative mt-14 hidden lg:block">
          <div className="origin-top-left rounded-t-xl border border-white/15 bg-white/5 p-1.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,.6)] [transform:perspective(1800px)_rotateY(-8deg)_rotateX(4deg)] lg:w-[118%]">
            <img
              src="/screenshots/edu-dashboard-agri-products.webp"
              alt={t('auth.heroImageAlt')}
              className="block w-full rounded-t-lg"
              draggable={false}
            />
          </div>
        </div>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-6 py-16 sm:px-12">
        {!isTenantSubdomain && (
          <>
            {hasSite && (
              <Link
                to="/"
                className="group absolute left-6 top-5 inline-flex items-center gap-2 rounded text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:left-12"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                {t('auth.backToSite')}
              </Link>
            )}
            <div className="absolute right-6 top-4 sm:right-12">
              <LanguageSelector variant="minimal" />
            </div>
          </>
        )}

        <div className="w-full max-w-[380px]">
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">{t('auth.login')}</h1>
          <p className="mt-2 text-[14.5px] text-muted-foreground">{t('auth.signInHint')}</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/[0.06] px-3.5 py-3 text-[13.5px] text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[13.5px] font-medium">{t('common.email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={field}
                placeholder={t('auth.emailPlaceholder')}
                required
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[13.5px] font-medium">{t('common.password')}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${field} pr-11`}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#03140c] text-[14.5px] font-semibold text-white outline-none transition-colors hover:bg-[#0b3a26] focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-primary dark:hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('auth.loggingIn')}
                </>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
