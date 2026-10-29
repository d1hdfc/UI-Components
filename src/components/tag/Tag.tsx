import type { TagProps } from './Tag.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function Tag({
  tone = 'neutral',
  removable = false,
  onRemove,
  className,
  children,
  ...spanProps
}: TagProps) {
  return (
    <span {...spanProps} className={cx('tag', `tag--${tone}`, className)}>
      <span className="tag-label">{children}</span>
      {removable && (
        <button
          type="button"
          className="tag-remove"
          aria-label="Remove"
          onClick={onRemove}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </span>
  );
}

export default Tag;
