'use client';

import React, { useState, useEffect, useRef } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, onTypingChange, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      // Notify that user stopped typing after sending message
      onTypingChange?.(false);
      // Focus the input after sending
      inputRef.current?.focus();
    }
  };

  // Detect typing activity
  useEffect(() => {
    // Only detect typing when there's a message and typing notifications are enabled
    if (message.trim() && onTypingChange && !disabled) {
      // Notify that user is typing
      onTypingChange(true);
      
      // Clear previous timeout if it exists
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set a new timeout to notify when user stops typing
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange(false);
      }, 2000); // 2 seconds of inactivity considered "stopped typing"
    }
    
    // If message is empty, notify that user stopped typing
    if (!message.trim() && onTypingChange) {
      onTypingChange(false);
    }
    
    // Clean up timeout on component unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, onTypingChange, disabled]);

  return (
    <div className="px-2 py-2 sm:px-4 sm:py-3 bg-white dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button 
          type="button" 
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          disabled={disabled}
          aria-label="Attach file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={disabled ? "Reconnecting..." : "Type a message..."}
            className={`w-full rounded-full py-2.5 px-4 ${
              disabled ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            } border-none focus:ring-2 focus:ring-blue-500 focus:outline-none text-base`}
            disabled={disabled}
            autoComplete="off"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={disabled || !message.trim()}
          className={`p-2.5 rounded-full flex items-center justify-center ${
            message.trim() && !disabled 
              ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700' 
              : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          } transition-colors h-10 w-10`}
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
} 