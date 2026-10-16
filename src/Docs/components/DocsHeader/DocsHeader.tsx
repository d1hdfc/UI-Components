import './DocsHeader.scss';

export function DocsHeader() {
  return (
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
  );
}
