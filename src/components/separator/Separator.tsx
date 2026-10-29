import type { SeparatorProps } from './Separator.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function Separator({
  orientation = 'horizontal',
  decorative = false,
  className,
  ...hrProps
}: SeparatorProps) {
  return (
    <hr
      {...hrProps}
      className={cx('separator', `separator--${orientation}`, className)}
      role={decorative ? 'presentation' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
    />
  );
}

export default Separator;
