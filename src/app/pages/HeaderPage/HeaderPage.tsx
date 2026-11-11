import { useEffect, useState } from 'react';
import './HeaderPage.scss';

interface HeaderPageProps {
  syncStatus: 'connecting' | 'connected' | 'disconnected';
  currentPage: string;
  onNav: (page: string) => void;
}

export function HeaderPage({ syncStatus, currentPage, onNav }: HeaderPageProps) {
  const [browserOnline, setBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isLive = browserOnline && syncStatus === 'connected';
  const isConnecting = browserOnline && syncStatus === 'connecting';

  const syncLabel = isLive
    ? 'Sync Online'
    : isConnecting
    ? 'Connecting…'
    : 'Sync Offline';

  const syncClass = isLive
    ? 'docs-sync-badge--live'
    : isConnecting
    ? 'docs-sync-badge--connecting'
    : 'docs-sync-badge--offline';

  return (
    <header className="docs-topbar">
      <a
        className="docs-brand"
        href="#button"
        aria-label="HDFC design system home"
        onClick={() => onNav('button')}
      >
        <span className="docs-brand-mark">H</span>
        <span>
          HDFC <strong>Design System</strong>
        </span>
        <span className="docs-version-badge">v0.1.0 · Atlassian Portal</span>
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
        <div
          className={`docs-sync-badge ${syncClass}`}
          title={`Figma Bi-Directional Auto-Sync WebSocket (ws://localhost:3055) — ${syncLabel}`}
          role="status"
          aria-live="polite"
        >
          <span className="docs-sync-dot" aria-hidden="true" />
          <span className="docs-sync-status-text">{syncLabel}</span>
          <code className="docs-sync-endpoint">ws://localhost:3055</code>
        </div>
      </div>
    </header>
  );
}
