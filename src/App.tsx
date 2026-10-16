import { Button } from './components/Button';
import './App.scss';

const sizes = ['large', 'medium', 'small', 'xsmall'] as const;
const variants = ['primary', 'secondary', 'tertiary', 'link'] as const;
const states = ['default', 'hover', 'selected', 'disabled'] as const;

const example = `<Button variant="primary" size="medium" leftIcon="‹">
  Continue
</Button>`;

export default function App() {
  return (
    <div className="docs-shell">
      <header className="docs-topbar">
        <a className="docs-brand" href="#top" aria-label="HDFC design system home">
          <span className="docs-brand-mark">H</span>
          <span>HDFC <strong>Design System</strong></span>
        </a>
        <div className="docs-topbar-actions">
          <span className="docs-version">Components</span>
          <a className="docs-topbar-link" href="#api">API reference</a>
        </div>
      </header>

      <div className="docs-layout" id="top">
        <aside className="docs-sidebar" aria-label="Documentation navigation">
          <label className="docs-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder="Search documentation" aria-label="Search documentation" />
            <kbd>/</kbd>
          </label>
          <nav>
            <p className="docs-nav-heading">GETTING STARTED</p>
            <a href="#overview">Introduction</a>
            <p className="docs-nav-heading">COMPONENTS</p>
            <a className="docs-nav-active" href="#button">Button</a>
            <a className="docs-nav-muted" href="#button">Other components</a>
          </nav>
          <div className="docs-sidebar-footer">Design system · v1.0</div>
        </aside>

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
                            <Button
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
                            </Button>
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
                <h2>Usage</h2>
                <p>Use semantic variants and sizes instead of custom button styling.</p>
              </div>
            </div>
            <div className="usage-card">
              <pre><code>{example}</code></pre>
              <div className="usage-preview">
                <span>Preview</span>
                <Button variant="primary" size="medium" leftIcon="‹" type="button">Continue</Button>
              </div>
            </div>
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
      </div>
    </div>
  );
}
