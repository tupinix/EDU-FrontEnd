import { useEffect, useRef, useState, useId } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

/**
 * Renders a Mermaid diagram from a source string. Mermaid is a heavy dependency,
 * so it is imported lazily (dynamic import) the first time this component
 * mounts, keeping it out of the main bundle. Theme follows the app's dark mode.
 */

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => m.default);
  }
  return mermaidPromise;
}

interface Props {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className }: Props) {
  const rawId = useId();
  const renderId = `mmd-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const isDark = document.documentElement.classList.contains('dark');

    loadMermaid()
      .then(async (mermaid) => {
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'strict',
          flowchart: { htmlLabels: true, curve: 'basis' },
          themeVariables: isDark
            ? { primaryColor: '#065f46', primaryTextColor: '#e5e7eb', lineColor: '#4b5563', background: '#0f1117' }
            : undefined,
        });
        // mermaid.render rejects on a parse error; catch it and show the source.
        const { svg: out } = await mermaid.render(renderId, chart);
        if (!cancelled && mountedRef.current) {
          setSvg(out);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled && mountedRef.current) {
          setError(e instanceof Error ? e.message : 'Falha ao renderizar o fluxograma');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [chart, renderId]);

  if (loading) {
    return (
      <div className={`flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 ${className || ''}`}>
        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30 ${className || ''}`}>
        <div className="mb-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Nao foi possivel renderizar o fluxograma. Codigo Mermaid abaixo:
        </div>
        <pre className="max-h-64 overflow-auto rounded-lg bg-white/60 p-2 text-[11px] text-gray-700 dark:bg-black/30 dark:text-gray-300">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      className={`w-full overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 ${className || ''}`}
      // eslint-disable-next-line react/no-danger -- Mermaid output rendered with securityLevel:'strict' (sanitized SVG)
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
