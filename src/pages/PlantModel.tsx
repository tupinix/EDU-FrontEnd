import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import ForceGraph2D from 'react-force-graph-2d';
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  Loader2,
  X,
  ChevronRight,
  Play,
  AlertCircle,
} from 'lucide-react';
import { hierarchyApi } from '../services/api';
import { HierarchyData, CypherResult } from '../types';
import { cn } from '@/lib/utils';

// ─── Graph types ──────────────────────────────────────────────────────

interface GNode {
  id: string;
  name: string;
  type: 'root' | 'enterprise' | 'site' | 'area' | 'line' | 'equipment' | 'tag';
  parentId?: string;
  metadata?: Record<string, string>;
  tagCount?: number;
  val: number;
  color: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GLink { source: string; target: string; label: string; }
interface GData { nodes: GNode[]; links: GLink[]; }

// ─── Colors ──────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { color: string; label: string }> = {
  root:       { color: '#6366f1', label: 'Plant Model' },
  enterprise: { color: '#8b5cf6', label: 'Enterprise' },
  site:       { color: '#0ea5e9', label: 'Site' },
  area:       { color: '#10b981', label: 'Area' },
  line:       { color: '#f59e0b', label: 'Line' },
  equipment:  { color: '#ef4444', label: 'Equipment' },
  tag:        { color: '#9ca3af', label: 'Tag' },
};

// ─── Transform ───────────────────────────────────────────────────────

function buildGraph(data: HierarchyData, showTags: boolean): GData {
  const nodes: GNode[] = [];
  const links: GLink[] = [];
  nodes.push({ id: 'root', name: 'ISA-95', type: 'root', val: 24, color: TYPE_COLORS.root.color });

  for (const ent of data.enterprises) {
    nodes.push({ id: `ent:${ent.id}`, name: ent.name, type: 'enterprise', val: 20, color: TYPE_COLORS.enterprise.color });
    links.push({ source: 'root', target: `ent:${ent.id}`, label: 'OWNS' });
    for (const site of ent.sites) {
      nodes.push({ id: `site:${site.id}`, name: site.name, type: 'site', parentId: `ent:${ent.id}`, val: 16, color: TYPE_COLORS.site.color });
      links.push({ source: `ent:${ent.id}`, target: `site:${site.id}`, label: 'HAS_SITE' });
      for (const area of site.areas) {
        nodes.push({ id: `area:${area.id}`, name: area.name, type: 'area', parentId: `site:${site.id}`, val: 14, color: TYPE_COLORS.area.color });
        links.push({ source: `site:${site.id}`, target: `area:${area.id}`, label: 'HAS_AREA' });
        for (const line of area.lines) {
          nodes.push({ id: `line:${line.id}`, name: line.name, type: 'line', parentId: `area:${area.id}`, val: 12, color: TYPE_COLORS.line.color });
          links.push({ source: `area:${area.id}`, target: `line:${line.id}`, label: 'HAS_LINE' });
          for (const eq of line.equipment) {
            nodes.push({ id: `eq:${eq.id}`, name: eq.name, type: 'equipment', parentId: `line:${line.id}`, metadata: { type: eq.type }, tagCount: eq.tags.length, val: 10, color: TYPE_COLORS.equipment.color });
            links.push({ source: `line:${line.id}`, target: `eq:${eq.id}`, label: 'HAS_EQUIPMENT' });
            if (showTags) {
              for (const tag of eq.tags) {
                const tagId = `tag:${eq.id}:${tag}`;
                nodes.push({ id: tagId, name: tag.split('/').pop() || tag, type: 'tag', parentId: `eq:${eq.id}`, metadata: { topic: tag }, val: 6, color: TYPE_COLORS.tag.color });
                links.push({ source: `eq:${eq.id}`, target: tagId, label: 'HAS_TAG' });
              }
            }
          }
        }
      }
    }
  }
  return { nodes, links };
}

// ─── Node Detail ─────────────────────────────────────────────────────

function NodeDetail({ node, onClose }: { node: GNode; onClose: () => void }) {
  const c = TYPE_COLORS[node.type];
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-lg p-4 min-w-[240px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: c?.color }}>{c?.label}</span>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>
      </div>
      <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-2">{node.name}</p>
      <div className="space-y-1.5 text-[12px]">
        {node.metadata && Object.entries(node.metadata).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <span className="text-gray-400 capitalize">{k}</span>
            <span className="text-gray-700 dark:text-gray-300 font-mono truncate max-w-[160px]" title={v}>{v}</span>
          </div>
        ))}
        {(node.tagCount ?? 0) > 0 && (
          <div className="flex justify-between"><span className="text-gray-400">Tags</span><span className="text-gray-700 dark:text-gray-300">{node.tagCount}</span></div>
        )}
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────

