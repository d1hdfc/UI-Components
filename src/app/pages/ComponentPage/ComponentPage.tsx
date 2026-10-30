import { createElement, useState } from 'react';
import type { ComponentDocumentation } from './componentRegistry';
import './ComponentPage.scss';

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

function getFlutterCode(component: ComponentDocumentation): string {
  const widgetName = component.name.replace(/([A-Z])/g, (m, c, i) => i === 0 ? c : `_${c}`).toUpperCase();
  return `// Flutter\nimport 'package:hdfc_ui/hdfc_ui.dart';\n\n${widgetName}(\n  // props here\n)`;
}

function getHtmlCode(component: ComponentDocumentation): string {
  const cls = component.slug;
  return `<!-- HTML/CSS -->\n<div class="${cls}-component">\n  <!-- ${component.title} -->\n</div>`;
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

type CodeTab = 'react' | 'flutter' | 'html';

export function ComponentPage({ component }: { component: ComponentDocumentation }) {
  const [showCode, setShowCode] = useState(false);
  const [activeTab, setActiveTab] = useState<CodeTab>('react');
  const [copyStatus, setCopyStatus] = useState('Copy');

  const installCode = 'npm install @d1hdfc/ui-components@main';
  const importCode = `import { ${component.name} } from '@d1hdfc/ui-components';\nimport '@d1hdfc/ui-components/style.css';`;
  const exampleCode = getExampleCode(component);
  const flutterCode = getFlutterCode(component);
  const htmlCode = getHtmlCode(component);
  const sourceUrl = `https://github.com/d1hdfc/UI-Components/tree/main/src/components/${component.slug}`;

  const codeByTab: Record<CodeTab, string> = {
    react: `${importCode}\n\n${exampleCode}`,
    flutter: flutterCode,
    html: htmlCode,
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeByTab[activeTab]);
      setCopyStatus('Copied!');
      window.setTimeout(() => setCopyStatus('Copy'), 1800);
    } catch {
      setCopyStatus('Failed');
    }
  };

  return (
    <main className="docs-content auto-component-page" id={component.routeSlug}>
      {/* Breadcrumb */}
      <div className="docs-breadcrumbs">
        <a href="#button">Components</a>
        <span>/</span>
        <strong>{component.title}</strong>
      </div>

      {/* Header */}
      <header className="docs-heading">
        <div className="docs-heading-inner">
          <p className="docs-eyebrow">COMPONENT</p>
          <div className="docs-title-row">
            <h1>{component.title}</h1>
            <span className="docs-status-badge">
              <span className="docs-status-dot" />
              Stable
            </span>
          </div>
          <p className="docs-intro">
            Live documentation rendered from{' '}
            <code>src/components/{component.slug}</code>.
            Use the preview to explore variants, sizes, and states.
          </p>
          <div className="docs-heading-links">
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              ↗ View source
            </a>
            {component.figmaUrl && (
              <a href={component.figmaUrl} target="_blank" rel="noopener noreferrer">
                🎨 Open in Figma
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Installation */}
      <section className="docs-section" id="component-installation">
        <div className="docs-section-heading">
          <h2>Installation</h2>
          <p>Install the package and import component styles.</p>
        </div>
        <div className="auto-component-code-blocks">
          <div className="auto-code-block">
            <span className="auto-code-block-label">npm</span>
            <pre><code>{installCode}</code></pre>
          </div>
          <div className="auto-code-block">
            <span className="auto-code-block-label">Import</span>
            <pre><code>{importCode}</code></pre>
          </div>
        </div>
      </section>

      {/* Live Preview */}
      <section className="docs-section" id="component-examples">
        <div className="docs-section-heading">
          <h2>Examples</h2>
          <p>Interactive preview rendered directly from source.</p>
        </div>

        <article className="auto-component-example">
          <div className="auto-component-example-heading">
            <div>
              <h3>{component.title}</h3>
              <p>Interactive component preview</p>
            </div>
            <button
              type="button"
              className="auto-view-code-btn"
              onClick={() => setShowCode(v => !v)}
              aria-expanded={showCode}
            >
              {showCode ? 'Hide code' : 'View code'}
            </button>
          </div>

          <div className="auto-component-preview">
            <ComponentPreview component={component} />
          </div>

          {showCode && (
            <div className="auto-component-code-example">
              <div className="auto-code-tabs-bar">
                <div className="auto-code-tabs">
                  {(['react', 'flutter', 'html'] as CodeTab[]).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      className={`auto-code-tab${activeTab === tab ? ' auto-code-tab--active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === 'react' ? 'React · TS' : tab === 'flutter' ? 'Flutter' : 'HTML / CSS'}
                    </button>
                  ))}
                </div>
                <button type="button" className="auto-copy-btn" onClick={copyCode} aria-live="polite">
                  {copyStatus}
                </button>
              </div>
              <pre className="auto-code-body"><code>{codeByTab[activeTab]}</code></pre>
            </div>
          )}
        </article>
      </section>

      {/* Usage Guidelines */}
      <section className="docs-section" id="component-guidelines">
        <div className="docs-section-heading">
          <h2>Usage guidelines</h2>
          <p>Best practices for using {component.title} in your product.</p>
        </div>
        <div className="auto-guidelines-grid">
          <div className="auto-guideline-card auto-guideline-card--do">
            <div className="auto-guideline-card-header">
              <span className="auto-guideline-icon">✓</span>
              <strong>Do</strong>
            </div>
            <p>Use <strong>{component.title}</strong> for its intended purpose following HDFC design tokens.</p>
          </div>
          <div className="auto-guideline-card auto-guideline-card--dont">
            <div className="auto-guideline-card-header">
              <span className="auto-guideline-icon">✗</span>
              <strong>Don't</strong>
            </div>
            <p>Don't override component internals or bypass the design system API.</p>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="docs-section" id="component-api">
        <div className="docs-section-heading">
          <h2>API reference</h2>
          <p>Props and configuration options for {component.title}.</p>
        </div>
        <div className="auto-props-table-wrap">
          <table className="auto-props-table">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(component.previewProps).map(([prop, value]) => (
                <tr key={prop}>
                  <td><code>{prop}</code></td>
                  <td><code>{typeof value}</code></td>
                  <td><code>{String(value)}</code></td>
                  <td>–</td>
                </tr>
              ))}
              {component.previewChildren !== undefined && (
                <tr>
                  <td><code>children</code></td>
                  <td><code>ReactNode</code></td>
                  <td>–</td>
                  <td>Child content rendered inside the component.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
