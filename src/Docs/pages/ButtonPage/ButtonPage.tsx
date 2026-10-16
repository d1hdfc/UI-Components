import { useState } from 'react';
import { Button as ButtonComponent } from '../../../components/Button';
import buttonStyles from '../../../components/Button/Button.scss?raw';
import buttonComponent from '../../../components/Button/Button.tsx?raw';
import './ButtonPage.scss';

const sizes = ['large', 'medium', 'small', 'xsmall'] as const;
const variants = ['primary', 'secondary', 'tertiary', 'link'] as const;
const states = ['default', 'hover', 'selected', 'disabled'] as const;

const buttonSourceUrl = 'https://github.com/d1hdfc/UI-Components/tree/main/src/components/Button';
const codeTabs = [
  { label: 'Button.tsx', code: buttonComponent },
  { label: 'Button.scss', code: buttonStyles }
];

export function ButtonPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');
  const selectedTab = codeTabs[activeTab];

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(selectedTab.code);
      setCopyStatus('Copied');
      window.setTimeout(() => setCopyStatus(''), 1800);
    } catch {
      setCopyStatus('Copy failed');
    }
  };

  return (
    <main className="docs-content" id="button">
      <div className="docs-breadcrumbs"><span>Components</span><span>/</span><strong>Button</strong></div>
      <div className="docs-heading">
        <div>
          <p className="docs-eyebrow">COMPONENTS</p>
          <h1>Button</h1>
          <p className="docs-intro">
            Buttons help people take an action, such as submitting a form or moving to the next step.
            Choose a variant that reflects the importance of the action.
          </p>
          <div className="docs-heading-links">
            <a href="/button.md" target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">▤</span> View as Markdown
            </a>
            <a href={buttonSourceUrl} target="_blank" rel="noopener noreferrer">
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="M8 .7a7.3 7.3 0 0 0-2.31 14.23c.36.07.5-.16.5-.35v-1.26c-2.03.44-2.46-.86-2.46-.86-.33-.85-.81-1.08-.81-1.08-.66-.45.05-.44.05-.44.73.05 1.12.75 1.12.75.65 1.12 1.7.8 2.11.61.07-.47.26-.8.46-.98-1.62-.18-3.32-.81-3.32-3.61 0-.8.28-1.45.75-1.96-.08-.18-.33-.93.07-1.94 0 0 .61-.2 2.01.75a6.98 6.98 0 0 1 3.66 0c1.4-.95 2-.75 2-.75.4 1.01.15 1.76.08 1.94.47.51.75 1.16.75 1.96 0 2.81-1.7 3.42-3.33 3.6.26.22.49.67.49 1.35v2c0 .2.13.42.5.35A7.3 7.3 0 0 0 8 .7Z" />
              </svg>
              View source
            </a>
          </div>
        </div>
        <span className="docs-status"><i /> Stable</span>
      </div>

      <section className="docs-section" id="overview">
        <div className="docs-section-heading">
          <div>
            <h2>Variants, sizes and states</h2>
            <p>Compare every button size across its default, hover, selected and disabled states.</p>
          </div>
          <span className="docs-count">4 variants · 4 sizes · 4 states</span>
        </div>
        <div className="button-showcase">
          {variants.map((variant) => (
            <section className="variant-state-card" key={variant} aria-labelledby={`variant-${variant}`}>
              <header className="variant-state-heading">
                <h3 id={`variant-${variant}`}>{variant}</h3>
                <span>Button · {variant}</span>
              </header>
              <div className="state-matrix">
                <div className="state-matrix-head">
                  <span>STATE</span>
                  {sizes.map((size) => <span key={size}>{size.toUpperCase()}</span>)}
                </div>
                {states.map((state) => (
                  <div className="state-matrix-row" key={state}>
                    <span className={`state-name state-name--${state}`}>{state}</span>
                    {sizes.map((size) => (
                      <div className="state-matrix-cell" key={size}>
                        <ButtonComponent
                          variant={variant}
                          size={size}
                          leftIcon
                          rightIcon
                          type="button"
                          className={state === 'hover' ? 'btn--show-hover' : undefined}
                          selected={state === 'selected'}
                          disabled={state === 'disabled'}
                        >
                          Button
                        </ButtonComponent>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="docs-section" id="usage">
        <div className="docs-section-heading">
          <div>
            <h2>Examples</h2>
            <p>Preview the Button component and inspect its implementation by file.</p>
          </div>
        </div>
        <div className="button-code-example">
          <div className="button-code-preview">
            <ButtonComponent type="button">Submit</ButtonComponent>
          </div>
          <div className="button-code-toolbar">
            <div className="button-code-tabs" role="tablist" aria-label="Button source files">
              {codeTabs.map((tab, index) => (
                <button
                  key={tab.label}
                  id={`button-code-tab-${index}`}
                  className="button-code-tab"
                  type="button"
                  role="tab"
                  aria-selected={activeTab === index}
                  aria-controls="button-code-panel"
                  onClick={() => {
                    setActiveTab(index);
                    setCopyStatus('');
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="button-code-actions">
              <span>{selectedTab.label.endsWith('.scss') ? 'SCSS' : 'React · TypeScript'}</span>
              <button
                className="button-code-copy"
                type="button"
                aria-label="Copy source code"
                title={copyStatus || 'Copy source code'}
                onClick={copyCode}
              >
                {copyStatus || 'Copy'}
              </button>
            </div>
          </div>
          <div
            className="button-code-panel"
            id="button-code-panel"
            role="tabpanel"
            aria-labelledby={`button-code-tab-${activeTab}`}
          >
            <pre><code>{selectedTab.code}</code></pre>
          </div>
        </div>
      </section>

      <section className="docs-section" id="guidelines">
        <div className="docs-section-heading">
          <div>
            <h2>Usage guidelines</h2>
            <p>Use a clear label that describes the action and select the variant that matches its importance.</p>
          </div>
        </div>
        <p className="docs-guideline-copy">
          Use primary buttons for the main action, secondary or tertiary buttons for supporting actions,
          and link buttons for low-emphasis navigation. Use the disabled state only when the action is
          unavailable.
        </p>
      </section>

      <section className="docs-section" id="api">
        <div className="docs-section-heading">
          <div>
            <h2>API reference</h2>
            <p>Button extends the native HTML button attributes.</p>
          </div>
        </div>
        <div className="api-table-wrap">
          <table className="api-table">
            <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td><code>variant</code></td><td><code>primary | secondary | tertiary | link</code></td><td><code>primary</code></td><td>Visual emphasis of the action.</td></tr>
              <tr><td><code>size</code></td><td><code>xsmall | small | medium | large</code></td><td><code>medium</code></td><td>Button height, spacing and typography.</td></tr>
              <tr><td><code>leftIcon</code>, <code>rightIcon</code></td><td><code>boolean | ReactNode</code></td><td><code>false</code></td><td>Optional leading or trailing icon.</td></tr>
              <tr><td><code>loading</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Shows a spinner and disables interaction.</td></tr>
              <tr><td><code>selected</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Shows the selected state and sets <code>aria-pressed</code>.</td></tr>
              <tr><td><code>fullWidth</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Expands the button to its container width.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer className="docs-footer">Button styles are sourced from the Figma semantic design tokens.</footer>
    </main>
  );
}

export default ButtonPage;
