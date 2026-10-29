import { useState, type ReactNode } from 'react';
import { Button as ButtonComponent } from '../../../components';
import type { ButtonSize, ButtonVariant } from '../../../components/button/Button.types';
import './ButtonPage.scss';

const buttonSourceUrl = 'https://github.com/d1hdfc/UI-Components/tree/main/src/components/button';
const installCode = `npm install @d1hdfc/ui-components@main`;
const importCode = `import { Button } from '@d1hdfc/ui-components';
import '@d1hdfc/ui-components/style.css';`;

function CodeExample({
  id,
  title,
  description,
  code,
  children
}: {
  id?: string;
  title: string;
  description: string;
  code: string;
  children: ReactNode;
}) {
  const [showCode, setShowCode] = useState(false);
  const [copyStatus, setCopyStatus] = useState('Copy');

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus('Copied');
      window.setTimeout(() => setCopyStatus('Copy'), 1800);
    } catch {
      setCopyStatus('Copy failed');
    }
  };

  return (
    <article className="example-card" id={id}>
      <div className="example-card-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <button
          className="example-code-toggle"
          type="button"
          aria-expanded={showCode}
          onClick={() => setShowCode((visible) => !visible)}
        >
          {showCode ? 'Hide code' : 'View code'}
        </button>
      </div>
      <div className="example-preview">{children}</div>
      {showCode && (
        <div className="example-code">
          <div className="example-code-toolbar">
            <span>React · TypeScript</span>
            <button type="button" onClick={copyCode} aria-live="polite">{copyStatus}</button>
          </div>
          <pre><code>{code}</code></pre>
        </div>
      )}
    </article>
  );
}

