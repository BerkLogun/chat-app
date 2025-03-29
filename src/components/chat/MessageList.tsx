'use client';

import React, { useEffect, useRef } from 'react';
import { Message } from '@/lib/api/chat';
import {
  DateHeader,
  MessageItem,
  TypingIndicator,
  EmptyState
} from './utils';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  typingIndicator?: string;
}

// Main MessageList component
export function MessageList({ messages, currentUserId, typingIndicator }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change or when typing status changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingIndicator]);

  if (messages.length === 0 && !typingIndicator) {
    return <EmptyState />;
  }

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    
    messages.forEach(message => {
      const msgDate = new Date(message.createdAt).toLocaleDateString();
      
      if (msgDate !== currentDate) {
        groups.push({ date: msgDate, messages: [message] });
        currentDate = msgDate;
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });
    
    return groups;
  };
  
  const messageGroups = groupMessagesByDate();

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-y-auto scrollbar-thin"
      style={{ 
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div className="px-2 sm:px-4 md:px-6 py-2 sm:py-4">
        <div className="flex flex-col space-y-3 sm:space-y-4">
          {messageGroups.map((group) => (
            <div key={group.date} className="space-y-2 sm:space-y-3">
              <DateHeader date={group.date} />
              
              {group.messages.map((message, index) => {
                // Check if next message is from same sender (for grouping bubbles)
                const nextMessage = group.messages[index + 1];
                const messageSenderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
                const isSameSenderAsNext = nextMessage && 
                  String(typeof nextMessage.sender === 'object' && nextMessage.sender !== null && '_id' in nextMessage.sender ? 
                    nextMessage.sender._id : nextMessage.sender) === 
                  String(messageSenderId);
                  
                // Check if previous message is from same sender
                const prevMessage = group.messages[index - 1];
                const isSameSenderAsPrev = prevMessage && 
                  String(typeof prevMessage.sender === 'object' && prevMessage.sender !== null && '_id' in prevMessage.sender ? 
                    prevMessage.sender._id : prevMessage.sender) === 
                  String(messageSenderId);

                return (
                  <MessageItem
                    key={message._id}
                    message={message}
                    currentUserId={currentUserId}
                    isSameSenderAsPrev={isSameSenderAsPrev}
                    isSameSenderAsNext={isSameSenderAsNext}
                  />
                );
              })}
            </div>
          ))}
          
          {/* Typing indicator */}
          {typingIndicator && (
            <TypingIndicator username={typingIndicator} />
          )}
          
          {/* This invisible element ensures we can scroll to the bottom */}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>
    </div>
  );
} 