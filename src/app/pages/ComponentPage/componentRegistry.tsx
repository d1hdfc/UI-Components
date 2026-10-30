import type { ComponentType, ReactNode } from 'react';
import { figmaComponentCatalog } from '../../../figma/componentCatalog';

type PreviewComponent = ComponentType<Record<string, unknown>>;

export type ComponentDocumentation = {
  component: PreviewComponent;
  figmaUrl?: string;
  name: string;
  previewChildren?: ReactNode;
  previewProps: Record<string, unknown>;
  routeSlug: string;
  slug: string;
  title: string;
};

type PreviewExample = {
  children?: ReactNode;
  props?: Record<string, unknown>;
};

const previewExamples: Record<string, PreviewExample> = {
  avatar: { props: { initials: 'JD', size: 'large', status: 'online' } },
  badge: { children: 'New' },
  'bottom-sheet': {
    children: 'Review your details before continuing.',
    props: { open: false, title: 'Review details', onClose: () => undefined }
  },
  'browser-bar': { props: { address: 'hdfcbank.com' } },
  button: { children: 'Continue', props: { size: 'medium', variant: 'primary' } },
  card: {
    children: 'Account overview',
    props: { padding: 'medium', variant: 'outlined' }
  },
  carousel: { props: { items: ['First slide', 'Second slide', 'Third slide'] } },
  checkbox: { props: { checked: true, label: 'Remember this choice' } },
  chips: { children: 'Personal', props: { selected: true } },
  'focus-ring': { children: 'Focus me', props: { visible: true } },
  'mpin-input': { props: { label: 'Enter your MPIN', length: 4 } },
  pagination: { props: { page: 2, pageCount: 5, onPageChange: () => undefined } },
  popover: { props: { trigger: 'Open details', content: 'Additional account details' } },
  'progress-bar': { props: { value: 68, label: 'Profile completion', showValue: true } },
  radio: { props: { checked: true, label: 'Savings account', name: 'account-type' } },
  rating: { props: { label: 'Rating', value: 4 } },
  'search-bar': { props: { placeholder: 'Search' } },
  separator: {},
  snackbar: { props: { message: 'Your changes have been saved', actionLabel: 'Undo' } },
  'status-bar': { props: { time: '9:41', batteryLevel: 82 } },
  switch: { props: { checked: true, label: 'Enable notifications' } },
  tabs: {
    props: {
      items: [
        { id: 'overview', label: 'Overview', content: 'Account overview' },
        { id: 'activity', label: 'Activity', content: 'Recent activity' }
      ]
    }
  },
  tag: { children: 'Verified' },
  'text-area': { props: { label: 'Message', placeholder: 'Write a message' } },
  'text-field': { props: { label: 'Full name', placeholder: 'Enter your name' } },
  toast: { props: { title: 'Payment complete', description: 'Your payment was processed.' } },
  tooltip: { children: 'Hover to see more', props: { content: 'Helpful information' } }
};

const componentModules = import.meta.glob<unknown>(
  '../../../components/*/*.tsx',
  { eager: true, import: 'default' }
);

const figmaPagesBySlug: Record<string, string> = {
  avatar: 'Avatar',
  badge: 'Badge',
  'bottom-sheet': 'bottomsheet',
  'browser-bar': 'status bar / browser',
  button: 'Button',
  card: 'Card',
  carousel: 'Carousel hook',
  checkbox: 'Controls',
  chips: 'Chips',
  'focus-ring': 'Focus ring',
  'mpin-input': 'MPIN-input',
  pagination: 'Pagination',
  popover: 'Popover',
  'progress-bar': 'Progress bar',
  radio: 'Controls',
  rating: 'Rating',
  'search-bar': 'Search bar',
  separator: 'seperator',
  snackbar: 'Snackbar',
  'status-bar': 'status bar / browser',
  switch: 'Controls',
  tabs: 'Tabs',
  tag: 'tag',
  'text-area': 'Input-Area',
  'text-field': 'Text-input',
  toast: 'Toast',
  tooltip: 'Tooltip'
};

const figmaNamesBySlug: Record<string, string> = {
  'bottom-sheet': 'bottomsheet',
  'browser-bar': 'browser',
  checkbox: 'checkbox',
  carousel: 'carousel hook',
  radio: 'radio',
  'status-bar': 'status bar',
  switch: 'toggle'
};

function isPreviewComponent(value: unknown): value is PreviewComponent {
  return typeof value === 'function';
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getFigmaUrl(slug: string): string | undefined {
  const pageName = figmaPagesBySlug[slug];
  if (!pageName) return undefined;

  const candidates = figmaComponentCatalog.components.filter(
    (entry) => normalize(entry.pageName) === normalize(pageName)
  );
  const preferredName = figmaNamesBySlug[slug];
  const match = preferredName
    ? candidates.find((entry) => normalize(entry.name).includes(normalize(preferredName)))
    : undefined;
  const entry = match ?? candidates.find((candidate) => candidate.type === 'COMPONENT_SET') ?? candidates[0];
  if (!entry) return undefined;

  const nodeId = encodeURIComponent(entry.nodeId.replace(':', '-'));
  return `https://www.figma.com/design/${figmaComponentCatalog.fileKey}?node-id=${nodeId}`;
}

function getTitle(slug: string): string {
  return slug
    .split('-')
    .map((part) => {
      if (part.toLowerCase() === 'mpin') return 'MPin';
      return `${part.charAt(0).toUpperCase()}${part.slice(1)}`;
    })
    .join(' ');
}

export const componentDocumentation: ComponentDocumentation[] = Object.entries(componentModules)
  .flatMap(([modulePath, component]) => {
    const match = modulePath.match(/\/components\/([^/]+)\/([^/]+)\.tsx$/);
    if (!match || match[1] === 'assets' || !isPreviewComponent(component)) return [];

    const [, slug, filename] = match;
    const example = previewExamples[slug] ?? {};

    return [{
      component,
      figmaUrl: getFigmaUrl(slug),
      name: filename,
      previewChildren: example.children,
      previewProps: example.props ?? {},
      routeSlug: slug === 'text-field' ? 'textfield' : slug === 'text-area' ? 'textarea' : slug,
      slug,
      title: getTitle(slug)
    }];
  })
  .sort((left, right) => left.title.localeCompare(right.title));
