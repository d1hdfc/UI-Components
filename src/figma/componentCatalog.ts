import source from './components.json';

export type FigmaComponentEntry = {
  key: string;
  name: string;
  description: string;
  nodeId: string;
  thumbnailUrl: string;
};

type FigmaComponentCatalog = {
  fileKey: string;
  components: FigmaComponentEntry[];
};

export const figmaComponentCatalog = source as FigmaComponentCatalog;
