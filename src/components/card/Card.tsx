import type { CardProps } from './Card.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function Card({
  padding = 'medium',
  variant = 'outlined',
  className,
  ...articleProps
}: CardProps) {
  return (
    <article
      {...articleProps}
      className={cx('card', `card--padding-${padding}`, `card--${variant}`, className)}
    />
  );
}

export default Card;
