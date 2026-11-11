/**
 * Bridges all 5 canonical component files in src/components/<slug>/ into the Atlassian-style
 * Design System Portal:
 *   1. <slug>.tsx
 *   2. <slug>.types.ts
 *   3. <slug>.scss
 *   4. <slug>.dart
 *   5. <slug>.md
 *
 * Files are imported as raw strings via Vite's import.meta.glob, so Vite HMR re-renders
 * the portal tabs immediately whenever the Figma sync engine creates or updates any file.
 */
const markdownModules = import.meta.glob<string>('../../../components/*/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
});

const tsxModules = import.meta.glob<string>('../../../components/*/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default'
});

const typesModules = import.meta.glob<string>('../../../components/*/*.types.ts', {
  eager: true,
  query: '?raw',
  import: 'default'
});

const scssModules = import.meta.glob<string>('../../../components/*/*.scss', {
  eager: true,
  query: '?raw',
  import: 'default'
});

const dartModules = import.meta.glob<string>('../../../components/*/*.dart', {
  eager: true,
  query: '?raw',
  import: 'default'
});

export interface ComponentSourceFiles {
  tsx: string;
  types: string;
  scss: string;
  dart: string;
  md: string;
}

function buildSlugMap(modules: Record<string, string>, extPattern: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = new RegExp(`/components/([^/]+)/([^/]+)\\.${extPattern}$`);
  for (const [modulePath, content] of Object.entries(modules)) {
    const match = modulePath.match(re);
    if (match && match[1].toLowerCase() === match[2].toLowerCase()) {
      map.set(match[1], content);
    }
  }
  return map;
}

const markdownBySlug = buildSlugMap(markdownModules, 'md');
const tsxBySlug = buildSlugMap(tsxModules, 'tsx');
const typesBySlug = buildSlugMap(typesModules, 'types\\.ts');
const scssBySlug = buildSlugMap(scssModules, 'scss');
const dartBySlug = buildSlugMap(dartModules, 'dart');

export function getComponentMarkdown(slug: string): string | undefined {
  return markdownBySlug.get(slug);
}

export function getComponentSourceFiles(slug: string): ComponentSourceFiles {
  return {
    tsx: tsxBySlug.get(slug) ?? `// src/components/${slug}/${slug}.tsx`,
    types: typesBySlug.get(slug) ?? `// src/components/${slug}/${slug}.types.ts`,
    scss: scssBySlug.get(slug) ?? `// src/components/${slug}/${slug}.scss`,
    dart: dartBySlug.get(slug) ?? `// src/components/${slug}/${slug}.dart`,
    md: markdownBySlug.get(slug) ?? `# ${slug}\n\n## Figma Changelog & Diff Status\n\n> [!TIP]\n> **Nothing changed** — Component matches the latest Figma baseline.`
  };
}

export function isFigmaSourcedMarkdown(markdown: string): boolean {
  return markdown.includes('<!-- docs-source: figma -->');
}

export function getComponentChangelogStatus(slug: string): {
  hasChanges: boolean;
  summary: string;
  sectionMarkdown: string;
} {
  const md = markdownBySlug.get(slug) ?? '';
  const match = md.match(/##\s+Figma Changelog & Diff Status[\s\S]*$/i);
  const sectionMarkdown = match
    ? match[0]
    : `## Figma Changelog & Diff Status\n\n> [!TIP]\n> **Nothing changed** — Component matches the latest Figma baseline.`;
  const hasChanges = /\[!IMPORTANT\]|Changes detected|modified in Figma/i.test(sectionMarkdown) &&
    !/Nothing changed|Nothing to change/i.test(sectionMarkdown);
  const summary = hasChanges ? 'Figma updates synced' : 'Nothing changed';
  return { hasChanges, summary, sectionMarkdown };
}
