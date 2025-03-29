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
    away: 'bg-yellow-500',
    offline: 'bg-gray-500',
  };
  
  return (
    <span 
      className={`inline-block rounded-full ${sizeClasses[size]} ${statusColorClasses[status]} ${className}`}
      aria-label={`Status: ${status}`}
    />
  );
} 