function Legend() {
  const types = ['enterprise', 'site', 'area', 'line', 'equipment', 'tag'] as const;
  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-800 p-3 shadow-sm">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">ISA-95</p>
      <div className="space-y-1.5">
        {types.map((t) => (
          <div key={t} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[t].color }} />
            <span className="text-[12px] text-gray-500">{TYPE_COLORS[t].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tree Panel ──────────────────────────────────────────────────────

function TreePanel({ data, onSelect }: { data: HierarchyData; onSelect: (id: string) => void }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));
  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const Item = ({ id, name, type, children, depth }: { id: string; name: string; type: string; children?: React.ReactNode; depth: number }) => {
    const has = !!children;
    const open = expanded.has(id);
    return (
      <div>
        <button
          onClick={() => { if (has) toggle(id); onSelect(id); }}
          className="w-full flex items-center gap-1.5 py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-[12px] transition-colors"
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          {has ? <ChevronRight className={cn('w-3 h-3 text-gray-300 transition-transform', open && 'rotate-90')} /> : <span className="w-3" />}
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[type]?.color }} />
          <span className="text-gray-600 truncate">{name}</span>
        </button>
        {has && open && children}
      </div>
    );
  };

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-800 p-2 max-h-[55vh] overflow-y-auto w-56 shadow-sm">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 px-2">Hierarchy</p>
      {data.enterprises.map(ent => (
        <Item key={ent.id} id={`ent:${ent.id}`} name={ent.name} type="enterprise" depth={0}>
          {ent.sites.map(site => (
            <Item key={site.id} id={`site:${site.id}`} name={site.name} type="site" depth={1}>
              {site.areas.map(area => (
                <Item key={area.id} id={`area:${area.id}`} name={area.name} type="area" depth={2}>
                  {area.lines.map(line => (
                    <Item key={line.id} id={`line:${line.id}`} name={line.name} type="line" depth={3}>
                      {line.equipment.map(eq => (
                        <Item key={eq.id} id={`eq:${eq.id}`} name={eq.name} type="equipment" depth={4}>
                          {eq.tags.length > 0 ? <>{eq.tags.map(tag => (
                            <Item key={tag} id={`tag:${eq.id}:${tag}`} name={tag.split('/').pop() || tag} type="tag" depth={5} />
                          ))}</> : undefined}
                        </Item>
                      ))}
                    </Item>
                  ))}
                </Item>
              ))}
            </Item>
          ))}
        </Item>
      ))}
    </div>
  );
}

// ─── Cypher Console ──────────────────────────────────────────────────

const EXAMPLES = [
  { label: 'All nodes', query: 'MATCH (n) RETURN labels(n) AS label, count(n) AS count ORDER BY count DESC' },
  { label: 'Full hierarchy', query: 'MATCH path = (e:Enterprise)-[:HAS_SITE]->(s)-[:HAS_AREA]->(a)-[:HAS_LINE]->(l)-[:HAS_EQUIPMENT]->(eq) RETURN e.name AS enterprise, s.name AS site, a.name AS area, l.name AS line, eq.name AS equipment' },
  { label: 'Equipment + Tags', query: 'MATCH (eq:Equipment)-[:HAS_TAG]->(t:Tag) RETURN eq.name AS equipment, eq.type AS type, t.topic AS tag, t.last_value AS value' },
  { label: 'Relationships', query: 'MATCH ()-[r]->() RETURN type(r) AS relationship, count(r) AS count ORDER BY count DESC' },
];

