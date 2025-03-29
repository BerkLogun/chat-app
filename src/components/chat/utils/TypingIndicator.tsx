'use client';

import React from 'react';
import { UserAvatar } from './UserAvatar';

interface TypingIndicatorProps {
  username: string;
}

export function TypingIndicator({ username }: TypingIndicatorProps) {
  return (
    <div className="flex w-full justify-start mt-2">
      <div className="mr-2 self-end">
        <UserAvatar username={username} isCurrentUser={false} />
      </div>
      
      <div className="flex flex-col items-start">
        <div className="px-3 py-2 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none">
          <div className="flex items-center">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p className="ml-2 text-xs">
              {username}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 