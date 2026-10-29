import { useId, useState, type KeyboardEvent } from 'react';
import type { TabsProps } from './Tabs.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function Tabs({
  items,
  activeId,
  defaultActiveId,
  onChange,
  className,
  ...divProps
}: TabsProps) {
  const generatedId = useId();
  const [uncontrolledId, setUncontrolledId] = useState(defaultActiveId ?? items.find((item) => !item.disabled)?.id);
  const selectedId = activeId ?? uncontrolledId;
  const selectedTab = items.find((item) => item.id === selectedId && !item.disabled) ?? items.find((item) => !item.disabled);
  const selectedIndex = selectedTab ? items.findIndex((item) => item.id === selectedTab.id) : -1;

  const selectTab = (id: string) => {
    if (activeId === undefined) setUncontrolledId(id);
    onChange?.(id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    let nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : selectedIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      for (let count = 0; count < items.length; count += 1) {
        nextIndex = (nextIndex + direction + items.length) % items.length;
        if (!items[nextIndex].disabled) break;
      }
    } else {
      const step = event.key === 'Home' ? 1 : -1;
      while (nextIndex >= 0 && nextIndex < items.length && items[nextIndex].disabled) nextIndex += step;
    }
    const next = items[nextIndex];
    if (!next || next.disabled) return;
    selectTab(next.id);
    document.getElementById(`${generatedId}-tab-${next.id}`)?.focus();
  };

  return (
    <div {...divProps} className={cx('tabs', className)}>
      <div className="tabs-list" role="tablist">
        {items.map((item) => {
          const selected = item.id === selectedTab?.id;
          return (
            <button
              type="button"
              id={`${generatedId}-tab-${item.id}`}
              className="tabs-tab"
              role="tab"
              key={item.id}
              aria-selected={selected}
              aria-controls={`${generatedId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => selectTab(item.id)}
              onKeyDown={handleKeyDown}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {selectedTab && (
        <div
          className="tabs-panel"
          id={`${generatedId}-panel-${selectedTab.id}`}
          role="tabpanel"
          aria-labelledby={`${generatedId}-tab-${selectedTab.id}`}
          tabIndex={0}
        >
          {selectedTab.content}
        </div>
      )}
    </div>
  );
}

export default Tabs;
