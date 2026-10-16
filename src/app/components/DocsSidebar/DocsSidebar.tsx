import './DocsSidebar.scss';

export function DocsSidebar() {
  return (
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
        <p className="docs-nav-heading">ON THIS PAGE</p>
        <a href="#overview">Examples</a>
        <a href="#usage">Usage</a>
        <a href="#api">API reference</a>
      </nav>
      <div className="docs-sidebar-footer">Design system · v1.0</div>
    </aside>
  );
}
