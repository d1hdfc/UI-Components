import source from './components.json';

export type FigmaComponentEntry = {
  key: string;
  name: string;
  pageName: string;
  description: string;
  nodeId: string;
  type: 'COMPONENT' | 'COMPONENT_SET';
  thumbnailUrl: string;
};

type FigmaComponentCatalog = {
  fileKey: string;
  version: string;
  components: FigmaComponentEntry[];
};

export const figmaComponentCatalog = source as FigmaComponentCatalog;
