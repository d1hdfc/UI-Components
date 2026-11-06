import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button as ButtonComponent } from '../../../components';
import type {
  ButtonSize,
  ButtonState,
  ButtonVariant,
  ButtonVisualType
} from '../../../components/button/button.types';
import './ButtonPage.scss';

const buttonSourceUrl = 'https://github.com/d1hdfc/UI-Components/tree/main/src/components/button';
const installCode = `npm install @d1hdfc/ui-components@main`;
const importCode = `import { Button } from '@d1hdfc/ui-components';
import '@d1hdfc/ui-components/style.scss';`;

const VARIANT_OPTIONS: { value: ButtonVariant; label: string }[] = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'tertiary', label: 'Tertiary' },
  { value: 'link', label: 'Link' }
];

const SIZE_OPTIONS: { value: ButtonSize; label: string }[] = [
  { value: 'large', label: 'Large' },
  { value: 'medium', label: 'Medium' },
  { value: 'small', label: 'Small' },
  { value: 'xsmall', label: 'Xsmall' }
];

const STATE_OPTIONS: { value: ButtonState; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'hover', label: 'Hover' },
  { value: 'pressed', label: 'Pressed' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'focus', label: 'Focus' }
];

const TYPE_OPTIONS: { value: ButtonVisualType; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'icon', label: 'Icon' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'white', label: 'White' }
];

function rgbStringToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return rgb;
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  const a = match[4] !== undefined ? Number(match[4]) : 1;
  if (a === 0) return 'transparent';
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

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
  const [playgroundSize, setPlaygroundSize] = useState<ButtonSize>('large');
  const [playgroundState, setPlaygroundState] = useState<ButtonState>('default');
  const [playgroundType, setPlaygroundType] = useState<ButtonVisualType>('default');
  const [playgroundLeftIcon, setPlaygroundLeftIcon] = useState<boolean>(true);
  const [playgroundRightIcon, setPlaygroundRightIcon] = useState<boolean>(true);
  const [playgroundLabel, setPlaygroundLabel] = useState<string>('Button');
  const [playgroundCopyStatus, setPlaygroundCopyStatus] = useState('Copy');
  const [cssCopyStatus, setCssCopyStatus] = useState('Copy CSS');

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [computedMetrics, setComputedMetrics] = useState({
    width: '194px',
    height: '72px',
    paddingX: '40px',
    borderRadius: '12px',
    fontSize: '18px',
    gap: '4px',
    backgroundHex: '#D61C53',
    textHex: '#FFFFFF'
  });

  useEffect(() => {
    const updateMetrics = () => {
      const btn = previewWrapRef.current?.querySelector('button.btn') as HTMLButtonElement | null;
      if (!btn) return;
      const cs = window.getComputedStyle(btn);
      const rect = btn.getBoundingClientRect();
      setComputedMetrics({
        width: `${Math.round(rect.width)}px`,
        height: cs.height || `${Math.round(rect.height)}px`,
        paddingX: cs.paddingLeft || '40px',
        borderRadius: cs.borderTopLeftRadius || '12px',
        fontSize: cs.fontSize || '18px',
        gap: cs.gap || '4px',
        backgroundHex: rgbStringToHex(cs.backgroundColor),
        textHex: rgbStringToHex(cs.color)
      });
    };

    updateMetrics();
    const timer = window.setTimeout(updateMetrics, 120);
    window.addEventListener('resize', updateMetrics);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', updateMetrics);
    };
  }, [
    playgroundVariant,
    playgroundSize,
    playgroundState,
    playgroundType,
    playgroundLeftIcon,
    playgroundRightIcon,
    playgroundLabel
  ]);

  const iconPropsString = `${playgroundLeftIcon ? ' leftIcon' : ''}${playgroundRightIcon ? ' rightIcon' : ''}`;
  const playgroundCode = `<Button variant="${playgroundVariant}" size="${playgroundSize}" state="${playgroundState}" type="${playgroundType}"${iconPropsString}>
  ${playgroundLabel}
</Button>`;

  const heightTokenName = `--button-size-${playgroundSize}-height`;
  const paddingTokenName = `--button-size-${playgroundSize}-padding-x`;
  const radiusTokenName = `--button-size-${playgroundSize}-radius`;
  const fontSizeTokenName = `--button-size-${playgroundSize}-font-size`;
  const bgTokenName = playgroundType === 'white'
    ? `--button-white-${playgroundVariant}-background-color-${playgroundState === 'focus' ? 'default' : playgroundState}`
    : `--button-${playgroundVariant}-background-color-${playgroundState === 'focus' ? 'default' : playgroundState}`;

  const figmaCssCode = `/* Layout */
display: inline-flex;
height: var(${heightTokenName}, ${computedMetrics.height});
padding: 0 var(${paddingTokenName}, ${computedMetrics.paddingX});
justify-content: center;
align-items: center;
gap: var(--button-size-${playgroundSize}-gap, ${computedMetrics.gap});

/* Style */
border-radius: var(${radiusTokenName}, ${computedMetrics.borderRadius});
background: var(${bgTokenName}, ${computedMetrics.backgroundHex});
font-size: var(${fontSizeTokenName}, ${computedMetrics.fontSize});`;

  const copyPlaygroundCode = async () => {
    try {
      await navigator.clipboard.writeText(playgroundCode);
      setPlaygroundCopyStatus('Copied');
      window.setTimeout(() => setPlaygroundCopyStatus('Copy'), 1800);
    } catch {
      setPlaygroundCopyStatus('Copy failed');
    }
  };

  const copyFigmaCss = async () => {
    try {
      await navigator.clipboard.writeText(figmaCssCode);
      setCssCopyStatus('Copied');
      window.setTimeout(() => setCssCopyStatus('Copy CSS'), 1800);
    } catch {
      setCssCopyStatus('Failed');
    }
  };

  return (
    <main className="docs-content" id="button">
      <div className="docs-breadcrumbs">
        <a href="#components">Components</a><span>/</span><strong>Button</strong>
      </div>

      <header className="docs-heading">
        <div className="docs-heading-top">
          <div>
            <p className="docs-eyebrow">COMPONENTS · DESIGN SYSTEM</p>
            <div className="docs-title-row">
              <h1>Button</h1>
              <span className="docs-status"><i /> Live Figma Token Sync</span>
            </div>
            <p className="docs-intro">
              Buttons trigger actions and decisions. All heights, spacings, corner radii, and colors are bound
              directly to semantic design tokens in <code>src/tokens/variables/</code> and update live with Figma.
            </p>
          </div>
          <div className="docs-token-summary">
            <div className="token-pill">
              <span>Height ({playgroundSize})</span>
              <strong>{computedMetrics.height}</strong>
            </div>
            <div className="token-pill">
              <span>Padding X ({playgroundSize})</span>
              <strong>{computedMetrics.paddingX}</strong>
            </div>
            <div className="token-pill">
              <span>Radius ({playgroundSize})</span>
              <strong>{computedMetrics.borderRadius}</strong>
            </div>
            <div className="token-pill">
              <span>Fill ({playgroundVariant})</span>
              <strong>
                <i className="color-dot" style={{ backgroundColor: computedMetrics.backgroundHex }} />
                {computedMetrics.backgroundHex}
              </strong>
            </div>
          </div>
        </div>
        <div className="docs-heading-links">
          <a href={buttonSourceUrl} target="_blank" rel="noopener noreferrer">
            <span aria-hidden="true">↗</span> View source
          </a>
          <a href="https://www.figma.com/design/CXxUbHl3oMzt9Bzv3SKv75/Foundations--Copy?node-id=2617-4609" target="_blank" rel="noopener noreferrer">
            View in Figma <span aria-hidden="true">↗</span>
          </a>
          <a href="#playground">Interactive Playground</a>
          <a href="#figma-matrix">Figma Variant Matrix</a>
          <a href="#api">API Reference</a>
        </div>
      </header>

      <section className="docs-section" id="playground">
        <div className="docs-section-heading">
          <div>
            <h2>Try it out (Interactive Figma & Code Inspector)</h2>
            <p>
              Select any Variant, Size, State, or Type — or click any variant in the matrix below — to inspect its
              live token bindings, computed dimensions, and JSX output.
            </p>
          </div>
        </div>

        <div className="button-playground">
          <div className="playground-controls">
            <label>
              Variant (style)
              <select
                value={playgroundVariant}
                onChange={(event) => setPlaygroundVariant(event.target.value as ButtonVariant)}
              >
                {VARIANT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            <label>
              Size
              <select
                value={playgroundSize}
                onChange={(event) => setPlaygroundSize(event.target.value as ButtonSize)}
              >
                {SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            <label>
              State
              <select
                value={playgroundState}
                onChange={(event) => setPlaygroundState(event.target.value as ButtonState)}
              >
                {STATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            <label>
              Type
              <select
                value={playgroundType}
                onChange={(event) => setPlaygroundType(event.target.value as ButtonVisualType)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            <label>
              Label
              <input
                type="text"
                className="playground-text-input"
                value={playgroundLabel}
                onChange={(event) => setPlaygroundLabel(event.target.value)}
              />
            </label>

            <div className="playground-toggles">
              <label className="playground-checkbox">
                <input
                  type="checkbox"
                  checked={playgroundLeftIcon}
                  onChange={(event) => setPlaygroundLeftIcon(event.target.checked)}
                />
                <span>leadingIcon</span>
              </label>
              <label className="playground-checkbox">
                <input
                  type="checkbox"
                  checked={playgroundRightIcon}
                  onChange={(event) => setPlaygroundRightIcon(event.target.checked)}
                />
                <span>trailingIcon</span>
              </label>
            </div>
          </div>

          <div className="playground-output playground-output--three-col">
            <div
              ref={previewWrapRef}
              className={`playground-preview${playgroundType === 'white' ? ' playground-preview--on-dark' : ''}`}
            >
              <div className="playground-preview-stage">
                <ButtonComponent
                  variant={playgroundVariant}
                  size={playgroundSize}
                  state={playgroundState}
                  type={playgroundType}
                  leftIcon={playgroundLeftIcon}
                  rightIcon={playgroundRightIcon}
                >
                  {playgroundLabel}
                </ButtonComponent>
                <div className="playground-dimension-badge">
                  <span>{computedMetrics.width} × {computedMetrics.height}</span>
                  <span>padding-x: {computedMetrics.paddingX}</span>
                  <span>radius: {computedMetrics.borderRadius}</span>
                </div>
              </div>
            </div>

            <div className="playground-code">
              <div className="playground-panel-header">
                <span>React JSX</span>
                <button type="button" onClick={copyPlaygroundCode} aria-live="polite">
                  {playgroundCopyStatus}
                </button>
              </div>
              <pre><code>{playgroundCode}</code></pre>
            </div>

            <div className="playground-code playground-code--css">
              <div className="playground-panel-header">
                <span>Figma Dev Mode CSS & Tokens</span>
                <button type="button" onClick={copyFigmaCss} aria-live="polite">
                  {cssCopyStatus}
                </button>
              </div>
              <pre><code>{figmaCssCode}</code></pre>
            </div>
          </div>
        </div>
      </section>

      <section className="docs-section" id="figma-matrix">
        <div className="docs-section-heading">
          <div>
            <h2>Figma Component Variant Matrix</h2>
            <p>
              Mirrors the Figma canvas grid across all States (<code>Default</code>, <code>Hover</code>,{' '}
              <code>Pressed</code>, <code>Disabled</code>, <code>Focus</code>), Variants (<code>Primary</code>,{' '}
              <code>Secondary</code>, <code>Tertiary</code>, <code>Link</code>), and Sizes (<code>Large</code>,{' '}
              <code>Medium</code>, <code>Small</code>, <code>Xsmall</code>). Click any button to inspect it above.
            </p>
          </div>
        </div>

        <div className="figma-matrix-card">
          {SIZE_OPTIONS.map((sizeOpt) => (
            <div key={sizeOpt.value} className="figma-matrix-group">
              <div className="figma-matrix-group-header">
                <h3>Size: {sizeOpt.label}</h3>
                <code>--button-size-{sizeOpt.value}-height</code>
              </div>
              <div className="figma-matrix-table-scroll">
                <table className="figma-matrix-table">
                  <thead>
                    <tr>
                      <th>State</th>
                      {VARIANT_OPTIONS.map((v) => (
                        <th key={v.value}>{v.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {STATE_OPTIONS.map((st) => (
                      <tr key={st.value}>
                        <td className="figma-matrix-state-label">{st.label}</td>
                        {VARIANT_OPTIONS.map((v) => (
                          <td
                            key={v.value}
                            className="figma-matrix-cell"
                            onClick={() => {
                              setPlaygroundVariant(v.value);
                              setPlaygroundSize(sizeOpt.value);
                              setPlaygroundState(st.value);
                              setPlaygroundType('default');
                            }}
                          >
                            <ButtonComponent
                              variant={v.value}
                              size={sizeOpt.value}
                              state={st.value}
                              type="default"
                              leftIcon
                              rightIcon
                            >
                              Button
                            </ButtonComponent>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
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
            code={`<Button variant="primary" size="large" leftIcon rightIcon>Button</Button>
<Button variant="secondary" size="large" leftIcon rightIcon>Button</Button>
<Button variant="tertiary" size="large" leftIcon rightIcon>Button</Button>
<Button variant="link" size="large" leftIcon rightIcon>Button</Button>`}>
            <div className="example-button-row">
              <ButtonComponent variant="primary" size="large" leftIcon rightIcon>Button</ButtonComponent>
              <ButtonComponent variant="secondary" size="large" leftIcon rightIcon>Button</ButtonComponent>
              <ButtonComponent variant="tertiary" size="large" leftIcon rightIcon>Button</ButtonComponent>
              <ButtonComponent variant="link" size="large" leftIcon rightIcon>Button</ButtonComponent>
            </div>
          </CodeExample>

          <CodeExample
            id="size-examples"
            title="Sizes"
            description="Choose a size that fits the density and hierarchy of the interface."
            code={`<Button size="large" leftIcon rightIcon>Large</Button>
<Button size="medium" leftIcon rightIcon>Medium</Button>
<Button size="small" leftIcon rightIcon>Small</Button>
<Button size="xsmall" leftIcon rightIcon>Xsmall</Button>`}>
            <div className="example-button-row example-button-row--sizes">
              {(['large', 'medium', 'small', 'xsmall'] as const).map((size) => (
                <ButtonComponent key={size} size={size} leftIcon rightIcon>{size}</ButtonComponent>
              ))}
            </div>
          </CodeExample>

          <CodeExample
            id="icon-examples"
            title="Icon & Surface Types"
            description="Support default, icon-only, gradient, and white surface treatments."
            code={`<Button type="default" leftIcon rightIcon>Button</Button>
<Button type="icon" aria-label="Previous" />
<Button type="gradient" leftIcon rightIcon>Gradient</Button>`}>
            <div className="example-button-row">
              <ButtonComponent type="default" leftIcon rightIcon>Button</ButtonComponent>
              <ButtonComponent type="icon" aria-label="Previous" />
              <ButtonComponent type="gradient" leftIcon rightIcon>Gradient</ButtonComponent>
            </div>
          </CodeExample>

          <CodeExample
            id="state-examples"
            title="Interactive States"
            description="Preview Default, Hover, Pressed, Disabled, Focus, and Loading states."
            code={`<Button state="default">Default</Button>
<Button state="hover">Hover</Button>
<Button state="pressed">Pressed</Button>
<Button state="disabled">Disabled</Button>
<Button loading>Saving</Button>`}
          >
            <div className="example-button-row">
              <ButtonComponent state="default">Default</ButtonComponent>
              <ButtonComponent state="hover">Hover</ButtonComponent>
              <ButtonComponent state="pressed">Pressed</ButtonComponent>
              <ButtonComponent state="disabled">Disabled</ButtonComponent>
              <ButtonComponent loading>Saving</ButtonComponent>
            </div>
          </CodeExample>
        </div>
      </section>

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
              <tr><td><code>state</code></td><td><code>default | hover | pressed | disabled | focus</code></td><td><code>default</code></td><td>Interactive state mapped to design system tokens.</td></tr>
              <tr><td><code>type</code></td><td><code>default | icon | gradient | white</code></td><td><code>default</code></td><td>Visual layout and surface treatment of the button.</td></tr>
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
