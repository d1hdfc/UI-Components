import { useId } from 'react';
import type { TooltipProps } from './Tooltip.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function Tooltip({
  content,
  children,
  placement = 'top',
  className,
  ...spanProps
}: TooltipProps) {
  const generatedId = useId();

  return (
    <span
      {...spanProps}
      className={cx('tooltip', `tooltip--${placement}`, className)}
      aria-describedby={generatedId}
    >
      {children}
      <span className="tooltip-content" id={generatedId} role="tooltip">{content}</span>
    </span>
  );
}

export default Tooltip;
