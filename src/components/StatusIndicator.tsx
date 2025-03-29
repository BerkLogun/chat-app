import React from 'react';

type Status = 'online' | 'offline' | 'away';

interface StatusIndicatorProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusIndicator({ status, size = 'md', className = '' }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };
  
  const statusColorClasses = {
    online: 'bg-green-500',
    away: 'bg-amber-500',
    offline: 'bg-gray-400',
  };
  
  // Only add ring and shadow if no custom className is provided to override them
  const ringClasses = className.includes('ring-0') ? '' : 'ring-2 ring-white dark:ring-gray-800 shadow-sm';
  
  return (
    <span 
      className={`inline-block rounded-full ${sizeClasses[size]} ${statusColorClasses[status]} ${ringClasses} ${className}`}
      aria-label={`Status: ${status}`}
    />
  );
} 