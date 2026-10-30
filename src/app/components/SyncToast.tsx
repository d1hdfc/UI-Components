import { useEffect, useState } from 'react';
import type { SyncEvent } from '../hooks/useSyncWebSocket';

interface SyncToastProps {
  event: SyncEvent | null;
}

export function SyncToast({ event }: SyncToastProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'warning' | 'error'>('success');

  useEffect(() => {
    if (!event) return;

    if (event.event === 'FIGMA_TO_CODE_COMPLETE') {
      const { createdCount = 0, updatedCount = 0, deletedCount = 0 } = event.result ?? {};
      if (createdCount === 0 && updatedCount === 0 && deletedCount === 0) return;
      setMessage(`✅ Figma sync: +${createdCount} created, ~${updatedCount} updated, -${deletedCount} deleted`);
      setType('success');
    } else if (event.event === 'FIGMA_TO_CODE_ERROR') {
      setMessage(`❌ Sync error: ${event.error}`);
      setType('error');
    } else if (event.event === 'CODE_TO_FIGMA_DELETE' || event.event === 'CODE_COMPONENT_DELETED') {
      setMessage(`🗑️ "${event.componentName}" removed from Figma`);
      setType('warning');
    } else {
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [event]);

  if (!visible) return null;

  return (
    <div className={`sync-toast sync-toast--${type}`} role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss">×</button>
    </div>
  );
}
