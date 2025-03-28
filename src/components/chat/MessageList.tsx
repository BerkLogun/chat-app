'use client';

import React, { useEffect, useRef } from 'react';
import { Message } from '@/lib/api/chat';
import { User } from '@/store/auth';
import { formatTime, getInitials } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  typingUsers?: string[];
}

export function MessageList({ messages, currentUser, typingUsers = [] }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change or when typing status changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  if (messages.length === 0 && typingUsers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start the conversation</p>
        </div>
      </div>
    );
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
    <div className="h-full w-full overflow-y-auto py-4 px-4 md:px-6 scrollbar-thin">
      <div className="flex flex-col space-y-6">
        {messageGroups.map((group, groupIndex) => (
          <div key={group.date} className="space-y-4">
            <div className="flex justify-center my-2">
              <div className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                {group.date === new Date().toLocaleDateString() ? 'Today' : group.date}
              </div>
            </div>
            
            {group.messages.map((message, index) => {
              // Check if the message is from the current user
              const currentUserId = currentUser?._id;
              const messageSenderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
              const isCurrentUserMessage = currentUserId && String(messageSenderId) === String(currentUserId);
              
              // Check if next message is from same sender (for grouping bubbles)
              const nextMessage = group.messages[index + 1];
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
                <div
                  key={message._id}
                  className={`flex w-full ${isCurrentUserMessage ? 'justify-end' : 'justify-start'} ${isSameSenderAsPrev ? 'mt-1' : 'mt-4'}`}
                >
                  {!isCurrentUserMessage && !isSameSenderAsPrev && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2 self-end">
                      {typeof message.sender === 'object' && message.sender !== null && 'username' in message.sender
                        ? getInitials(message.sender.username)
                        : getInitials('Other')}
                    </div>
                  )}
                  
                  {!isCurrentUserMessage && isSameSenderAsPrev && (
                    <div className="w-8 mr-2"></div>
                  )}
                  
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
                        {message.content}
                      </p>
                    </div>
                    
                    {!isSameSenderAsNext && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 mx-1">
                        {formatTime(message.createdAt)}
                      </div>
                    )}
                  </div>
                  
                  {isCurrentUserMessage && !isSameSenderAsPrev && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white ml-2 self-end">
                      {getInitials(currentUser?.username || 'Me')}
                    </div>
                  )}
                  
                  {isCurrentUserMessage && isSameSenderAsPrev && (
                    <div className="w-8 ml-2"></div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex w-full justify-start mt-2">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2 self-end">
              <span className="text-xs">...</span>
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
                    {typingUsers.length === 1 
                      ? `${typingUsers[0]} is typing...` 
                      : typingUsers.length === 2 
                        ? `${typingUsers[0]} and ${typingUsers[1]} are typing...` 
                        : `${typingUsers.length} people are typing...`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
} 