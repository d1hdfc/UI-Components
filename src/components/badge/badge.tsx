import type { ReactNode } from 'react';
import type { BadgeProps } from './badge.types';

const chevronLeft =
  'data:image/svg+xml;utf8,%3Csvg%20preserveAspectRatio%3D%22none%22%20overflow%3D%22visible%22%20style%3D%22display%3A%20block%3B%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%20%3Cg%20id%3D%22Icon%2FArrow%2FChevron%20Left%22%3E%20%3Cpath%20id%3D%221%22%20d%3D%22M12.5159%202.95892C12.76%202.71489%2013.1556%202.71498%2013.3997%202.95892C13.6438%203.203%2013.6438%203.59863%2013.3997%203.84271L7.96637%209.27606C7.56907%209.67352%207.56925%2010.3275%207.96637%2010.725L13.3997%2016.1584C13.6438%2016.4024%2013.6437%2016.7981%2013.3997%2017.0422C13.1556%2017.2862%2012.76%2017.2862%2012.5159%2017.0422L7.08258%2011.6088C6.19731%2010.7231%206.19713%209.27788%207.08258%208.39227L12.5159%202.95892Z%22%20fill%3D%22%23111111%22%2F%3E%20%3C%2Fg%3E%20%3C%2Fsvg%3E';
const chevronRight =
  'data:image/svg+xml;utf8,%3Csvg%20preserveAspectRatio%3D%22none%22%20overflow%3D%22visible%22%20style%3D%22display%3A%20block%3B%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%20%3Cg%20id%3D%22Icon%2FArrow%2FChevron%20Right%22%3E%20%3Cpath%20id%3D%221%22%20d%3D%22M6.60156%202.95898C6.84564%202.71491%207.24127%202.71491%207.48535%202.95898L12.9187%208.39233C13.8043%209.27799%2013.8042%2010.7231%2012.9187%2011.6089L7.48535%2017.0422C7.24127%2017.2863%206.84564%2017.2863%206.60156%2017.0422C6.35775%2016.7981%206.35757%2016.4024%206.60156%2016.1584L12.0349%2010.7251C12.4322%2010.3275%2012.4324%209.67362%2012.0349%209.27612L6.60156%203.84277C6.35748%203.5987%206.35748%203.20306%206.60156%202.95898Z%22%20fill%3D%22%23111111%22%2F%3E%20%3C%2Fg%3E%20%3C%2Fsvg%3E';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

function renderIcon(icon: boolean | ReactNode, direction: 'left' | 'right') {
  if (!icon) return null;
  const maskImage = `url("${direction === 'left' ? chevronLeft : chevronRight}")`;

  return (
    <span
      className={`badge-icon${icon === true ? ` badge-icon--${direction}` : ''}`}
      style={icon === true ? { maskImage } : undefined}
      aria-hidden="true"
    >
      {icon === true ? null : icon}
    </span>
  );
}

export function Badge({
  size = 'medium',
  tone = 'primary',
  variant = 'filled',
  leftIcon,
  rightIcon,
  className,
  children,
  ...spanProps
}: BadgeProps) {
  return (
    <span
      {...spanProps}
      className={cx('badge', `badge--${size}`, `badge--${tone}`, `badge--${variant}`, className)}
    >
      {renderIcon(leftIcon, 'left')}
      <span className="badge-label">{children}</span>
      {renderIcon(rightIcon, 'right')}
    </span>
  );
}

export default Badge;
