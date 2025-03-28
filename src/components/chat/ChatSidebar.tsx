'use client';

import React, { useState } from 'react';
import { useAuth } from '@/store/AuthProvider';
import { ChatRoom } from '@/lib/api/chat';
import { userService } from '@/lib/api/user';
import { useChatStore } from '@/store/chat';
import Link from 'next/link';
import { User } from '@/store/auth';
import { getInitials, truncateText, getRelativeTime } from '@/lib/utils';

interface ChatSidebarProps {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  onSelectRoom: (room: ChatRoom) => void;
  onClose?: () => void;
  typingUsers?: {[roomId: string]: string[]};
}

export function ChatSidebar({ rooms, currentRoom, onSelectRoom, onClose, typingUsers = {} }: ChatSidebarProps) {
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
  
  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h2 className="font-bold text-xl">Messages</h2>
        <div className="flex items-center space-x-2">
          <button
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
            className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
      <div className="px-4 pb-3">
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
            className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 dark:bg-gray-700 border-none text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Search results */}
      {isCreatingChat && searchResults.length > 0 && (
        <div className="px-4 pb-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
            Search Results
          </h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {searchResults.map((user) => (
              <div
                key={user._id}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer flex items-center"
                onClick={() => handleStartChat(user._id)}
              >
                <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="h-10 w-10 rounded-full" />
                  ) : (
                    getInitials(user.username)
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{user.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-3">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2 mt-2">
          Conversations
        </h3>
        
        {rooms.length > 0 ? (
          <div className="space-y-1">
            {rooms.map((room) => {
              const isTyping = typingUsers[room._id]?.length > 0;
              const isActive = currentRoom?._id === room._id;
              
              return (
                <div
                  key={room._id}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => onSelectRoom(room)}
                >
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-white ${
                      isActive ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-600'
                    }`}>
                      {room.type === 'private' ? (
                        (() => {
                          // Get the other participant for avatar initials
                          const otherParticipant = room.participants.find(p => {
                            if (typeof p === 'object' && p !== null && '_id' in p) {
                              return p._id !== user?._id;
                            }
                            return false;
                          });
                          
                          if (otherParticipant && typeof otherParticipant === 'object' && 'username' in otherParticipant) {
                            return getInitials(otherParticipant.username);
                          }
                          return getInitials(room.name || 'Chat');
                        })()
                      ) : (
                        <span className="text-xs">Group</span>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium truncate ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                          {room.type === 'private' ? (
                            (() => {
                              // Find other participant
                              const otherParticipant = room.participants.find(p => {
                                if (typeof p === 'object' && p !== null && '_id' in p) {
                                  return p._id !== user?._id;
                                }
                                return false;
                              });
                              
                              if (otherParticipant && typeof otherParticipant === 'object' && 'username' in otherParticipant) {
                                return truncateText(otherParticipant.username, 18);
                              }
                              return truncateText(room.name || 'Chat', 18);
                            })()
                          ) : (
                            truncateText(room.name || 'Group', 18)
                          )}
                        </p>
                        {room.lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0">
                            {getRelativeTime(
                              room.lastMessage.timestamp || 
                              room.lastMessage.createdAt || 
                              new Date().toISOString()
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {isTyping ? (
                          <span className="text-blue-500 dark:text-blue-400 flex items-center">
                            <span className="typing-indicator-small mr-1">
                              <span></span>
                              <span></span>
                              <span></span>
                            </span>
                            {typingUsers[room._id].length === 1 
                              ? `${typingUsers[room._id][0]} is typing...`
                              : `${typingUsers[room._id].length} people typing...`}
                          </span>
                        ) : (
                          room.lastMessage
                            ? truncateText(room.lastMessage.content, 28)
                            : 'No messages yet'
                        )}
                      </p>
                    </div>
                    {room.unreadCount > 0 && (
                      <div className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1 flex-shrink-0">
                        {room.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mt-2">
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Start a new chat to begin messaging</p>
          </div>
        )}
      </div>
      
      {/* User profile */}
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} className="h-10 w-10 rounded-full" />
              ) : (
                getInitials(user?.username || '')
              )}
            </div>
            <div className="ml-3 min-w-0">
              <p className="font-medium truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.status || 'Online'}</p>
            </div>
          </div>
          <div className="flex space-x-1">
            <Link href="/profile" className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 