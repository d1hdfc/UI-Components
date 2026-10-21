import { useEffect, useRef, useState } from 'react';
import './DocsSidebar.scss';

export function DocsSidebar({ currentPage }: { currentPage: 'button' | 'textfield' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const query = searchQuery.trim().toLowerCase();
  const showInstallation = 'installation'.includes(query);
  const showButton = 'button'.includes(query);
  const showTextField = 'text field'.includes(query) || 'textfield'.includes(query);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  return (
    <aside className="docs-sidebar" aria-label="Documentation navigation">
      <label className="docs-search">
        <span aria-hidden="true">⌕</span>
        <input
          ref={searchRef}
          type="search"
          placeholder="Search docs"
          aria-label="Search documentation"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <kbd>Ctrl K</kbd>
      </label>
      <nav>
        <p className="docs-nav-heading">GET STARTED</p>
        {showInstallation && <a href="#installation">Installation</a>}
        <p className="docs-nav-heading">COMPONENTS</p>
        {showButton && <a className={currentPage === 'button' ? 'docs-nav-active' : undefined} href="#button" aria-current={currentPage === 'button' ? 'page' : undefined}>Button</a>}
        {showTextField && <a className={currentPage === 'textfield' ? 'docs-nav-active' : undefined} href="#textfield" aria-current={currentPage === 'textfield' ? 'page' : undefined}>Text field</a>}
        {searchQuery && !showInstallation && !showButton && !showTextField && (
          <p className="docs-search-empty">No matching docs</p>
        )}
      </nav>
      <div className="docs-sidebar-footer">
        <span className="docs-sidebar-footer-mark">H</span>
        <span><strong>HDFC UI library</strong><small>Design system · v0.1.0</small></span>
      </div>
    </aside>
  );
}
