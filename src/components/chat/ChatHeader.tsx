'use client';

import React from 'react';
import { ChatRoom } from '@/lib/api/chat';
import { getInitials } from '@/lib/utils';
import { useAuth } from '@/store/AuthProvider';
import { StatusIndicator } from '@/components/StatusIndicator';
import { formatChatRoomName } from '@/features/chat/utils';

interface ChatHeaderProps {
  room: ChatRoom;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export function ChatHeader({ room, onMenuClick, onProfileClick }: ChatHeaderProps) {
  const { user } = useAuth();
  
  // Get participant status for direct chats
  const getParticipantStatus = (): 'online' | 'offline' | 'away' | null => {
    if (!room || room.type !== 'private') return null;
    
    // Find the other participant
    const otherParticipant = room.participants?.find(p => {
      const id = typeof p === 'object' ? p._id : p;
      return id !== user?._id;
    });
    
    if (otherParticipant && typeof otherParticipant === 'object' && 'status' in otherParticipant) {
      return otherParticipant.status as 'online' | 'offline' | 'away';
    }
    
    return 'offline';
  };
  
  const roomName = user?._id ? formatChatRoomName(room, user._id) : room.name || 'Chat';
  const status = getParticipantStatus();
  const statusText = status 
    ? status.charAt(0).toUpperCase() + status.slice(1) 
    : (room.type === 'private' ? 'Private conversation' : `${room.participants.length} members`);

  return (
    <div className="py-2 px-3 sm:py-3 sm:px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shadow-sm flex-shrink-0 w-full">
      <div className="flex items-center">
        <button 
          className="md:hidden mr-2 sm:mr-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="relative flex-shrink-0">
          <div className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
            {getInitials(roomName)}
          </div>
          {status && (
            <div className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white dark:ring-gray-800">
              <StatusIndicator status={status} size="md" />
            </div>
          )}
        </div>
        <div className="ml-2 sm:ml-3 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-base">{roomName}</h3>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            {status && <div className="w-2 h-2 rounded-full bg-transparent mr-1.5" />}
            <span className="truncate max-w-[150px] sm:max-w-[200px]">{statusText}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center">
        <button 
          className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={onProfileClick}
          aria-label="Profile settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
} 