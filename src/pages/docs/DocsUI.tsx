import { useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check } from 'lucide-react';

/** Pick pt/en content based on the active i18n language. */
export function useL() {
  const { i18n } = useTranslation();
  const lang: 'pt' | 'en' = i18n.language?.toLowerCase().startsWith('en') ? 'en' : 'pt';
  return function L<T>(o: { pt: T; en: T }): T {
    return o[lang];
  };
}

/** Copyable code block. */
export function Code({ children, lang }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => navigator.clipboard?.writeText(children).then(() => {
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }).catch(() => {});
  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-gray-800 bg-[#0d1117]">
      {lang && <span className="absolute left-3 top-2 text-[10px] uppercase tracking-wide text-gray-500">{lang}</span>}
      <button onClick={copy} className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] text-gray-400 opacity-0 transition hover:bg-white/10 hover:text-gray-200 group-hover:opacity-100">
        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}{copied ? 'Copiado' : 'Copiar'}
      </button>
      <pre className={`overflow-x-auto px-4 ${lang ? 'pt-6' : 'pt-3'} pb-3 text-[13px] leading-relaxed text-gray-100`}><code>{children}</code></pre>
    </div>
  );
}

/** Screenshot with caption; hides itself gracefully if the image is missing. */
export function Shot({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <figure className="my-5">
      <img src={src} alt={alt} onError={() => setOk(false)}
        className="w-full rounded-xl border border-gray-200 shadow-sm dark:border-gray-800" />
      <figcaption className="mt-2 text-center text-xs text-gray-400">{alt}</figcaption>
    </figure>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-gray-100 py-8 first:border-t-0 first:pt-0 dark:border-gray-800">
      <h2 className="mb-3 text-xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">{children}</div>
    </section>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 mb-1 text-base font-semibold text-gray-900 dark:text-white">{children}</h3>;
}

export const K = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[13px] text-gray-800 dark:bg-gray-800 dark:text-gray-200">{children}</code>
);

export function Callout({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'tip' | 'warn' }) {
  const c = tone === 'warn'
    ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300'
    : tone === 'tip'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
      : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
  return <div className={`my-3 rounded-xl border p-4 text-sm leading-relaxed ${c}`}>{children}</div>;
}

/** Page title block used at the top of each doc page. */
export function DocTitle({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <div className="mb-2">
      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{eyebrow}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{intro}</p>
    </div>
  );
}
