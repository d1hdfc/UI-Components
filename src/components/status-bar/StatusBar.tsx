import type { StatusBarProps } from './StatusBar.types';

export function StatusBar({
  time = '9:41',
  showWifi = true,
  showCellular = true,
  showBattery = true,
  batteryLevel = 100,
  className,
  ...divProps
}: StatusBarProps) {
  const battery = Math.max(0, Math.min(100, Number.isFinite(batteryLevel) ? batteryLevel : 100));

  return (
    <div {...divProps} className={['status-bar', className].filter(Boolean).join(' ')} role="img" aria-label={`Device status, ${time}`}>
      <span className="status-bar-time">{time}</span>
      <span className="status-bar-indicators" aria-hidden="true">
        {showCellular && <span className="status-bar-cellular"><i /><i /><i /><i /></span>}
        {showWifi && <span className="status-bar-wifi">⌁</span>}
        {showBattery && <span className="status-bar-battery"><i style={{ width: `${battery}%` }} /></span>}
      </span>
    </div>
  );
}

export default StatusBar;
