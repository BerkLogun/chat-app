'use client';

import React from 'react';
import { Message } from '@/lib/api/chat';
import { UserAvatar } from './UserAvatar';
import { MessageBubble } from './MessageBubble';

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  isSameSenderAsPrev: boolean;
  isSameSenderAsNext: boolean;
}

export function MessageItem({
  message,
  currentUserId,
  isSameSenderAsPrev,
  isSameSenderAsNext
}: MessageItemProps) {
  const messageSenderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
  const isCurrentUserMessage = String(messageSenderId) === String(currentUserId);
  
  const username = typeof message.sender === 'object' && message.sender !== null && 'username' in message.sender
    ? message.sender.username
    : 'Other';

  return (
    <div
      className={`flex w-full ${isCurrentUserMessage ? 'justify-end' : 'justify-start'} ${isSameSenderAsPrev ? 'mt-1' : 'mt-4'}`}
    >
      {!isCurrentUserMessage && !isSameSenderAsPrev && (
        <div className="mr-2 self-end">
          <UserAvatar username={username} isCurrentUser={false} />
        </div>
      )}
      
      {!isCurrentUserMessage && isSameSenderAsPrev && (
        <div className="w-8 mr-2"></div>
      )}
      
      <MessageBubble 
        content={message.content}
        createdAt={message.createdAt}
        isCurrentUserMessage={isCurrentUserMessage}
        isSameSenderAsPrev={isSameSenderAsPrev}
        isSameSenderAsNext={isSameSenderAsNext}
      />
      
      {isCurrentUserMessage && !isSameSenderAsPrev && (
        <div className="ml-2 self-end">
          <UserAvatar username="Me" isCurrentUser={true} />
        </div>
      )}
      
      {isCurrentUserMessage && isSameSenderAsPrev && (
        <div className="w-8 ml-2"></div>
      )}
    </div>
  );
} 