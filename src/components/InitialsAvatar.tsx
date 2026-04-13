import React, { useState } from 'react';
import { normalizeAssetUrl } from '../utils/assetUrls';

interface InitialsAvatarProps {
  imageUrl?: string;
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Generates consistent color based on name string
 */
function getNameColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Extracts initials from a name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Image component with initials fallback
 * Shows colored circle with initials when image fails to load or isn't provided
 */
export function InitialsAvatar({ imageUrl, name, className = '', size = 'md' }: InitialsAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const colorClass = getNameColor(name);

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-20 h-20 text-xl',
    lg: 'w-24 h-24 text-2xl',
  };

  const fontSizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  if (imgError || !imageUrl) {
    return (
      <div
        className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
        aria-hidden="true"
      >
        <span className={fontSizeClasses[size]}>{initials}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={normalizeAssetUrl(imageUrl)}
        alt={`${name} - Art Appraiser`}
        className={`w-full h-full object-cover rounded-lg`}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    </div>
  );
}
