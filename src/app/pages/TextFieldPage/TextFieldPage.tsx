import { useState, type FormEvent, type ReactNode } from 'react';
import { Button, TextField } from '../../../components';
import type { TextFieldAppearance, TextFieldSize, TextFieldStatus } from '../../../components';
import './TextFieldPage.scss';

const installCode = 'npm install @d1hdfc/ui-components@main';
const importCode = `import { TextField } from '@d1hdfc/ui-components';
import '@d1hdfc/ui-components/style.css';`;

function ExampleCard({
  title,
  description,
  code,
  children
}: {
  title: string;
  description: string;
  code: string;
  children: ReactNode;
}) {
  const [showCode, setShowCode] = useState(false);

  return (
    <article className="textfield-example-card">
      <div className="textfield-example-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <button type="button" onClick={() => setShowCode((shown) => !shown)} aria-expanded={showCode}>
          {showCode ? 'Hide code' : 'View code'}
        </button>
      </div>
      <div className="textfield-example-preview">{children}</div>
      {showCode && <pre className="textfield-example-code"><code>{code}</code></pre>}
    </article>
  );
}

export function TextFieldPage() {
  const [playgroundValue, setPlaygroundValue] = useState('');
  const [playgroundSize, setPlaygroundSize] = useState<TextFieldSize>('medium');
  const [playgroundAppearance, setPlaygroundAppearance] = useState<TextFieldAppearance>('standard');
  const [playgroundStatus, setPlaygroundStatus] = useState<TextFieldStatus>('default');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="docs-content textfield-docs-content" id="textfield">
      <div className="docs-breadcrumbs">
        <a href="#components">Components</a><span>/</span><strong>Text field</strong>
      </div>

      <header className="docs-heading">
        <div>
          <p className="docs-eyebrow">COMPONENTS</p>
          <div className="docs-title-row">
            <h1>Text field</h1>
            <span className="docs-status"><i /> Stable</span>
          </div>
          <p className="docs-intro">
            Text fields let people enter and edit a single line of text. Give every field a visible
            label and use helper text to explain its purpose or requirements.
          </p>
          <div className="docs-heading-links">
            <a href="https://github.com/d1hdfc/UI-Components/tree/main/src/components/text-field" target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">↗</span> View source
            </a>
            <a href="https://www.figma.com/design/CXxUbHl3oMzt9Bzv3SKv75/Foundations--Copy?node-id=2617-4611" target="_blank" rel="noopener noreferrer">
              View in Figma <span aria-hidden="true">↗</span>
            </a>
            <a href="https://atlassian.design/components/textfield/examples" target="_blank" rel="noopener noreferrer">
              Atlassian examples <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </header>

      <section className="docs-section" id="textfield-installation">
        <div className="docs-section-heading">
          <div><h2>Installation</h2><p>Install the shared package and import the component styles.</p></div>
        </div>
        <div className="textfield-install-grid">
          <pre><code>{installCode}</code></pre>
          <pre><code>{importCode}</code></pre>
        </div>
      </section>

      <section className="docs-section" id="textfield-examples">
        <div className="docs-section-heading">
          <div>
            <h2>Examples</h2>
            <p>Use a visible label, concise helper text, and validation feedback when needed.</p>
          </div>
        </div>
        <div className="textfield-examples-grid">
          <ExampleCard
            title="Basic"
            description="Always associate a visible label with the text input."
            code={`<TextField
  label="Field label"
  placeholder="Enter a value"
  helperText="Help or instruction text goes here"
/>`}
          >
            <TextField
              label="Field label"
              placeholder="Enter a value"
              helperText="Help or instruction text goes here"
            />
          </ExampleCard>

          <ExampleCard
            title="Text field in a form"
            description="Use native form attributes for required fields and browser validation."
            code={`<form>
  <TextField
    label="Email address"
    name="email"
    type="email"
    placeholder="you@example.com"
    helperText="We’ll use this to send your receipt."
    required
  />
  <Button type="submit">Submit</Button>
</form>`}
          >
            <form className="textfield-form-example" onSubmit={handleSubmit}>
              <TextField
                label="Email address"
                name="email"
                type="email"
                placeholder="you@example.com"
                helperText={submitted ? 'Thanks — your email has been submitted.' : 'We’ll use this to send your receipt.'}
                required
                status={submitted ? 'success' : 'default'}
              />
              <Button type="submit" size="small">Submit</Button>
            </form>
          </ExampleCard>

          <ExampleCard
            title="Validation"
            description="Show clear, actionable feedback for error and success states."
            code={`<TextField label="Username" status="error" helperText="This username is already taken." />
<TextField label="Username" status="success" helperText="This username is available." />`}
          >
            <div className="textfield-stacked-fields">
              <TextField label="Username" status="error" defaultValue="hdfc-user" helperText="This username is already taken." />
              <TextField label="Username" status="success" defaultValue="new-user" helperText="This username is available." />
            </div>
          </ExampleCard>

          <ExampleCard
            title="Disabled and read only"
            description="Disabled values cannot be edited or submitted; read-only values remain selectable."
            code={`<TextField label="Disabled" defaultValue="Not available" disabled />
<TextField label="Read only" defaultValue="Account ID: 0042" readOnly />`}
          >
            <div className="textfield-stacked-fields">
              <TextField label="Disabled" defaultValue="Not available" disabled />
              <TextField label="Read only" defaultValue="Account ID: 0042" readOnly />
            </div>
          </ExampleCard>

          <ExampleCard
            title="Character counter"
            description="Use a counter when the value has a meaningful length limit."
            code={`<TextField label="Project name" maxLength={40} showCharacterCount helperText="Use up to 40 characters." />`}
          >
            <TextField label="Project name" maxLength={40} showCharacterCount helperText="Use up to 40 characters." />
          </ExampleCard>

          <ExampleCard
            title="Subtle appearance"
            description="Use a transparent resting field when the surrounding layout already defines the control."
            code={`<TextField label="Search" appearance="subtle" placeholder="Search" />`}
          >
            <TextField label="Search" appearance="subtle" placeholder="Search" />
          </ExampleCard>
        </div>
      </section>

      <section className="docs-section" id="textfield-playground">
        <div className="docs-section-heading">
          <div><h2>Try it out</h2><p>Adjust the field properties and try typing into the preview.</p></div>
        </div>
        <div className="textfield-playground">
          <div className="textfield-playground-controls">
            <label>Size
              <select value={playgroundSize} onChange={(event) => setPlaygroundSize(event.target.value as TextFieldSize)}>
                <option value="small">Small</option><option value="medium">Medium</option>
              </select>
            </label>
            <label>Appearance
              <select value={playgroundAppearance} onChange={(event) => setPlaygroundAppearance(event.target.value as TextFieldAppearance)}>
                <option value="standard">Standard</option><option value="subtle">Subtle</option>
              </select>
            </label>
            <label>Status
              <select value={playgroundStatus} onChange={(event) => setPlaygroundStatus(event.target.value as TextFieldStatus)}>
                <option value="default">Default</option><option value="error">Error</option><option value="success">Success</option>
              </select>
            </label>
          </div>
          <div className="textfield-playground-preview">
            <TextField
              label="Project name"
              placeholder="Enter a project name"
              helperText={playgroundStatus === 'error' ? 'Please enter a valid project name.' : 'Choose a name that is easy to recognize.'}
              value={playgroundValue}
              onChange={(event) => setPlaygroundValue(event.target.value)}
              size={playgroundSize}
              appearance={playgroundAppearance}
              status={playgroundStatus}
            />
          </div>
          <pre className="textfield-playground-code"><code>{`<TextField size="${playgroundSize}" appearance="${playgroundAppearance}" status="${playgroundStatus}" />`}</code></pre>
        </div>
      </section>

      <section className="docs-section" id="textfield-guidelines">
        <div className="docs-section-heading">
          <div><h2>Usage guidelines</h2><p>Make text fields easy to understand, complete, and validate.</p></div>
        </div>
        <ul className="textfield-guidelines">
          <li><strong>Always use a label.</strong> Keep it visible and concise; don’t rely on placeholder text as the label.</li>
          <li><strong>Keep helper text useful.</strong> Explain a requirement, format, or consequence before the user makes an error.</li>
          <li><strong>Be specific with validation.</strong> Identify what went wrong and how to correct it, and connect the message to the field.</li>
          <li><strong>Use counters selectively.</strong> Show one when a character limit is important to completing the task.</li>
        </ul>
      </section>

      <section className="docs-section" id="textfield-api">
        <div className="docs-section-heading">
          <div><h2>API reference</h2><p>TextField accepts standard HTML input attributes in addition to these properties.</p></div>
        </div>
        <div className="textfield-api-table" role="table" aria-label="TextField properties">
          <div className="textfield-api-row textfield-api-row--header" role="row">
            <span role="columnheader">Property</span><span role="columnheader">Type</span><span role="columnheader">Default</span><span role="columnheader">Description</span>
          </div>
          {[
            ['label', 'string', '—', 'Visible label associated with the input.'],
            ['helperText', 'ReactNode', '—', 'Supporting guidance or validation message.'],
            ['size', '"small" | "medium"', '"medium"', 'Controls the field height and text scale.'],
            ['status', '"default" | "error" | "success"', '"default"', 'Visual and accessible validation state.'],
            ['appearance', '"standard" | "subtle"', '"standard"', 'Choose outlined or transparent resting appearance.'],
            ['leadingIcon', 'ReactNode', '—', 'Optional, non-interactive element before the input.'],
            ['trailingContent', 'ReactNode', '—', 'Optional, non-interactive element after the input.'],
            ['loading', 'boolean', 'false', 'Disables the input and displays a progress indicator.'],
            ['showCharacterCount', 'boolean', 'false', 'Shows the current length when maxLength is set.']
          ].map(([property, type, defaultValue, description]) => (
            <div className="textfield-api-row" role="row" key={property}>
              <code role="cell">{property}</code><code role="cell">{type}</code><code role="cell">{defaultValue}</code><span role="cell">{description}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
