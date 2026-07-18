import { useState } from 'react';
import { normalizeProviderImageUrl } from '../utils/assetUrls';

interface InitialsAvatarProps {
  imageUrl?: string;
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Generates consistent color based on name string
 */
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
  const normalizedImageUrl = normalizeProviderImageUrl(imageUrl);

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

  if (imgError || !normalizedImageUrl) {
    return (
      <div
        className={`${sizeClasses[size]} border border-[#cbbdac] bg-[#eee6db] rounded-full flex items-center justify-center text-[#5b1f2a] font-serif font-semibold ${className}`}
        role="img"
        aria-label={`${name} initials`}
      >
        <span className={fontSizeClasses[size]}>{initials}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={normalizedImageUrl}
        alt={`${name} - Art Appraiser`}
        className={`w-full h-full object-cover rounded-lg`}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    </div>
  );
}
