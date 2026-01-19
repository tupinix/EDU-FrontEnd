import { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTranslation } from 'react-i18next';
import { TopicNode } from '../../types';

interface GraphNode {
  id: string;
  name: string;
  fullPath: string;
  level: number;
  levelName: string;
  children: number;
  messageCount: number;
  val: number;
  color: string;
  // D3 force simulation adds these
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface TopicGraphProps {
  topics: TopicNode[];
  onNodeClick?: (node: GraphNode) => void;
  width?: number;
  height?: number;
}

// Color palette for different levels - using green theme
const LEVEL_COLORS: Record<string, string> = {
  root: '#064e3b',      // Dark green
  enterprise: '#059669', // Emerald
  site: '#10b981',      // Light emerald
  area: '#34d399',      // Teal
  line: '#6ee7b7',      // Light teal
  cell: '#a7f3d0',      // Very light green
  device: '#d1fae5',    // Pale green
  other: '#9ca3af',     // Gray
};

const LEVEL_NAMES = ['root', 'enterprise', 'site', 'area', 'line', 'cell', 'device', 'other'];

function getLevelName(level: number): string {
  if (level >= 0 && level < LEVEL_NAMES.length) {
    return LEVEL_NAMES[level];
  }
  return 'other';
}

function getLevelColor(level: number): string {
  const levelName = getLevelName(level);
  return LEVEL_COLORS[levelName] || LEVEL_COLORS.other;
}

function transformTopicsToGraph(topics: TopicNode[]): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeMap = new Map<string, boolean>();

  // Add root node
  nodes.push({
    id: 'root',
    name: 'UNS',
    fullPath: '',
    level: 0,
    levelName: 'root',
    children: 0,
    messageCount: 0,
    val: 20,
    color: LEVEL_COLORS.root,
  });
  nodeMap.set('root', true);

  // Process each topic
  topics.forEach((topic) => {
    const segments = topic.fullPath.split('/');
    let parentId = 'root';

    segments.forEach((segment, index) => {
      const nodeId = segments.slice(0, index + 1).join('/');
      const level = index + 1;

      if (!nodeMap.has(nodeId)) {
        nodes.push({
          id: nodeId,
          name: segment,
          fullPath: nodeId,
          level,
          levelName: getLevelName(level),
          children: topic.children?.length || 0,
          messageCount: topic.messageCount || 0,
          val: Math.max(5, Math.min(15, 5 + (topic.messageCount || 0) / 100)),
          color: getLevelColor(level),
        });
        nodeMap.set(nodeId, true);

        links.push({
          source: parentId,
          target: nodeId,
        });
      }

      parentId = nodeId;
    });
  });

  // Update root children count
  const rootNode = nodes.find(n => n.id === 'root');
  if (rootNode) {
    rootNode.children = links.filter(l => l.source === 'root').length;
  }

  return { nodes, links };
}

export function TopicGraph({ topics, onNodeClick, width, height }: TopicGraphProps) {
  const { t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: width || 800, height: height || 600 });
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Transform topics to graph data
  useEffect(() => {
    if (topics && topics.length > 0) {
      const data = transformTopicsToGraph(topics);
      setGraphData(data);
    }
  }, [topics]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        setDimensions({ width: w, height: h });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Center graph on mount
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        graphRef.current?.zoomToFit(400, 50);
      }, 500);
    }
  }, [graphData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = useCallback((node: any) => {
    const graphNode = node as GraphNode;
    if (onNodeClick) {
      onNodeClick(graphNode);
    }
    // Zoom to node
    if (graphRef.current && graphNode.x !== undefined && graphNode.y !== undefined) {
      graphRef.current.centerAt(graphNode.x, graphNode.y, 500);
      graphRef.current.zoom(2, 500);
    }
  }, [onNodeClick]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node as GraphNode | null);
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? 'pointer' : 'default';
    }
  }, []);

  // Custom node rendering
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const graphNode = node as GraphNode;
    const label = graphNode.name;
    const fontSize = Math.max(10 / globalScale, 3);
    const nodeSize = graphNode.val || 5;
    const isHovered = hoveredNode?.id === graphNode.id;

    if (graphNode.x === undefined || graphNode.y === undefined) return;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(graphNode.x, graphNode.y, nodeSize + (isHovered ? 2 : 0), 0, 2 * Math.PI);
    ctx.fillStyle = graphNode.color;
    ctx.fill();

    // Draw border for hovered node
    if (isHovered) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    // Draw label
    ctx.font = `${isHovered ? 'bold ' : ''}${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isHovered ? '#ffffff' : '#374151';
    ctx.fillText(label, graphNode.x, graphNode.y + nodeSize + 2);
  }, [hoveredNode]);

  // Custom link rendering
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const start = link.source as GraphNode;
    const end = link.target as GraphNode;

    if (!start.x || !start.y || !end.x || !end.y) return;

    // Draw gradient line
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, (start.color || '#10b981') + '80');
    gradient.addColorStop(1, (end.color || '#10b981') + '80');

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, []);

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>{t('discovery.noData')}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gray-900 rounded-lg overflow-hidden">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        nodeLabel={(node: GraphNode) => `${node.fullPath || node.name}`}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={() => '#10b981'}
        linkDirectionalParticleSpeed={0.005}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
        backgroundColor="#111827"
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />

      {/* Stats overlay */}
      <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm">
        <div className="flex items-center gap-4 text-gray-300">
          <span>{t('discovery.nodes')}: <strong className="text-white">{graphData.nodes.length}</strong></span>
          <span>{t('discovery.links')}: <strong className="text-white">{graphData.links.length}</strong></span>
        </div>
      </div>

      {/* Hovered node info */}
      {hoveredNode && hoveredNode.id !== 'root' && (
        <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-3 text-sm max-w-sm">
          <p className="text-white font-medium truncate">{hoveredNode.fullPath}</p>
          <p className="text-gray-400 text-xs mt-1">
            {t(`discovery.levels.${hoveredNode.levelName}`)} | {t('discovery.children')}: {hoveredNode.children}
          </p>
        </div>
      )}
    </div>
  );
}
