import React from 'react';

/**
 * Standard Iconify / Lucide Outline Icons (Monochrome, no AI/3D color gradients)
 * Matching the clean outline style requested by user (stroke="currentColor", fill="none").
 */

export function IconStar({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-star ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function IconTruck({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-truck ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

export function IconTrash({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-trash ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export const IconWastebasket = IconTrash;

export function IconRecycle({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-recycle ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
      <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
      <path d="m14 16 3 3 3-3" />
      <path d="M8.293 13.596 4.8 7.5a1.82 1.82 0 0 1 0-1.785l.004-.007a1.83 1.83 0 0 1 1.57-.883H12" />
      <path d="m3 9 3-3-3-3" />
      <path d="M17.8 7.5 19.5 4.5" />
      <path d="m14 5 3-3 3 3" />
    </svg>
  );
}

export function IconLeaf({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-leaf ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  );
}

export function IconMapPin({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-map-pin ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

export function IconBuilding({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-building ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
      <path d="M10 6h4"/>
      <path d="M10 10h4"/>
      <path d="M10 14h4"/>
      <path d="M10 18h4"/>
    </svg>
  );
}

export function IconUser({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-user ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

export function IconShield({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-shield ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    </svg>
  );
}

export function IconCrown({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-crown ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
    </svg>
  );
}

export function IconGift({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-gift ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <rect x="3" y="8" width="18" height="4" rx="1"/>
      <path d="M12 8v13"/>
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
    </svg>
  );
}

export function IconClock({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-clock ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

export function IconBox({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-box ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <path d="m3.3 7 8.7 5 8.7-5"/>
      <path d="M12 22V12"/>
    </svg>
  );
}

export function IconAlert({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-alert ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

export function IconMegaphone({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-megaphone ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="m3 11 18-5v12L3 14v-3z"/>
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
    </svg>
  );
}

export function IconZap({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-zap ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

export function IconNewspaper({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-newspaper ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8"/>
      <path d="M15 18h-5"/>
      <path d="M10 6h8v4h-8V6Z"/>
    </svg>
  );
}

export function IconTrendingUp({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-trending-up ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

export function IconUsers({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-users ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconLightbulb({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-lightbulb ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

export const IconBulb = IconLightbulb;

export function IconCamera({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-camera ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export function IconCompass({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-compass ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

export function IconCheck({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-check ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconSearch({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-search ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function IconInfo({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-info ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export function IconX({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-x ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}


export function IconPlus({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-plus ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconMinus({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-minus ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconNavigation({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-navigation ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}


export function IconBot({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-bot ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}

export function IconCalendar({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-calendar ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function IconMap({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-map ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

export function IconGraduationCap({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-graduation-cap ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  );
}

export function IconAnchor({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-anchor ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="8" x2="12" y2="22" />
      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    </svg>
  );
}

export function IconTree({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-tree ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="m12 19 3-4-2-1 2.5-3.5-2-.5 2.5-4-6-6-6 6 2.5 4-2 .5 2.5 3.5-2 1 3 4z" />
      <path d="M12 19v3" />
    </svg>
  );
}

export function IconSend({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-send ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function IconFileText({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-file-text ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function IconEye({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-eye ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEdit({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-edit ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function IconFilter({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`app-icon icon-filter ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export default {
  IconStar,
  IconTruck,
  IconTrash,
  IconWastebasket,
  IconRecycle,
  IconLeaf,
  IconMapPin,
  IconBuilding,
  IconUser,
  IconUsers,
  IconShield,
  IconCrown,
  IconGift,
  IconClock,
  IconBox,
  IconAlert,
  IconMegaphone,
  IconZap,
  IconNewspaper,
  IconTrendingUp,
  IconLightbulb,
  IconBulb,
  IconCamera,
  IconCompass,
  IconCheck,
  IconSearch,
  IconInfo,
  IconX,
  IconPlus,
  IconMinus,
  IconNavigation,
  IconBot,
  IconCalendar,
  IconMap,
  IconGraduationCap,
  IconAnchor,
  IconTree,
  IconSend,
  IconFileText,
  IconEye,
  IconEdit,
  IconFilter,
};
