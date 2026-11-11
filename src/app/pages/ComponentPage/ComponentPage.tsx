import { createElement, useState } from 'react';
import type { ComponentDocumentation } from './componentRegistry';
import {
  getComponentChangelogStatus,
  getComponentMarkdown,
  getComponentSourceFiles,
  isFigmaSourcedMarkdown
} from './componentMarkdown';
import { ComponentSourceInspector, MarkdownView } from '../../components/MarkdownView';
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

function getExampleCode(
  component: ComponentDocumentation,
  overrides: Record<string, unknown>
): string {
  const mergedProps = { ...component.previewProps, ...overrides };
  const attributes = Object.entries(mergedProps)
    .filter(([name, val]) => name !== 'children' && val !== false && val !== undefined)
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

function ComponentPreview({
  component,
  overrides
}: {
  component: ComponentDocumentation;
  overrides: Record<string, unknown>;
}) {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const mergedProps = { ...component.previewProps, ...overrides };

  if (component.slug === 'bottom-sheet') {
    return (
      <>
        <button
          type="button"
          className="auto-component-open-button"
          onClick={() => setBottomSheetOpen(true)}
        >
          Open bottom sheet
        </button>
        {bottomSheetOpen &&
          createElement(
            component.component,
            {
              ...mergedProps,
              open: true,
              onClose: () => setBottomSheetOpen(false)
            },
            component.previewChildren
          )}
      </>
    );
  }

  return createElement(component.component, mergedProps, component.previewChildren);
}

type PortalMainTab = 'preview' | 'code' | 'specs';
type QuickCodeTab = 'tsx' | 'scss' | 'dart' | 'md';

export function ComponentPage({ component }: { component: ComponentDocumentation }) {
  const [portalTab, setPortalTab] = useState<PortalMainTab>('preview');
  const [showCode, setShowCode] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<QuickCodeTab>('tsx');
  const [copyStatus, setCopyStatus] = useState('Copy');

  // Interactive playground controls for component preview
  const [variantOverride, setVariantOverride] = useState<string>(
    String(component.previewProps.variant ?? 'primary')
  );
  const [sizeOverride, setSizeOverride] = useState<string>(
    String(component.previewProps.size ?? 'medium')
  );
  const [disabledOverride, setDisabledOverride] = useState<boolean>(
    Boolean(component.previewProps.disabled ?? false)
  );
  const [loadingOverride, setLoadingOverride] = useState<boolean>(
    Boolean(component.previewProps.loading ?? false)
  );

  const liveOverrides: Record<string, unknown> = {
    variant: variantOverride,
    size: sizeOverride,
    disabled: disabledOverride,
    loading: loadingOverride
  };

  const sourceFiles = getComponentSourceFiles(component.slug);
  const markdown = getComponentMarkdown(component.slug);
  const changelog = getComponentChangelogStatus(component.slug);

  const installCode = 'npm install @d1hdfc/ui-components@main';
  const importCode = `import { ${component.name} } from '@d1hdfc/ui-components';\nimport '@d1hdfc/ui-components/style.scss';`;
  const exampleCode = getExampleCode(component, liveOverrides);
  const sourceUrl = `https://github.com/d1hdfc/UI-Components/tree/main/src/components/${component.slug}`;

  const codeByTab: Record<QuickCodeTab, string> = {
    tsx: `${importCode}\n\n${exampleCode}\n\n/* --- Full Source: src/components/${component.slug}/${component.slug}.tsx --- */\n${sourceFiles.tsx}`,
    scss: sourceFiles.scss,
    dart: sourceFiles.dart,
    md: sourceFiles.md
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeByTab[activeCodeTab]);
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
          <p className="docs-eyebrow">ATLASSIAN DESIGN SYSTEM · COMPONENT</p>
          <div className="docs-title-row">
            <h1>{component.title}</h1>
            <span className="docs-status-badge">
              <span className="docs-status-dot" />
              Stable
            </span>
            <span
              className={`docs-diff-badge ${
                changelog.hasChanges ? 'docs-diff-badge--updated' : 'docs-diff-badge--clean'
              }`}
            >
              {changelog.hasChanges ? '● Figma Changes Synced' : '✓ Nothing changed'}
            </span>
          </div>
          <p className="docs-intro">
            Live interactive component rendered from{' '}
            <code>src/components/{component.slug}/</code> (strict 5-file architecture:{' '}
            <code>.tsx</code>, <code>.types.ts</code>, <code>.scss</code>, <code>.dart</code>,{' '}
            <code>.md</code>).
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

        {/* Atlassian-Style Top-Level Portal Tabs */}
        <div className="atlassian-portal-tabs" role="tablist" aria-label="Component portal tabs">
          <button
            type="button"
            role="tab"
            aria-selected={portalTab === 'preview'}
            className={`atlassian-portal-tab${
              portalTab === 'preview' ? ' atlassian-portal-tab--active' : ''
            }`}
            onClick={() => setPortalTab('preview')}
          >
            1. Preview & Playground
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={portalTab === 'code'}
            className={`atlassian-portal-tab${
              portalTab === 'code' ? ' atlassian-portal-tab--active' : ''
            }`}
            onClick={() => setPortalTab('code')}
          >
            2. Code Snippets (.tsx · .scss · .dart · .md)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={portalTab === 'specs'}
            className={`atlassian-portal-tab${
              portalTab === 'specs' ? ' atlassian-portal-tab--active' : ''
            }`}
            onClick={() => setPortalTab('specs')}
          >
            3. Figma Specs & Changelog
          </button>
        </div>
      </header>

      {/* TAB 2: CODE SNIPPETS INSPECTOR */}
      {portalTab === 'code' && (
        <section className="docs-section" id="component-code-inspector">
          <div className="docs-section-heading">
            <h2>Code Snippets Inspector ({component.title})</h2>
            <p>
              Inspect the 5 canonical component files inside{' '}
              <code>src/components/{component.slug}/</code> with one-click copy to clipboard.
            </p>
          </div>
          <ComponentSourceInspector slug={component.slug} />
        </section>
      )}

      {/* TAB 3: FIGMA SPECS & CHANGELOG */}
      {portalTab === 'specs' && (
        <section className="docs-section" id="component-docs">
          <div className="docs-section-heading md-docs-heading">
            <div>
              <h2>Figma Specifications & Changelog ({component.title})</h2>
              <p>
                Rendered live from <code>src/components/{component.slug}/{component.slug}.md</code>.
              </p>
            </div>
            {markdown && (
              <span
                className={`md-source-badge ${
                  isFigmaSourcedMarkdown(markdown) ? 'md-source-badge--figma' : ''
                }`}
              >
                {isFigmaSourcedMarkdown(markdown) ? 'Synced from Figma' : 'Local baseline'}
              </span>
            )}
          </div>
          {markdown ? (
            <div className="md-docs-card">
              <MarkdownView markdown={markdown} hideTitle />
            </div>
          ) : (
            <div className="md-docs-card">
              <MarkdownView markdown={changelog.sectionMarkdown} />
            </div>
          )}
        </section>
      )}

      {/* TAB 1: PREVIEW, PLAYGROUND, INSTALLATION, GUIDELINES & API */}
      {portalTab === 'preview' && (
        <>
          {/* Live Interactive Preview & Playground */}
          <section className="docs-section" id="component-examples">
            <div className="docs-section-heading">
              <h2>Interactive Preview & Playground</h2>
              <p>Test variants, sizes, and states live from source.</p>
            </div>

            <article className="auto-component-example">
              <div className="auto-component-example-heading">
                <div>
                  <h3>{component.title}</h3>
                  <p>Live interactive rendering · Adjust controls below</p>
                </div>
                <div className="auto-example-actions">
                  <button
                    type="button"
                    className="auto-view-code-btn"
                    onClick={() => setPortalTab('code')}
                  >
                    Inspect 5 Files ↗
                  </button>
                  <button
                    type="button"
                    className="auto-view-code-btn"
                    onClick={() => setShowCode((v) => !v)}
                    aria-expanded={showCode}
                  >
                    {showCode ? 'Hide snippet' : 'View snippet'}
                  </button>
                </div>
              </div>

              {/* Interactive Controls Bar */}
              <div className="auto-playground-controls">
                <label className="auto-playground-field">
                  <span>Variant</span>
                  <select
                    value={variantOverride}
                    onChange={(e) => setVariantOverride(e.target.value)}
                  >
                    <option value="primary">primary</option>
                    <option value="secondary">secondary</option>
                    <option value="tertiary">tertiary</option>
                    <option value="outlined">outlined</option>
                  </select>
                </label>
                <label className="auto-playground-field">
                  <span>Size</span>
                  <select value={sizeOverride} onChange={(e) => setSizeOverride(e.target.value)}>
                    <option value="small">small</option>
                    <option value="medium">medium</option>
                    <option value="large">large</option>
                  </select>
                </label>
                <label className="auto-playground-checkbox">
                  <input
                    type="checkbox"
                    checked={disabledOverride}
                    onChange={(e) => setDisabledOverride(e.target.checked)}
                  />
                  <span>Disabled</span>
                </label>
                <label className="auto-playground-checkbox">
                  <input
                    type="checkbox"
                    checked={loadingOverride}
                    onChange={(e) => setLoadingOverride(e.target.checked)}
                  />
                  <span>Loading</span>
                </label>
              </div>

              <div className="auto-component-preview">
                <ComponentPreview component={component} overrides={liveOverrides} />
              </div>

              {showCode && (
                <div className="auto-component-code-example">
                  <div className="auto-code-tabs-bar">
                    <div className="auto-code-tabs">
                      {(['tsx', 'scss', 'dart', 'md'] as QuickCodeTab[]).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          className={`auto-code-tab${
                            activeCodeTab === tab ? ' auto-code-tab--active' : ''
                          }`}
                          onClick={() => setActiveCodeTab(tab)}
                        >
                          {tab === 'tsx'
                            ? 'React (.tsx)'
                            : tab === 'scss'
                            ? 'Styles (.scss)'
                            : tab === 'dart'
                            ? 'Flutter (.dart)'
                            : 'Markdown (.md)'}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="auto-copy-btn"
                      onClick={copyCode}
                      aria-live="polite"
                    >
                      {copyStatus}
                    </button>
                  </div>
                  <pre className="auto-code-body">
                    <code>{codeByTab[activeCodeTab]}</code>
                  </pre>
                </div>
              )}
            </article>
          </section>

          {/* Installation */}
          <section className="docs-section" id="component-installation">
            <div className="docs-section-heading">
              <h2>Installation</h2>
              <p>Install the package and import component styles.</p>
            </div>
            <div className="auto-component-code-blocks">
              <div className="auto-code-block">
                <span className="auto-code-block-label">npm</span>
                <pre>
                  <code>{installCode}</code>
                </pre>
              </div>
              <div className="auto-code-block">
                <span className="auto-code-block-label">Import</span>
                <pre>
                  <code>{importCode}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* Inline Figma Changelog & Diff Summary Card */}
          <section className="docs-section" id="component-docs">
            <div className="docs-section-heading md-docs-heading">
              <div>
                <h2>Figma Changelog & Diff Status</h2>
                <p>
                  Live status from <code>src/components/{component.slug}/{component.slug}.md</code>.
                </p>
              </div>
              <button
                type="button"
                className="auto-view-code-btn"
                onClick={() => setPortalTab('specs')}
              >
                Open Full Figma Specs →
              </button>
            </div>
            <div className="md-docs-card">
              <MarkdownView markdown={changelog.sectionMarkdown} />
            </div>
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
                <p>
                  Use <strong>{component.title}</strong> for its intended purpose following HDFC
                  design tokens (`token&gt;variables`).
                </p>
              </div>
              <div className="auto-guideline-card auto-guideline-card--dont">
                <div className="auto-guideline-card-header">
                  <span className="auto-guideline-icon">✗</span>
                  <strong>Don't</strong>
                </div>
                <p>
                  Don't hardcode raw hex or pixel values — always reference semantic token variables.
                </p>
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
                  <tr>
                    <td>
                      <code>variant</code>
                    </td>
                    <td>
                      <code>'primary' | 'secondary' | 'tertiary' | 'outlined'</code>
                    </td>
                    <td>
                      <code>{String(component.previewProps.variant ?? 'primary')}</code>
                    </td>
                    <td>Visual emphasis variant mapped to Figma token variables.</td>
                  </tr>
                  <tr>
                    <td>
                      <code>size</code>
                    </td>
                    <td>
                      <code>'small' | 'medium' | 'large'</code>
                    </td>
                    <td>
                      <code>{String(component.previewProps.size ?? 'medium')}</code>
                    </td>
                    <td>Size configuration synced with Figma layout tokens.</td>
                  </tr>
                  {Object.entries(component.previewProps)
                    .filter(([prop]) => prop !== 'variant' && prop !== 'size')
                    .map(([prop, value]) => (
                      <tr key={prop}>
                        <td>
                          <code>{prop}</code>
                        </td>
                        <td>
                          <code>{typeof value}</code>
                        </td>
                        <td>
                          <code>{String(value)}</code>
                        </td>
                        <td>Component property synced from Figma.</td>
                      </tr>
                    ))}
                  <tr>
                    <td>
                      <code>children</code>
                    </td>
                    <td>
                      <code>ReactNode</code>
                    </td>
                    <td>–</td>
                    <td>Child content rendered inside the component.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
