export type EditionMode = 'standard' | 'edge';

export const editionPages: Record<EditionMode, string[]> = {
  standard: [
    '/', '/neo4j', '/explorer', '/configuration',
    '/ignition', '/connections', '/users',
  ],
  edge: [
    '/', '/explorer', '/configuration',
    '/modbus', '/opcua', '/connections', '/users',
  ],
};

export const editionLabels: Record<EditionMode, { title: string; description: string }> = {
  standard: {
    title: 'EDU Standard',
    description: 'Plataforma central de dados industriais',
  },
  edge: {
    title: 'EDU Edge',
    description: 'Gateway de protocolos de campo',
  },
};
