'use client';

import React, { useState } from 'react';
import { useAuth } from '@/store/AuthProvider';
import { ChatRoom } from '@/lib/api/chat';
import { userService } from '@/lib/api/user';
import { useChatStore } from '@/store/chat';
import Link from 'next/link';
import { User } from '@/store/auth';
import { getInitials, truncateText, getRelativeTime } from '@/lib/utils';
import { StatusIndicator } from '@/components/StatusIndicator';
import { formatChatRoomName, hasUnreadMessages, formatMessageTime } from '@/features/chat/utils';

interface ChatSidebarProps {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  onSelectRoom: (room: ChatRoom) => void;
  isVisible: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export function ChatSidebar({ 
  rooms, 
  currentRoom, 
  onSelectRoom, 
  isVisible, 
  onClose,
  onOpenSettings
}: ChatSidebarProps) {
  const { user, logout } = useAuth();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const { createPrivateRoom } = useChatStore();
  
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 1) {
      try {
        const response = await userService.getUsers(query);
        // Access the users array from the response and filter out current user
        const users = response.users || [];
        setSearchResults(users.filter((u: User) => u._id !== user?._id));
      } catch (error) {
        console.error('Error searching users:', error);
      }
    } else {
      setSearchResults([]);
    }
  };
  
  const handleStartChat = async (userId: string) => {
    try {
      const room = await createPrivateRoom(userId);
      onSelectRoom(room);
      setIsCreatingChat(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };
  
  const handleLogout = () => {
    logout();
  };
  
  // Render participant status
  const getParticipantStatus = (room: ChatRoom): 'online' | 'offline' | 'away' => {
    if (!user || !room || room.type !== 'private') return 'offline';
    
    // Find the other participant
    const otherParticipant = room.participants?.find(p => {
      const id = typeof p === 'object' ? p._id : p;
      return id !== user._id;
    });
    
    if (otherParticipant && typeof otherParticipant === 'object' && 'status' in otherParticipant) {
      return otherParticipant.status as 'online' | 'offline' | 'away';
    }
    
    return 'offline';
  };
  
  return (
    <div className={`
      fixed md:relative inset-y-0 left-0 z-20 md:z-auto h-full 
      w-[85%] sm:w-80 md:w-72 max-w-sm
      transform ${isVisible ? 'translate-x-0' : '-translate-x-full'} 
      md:translate-x-0 transition-transform duration-300 ease-in-out
      bg-white dark:bg-gray-800 shadow-lg flex flex-col
      overflow-hidden
    `}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-bold text-xl bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Messages</h2>
        <div className="flex items-center space-x-3">
          <button
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setIsCreatingChat(!isCreatingChat)}
            aria-label={isCreatingChat ? 'Cancel' : 'New Chat'}
          >
            {isCreatingChat ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
          <button
            className="md:hidden p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={isCreatingChat ? "Search users..." : "Search messages..."}
            value={searchQuery}
            onChange={handleSearch}
            className="w-full py-2 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-gray-700 border-none text-sm focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-200"
          />
        </div>
      </div>
      
      {/* Search results */}
      {isCreatingChat && searchResults.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
            Search Results
          </h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {searchResults.map((resultUser) => (
              <div
                key={resultUser._id}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer flex items-center transition-colors duration-200"
                onClick={() => handleStartChat(resultUser._id)}
              >
                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
                  {resultUser.avatar ? (
                    <img src={resultUser.avatar} alt={resultUser.username} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    getInitials(resultUser.username)
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{resultUser.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2 mt-1">
          Conversations
        </h3>
        
        {rooms.length > 0 ? (
          <div className="space-y-1.5">
            {rooms.map((room) => {
              const isActive = currentRoom?._id === room._id;
              const participantStatus = getParticipantStatus(room);
              const unread = user?._id ? hasUnreadMessages(room, user._id) : false;
              const roomName = user?._id ? formatChatRoomName(room, user._id) : '';
              
              return (
                <div
                  key={room._id}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-sm'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                  }`}
                  onClick={() => onSelectRoom(room)}
                >
                  <div className="flex items-center">
                    <div className="relative flex-shrink-0">
                      <div 
                        className={`h-12 w-12 rounded-full flex items-center justify-center text-white shadow-md ${
                        isActive 
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                          : 'bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700'
                      }`}>
                        {getInitials(roomName)}
                      </div>
                      
                      {/* Status indicator for direct chats */}
                      {room.type === 'private' && (
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <StatusIndicator status={participantStatus} size="md" />
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h4 className={`font-medium truncate ${
                          unread ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        } ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                          {roomName}
                        </h4>
                        {room.lastMessage?.timestamp && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-1">
                            {formatMessageTime(room.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center mt-0.5">
                        <p className={`text-sm truncate ${
                          unread 
                            ? 'font-semibold text-gray-900 dark:text-gray-100' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {room.lastMessage?.content ? truncateText(room.lastMessage.content, 30) : 'No messages yet'}
                        </p>
                        
                        {unread && (
                          <div className="ml-2 h-2.5 w-2.5 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="mb-2">No conversations yet</p>
            <button
              onClick={() => setIsCreatingChat(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
            >
              Start a new chat
            </button>
          </div>
        )}
      </div>
      
      {/* User profile section at bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div 
          className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={onOpenSettings}
          role="button"
          aria-label="Open profile settings"
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                getInitials(user?.username || 'User')
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">{user?.username || 'User'}</h4>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
              </div>
            </div>
          </div>
          
          <div className="text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="mt-2 w-full py-2 flex items-center justify-center text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
} 