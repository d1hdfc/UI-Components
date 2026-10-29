import type { BrowserBarProps } from './BrowserBar.types';

export function BrowserBar({
  address = 'example.com',
  onBack,
  onForward,
  onReload,
  className,
  ...divProps
}: BrowserBarProps) {
  return (
    <div {...divProps} className={['browser-bar', className].filter(Boolean).join(' ')}>
      <div className="browser-bar-navigation">
        <button type="button" aria-label="Go back" onClick={onBack} disabled={!onBack}>‹</button>
        <button type="button" aria-label="Go forward" onClick={onForward} disabled={!onForward}>›</button>
        <button type="button" aria-label="Reload page" onClick={onReload} disabled={!onReload}>↻</button>
      </div>
      <div className="browser-bar-address">
        <span className="browser-bar-lock" aria-hidden="true">⌑</span>
        <span>{address}</span>
      </div>
    </div>
  );
}

export default BrowserBar;
