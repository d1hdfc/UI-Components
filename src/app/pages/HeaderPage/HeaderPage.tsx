import './HeaderPage.scss';

interface HeaderPageProps {
  syncStatus: 'connecting' | 'connected' | 'disconnected';
  currentPage: string;
  onNav: (page: string) => void;
}

export function HeaderPage({ syncStatus, currentPage, onNav }: HeaderPageProps) {
  const syncLabel =
    syncStatus === 'connected' ? '🟢 Live Sync' :
    syncStatus === 'connecting' ? '🟡 Connecting…' :
    '🔴 Sync Offline';

  const syncClass =
    syncStatus === 'connected' ? 'docs-sync-badge--live' :
    syncStatus === 'connecting' ? 'docs-sync-badge--connecting' :
    'docs-sync-badge--offline';

  return (
    <header className="docs-topbar">
      <a className="docs-brand" href="#button" aria-label="HDFC design system home" onClick={() => onNav('button')}>
        <span className="docs-brand-mark">H</span>
        <span>HDFC <strong>UI Library</strong></span>
        <span className="docs-version-badge">v0.1.0</span>
      </a>

      <nav className="docs-topbar-nav" aria-label="Main navigation">
        <a
          href="#button"
          className={!['figma-components', 'installation'].includes(currentPage) ? 'docs-topbar-nav-active' : ''}
          onClick={() => onNav('button')}
        >
          Components
        </a>
        <a
          href="#figma-components"
          className={currentPage === 'figma-components' ? 'docs-topbar-nav-active' : ''}
          onClick={() => onNav('figma-components')}
        >
          Figma Catalog
        </a>
        <a
          href="https://github.com/d1hdfc/UI-Components"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>
      </nav>

      <div className="docs-topbar-actions">
        <span className={`docs-sync-badge ${syncClass}`} title="Auto-sync server status">
          {syncLabel}
        </span>
      </div>
    </header>
  );
}
