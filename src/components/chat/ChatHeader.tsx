'use client';

import React from 'react';
import { ChatRoom } from '@/lib/api/chat';
import { getInitials } from '@/lib/utils';
import { useAuth } from '@/store/AuthProvider';

interface ChatHeaderProps {
  room: ChatRoom;
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export function ChatHeader({ room, onMenuClick, isMobile }: ChatHeaderProps) {
  const { user } = useAuth();
  
  // Get the other participant's name for private chats
  const getDisplayName = () => {
    if (room.type === 'private') {
      // Find other participant
      const otherParticipant = room.participants.find(p => {
        if (typeof p === 'object' && p !== null && '_id' in p) {
          return p._id !== user?._id;
        }
        return false;
      });
      
      if (otherParticipant && typeof otherParticipant === 'object' && 'username' in otherParticipant) {
        return otherParticipant.username;
      }
    }
    return room.name;
  };
  
  // Get status text
  const getStatusText = () => {
    if (room.type === 'private') {
      // Find other participant
      const otherParticipant = room.participants.find(p => {
        if (typeof p === 'object' && p !== null && '_id' in p) {
          return p._id !== user?._id;
        }
        return false;
      });
      
      if (otherParticipant && typeof otherParticipant === 'object') {
        return otherParticipant.status || 'Offline';
      }
      return 'Private conversation';
    }
    return `${room.participants.length} members`;
  };
  
  const displayName = getDisplayName();

  return (
    <div className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
      <div className="flex items-center">
        {isMobile && (
          <button 
            className="md:hidden mr-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
          {room.type === 'private' ? (
            getInitials(displayName)
          ) : (
            <span className="text-xs">Group</span>
          )}
        </div>
        <div className="ml-3">
          <h3 className="font-medium">{displayName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getStatusText()}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
} 