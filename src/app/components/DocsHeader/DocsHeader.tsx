import './DocsHeader.scss';

export function DocsHeader() {
  return (
    <header className="docs-topbar">
      <a className="docs-brand" href="#top" aria-label="HDFC design system home">
        <span className="docs-brand-mark">H</span>
        <span>HDFC <strong>UI library</strong></span>
      </a>
      <div className="docs-topbar-actions">
        <a className="docs-topbar-link" href="https://github.com/d1hdfc/UI-Components" target="_blank" rel="noopener noreferrer">
          GitHub <span aria-hidden="true">↗</span>
        </a>
        <span className="docs-version">v0.1.0</span>
      </div>
    </header>
  );
}
