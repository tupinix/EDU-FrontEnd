export type EditionMode = 'standard' | 'edge';

export const editionPages: Record<EditionMode, string[]> = {
  standard: [
    '/', '/data-models', '/neo4j', '/explorer', '/configuration',
    '/connections', '/users', '/alerts', '/process', '/licenses',
  ],
  edge: [
    '/', '/data-models', '/explorer', '/configuration',
    '/modbus', '/opcua', '/ethip', '/connections', '/users', '/alerts', '/process',
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
