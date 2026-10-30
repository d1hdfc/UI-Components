import { useEffect, useRef, useState } from 'react';
import { componentDocumentation } from '../ComponentPage/componentRegistry';
import './SidebarPage.scss';

const componentLinks = [
  ...componentDocumentation.map(({ routeSlug, title }) => ({ slug: routeSlug, name: title })),
];

// Category grouping
const CATEGORIES: Record<string, string[]> = {
  'Form Controls': ['button', 'checkbox', 'radio', 'switch', 'text-field', 'textarea', 'mpin-input', 'search-bar', 'textfield', 'text-area'],
  'Indicators': ['badge', 'chips', 'progress-bar', 'rating', 'status-bar', 'tag', 'toast', 'snackbar', 'tooltip'],
  'Navigation': ['tabs', 'pagination', 'carousel'],
  'Overlays': ['bottom-sheet', 'popover'],
  'Display': ['avatar', 'card', 'separator', 'focus-ring'],
  'System': ['browser-bar', 'browser', 'status'],
};

function categorize(links: typeof componentLinks) {
  const used = new Set<string>();
  const grouped: Record<string, typeof componentLinks> = {};

  for (const [cat, slugs] of Object.entries(CATEGORIES)) {
    const items = links.filter(l => slugs.includes(l.slug));
    if (items.length > 0) {
      grouped[cat] = items;
      items.forEach(i => used.add(i.slug));
    }
  }

  const rest = links.filter(l => !used.has(l.slug));
  if (rest.length > 0) grouped['Other'] = rest;

  return grouped;
}

interface SidebarPageProps {
  currentPage: string;
  syncStatus: 'connecting' | 'connected' | 'disconnected';
}

export function SidebarPage({ currentPage, syncStatus }: SidebarPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const searchRef = useRef<HTMLInputElement>(null);

  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  // When searching, flatten all; else show categories
  const allLinks = componentLinks;
  const visibleFlat = isSearching
    ? allLinks.filter(c => c.name.toLowerCase().includes(query))
    : [];

  const grouped = categorize(allLinks);

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

  const toggleCategory = (cat: string) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

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
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <kbd>Ctrl K</kbd>
      </label>

      <nav>
        <p className="docs-nav-heading">GET STARTED</p>
        <a href="#installation" className={currentPage === 'installation' ? 'docs-nav-active' : ''}>
          Installation
        </a>

        {isSearching ? (
          <>
            <p className="docs-nav-heading">RESULTS</p>
            {visibleFlat.length === 0 ? (
              <p className="docs-search-empty">No matching components</p>
            ) : (
              visibleFlat.map(c => (
                <a
                  key={c.slug}
                  href={`#${c.slug}`}
                  className={currentPage === c.slug ? 'docs-nav-active' : ''}
                  aria-current={currentPage === c.slug ? 'page' : undefined}
                >
                  {c.name}
                </a>
              ))
            )}
          </>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="docs-nav-group">
              <button
                type="button"
                className="docs-nav-category"
                onClick={() => toggleCategory(cat)}
                aria-expanded={!collapsed[cat]}
              >
                <span>{cat}</span>
                <span className="docs-nav-category-meta">
                  <span className="docs-nav-count">{items.length}</span>
                  <span className="docs-nav-chevron">{collapsed[cat] ? '›' : '⌄'}</span>
                </span>
              </button>
              {!collapsed[cat] && (
                <div className="docs-nav-group-items">
                  {items.map(c => (
                    <a
                      key={c.slug}
                      href={`#${c.slug}`}
                      className={currentPage === c.slug ? 'docs-nav-active' : ''}
                      aria-current={currentPage === c.slug ? 'page' : undefined}
                    >
                      {c.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        <div className="docs-nav-divider" />
        <a
          href="#figma-components"
          className={currentPage === 'figma-components' ? 'docs-nav-active' : ''}
        >
          🎨 Figma Catalog
        </a>
      </nav>

      <div className="docs-sidebar-footer">
        <span className="docs-sidebar-footer-mark">H</span>
        <span>
          <strong>HDFC UI Library</strong>
          <small>Design system · v0.1.0</small>
        </span>
        <span className={`docs-sidebar-sync-dot docs-sidebar-sync-dot--${syncStatus}`} title={`Sync: ${syncStatus}`} />
      </div>
    </aside>
  );
}
