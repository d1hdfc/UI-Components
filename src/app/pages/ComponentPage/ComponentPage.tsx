import { createElement, useState } from 'react';
import type { ComponentDocumentation } from './componentRegistry';
import './ComponentPage.scss';

const installCode = 'npm install @d1hdfc/ui-components@main';

function formatValue(value: unknown): string | undefined {
  if (typeof value === 'string') return `"${value.replaceAll('"', '\\"')}"`;
  if (typeof value === 'number') return `{${value}}`;
  if (typeof value === 'boolean') return value ? '' : '{false}';
  if (typeof value === 'function') return '{() => {}}';
  if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
    return `{${JSON.stringify(value)}}`;
  }
  return undefined;
}

function getExampleCode(component: ComponentDocumentation): string {
  const attributes = Object.entries(component.previewProps)
    .filter(([name]) => name !== 'children')
    .flatMap(([name, value]) => {
      const formattedValue = formatValue(value);
      if (formattedValue === undefined) return [];
      return [formattedValue ? `${name}=${formattedValue}` : name];
    });
  const openingTag = `<${component.name}${attributes.length ? ` ${attributes.join(' ')}` : ''}`;
  const children = typeof component.previewChildren === 'string' ? component.previewChildren : '';

  return children
    ? `${openingTag}>${children}</${component.name}>`
    : `${openingTag} />`;
}

function ComponentPreview({ component }: { component: ComponentDocumentation }) {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  if (component.slug === 'bottom-sheet') {
    return (
      <>
        <button type="button" className="auto-component-open-button" onClick={() => setBottomSheetOpen(true)}>
          Open bottom sheet
        </button>
        {bottomSheetOpen && createElement(component.component, {
          ...component.previewProps,
          open: true,
          onClose: () => setBottomSheetOpen(false)
        }, component.previewChildren)}
      </>
    );
  }

  return createElement(component.component, component.previewProps, component.previewChildren);
}

export function ComponentPage({ component }: { component: ComponentDocumentation }) {
  const [showCode, setShowCode] = useState(false);
  const [copyStatus, setCopyStatus] = useState('Copy');
  const importCode = `import { ${component.name} } from '@d1hdfc/ui-components';\nimport '@d1hdfc/ui-components/style.css';`;
  const exampleCode = getExampleCode(component);
  const sourceUrl = `https://github.com/d1hdfc/UI-Components/tree/main/src/components/${component.slug}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(`${importCode}\n\n${exampleCode}`);
      setCopyStatus('Copied');
      window.setTimeout(() => setCopyStatus('Copy'), 1800);
    } catch {
      setCopyStatus('Copy failed');
    }
  };

  return (
    <main className="docs-content auto-component-page" id={component.routeSlug}>
      <div className="docs-breadcrumbs">
        <a href="#button">Components</a><span>/</span><strong>{component.title}</strong>
      </div>

      <header className="docs-heading">
        <div>
          <p className="docs-eyebrow">COMPONENTS</p>
          <div className="docs-title-row">
            <h1>{component.title}</h1>
            <span className="docs-status"><i /> Stable</span>
          </div>
          <p className="docs-intro">
            Live documentation generated from <code>src/components/{component.slug}</code>.
            Use the preview to explore the {component.title} component.
          </p>
          <div className="docs-heading-links">
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">↗</span> View source
            </a>
            {component.figmaUrl && (
              <a href={component.figmaUrl} target="_blank" rel="noopener noreferrer">
                View in Figma <span aria-hidden="true">↗</span>
              </a>
            )}
            <a href="#component-examples">Examples</a>
          </div>
        </div>
      </header>

      <section className="docs-section" id="component-installation">
        <div className="docs-section-heading">
          <div>
            <h2>Installation</h2>
            <p>Install the shared package and import the component styles.</p>
          </div>
        </div>
        <div className="auto-component-code">
          <pre><code>{installCode}</code></pre>
          <pre><code>{importCode}</code></pre>
        </div>
      </section>

      <section className="docs-section" id="component-examples">
        <div className="docs-section-heading">
          <div>
            <h2>Live preview</h2>
            <p>This preview renders the component directly from its source folder.</p>
          </div>
        </div>
        <article className="auto-component-example">
          <div className="auto-component-example-heading">
            <div>
              <h3>{component.title}</h3>
              <p>Interactive component preview</p>
            </div>
            <button type="button" onClick={() => setShowCode((visible) => !visible)} aria-expanded={showCode}>
              {showCode ? 'Hide code' : 'View code'}
            </button>
          </div>
          <div className="auto-component-preview">
            <ComponentPreview component={component} />
          </div>
          {showCode && (
            <div className="auto-component-code-example">
              <div>
                <span>React · TypeScript</span>
                <button type="button" onClick={copyCode} aria-live="polite">{copyStatus}</button>
              </div>
              <pre><code>{`${importCode}\n\n${exampleCode}`}</code></pre>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
