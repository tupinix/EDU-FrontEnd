import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../hooks/useStore';
import { authApi } from '../services/api';
import LogoTupinix from '../utils/Logo BR.jpg';
import { DarkVeil } from '../components/DarkVeil';
import { LanguageSelector } from '../components/LanguageSelector';

export function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setAuth, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Animation on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
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
      setAuth(user, response.token);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Dark Veil Background */}
      <DarkVeil
        hueShift={180}
        noiseIntensity={0.03}
        scanlineIntensity={0.05}
        speed={0.3}
        scanlineFrequency={100}
        warpAmount={0.3}
        resolutionScale={1}
      />

      {/* Gradient overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />

      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector variant="minimal" />
      </div>

      <div className={`w-full max-w-md px-4 relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          {/* Header with logo */}
          <div className="relative bg-gradient-to-r from-[#059669] to-[#022c22] px-8 py-10 text-center overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

            <div className={`relative transition-all duration-700 delay-200 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl animate-glow" />
                  <img
                    src={LogoTupinix}
                    alt="EDU Platform"
                    className="relative w-24 h-24 rounded-2xl object-cover shadow-2xl ring-4 ring-white/30 animate-float"
                  />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">EDU Platform</h1>
              <p className="text-primary-200 text-sm mt-2 font-medium">{t('auth.loginSubtitle')}</p>

              {/* Decorative line */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/50" />
                <div className="w-2 h-2 rounded-full bg-white/50" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/50" />
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 animate-fade-in-down">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className={`space-y-2 transition-all duration-500 delay-300 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                {t('common.email')}
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#10b981] transition-colors" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#10b981] focus:bg-white transition-all"
                    placeholder={t('auth.emailPlaceholder')}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className={`space-y-2 transition-all duration-500 delay-400 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                {t('common.password')}
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#10b981] transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#10b981] focus:bg-white transition-all"
                    placeholder={t('auth.passwordPlaceholder')}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#10b981] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className={`transition-all duration-500 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full py-4 px-6 bg-gradient-to-r from-[#10b981] to-[#34d399] text-white font-semibold rounded-xl hover:from-[#059669] hover:to-[#10b981] focus:outline-none focus:ring-4 focus:ring-[#10b981]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                <span className="relative flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t('auth.loggingIn')}
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      {t('auth.loginTitle')}
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className={`px-8 pb-8 transition-all duration-500 delay-600 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                {t('auth.defaultCredentials')}
              </p>
              <div className="flex items-center justify-center gap-4 mt-2">
                <code className="text-xs bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-[#10b981] font-mono">
                  admin@tupinix.com
                </code>
                <code className="text-xs bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-[#10b981] font-mono">
                  admin123
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Version */}
        <p className={`text-center text-white/60 text-xs mt-6 transition-all duration-500 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <span className="font-medium">EDU Platform</span> v1.0.0 - Tupinix Engineering
        </p>
      </div>
    </div>
  );
}
