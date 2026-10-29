import type { FocusRingProps } from './FocusRing.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function FocusRing({
  children,
  visible = false,
  className,
  ...spanProps
}: FocusRingProps) {
  return (
    <span
      {...spanProps}
      className={cx('focus-ring', visible && 'focus-ring--visible', className)}
    >
      {children}
    </span>
  );
}

export default FocusRing;
