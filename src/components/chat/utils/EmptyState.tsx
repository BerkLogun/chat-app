'use client';

import React from 'react';

export function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start the conversation</p>
      </div>
    </div>
  );
} 