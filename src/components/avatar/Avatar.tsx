import { useEffect, useState } from 'react';
import type { AvatarProps } from './Avatar.types';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export function Avatar({
  src,
  alt = '',
  initials,
  size = 'medium',
  status,
  className,
  ...spanProps
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <span
      {...spanProps}
      className={cx('avatar', `avatar--${size}`, status && `avatar--${status}`, className)}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
    >
      {src && !imageFailed ? (
        <img className="avatar-image" src={src} alt="" onError={() => setImageFailed(true)} />
      ) : (
        <span aria-hidden="true">{initials?.slice(0, 2).toUpperCase() || '?'}</span>
      )}
      {status && <span className="avatar-status" aria-hidden="true" />}
    </span>
  );
}

export default Avatar;