export function ButtonPage() {
  const [playgroundVariant, setPlaygroundVariant] = useState<ButtonVariant>('primary');
  const [playgroundSize, setPlaygroundSize] = useState<ButtonSize>('medium');
  const [playgroundCopyStatus, setPlaygroundCopyStatus] = useState('Copy');
  const playgroundCode = `<Button variant="${playgroundVariant}" size="${playgroundSize}">
  Continue
</Button>`;

  const copyPlaygroundCode = async () => {
    try {
      await navigator.clipboard.writeText(playgroundCode);
      setPlaygroundCopyStatus('Copied');
      window.setTimeout(() => setPlaygroundCopyStatus('Copy'), 1800);
    } catch {
      setPlaygroundCopyStatus('Copy failed');
    }
  };

  return (
    <main className="docs-content" id="button">
      <div className="docs-breadcrumbs">
        <a href="#components">Components</a><span>/</span><strong>Button</strong>
      </div>

      <header className="docs-heading">
        <div>
          <p className="docs-eyebrow">COMPONENTS</p>
          <div className="docs-title-row">
            <h1>Button</h1>
            <span className="docs-status"><i /> Stable</span>
          </div>
          <p className="docs-intro">
            Buttons help people take action. Use a clear label and choose a style that reflects
            the importance of that action.
          </p>
          <div className="docs-heading-links">
            <a href={buttonSourceUrl} target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">↗</span> View source
            </a>
            <a href="https://www.figma.com/design/CXxUbHl3oMzt9Bzv3SKv75/Foundations--Copy?node-id=2617-4609" target="_blank" rel="noopener noreferrer">
              View in Figma <span aria-hidden="true">↗</span>
            </a>
            <a href="#installation">Installation</a>
          </div>
        </div>
      </header>

      <section className="docs-section" id="installation">
        <div className="docs-section-heading">
          <div>
            <h2>Installation</h2>
            <p>Install the shared package and import the component styles.</p>
          </div>
        </div>
        <div className="install-steps">
          <CodeExample title="1. Install the package" description="Authenticate with GitHub Packages, then add the library." code={installCode}>
            <code className="install-command">{installCode}</code>
          </CodeExample>
          <CodeExample title="2. Import Button and styles" description="Add the stylesheet once in your app entry point." code={importCode}>
            <pre className="install-command">{importCode}</pre>
          </CodeExample>
        </div>
      </section>

      <section className="docs-section" id="examples">
        <div className="docs-section-heading">
          <div>
            <h2>Examples</h2>
            <p>Explore the available Button styles and copy the usage code for your project.</p>
          </div>
        </div>
        <div className="examples-grid">
          <CodeExample
            id="variant-examples"
            title="Variants"
            description="Match the button emphasis to the importance of the action."
            code={`<Button variant="primary">Save changes</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="tertiary">More options</Button>
<Button variant="link">Learn more</Button>`}
          >
            <div className="example-button-row">
              <ButtonComponent>Save changes</ButtonComponent>
              <ButtonComponent variant="secondary">Cancel</ButtonComponent>
              <ButtonComponent variant="tertiary">More options</ButtonComponent>
              <ButtonComponent variant="link">Learn more</ButtonComponent>
            </div>
          </CodeExample>

          <CodeExample
            id="size-examples"
            title="Sizes"
            description="Choose a size that fits the density and hierarchy of the interface."
            code={`<Button size="large">Continue</Button>
<Button size="medium">Continue</Button>
<Button size="small">Continue</Button>
<Button size="xsmall">Continue</Button>`}
          >
            <div className="example-button-row example-button-row--sizes">
              {(['large', 'medium', 'small', 'xsmall'] as const).map((size) => (
                <ButtonComponent key={size} size={size}>{size}</ButtonComponent>
              ))}
            </div>
          </CodeExample>

          <CodeExample
            id="icon-examples"
            title="With icons"
            description="Use leading or trailing icons to add useful visual context."
            code={`<Button leftIcon>Back</Button>
<Button rightIcon>Continue</Button>
<Button leftIcon rightIcon>Move</Button>`}
          >
            <div className="example-button-row">
              <ButtonComponent leftIcon>Back</ButtonComponent>
              <ButtonComponent rightIcon>Continue</ButtonComponent>
              <ButtonComponent leftIcon rightIcon>Move</ButtonComponent>
            </div>
          </CodeExample>

          <CodeExample
            id="state-examples"
            title="Loading and disabled"
            description="Show progress during work and disable actions that are unavailable."
            code={`<Button loading>Saving</Button>
<Button disabled>Unavailable</Button>
<Button variant="secondary" disabled>Cancel</Button>`}
          >
            <div className="example-button-row">
              <ButtonComponent loading>Saving</ButtonComponent>
              <ButtonComponent disabled>Unavailable</ButtonComponent>
              <ButtonComponent variant="secondary" disabled>Cancel</ButtonComponent>
            </div>
          </CodeExample>

          <CodeExample
            id="selected-examples"
            title="Selected"
            description="Use selected for a button that represents an active, pressed state."
            code={`<Button selected aria-pressed="true">Notifications on</Button>`}
          >
            <div className="example-button-row">
              <ButtonComponent selected aria-pressed="true">Notifications on</ButtonComponent>
            </div>
          </CodeExample>

          <CodeExample
            id="full-width-examples"
            title="Full width"
            description="Expand the button to fill the width of its parent container."
            code={`<Button fullWidth>Continue</Button>`}
          >
            <div className="example-full-width">
              <ButtonComponent fullWidth>Continue</ButtonComponent>
            </div>
          </CodeExample>
        </div>
      </section>

      <section className="docs-section" id="playground">
        <div className="docs-section-heading">
          <div>
            <h2>Try it out</h2>
            <p>Change the options to preview the Button and generate its JSX.</p>
          </div>
        </div>
        <div className="button-playground">
          <div className="playground-controls">
            <label>
              Variant
              <select value={playgroundVariant} onChange={(event) => setPlaygroundVariant(event.target.value as ButtonVariant)}>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="tertiary">Tertiary</option>
                <option value="link">Link</option>
              </select>
            </label>
            <label>
              Size
              <select value={playgroundSize} onChange={(event) => setPlaygroundSize(event.target.value as ButtonSize)}>
                <option value="large">Large</option>
                <option value="medium">Medium</option>
                <option value="small">Small</option>
                <option value="xsmall">Xsmall</option>
              </select>
            </label>
          </div>
          <div className="playground-output">
            <div className="playground-preview">
              <ButtonComponent variant={playgroundVariant} size={playgroundSize}>Continue</ButtonComponent>
            </div>
            <div className="playground-code">
              <button type="button" onClick={copyPlaygroundCode} aria-live="polite">
                {playgroundCopyStatus}
              </button>
              <pre><code>{playgroundCode}</code></pre>
            </div>
          </div>
        </div>
      </section>

      <section className="docs-section" id="guidelines">
        <div className="docs-section-heading">
          <div>
            <h2>Usage guidelines</h2>
            <p>Make actions easy to understand and consistent across your product.</p>
          </div>
        </div>
        <div className="guideline-grid">
          <article><h3>Do</h3><p>Use a concise label that clearly describes the result of the action.</p></article>
          <article><h3>Do</h3><p>Use one primary action when a page or section has a clear main task.</p></article>
          <article><h3>Avoid</h3><p>Do not use a disabled button without explaining why the action is unavailable.</p></article>
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
              <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Prevents interaction with the button.</td></tr>
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
