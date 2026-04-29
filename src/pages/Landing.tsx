import { useEffect, useRef, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, Radar, Waypoints, Workflow, LayoutDashboard, Bell, Sparkles,
  Activity, Gauge, Database, Zap,
  CheckCircle2, Loader2, AlertCircle,
} from 'lucide-react';
import { LanguageSelector } from '../components/LanguageSelector';
import { waitlistApi } from '../services/api';

export function Landing() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Header inverts to light theme after the hero ends (~hero height = ~720px on desktop)
    const onScroll = () => setScrolled(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased font-sans selection:bg-emerald-200/50">
      {/* ── Header (adaptive: dark over hero, light after scroll) ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm shadow-gray-100/40'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src="/edu-logo.png"
              alt="EDU"
              className={`h-8 w-auto select-none transition-all ${scrolled ? '' : 'brightness-0 invert'}`}
              draggable={false}
            />
          </Link>
          <nav className={`hidden md:flex items-center gap-8 text-[13px] transition-colors ${
            scrolled ? 'text-gray-500' : 'text-gray-300'
          }`}>
            <a href="#showcase" className="hover:text-gray-900 hover:[--c:theme(colors.white)] transition-colors">
              {t('landing.nav.product')}
            </a>
            <a href="#features" className="hover:text-gray-900 transition-colors">
              {t('landing.nav.features')}
            </a>
            <a href="#editions" className="hover:text-gray-900 transition-colors">
              {t('landing.nav.editions')}
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSelector variant="minimal" />
            <a
              href="#demo"
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-xl transition-all ${
                scrolled
                  ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                  : 'bg-white text-gray-900 hover:bg-gray-50 shadow-md shadow-black/20'
              }`}
            >
              {t('landing.nav.demo')}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <DarkHero />

      {/* ── Showcase ───────────────────────────────────────────────── */}
      <Showcase />

      {/* ── Trust strip ────────────────────────────────────────────── */}
      <TrustStrip />

      {/* ── Features ───────────────────────────────────────────────── */}
      <FeaturesSection />

      {/* ── Editions ───────────────────────────────────────────────── */}
      <EditionsSection />

      {/* ── Mid CTA ────────────────────────────────────────────────── */}
      <MidCta />

      {/* ── Demo Form (2-column) ───────────────────────────────────── */}
      <DemoSection />

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <FooterBlock />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hero — dark cinematic
// ─────────────────────────────────────────────────────────────────────
function DarkHero() {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-[100vh] pt-32 pb-24 overflow-hidden bg-[#0A0E14] text-white isolate">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.13] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.5px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.5) 0.5px, transparent 0.5px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 80%)',
        }}
      />
      {/* Glows */}
      <div className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full bg-emerald-500/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full bg-blue-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] rounded-full bg-gradient-radial from-emerald-500/[0.06] to-transparent blur-3xl pointer-events-none" />


      <div className="relative max-w-6xl mx-auto px-6 sm:px-8 text-center pt-12">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-[11px] font-medium text-emerald-300 tracking-wider uppercase animate-fade-in"
          style={{ animation: 'fadeInUp 0.7s cubic-bezier(0.2, 0.7, 0.1, 1) 0.05s both' }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          {t('landing.hero.tag')}
        </div>

        {/* Headline */}
        <h1
          className="text-[44px] sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] max-w-5xl mx-auto"
          style={{ animation: 'fadeInUp 0.8s cubic-bezier(0.2, 0.7, 0.1, 1) 0.15s both' }}
        >
          <span className="block text-white">{t('landing.hero.titleLine1')}</span>
          <span className="block bg-gradient-to-br from-emerald-300 via-emerald-200 to-white bg-clip-text text-transparent">
            {t('landing.hero.titleLine2')}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="mt-7 text-[16px] sm:text-[19px] text-gray-400 max-w-2xl mx-auto leading-relaxed font-light"
          style={{ animation: 'fadeInUp 0.8s cubic-bezier(0.2, 0.7, 0.1, 1) 0.25s both' }}
        >
          {t('landing.hero.subtitle')}
        </p>

        {/* CTAs */}
        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          style={{ animation: 'fadeInUp 0.8s cubic-bezier(0.2, 0.7, 0.1, 1) 0.35s both' }}
        >
          <a
            href="#demo"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-900 text-[14px] font-semibold rounded-xl hover:bg-gray-100 transition-all w-full sm:w-auto shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20 hover:-translate-y-0.5"
          >
            {t('landing.hero.ctaPrimary')}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#showcase"
            className="inline-flex items-center justify-center px-6 py-3.5 text-[14px] font-medium text-white/80 hover:text-white rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/5 backdrop-blur-sm transition-all w-full sm:w-auto"
          >
            {t('landing.hero.ctaSecondary')}
          </a>
        </div>

        <p
          className="mt-6 text-[12px] text-gray-500 tracking-wide"
          style={{ animation: 'fadeIn 0.8s 0.5s both' }}
        >
          {t('landing.hero.note')}
        </p>

        {/* Stats strip */}
        <div
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5 max-w-4xl mx-auto"
          style={{ animation: 'fadeInUp 0.9s cubic-bezier(0.2, 0.7, 0.1, 1) 0.5s both' }}
        >
          {([
            { n: '04+', l: t('landing.hero.stats.protocols') },
            { n: '13',  l: t('landing.hero.stats.widgets') },
            { n: 'ISA-95', l: t('landing.hero.stats.standard') },
            { n: '100%', l: t('landing.hero.stats.edge') },
          ] as const).map((s, i) => (
            <div key={i} className="bg-[#0A0E14] px-6 py-7 hover:bg-white/[0.02] transition-colors">
              <div className="text-[28px] sm:text-[32px] font-semibold text-white tracking-tight tabular-nums">
                {s.n}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-gray-500">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Showcase — bigger product mock with side copy
// ─────────────────────────────────────────────────────────────────────
function Showcase() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const bullets = t('landing.showcase.bullets', { returnObjects: true }) as string[];

  return (
    <section id="showcase" className="relative py-28 bg-white overflow-hidden">
      <div
        ref={ref}
        className={`relative max-w-7xl mx-auto px-6 sm:px-8 transition-all duration-700 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <div className="lg:col-span-5">
            <span className="inline-flex items-center px-2.5 py-1 mb-6 rounded-md bg-emerald-50 text-[10px] font-semibold text-emerald-700 tracking-[0.18em] uppercase">
              {t('landing.showcase.tag')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.08] text-gray-900">
              {t('landing.showcase.title')}
            </h2>
            <p className="mt-5 text-[15px] sm:text-[16px] text-gray-500 leading-relaxed">
              {t('landing.showcase.subtitle')}
            </p>
            <ul className="mt-9 space-y-4 border-t border-gray-100 pt-7">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-4 text-[14px] text-gray-700">
                  <span className="mt-1 text-[10px] font-mono text-gray-400 tracking-wide w-5 shrink-0">
                    0{i + 1}
                  </span>
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
            <a
              href="#demo"
              className="mt-9 inline-flex items-center gap-2 text-[14px] font-medium text-gray-900 hover:text-emerald-600 transition-colors group border-b border-gray-300 hover:border-emerald-500 pb-1"
            >
              {t('landing.showcase.cta')}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Mock dashboard */}
          <div className="lg:col-span-7">
            <ProductMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductMock() {
  return (
    <div className="relative">
      {/* Glow behind */}
      <div className="absolute -inset-12 bg-gradient-to-tr from-emerald-500/20 via-blue-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="relative rounded-2xl border border-white/10 shadow-2xl shadow-black/40 bg-[#0F1320] overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[#0B0F1A]">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
          <span className="ml-3 text-[11px] text-gray-400 font-mono">edu &middot; Cooling Tower BR-Plant2</span>
          <div className="ml-auto flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            LIVE
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-12 gap-3">
          {/* Top KPIs */}
          <MockTile className="col-span-3" icon={<Gauge />}    label="Inlet T°"   value="42.8" unit="°C"  tone="emerald" />
          <MockTile className="col-span-3" icon={<Gauge />}    label="Outlet T°"  value="28.1" unit="°C"  tone="blue" />
          <MockTile className="col-span-3" icon={<Activity />} label="Flow"       value="118"  unit="m³/h" tone="emerald" />
          <MockTile className="col-span-3" icon={<Bell />}     label="Alarms"     value="0"                tone="gray" />

          {/* Chart */}
          <div className="col-span-8 bg-[#1A1F2E] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono">Process trend · last 12h</div>
                <div className="mt-0.5 text-sm text-white font-medium tabular-nums">42.8 → 28.1 °C</div>
              </div>
              <div className="text-[10px] text-gray-500 font-mono">+ 0.3 °C/min</div>
            </div>
            <MockChart />
          </div>

          {/* Side stats */}
          <div className="col-span-4 grid grid-cols-1 gap-3">
            <MockTile icon={<Zap />}     label="Pump 1"  value="ON"   tone="emerald" small />
            <MockTile icon={<Zap />}     label="Pump 2"  value="ON"   tone="emerald" small />
            <MockTile icon={<Database />} label="Tags"    value="312"  tone="blue" small />
          </div>
        </div>
      </div>

    </div>
  );
}

function MockChart() {
  // Static SVG sparkline to suggest a process trend
  return (
    <svg viewBox="0 0 400 90" className="w-full h-20">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,55 L40,52 L80,46 L120,50 L160,38 L200,30 L240,42 L280,28 L320,18 L360,22 L400,12 L400,90 L0,90 Z"
        fill="url(#g)"
      />
      <path
        d="M0,55 L40,52 L80,46 L120,50 L160,38 L200,30 L240,42 L280,28 L320,18 L360,22 L400,12"
        fill="none"
        stroke="#34D399"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* gridlines */}
      {[20, 40, 60, 80].map((y) => (
        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Trust strip — typographic only
// ─────────────────────────────────────────────────────────────────────
function TrustStrip() {
  const { t } = useTranslation();
  const items = ['MQTT 5', 'OPC-UA', 'Modbus TCP', 'EtherNet/IP', 'Sparkplug B', 'ISA-95', 'CESMII'];
  return (
    <section className="py-14 bg-white border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <p className="text-center text-[10px] uppercase tracking-[0.28em] text-gray-400 mb-7 font-medium">
          {t('landing.protocols.title')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-3 text-[13.5px] text-gray-500">
          {items.map((label, i) => (
            <span key={label} className="inline-flex items-center">
              <span className="px-3 sm:px-4 py-1 hover:text-gray-900 transition-colors font-medium tracking-wide">
                {label}
              </span>
              {i < items.length - 1 && (
                <span className="text-gray-300 select-none" aria-hidden>·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Features
// ─────────────────────────────────────────────────────────────────────
function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <section id="features" className="py-28 bg-gray-50/70">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-white border border-gray-200 text-[11px] font-medium text-gray-600 tracking-wider uppercase shadow-sm">
            {t('landing.features.tag')}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-900 leading-[1.08]">
            {t('landing.features.title')}
          </h2>
          <p className="mt-4 text-[15px] sm:text-[16px] text-gray-500 leading-relaxed">
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
  );
}

function FeatureCard({
  icon, title, desc,
}: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group relative p-7 rounded-2xl border border-gray-200/60 bg-white hover:border-emerald-200/80 hover:shadow-lg hover:shadow-emerald-100/40 hover:-translate-y-1 transition-all duration-300">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 text-emerald-600 flex items-center justify-center mb-5 group-hover:from-emerald-100 group-hover:to-emerald-200/50 group-hover:scale-105 transition-all">
        <span className="block w-5 h-5">{icon}</span>
      </div>
      <h3 className="text-[16px] font-semibold text-gray-900 mb-1.5 tracking-tight">{title}</h3>
      <p className="text-[13.5px] text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Editions
// ─────────────────────────────────────────────────────────────────────
function EditionsSection() {
  const { t } = useTranslation();
  return (
    <section id="editions" className="py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-gray-100 border border-gray-200 text-[11px] font-medium text-gray-700 tracking-wider uppercase">
            {t('landing.editions.tag')}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-900 leading-[1.08]">
            {t('landing.editions.title')}
          </h2>
          <p className="mt-4 text-[15px] sm:text-[16px] text-gray-500 leading-relaxed">
            {t('landing.editions.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <EditionCard
            wordmark="/edu-cloud.png"
            tag={t('landing.editions.cloud.tag')}
            items={t('landing.editions.cloud.items', { returnObjects: true }) as string[]}
            accent="emerald"
          />
          <EditionCard
            wordmark="/edu-edge.png"
            tag={t('landing.editions.edge.tag')}
            items={t('landing.editions.edge.items', { returnObjects: true }) as string[]}
            accent="blue"
          />
        </div>
      </div>
    </section>
  );
}

function EditionCard({
  wordmark, tag, items, accent,
}: { wordmark: string; tag: string; items: string[]; accent: 'emerald' | 'blue' }) {
  const dot = accent === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500';
  const grad = accent === 'emerald'
    ? 'from-emerald-50/60 via-white to-white'
    : 'from-blue-50/60 via-white to-white';
  return (
    <div className={`group relative p-9 rounded-2xl border border-gray-200/70 bg-gradient-to-br ${grad} hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-7">
        <img src={wordmark} alt="" className="h-7 w-auto" />
        <span className="text-[10px] font-medium text-gray-600 uppercase tracking-[0.18em] bg-white px-2.5 py-1 rounded-md border border-gray-200">
          {tag}
        </span>
      </div>
      <ul className="space-y-3.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[14px] text-gray-700">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Mid CTA banner — repeats demo CTA
// ─────────────────────────────────────────────────────────────────────
function MidCta() {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-gray-50/70 border-y border-gray-100">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#0A0E14] px-8 sm:px-12 py-14 text-center">
          {/* Glow accents */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-transparent to-blue-500/10 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-emerald-500/15 blur-3xl rounded-full pointer-events-none" />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,1) 0.5px, transparent 0.5px),' +
                'linear-gradient(90deg, rgba(255,255,255,1) 0.5px, transparent 0.5px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent 80%)',
            }}
          />
          <div className="relative">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white leading-tight">
              {t('landing.midCta.title')}
            </h3>
            <p className="mt-3 text-[15px] text-gray-400 max-w-xl mx-auto">
              {t('landing.midCta.subtitle')}
            </p>
            <a
              href="#demo"
              className="group mt-7 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 text-[14px] font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:-translate-y-0.5"
            >
              {t('landing.midCta.cta')}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Demo signup (2-column)
// ─────────────────────────────────────────────────────────────────────
function DemoSection() {
  const { t, i18n } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }),
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Form state
  const [email, setEmail]       = useState('');
  const [name, setName]         = useState('');
  const [company, setCompany]   = useState('');
  const [role, setRole]         = useState('');
  const [message, setMessage]   = useState('');
  const [status, setStatus]     = useState<'idle' | 'loading' | 'ok' | 'already' | 'error'>('idle');
  const [errMsg, setErrMsg]     = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setErrMsg('');
    try {
      const result = await waitlistApi.subscribe({
        email:   email.trim(),
        name:    name.trim()    || undefined,
        company: company.trim() || undefined,
        role:    role.trim()    || undefined,
        useCase: message.trim() || undefined,
        source:  'demo',
        locale:  i18n.language,
      });
      setStatus(result.alreadySubscribed ? 'already' : 'ok');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Erro inesperado');
      setStatus('error');
    }
  };

  const success = status === 'ok' || status === 'already';

  const expectations = t('landing.demo.expect.items', { returnObjects: true }) as Array<{
    title: string;
    desc: string;
  }>;

  return (
    <section id="demo" className="py-28 relative overflow-hidden bg-[#0A0E14] text-white">
      {/* Backdrop — subtle grid + glows */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 0.5px, transparent 0.5px),' +
            'linear-gradient(90deg, rgba(255,255,255,1) 0.5px, transparent 0.5px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 80%)',
        }}
      />
      <div className="absolute top-1/2 right-[-200px] w-[600px] h-[600px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-0 left-[-200px] w-[500px] h-[500px] bg-blue-500/8 blur-[140px] rounded-full pointer-events-none" />

      <div
        ref={ref}
        className={`relative max-w-7xl mx-auto px-6 sm:px-8 transition-all duration-700 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* LEFT — copy + bullets */}
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-[11px] font-medium text-emerald-300 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {t('landing.demo.tag')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.08]">
              {t('landing.demo.title')}
            </h2>
            <p className="mt-5 text-[15px] sm:text-[16px] text-gray-400 leading-relaxed">
              {t('landing.demo.subtitle')}
            </p>

            <div className="mt-10 space-y-6 border-t border-white/10 pt-7">
              {expectations.map((e, i) => (
                <div key={i} className="flex items-start gap-5">
                  <span className="text-[11px] font-mono font-medium text-emerald-400/70 tracking-[0.18em] pt-0.5 w-6 shrink-0">
                    0{i + 1}
                  </span>
                  <div>
                    <div className="text-[14.5px] font-semibold text-white tracking-tight">{e.title}</div>
                    <p className="mt-1.5 text-[13.5px] text-gray-400 leading-relaxed">{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — form card (white island on dark) */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl border border-white/10 bg-white shadow-2xl shadow-emerald-500/10 overflow-hidden">
              {success ? (
                <SuccessPanel
                  already={status === 'already'}
                  email={email}
                  onReset={() => {
                    setStatus('idle');
                    setEmail(''); setName(''); setCompany(''); setRole(''); setMessage('');
                  }}
                />
              ) : (
                <form onSubmit={onSubmit} className="p-8 sm:p-10">
                  <div className="mb-7">
                    <h3 className="text-xl font-semibold text-gray-900">{t('landing.demo.formTitle')}</h3>
                    <p className="mt-1 text-[13px] text-gray-500">{t('landing.demo.formSubtitle')}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                    <Field
                      label={t('landing.demo.fields.email')}
                      value={email}
                      onChange={setEmail}
                      type="email"
                      required
                      disabled={status === 'loading'}
                      autoComplete="email"
                      full
                    />
                    <Field
                      label={t('landing.demo.fields.name')}
                      value={name}
                      onChange={setName}
                      disabled={status === 'loading'}
                      autoComplete="name"
                    />
                    <Field
                      label={t('landing.demo.fields.company')}
                      value={company}
                      onChange={setCompany}
                      disabled={status === 'loading'}
                      autoComplete="organization"
                    />
                    <Field
                      label={t('landing.demo.fields.role')}
                      value={role}
                      onChange={setRole}
                      disabled={status === 'loading'}
                      full
                    />
                    <Field
                      label={t('landing.demo.fields.message')}
                      value={message}
                      onChange={setMessage}
                      disabled={status === 'loading'}
                      multiline
                      full
                    />

                    {status === 'error' && (
                      <div className="sm:col-span-2 flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-red-50 border border-red-100 text-[13px] text-red-700">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errMsg}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <p className="text-[12px] text-gray-400 leading-relaxed max-w-sm">
                      {t('landing.demo.legal')}
                    </p>
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white text-[14px] font-semibold rounded-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-gray-300 hover:shadow-lg hover:-translate-y-0.5 disabled:translate-y-0 w-full sm:w-auto"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('landing.demo.sending')}
                        </>
                      ) : (
                        <>
                          {t('landing.demo.submit')}
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label, value, onChange, type = 'text', required, disabled, autoComplete,
  multiline, full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  multiline?: boolean;
  full?: boolean;
}) {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <label className={`flex flex-col gap-2 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-[10.5px] font-semibold text-gray-500 tracking-[0.14em] uppercase">
        {label}
        {required && <span className="text-emerald-500 ml-0.5 normal-case font-normal">*</span>}
      </span>
      <Tag
        type={multiline ? undefined : type}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        rows={multiline ? 4 : undefined}
        className="w-full px-4 py-3 text-[14.5px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none transition-all placeholder:text-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
      />
    </label>
  );
}

function SuccessPanel({
  already, email, onReset,
}: {
  already: boolean;
  email: string;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="px-8 py-14 sm:px-10 sm:py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-100/40">
        <CheckCircle2 className="w-7 h-7" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">
        {already ? t('landing.demo.already.title') : t('landing.demo.ok.title')}
      </h3>
      <p className="mt-3 text-[15px] text-gray-500 max-w-md mx-auto leading-relaxed">
        {already ? t('landing.demo.already.body') : t('landing.demo.ok.body')}
      </p>
      <p className="mt-6 text-[12px] text-gray-400 font-mono">{email}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-7 text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
      >
        {t('landing.demo.submitAnother')} →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Mock tile (used by Showcase)
// ─────────────────────────────────────────────────────────────────────
function MockTile({
  icon, label, value, unit, tone, className = '', small,
}: {
  icon: React.ReactNode; label: string; value: string; unit?: string;
  tone: 'emerald' | 'blue' | 'gray';
  className?: string;
  small?: boolean;
}) {
  const accent = {
    emerald: 'text-emerald-400',
    blue:    'text-blue-400',
    gray:    'text-gray-400',
  }[tone];
  return (
    <div className={`bg-[#1A1F2E] border border-white/5 rounded-xl p-4 ${className}`}>
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${accent}`}>
        <span className="block w-3 h-3">{icon}</span>
        {label}
      </div>
      <p className={`mt-2 ${small ? 'text-xl' : 'text-2xl'} font-semibold text-white tabular-nums`}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-gray-500">{unit}</span>}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────
function FooterBlock() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-gray-100 py-10 bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-gray-400">
        <div className="flex items-center gap-3">
          <img src="/edu-logo.png" alt="EDU" className="h-6 w-auto opacity-80" />
          <span>{t('landing.footer.tagline')}</span>
        </div>
        <span className="font-mono">espacodedadosunificado.com.br</span>
        <div className="flex items-center gap-5">
          <Link to="/login" className="hover:text-gray-600 transition-colors">
            {t('landing.footer.clientLogin')}
          </Link>
          <span>
            © {new Date().getFullYear()} &middot; {t('landing.footer.rights')}
          </span>
        </div>
      </div>
    </footer>
  );
}
