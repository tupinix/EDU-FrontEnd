import type { TopicNode } from '../../types';

// The Explorer is organised by "equipment": any level of the namespace that has
// tags (topics with a value) directly under it. These helpers read that shape
// out of the topic tree.

/** Topics with a value directly under this node. */
export function valueChildren(node: TopicNode): TopicNode[] {
  return node.children.filter((c) => c.hasValue);
}

/** Levels under this node that are folders (have children of their own). */
export function folderChildren(node: TopicNode): TopicNode[] {
  return node.children.filter((c) => c.children.length > 0);
}

export function findNode(nodes: TopicNode[], path: string): TopicNode | null {
  for (const n of nodes) {
    if (n.fullPath === path) return n;
    if (path.startsWith(n.fullPath + '/')) {
      const hit = findNode(n.children, path);
      if (hit) return hit;
    }
  }
  return null;
}

/** First level, in tree order, that has tags of its own: the natural place to start. */
export function firstEquipment(nodes: TopicNode[]): TopicNode | null {
  for (const n of nodes) {
    if (valueChildren(n).length > 0) return n;
    const hit = firstEquipment(folderChildren(n));
    if (hit) return hit;
  }
  return null;
}

/** Tags with a value at any depth under these nodes. */
export function countValueTopics(nodes: TopicNode[]): number {
  return nodes.reduce((n, node) => n + (node.hasValue ? 1 : 0) + countValueTopics(node.children), 0);
}

/** Keeps the folders whose path, or any tag under them, matches the query. */
export function filterTree(nodes: TopicNode[], query: string): TopicNode[] {
  if (!query) return nodes;
  const q = query.toLowerCase();
  const visit = (n: TopicNode): TopicNode | null => {
    if (n.fullPath.toLowerCase().includes(q)) return n;
    const kids = n.children.map(visit).filter((c): c is TopicNode => c !== null);
    return kids.length > 0 ? { ...n, children: kids } : null;
  };
  return nodes.map(visit).filter((n): n is TopicNode => n !== null);
}

export const parentPath = (path: string) => path.split('/').slice(0, -1).join('/');
export const leafName = (path: string) => path.split('/').pop() ?? path;
