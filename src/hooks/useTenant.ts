import { useAuthStore } from './useStore';
import type { User } from '../types';

const ROOT_DOMAIN = 'espacodedadosunificado.com.br';
const RESERVED = new Set([
  'api', 'www', 'admin', 'app', 'auth', 'login', 'mcp',
  'docs', 'help', 'support', 'status', 'cdn', 'static',
]);

/**
 * Returns the current tenant context, sourced from two places:
 *   - `host`:  the subdomain in the browser URL (truth at any moment)
 *   - `jwt`:   the tenant the logged-in user belongs to (from /auth/login)
 *
 * If both are set and disagree, the user is on the wrong subdomain —
 * the post-login redirect logic should fix it; the backend will return
 * 403 on tenant-scoped API calls in the meantime.
 */
export interface TenantContext {
  /** Subdomain detected in window.location.hostname (e.g. "tupinix"). null
   *  when the user is on the apex domain, on an IP, or on localhost. */
  hostSubdomain: string | null;
  /** Tenant the JWT was issued for. Null for unscoped admin or guest. */
  jwtTenant: NonNullable<User['tenant']> | null;
  /** True when host.subdomain matches jwt.tenant.subdomain — the happy path. */
  inSync: boolean;
  /** True when running on a real org subdomain (not apex / not reserved). */
  isTenantSubdomain: boolean;
  /** Build a URL on a given tenant subdomain, preserving path + search. */
  urlForSubdomain: (sub: string, path?: string) => string;
}

export function useTenant(): TenantContext {
  const user = useAuthStore((s: { user: User | null }) => s.user);
  const hostSubdomain = parseSubdomain(typeof window !== 'undefined' ? window.location.hostname : '');
  const jwtTenant = user?.tenant ?? null;

  const isTenantSubdomain = hostSubdomain !== null;
  const inSync = !isTenantSubdomain || (!!jwtTenant && hostSubdomain === jwtTenant.subdomain);

  return {
    hostSubdomain,
    jwtTenant,
    inSync,
    isTenantSubdomain,
    urlForSubdomain: (sub, path = '/') => {
      const proto = typeof window !== 'undefined' ? window.location.protocol : 'https:';
      return `${proto}//${sub}.${ROOT_DOMAIN}${path.startsWith('/') ? path : `/${path}`}`;
    },
  };
}

function parseSubdomain(hostname: string): string | null {
  if (!hostname) return null;
  const lower = hostname.toLowerCase();
  // Match anything ending in .espacodedadosunificado.com.br
  if (!lower.endsWith(`.${ROOT_DOMAIN}`)) return null;
  const prefix = lower.slice(0, -ROOT_DOMAIN.length - 1); // strip ".espaco..."
  // Only a single label counts as the tenant subdomain. e.g.
  // "tupinix"        -> tupinix
  // "preview.www"    -> null (multi-label is not a tenant)
  if (!prefix || prefix.includes('.')) return null;
  if (!/^[a-z0-9-]+$/.test(prefix)) return null;
  if (RESERVED.has(prefix)) return null;
  return prefix;
}
