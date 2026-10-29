import { useState } from 'react';
import { TextArea } from '../../../components';
import type { TextAreaSize, TextAreaStatus } from '../../../components';
import './TextAreaPage.scss';


const states: Array<{
  name: string;
  props?: React.ComponentProps<typeof TextArea>;
}> = [
  { name: 'Inactive', props: { placeholder: 'Type here' } },
  { name: 'Focus', props: { placeholder: 'Type here', className: 'text-area--focus-preview' } },
  { name: 'Active', props: { defaultValue: 'Your text' } },
  { name: 'Disabled', props: { defaultValue: 'Your text', disabled: true } },
  { name: 'Error', props: { defaultValue: 'Your text', status: 'error', helperText: 'Please check this field.' } },
  { name: 'Success', props: { defaultValue: 'Your text', status: 'success', helperText: 'Looks good.' } },
  { name: 'Loading', props: { defaultValue: 'Your text', loading: true } },
  { name: 'Read only', props: { defaultValue: 'Your text', readOnly: true } }
];

export function TextAreaPage() {
  const [size, setSize] = useState<TextAreaSize>('small');
  const [status, setStatus] = useState<TextAreaStatus>('default');
  const [playgroundValue, setPlaygroundValue] = useState('');
  const playgroundCode = `<TextArea size="${size}" status="${status}" label="Message" />`;

  return (
    <main className="docs-content textarea-docs-content" id="textarea">
      <div className="docs-breadcrumbs">
        <a href="#components">Components</a><span>/</span><strong>Text area</strong>
      </div>

      <header className="docs-heading">
        <div>
          <p className="docs-eyebrow">COMPONENTS</p>
          <div className="docs-title-row">
            <h1>Text area</h1>
            <span className="docs-status"><i /> Stable</span>
          </div>
          <p className="docs-intro">
            Text areas let people enter and edit longer, multi-line text. Use a visible label,
            helpful instructions, and clear validation feedback.
          </p>
          <div className="docs-heading-links">
            <a href="https://github.com/d1hdfc/UI-Components/tree/main/src/components/text-area" target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">↗</span> View source
            </a>
            <a href="https://www.figma.com/design/CXxUbHl3oMzt9Bzv3SKv75/Foundations--Copy?node-id=4285-36878" target="_blank" rel="noopener noreferrer">
              View in Figma <span aria-hidden="true">↗</span>
            </a>
            <a href="#textarea-installation">Installation</a>
          </div>
        </div>
      </header>

      <section className="docs-section" id="textarea-installation">
        <div className="docs-section-heading">
          <div><h2>Installation</h2><p>Install the shared package and import the component styles.</p></div>
        </div>
        <div className="textarea-install-grid">
          <pre><code>npm install @d1hdfc/ui-components@main</code></pre>
          <pre><code>{`import { TextArea } from '@d1hdfc/ui-components';
import '@d1hdfc/ui-components/style.css';`}</code></pre>
        </div>
      </section>

      <section className="docs-section" id="textarea-examples">
        <div className="docs-section-heading">
          <div>
            <h2>States and sizes</h2>
            <p>Compare the component states in the small and medium sizes.</p>
          </div>
        </div>
        <div className="textarea-state-board">
          <div className="textarea-state-board-header">
            <span />
            <strong>Small (Mobile)</strong>
            <strong>Medium (Tablet/Desktop)</strong>
          </div>
          {states.map(({ name, props }) => (
            <div className="textarea-state-row" key={name}>
              <strong>{name}</strong>
              <TextArea label="Field label" aria-label={`${name} text area, small size`} size="small" {...props} />
              <TextArea label="Field label" aria-label={`${name} text area, medium size`} size="medium" {...props} />
            </div>
          ))}
        </div>
      </section>

      <section className="docs-section" id="textarea-playground">
        <div className="docs-section-heading">
          <div><h2>Try it out</h2><p>Adjust the size and validation state, then type in the preview.</p></div>
        </div>
        <div className="textarea-playground">
          <div className="textarea-playground-controls">
            <label>Size
              <select value={size} onChange={(event) => setSize(event.target.value as TextAreaSize)}>
                <option value="small">Small</option><option value="medium">Medium</option>
              </select>
            </label>
            <label>Status
              <select value={status} onChange={(event) => setStatus(event.target.value as TextAreaStatus)}>
                <option value="default">Default</option><option value="error">Error</option><option value="success">Success</option>
              </select>
            </label>
          </div>
          <div className="textarea-playground-preview">
            <TextArea
              label="Message"
              placeholder="Write your message"
              helperText={status === 'error' ? 'Please enter a valid message.' : 'Share any additional details.'}
              value={playgroundValue}
              onChange={(event) => setPlaygroundValue(event.target.value)}
              maxLength={300}
              showCharacterCount
              size={size}
              status={status}
            />
          </div>
          <pre className="textarea-playground-code"><code>{playgroundCode}</code></pre>
        </div>
      </section>

      <section className="docs-section" id="textarea-guidelines">
        <div className="docs-section-heading">
          <div><h2>Usage guidelines</h2><p>Help people understand what to enter and how much to write.</p></div>
        </div>
        <ul className="textarea-guidelines">
          <li><strong>Use a visible label.</strong> Describe what the person should enter; don’t rely on a placeholder as the label.</li>
          <li><strong>Choose a suitable size.</strong> Give the field enough initial space for the expected response.</li>
          <li><strong>Explain limits.</strong> Show a character count when a maximum length matters.</li>
          <li><strong>Make feedback actionable.</strong> Connect helper text to the field and explain how to fix an error.</li>
        </ul>
      </section>

      <section className="docs-section" id="textarea-api">
        <div className="docs-section-heading">
          <div><h2>API reference</h2><p>TextArea accepts standard HTML textarea attributes in addition to these properties.</p></div>
        </div>
        <div className="textarea-api-table" role="table" aria-label="TextArea properties">
          <div className="textarea-api-row textarea-api-row--header" role="row">
            <span role="columnheader">Property</span><span role="columnheader">Type</span><span role="columnheader">Default</span><span role="columnheader">Description</span>
          </div>
          {[
            ['label', 'string', '—', 'Visible label associated with the text area.'],
            ['helperText', 'ReactNode', '—', 'Supporting guidance or validation message.'],
            ['size', '"small" | "medium"', '"medium"', 'Controls the text area minimum height and padding.'],
            ['status', '"default" | "error" | "success"', '"default"', 'Visual and accessible validation state.'],
            ['loading', 'boolean', 'false', 'Disables the text area and displays a progress indicator.'],
            ['showCharacterCount', 'boolean', 'false', 'Shows the current length when maxLength is set.']
          ].map(([property, type, defaultValue, description]) => (
            <div className="textarea-api-row" role="row" key={property}>
              <code role="cell">{property}</code><code role="cell">{type}</code><code role="cell">{defaultValue}</code><span role="cell">{description}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
