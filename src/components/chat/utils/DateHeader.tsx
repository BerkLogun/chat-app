'use client';

import React from 'react';

interface DateHeaderProps {
  date: string;
}

export function DateHeader({ date }: DateHeaderProps) {
  return (
    <div className="flex justify-center my-2">
      <div className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
        {date === new Date().toLocaleDateString() ? 'Today' : date}
      </div>
    </div>
  );
} 