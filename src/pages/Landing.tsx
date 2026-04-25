import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, Radar, Waypoints, Workflow, LayoutDashboard, Bell, Sparkles,
  Cpu, CircuitBoard, Network, Radio,
} from 'lucide-react';
import { LanguageSelector } from '../components/LanguageSelector';

export function Landing() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased font-sans selection:bg-emerald-100">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all ${
          scrolled
            ? 'bg-white/85 backdrop-blur border-b border-gray-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/edu-logo.png" alt="EDU" className="h-8 w-auto select-none" draggable={false} />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-gray-500">
            <a href="#features"  className="hover:text-gray-900 transition-colors">{t('landing.nav.features')}</a>
            <a href="#editions"  className="hover:text-gray-900 transition-colors">{t('landing.nav.editions')}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSelector variant="minimal" />
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              {t('landing.nav.login')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-28 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-gradient-to-b from-emerald-50/60 via-blue-50/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 rounded-full bg-gray-50 border border-gray-100 text-[11px] font-medium text-gray-500 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('landing.hero.tag')}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-gray-900 leading-[1.05]">
            {t('landing.hero.title')}
          </h1>
          <p className="mt-5 text-[16px] sm:text-[18px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t('landing.hero.subtitle')}
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 text-white text-[14px] font-medium rounded-xl hover:bg-gray-800 transition-colors w-full sm:w-auto"
            >
              {t('landing.hero.ctaPrimary')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center px-5 py-3 text-[14px] font-medium text-gray-700 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              {t('landing.hero.ctaSecondary')}
            </a>
          </div>

          {/* Mock screenshot card */}
          <div className="mt-16 mx-auto max-w-4xl">
            <div className="relative rounded-2xl border border-gray-200/60 shadow-2xl shadow-gray-200/40 bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                <span className="ml-3 text-[11px] text-gray-400 font-mono">edu &middot; Cooling Tower BR-Plant2</span>
              </div>
              <div className="bg-[#0f1117] p-8 grid grid-cols-3 gap-4">
                <MockTile icon={<LayoutDashboard className="w-3.5 h-3.5" />} label="Inlet T°"   value="42.8" unit="°C" tone="emerald" />
                <MockTile icon={<LayoutDashboard className="w-3.5 h-3.5" />} label="Outlet T°"  value="28.1" unit="°C" tone="blue"    />
                <MockTile icon={<LayoutDashboard className="w-3.5 h-3.5" />} label="Flow"       value="118"  unit="m³/h" tone="emerald" />
                <MockTile icon={<LayoutDashboard className="w-3.5 h-3.5" />} label="Pump 1"     value="ON"   tone="emerald" />
                <MockTile icon={<LayoutDashboard className="w-3.5 h-3.5" />} label="Pump 2"     value="ON"   tone="emerald" />
                <MockTile icon={<Bell className="w-3.5 h-3.5" />}             label="Alarms"    value="0"    tone="gray"    />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Protocols strip ────────────────────────────────────────── */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/30">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <p className="text-center text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-6">
            {t('landing.protocols.title')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            <ProtoBadge icon={<Radio className="w-3.5 h-3.5" />}        label="MQTT" />
            <ProtoBadge icon={<Network className="w-3.5 h-3.5" />}      label="OPC-UA" />
            <ProtoBadge icon={<Cpu className="w-3.5 h-3.5" />}          label="Modbus TCP" />
            <ProtoBadge icon={<CircuitBoard className="w-3.5 h-3.5" />} label="EtherNet/IP" />
            <ProtoBadge icon={<Waypoints className="w-3.5 h-3.5" />}    label="Sparkplug B" />
            <ProtoBadge icon={<Cpu className="w-3.5 h-3.5" />}          label="Siemens S7" />
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
              {t('landing.features.title')}
            </h2>
            <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={<Radar />}            title={t('landing.features.scan.title')}    desc={t('landing.features.scan.desc')} />
            <FeatureCard icon={<Waypoints />}        title={t('landing.features.uns.title')}     desc={t('landing.features.uns.desc')} />
            <FeatureCard icon={<Workflow />}         title={t('landing.features.models.title')}  desc={t('landing.features.models.desc')} />
            <FeatureCard icon={<LayoutDashboard />}  title={t('landing.features.screens.title')} desc={t('landing.features.screens.desc')} />
            <FeatureCard icon={<Bell />}             title={t('landing.features.alerts.title')}  desc={t('landing.features.alerts.desc')} />
            <FeatureCard icon={<Sparkles />}         title={t('landing.features.ai.title')}      desc={t('landing.features.ai.desc')} />
          </div>
        </div>
      </section>

      {/* ── Editions ───────────────────────────────────────────────── */}
      <section id="editions" className="py-28 bg-gray-50/40 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
              {t('landing.editions.title')}
            </h2>
            <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">
              {t('landing.editions.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <EditionCard
              wordmark="/edu-cloud.png"
              tag={t('landing.editions.cloud.tag')}
              items={t('landing.editions.cloud.items', { returnObjects: true }) as string[]}
            />
            <EditionCard
              wordmark="/edu-edge.png"
              tag={t('landing.editions.edge.tag')}
              items={t('landing.editions.edge.items', { returnObjects: true }) as string[]}
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section className="py-28">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gray-950 px-8 py-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-blue-500/10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/15 blur-3xl rounded-full" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                {t('landing.cta.title')}
              </h2>
              <p className="mt-3 text-[15px] text-gray-400 max-w-xl mx-auto">
                {t('landing.cta.subtitle')}
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-900 text-[14px] font-medium rounded-xl hover:bg-gray-100 transition-colors w-full sm:w-auto"
                >
                  {t('landing.cta.primary')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="mailto:support@espacodedadosunificado.com.br"
                  className="inline-flex items-center justify-center px-5 py-3 text-[14px] font-medium text-white rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 transition-colors w-full sm:w-auto"
                >
                  {t('landing.cta.secondary')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-gray-400">
          <div className="flex items-center gap-3">
            <img src="/edu-logo.png" alt="EDU" className="h-6 w-auto opacity-80" />
            <span>{t('landing.footer.tagline')}</span>
          </div>
          <span className="font-mono">espacodedadosunificado.com.br</span>
          <span>
            © {new Date().getFullYear()} &middot; {t('landing.footer.rights')} &middot; {t('landing.footer.made')}
          </span>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────

function MockTile({
  icon, label, value, unit, tone,
}: {
  icon: React.ReactNode; label: string; value: string; unit?: string;
  tone: 'emerald' | 'blue' | 'gray';
}) {
  const accent = {
    emerald: 'text-emerald-400',
    blue:    'text-blue-400',
    gray:    'text-gray-400',
  }[tone];
  return (
    <div className="bg-[#1a1d29] border border-white/5 rounded-xl p-4 text-left">
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${accent}`}>
        {icon}{label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-white tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-gray-500">{unit}</span>}
      </p>
    </div>
  );
}

function ProtoBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-gray-500 font-medium">
      <span className="text-gray-400">{icon}</span>
      {label}
    </span>
  );
}

function FeatureCard({
  icon, title, desc,
}: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group p-6 rounded-2xl border border-gray-200/60 bg-white hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function EditionCard({
  wordmark, tag, items,
}: { wordmark: string; tag: string; items: string[] }) {
  return (
    <div className="p-8 rounded-2xl border border-gray-200/60 bg-white">
      <div className="flex items-center justify-between mb-6">
        <img src={wordmark} alt="" className="h-7 w-auto" />
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
          {tag}
        </span>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[14px] text-gray-700">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
