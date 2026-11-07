/**
 * Bridges src/components/<slug>/<slug>.md into the docs pages.
 * Files are imported as raw strings, so Vite HMR re-renders the page as soon as the
 * Figma sync engine (scripts/docs-generator.cjs) rewrites a .md file.
 */
const markdownModules = import.meta.glob<string>('../../../components/*/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
});

const markdownBySlug = new Map<string, string>();
for (const [modulePath, content] of Object.entries(markdownModules)) {
  const match = modulePath.match(/\/components\/([^/]+)\/([^/]+)\.md$/);
  // Only the canonical <slug>/<slug>.md file belongs to a component
  if (match && match[1] === match[2]) markdownBySlug.set(match[1], content);
}

export function getComponentMarkdown(slug: string): string | undefined {
  return markdownBySlug.get(slug);
}

export function isFigmaSourcedMarkdown(markdown: string): boolean {
  return markdown.includes('<!-- docs-source: figma -->');
}

