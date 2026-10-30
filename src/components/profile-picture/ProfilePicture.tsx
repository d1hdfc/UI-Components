import React from 'react';
import type { ProfilePictureProps } from './ProfilePicture.types';
import './ProfilePicture.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  children = 'Component',
  size = 'medium',
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const combinedClasses = cx(
    'ui-profile-picture',
    `ui-profile-picture--${size}`,
    `ui-profile-picture--${variant}`,
    fullWidth && 'ui-profile-picture--full-width',
    isDisabled && 'ui-profile-picture--disabled',
    loading && 'ui-profile-picture--loading',
    className
  );

  return (
    <div
      {...rest}
      className={combinedClasses}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-profile-picture__spinner" aria-hidden="true" />}
      <span className="ui-profile-picture__content">{children}</span>
    </div>
  );
};

export default ProfilePicture;