function CypherConsole() {
  const [query, setQuery] = useState(EXAMPLES[0].query);
  const [result, setResult] = useState<CypherResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    if (!query.trim() || running) return;
    setRunning(true); setError(null); setResult(null);
    try { setResult(await hierarchyApi.cypher(query.trim())); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); }
    finally { setRunning(false); }
  }, [query, running]);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
  }, [run]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fmt = (v: any): string => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
      {/* Editor */}
      <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4 shrink-0">
        <div className="flex gap-2.5">
          <textarea
            value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKey}
            rows={3} spellCheck={false}
            className="flex-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-[13px] font-mono text-gray-700 dark:text-gray-300 resize-none outline-none placeholder:text-gray-300 focus:border-gray-200 dark:focus:border-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-800 transition-all"
            placeholder="MATCH (n) RETURN n LIMIT 25"
          />
          <button
            onClick={run} disabled={running || !query.trim()}
            className="px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[13px] font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-30 flex items-center gap-1.5 self-end"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <span className="text-[11px] text-gray-300">Examples:</span>
          {EXAMPLES.map((eq) => (
            <button key={eq.label} onClick={() => setQuery(eq.query)}
              className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {eq.label}
            </button>
          ))}
          <span className="text-[10px] text-gray-300 ml-auto hidden sm:inline">Ctrl+Enter to run</span>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto min-h-0">
        {error && (
          <div className="m-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
            <pre className="text-[12px] text-red-500 font-mono whitespace-pre-wrap break-all">{error}</pre>
          </div>
        )}
        {result && (
          <div className="p-4">
            <div className="flex items-center gap-4 mb-3 text-[11px] text-gray-400">
              <span>{result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'}</span>
              {result.resultAvailableAfter !== null && <span>{result.resultAvailableAfter}ms</span>}
              {Object.entries(result.counters).filter(([, v]) => v > 0).map(([k, v]) => (
                <span key={k} className="text-gray-500">{k}: {v}</span>
              ))}
            </div>
            {result.columns.length > 0 && result.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      {result.columns.map(col => (
                        <th key={col} className="px-4 py-2.5 text-left font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-t border-gray-50 dark:border-gray-800/50">
                        {result.columns.map(col => (
                          <td key={col} className="px-4 py-2 text-gray-600 font-mono whitespace-nowrap max-w-[400px] truncate" title={fmt(row[col])}>{fmt(row[col])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : result.rowCount === 0 ? (
              <p className="text-center py-8 text-[13px] text-gray-400">Query executed — no results returned</p>
            ) : null}
          </div>
        )}
        {!result && !error && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[13px] text-gray-300">Run a Cypher query to see results</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stats ───────────────────────────────────────────────────────────

function Stats({ data }: { data: HierarchyData }) {
  let sites = 0, areas = 0, lines = 0, equip = 0, tags = 0;
  for (const e of data.enterprises) { sites += e.sites.length; for (const s of e.sites) { areas += s.areas.length; for (const a of s.areas) { lines += a.lines.length; for (const l of a.lines) { equip += l.equipment.length; for (const eq of l.equipment) tags += eq.tags.length; } } } }
  const items = [
    { v: data.enterprises.length, c: TYPE_COLORS.enterprise },
    { v: sites, c: TYPE_COLORS.site },
    { v: areas, c: TYPE_COLORS.area },
    { v: lines, c: TYPE_COLORS.line },
    { v: equip, c: TYPE_COLORS.equipment },
    { v: tags, c: TYPE_COLORS.tag },
  ];
  return (
    <div className="flex items-center gap-3 flex-wrap text-[12px]">
      {items.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.c.color }} />
          <span className="text-gray-400">{s.c.label}</span>
          <span className="text-gray-700 dark:text-gray-300 font-semibold">{s.v}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────

type Tab = 'graph' | 'cypher';

export function PlantModel() {
  useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [selected, setSelected] = useState<GNode | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [showTree, setShowTree] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [graphData, setGraphData] = useState<GData>({ nodes: [], links: [] });
  const [tab, setTab] = useState<Tab>('graph');

  const { data: hierarchy, isLoading, refetch } = useQuery({
    queryKey: ['plant-hierarchy'], queryFn: hierarchyApi.get, staleTime: 30000,
  });

  useEffect(() => { if (hierarchy) setGraphData(buildGraph(hierarchy, showTags)); }, [hierarchy, showTags]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => { for (const e of entries) { const { width, height } = e.contentRect; if (width > 0 && height > 0) setDims({ width, height }); } });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab, hierarchy]);

  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) setTimeout(() => graphRef.current?.zoomToFit(400, 60), 500);
  }, [graphData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onNodeClick = useCallback((node: any) => {
    setSelected(node as GNode);
    if (graphRef.current && node.x !== undefined) { graphRef.current.centerAt(node.x, node.y, 500); graphRef.current.zoom(2.5, 500); }
  }, []);

  const onTreeSelect = useCallback((nodeId: string) => {
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (node && graphRef.current) { setSelected(node); if (node.x !== undefined) { graphRef.current.centerAt(node.x, node.y, 500); graphRef.current.zoom(2.5, 500); } }
  }, [graphData.nodes]);

  const toggleFs = useCallback(() => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setFullscreen(true); }
    else { document.exitFullscreen(); setFullscreen(false); }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, scale: number) => {
    const n = node as GNode;
    if (n.x === undefined || n.y === undefined) return;
    const sz = n.val || 8;
    const fs = Math.max(11 / scale, 3);
    const isSel = selected?.id === n.id;
    if (isSel) { ctx.beginPath(); ctx.arc(n.x, n.y, sz + 4, 0, 2 * Math.PI); ctx.fillStyle = n.color + '30'; ctx.fill(); }
    ctx.beginPath(); ctx.arc(n.x, n.y, sz, 0, 2 * Math.PI); ctx.fillStyle = n.color; ctx.fill();
    if (isSel) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 / scale; ctx.stroke(); }
    ctx.font = `${isSel ? 'bold ' : ''}${fs}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#00000040'; ctx.fillText(n.name, n.x + 0.5, n.y + sz + 3.5);
    ctx.fillStyle = isSel ? '#ffffff' : '#d1d5db'; ctx.fillText(n.name, n.x, n.y + sz + 3);
  }, [selected]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const s = link.source as GNode, e = link.target as GNode;
    if (!s.x || !s.y || !e.x || !e.y) return;
    const g = ctx.createLinearGradient(s.x, s.y, e.x, e.y);
    g.addColorStop(0, s.color + '50'); g.addColorStop(1, e.color + '50');
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.stroke();
  }, []);

  return (
    <div className={cn('flex flex-col', fullscreen ? 'fixed inset-0 z-50 bg-[#fafafa] dark:bg-gray-950 p-4' : 'h-[calc(100vh-6rem)]')}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Plant Model</h1>
          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">Knowledge Graph — ISA-95</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-gray-50 dark:bg-gray-800/50 rounded-xl p-0.5 mr-1">
            <button onClick={() => setTab('graph')} className={cn('px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors', tab === 'graph' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-500')}>Graph</button>
            <button onClick={() => setTab('cypher')} className={cn('px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors', tab === 'cypher' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-500')}>Cypher</button>
          </div>

          {tab === 'graph' && (
            <>
              <Pill active={showTree} onClick={() => setShowTree(!showTree)}>Tree</Pill>
              <Pill active={showLegend} onClick={() => setShowLegend(!showLegend)}>Legend</Pill>
              <Pill active={showTags} onClick={() => setShowTags(!showTags)}>Tags</Pill>
              <button onClick={toggleFs} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}

          <button onClick={() => refetch()} disabled={isLoading} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Stats */}
      {hierarchy && tab === 'graph' && (
        <div className="mb-3 shrink-0"><Stats data={hierarchy} /></div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        {tab === 'graph' ? (
          <>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
              </div>
            ) : hierarchy && hierarchy.enterprises.length > 0 ? (
              <div ref={containerRef} className="absolute inset-0 rounded-2xl overflow-hidden bg-[#0f1117] border border-gray-200/60 dark:border-gray-800">
                <ForceGraph2D
                  ref={graphRef} graphData={graphData} width={dims.width} height={dims.height}
                  nodeCanvasObject={drawNode} linkCanvasObject={drawLink} onNodeClick={onNodeClick}
                  nodeLabel={(node: GNode) => `${TYPE_COLORS[node.type]?.label || node.type}: ${node.name}`}
                  linkDirectionalParticles={1} linkDirectionalParticleWidth={2}
                  linkDirectionalParticleColor={() => '#6366f1'} linkDirectionalParticleSpeed={0.003}
                  d3AlphaDecay={0.015} d3VelocityDecay={0.25} cooldownTicks={150}
                  backgroundColor="#0f1117" enableNodeDrag enableZoomInteraction enablePanInteraction
                />

                {showTree && <div className="absolute top-3 left-3 z-10"><TreePanel data={hierarchy} onSelect={onTreeSelect} /></div>}
                {showLegend && <div className="absolute top-3 right-3 z-10"><Legend /></div>}
                {selected && selected.id !== 'root' && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                    <NodeDetail node={selected} onClose={() => setSelected(null)} />
                  </div>
                )}

                <div className="absolute bottom-3 right-3 text-[11px] text-gray-500 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                  {graphData.nodes.length} nodes &middot; {graphData.links.length} links
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[14px] text-gray-400 mb-1">No hierarchy configured</p>
                  <p className="text-[12px] text-gray-300">Configure the ISA-95 plant hierarchy to view the Knowledge Graph</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0"><CypherConsole /></div>
        )}
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
        active ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:text-gray-500'
      )}
    >
      {children}
    </button>
  );
}
