import { useEffect, useRef, useState } from 'react';
import { componentDocumentation } from '../ComponentPage/componentRegistry';
import './SidebarPage.scss';

const componentLinks = [
  ...componentDocumentation.map(({ routeSlug, title }) => ({ slug: routeSlug, name: title })),
  { slug: 'figma-components', name: 'Figma catalog' }
];

export function SidebarPage({ currentPage }: { currentPage: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const query = searchQuery.trim().toLowerCase();
  const showInstallation = 'installation'.includes(query);
  const visibleComponents = componentLinks.filter((component) =>
    component.name.toLowerCase().includes(query)
  );

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
        {visibleComponents.map((component) => (
          <a
            key={component.slug}
            className={currentPage === component.slug ? 'docs-nav-active' : undefined}
            href={`#${component.slug}`}
            aria-current={currentPage === component.slug ? 'page' : undefined}
          >
            {component.name}
          </a>
        ))}
        {searchQuery && !showInstallation && visibleComponents.length === 0 && (
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
