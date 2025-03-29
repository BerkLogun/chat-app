'use client';

import React from 'react';
import { formatTime } from '@/lib/utils';

interface MessageBubbleProps {
  content: string;
  createdAt: string;
  isCurrentUserMessage: boolean;
  isSameSenderAsPrev: boolean;
  isSameSenderAsNext: boolean;
}

export function MessageBubble({ 
  content, 
  createdAt, 
  isCurrentUserMessage, 
  isSameSenderAsPrev, 
  isSameSenderAsNext 
}: MessageBubbleProps) {
  return (
    <div className={`max-w-[75%] flex flex-col ${isCurrentUserMessage ? 'items-end' : 'items-start'}`}>
      <div
        className={`px-3 py-2 rounded-2xl ${
          isCurrentUserMessage 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
        } ${isSameSenderAsPrev && isCurrentUserMessage ? 'rounded-tr-md' : ''}
        ${isSameSenderAsPrev && !isCurrentUserMessage ? 'rounded-tl-md' : ''}
        ${isSameSenderAsNext && isCurrentUserMessage ? 'rounded-br-md' : ''}
        ${isSameSenderAsNext && !isCurrentUserMessage ? 'rounded-bl-md' : ''}`
        }
      >
        <p className="whitespace-pre-wrap break-words text-sm">
          {content}
        </p>
      </div>
      
      {!isSameSenderAsNext && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 mx-1">
          {formatTime(createdAt)}
        </div>
      )}
    </div>
  );
} 