'use client';

import React from 'react';
import { getInitials } from '@/lib/utils';

interface UserAvatarProps {
  username: string | undefined;
  isCurrentUser: boolean;
}

export function UserAvatar({ username, isCurrentUser }: UserAvatarProps) {
  return (
    <div 
      className={`flex-shrink-0 h-8 w-8 rounded-full ${isCurrentUser ? 'bg-green-500' : 'bg-blue-500'} 
        flex items-center justify-center text-white overflow-hidden`}
    >
      {getInitials(isCurrentUser ? 'Me' : username || 'Other')}
    </div>
  );
} 