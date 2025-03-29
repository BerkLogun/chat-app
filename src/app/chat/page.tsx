'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/store/AuthProvider';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { ProfileModal } from '@/components/chat/ProfileModal';
import { useSocketConnection } from '@/hooks/useSocketConnection';
import { useChatMessaging } from '@/hooks/useChatMessaging';
import { formatTypingIndicator } from '@/features/chat/utils';
import { ChatRoom } from '@/lib/api/chat';

export default function ChatPage() {
  const { user } = useAuth();
  const { socketError, retryConnection } = useSocketConnection();
  const { 
    rooms, 
    currentRoom, 
    messages, 
    typingUsers, 
    handleSendMessage, 
    handleTypingChange, 
    handleSelectRoom 
  } = useChatMessaging();
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if device is mobile on component mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Format typing indicator for current room
  const typingIndicator = currentRoom && typingUsers[currentRoom._id]
    ? formatTypingIndicator(typingUsers[currentRoom._id], user?._id || '')
    : '';
  
  // Toggle sidebar for mobile view
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  // Close sidebar on mobile when selecting a room
  const handleRoomSelect = (room: ChatRoom) => {
    handleSelectRoom(room);
    if (isMobile) {
      setShowSidebar(false);
    }
  };
  
  // Handle opening settings modal
  const handleOpenSettings = () => {
    setIsProfileModalOpen(true);
    // Close sidebar on mobile when opening settings
    if (isMobile) {
      setShowSidebar(false);
    }
  };
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Chat Sidebar */}
      <ChatSidebar
        rooms={rooms}
        currentRoom={currentRoom}
        onSelectRoom={handleRoomSelect}
        isVisible={showSidebar}
        onClose={() => setShowSidebar(false)}
        onOpenSettings={handleOpenSettings}
      />
      
      {/* Overlay when sidebar is shown on mobile */}
      {showSidebar && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full h-full">
        {currentRoom ? (
          <>
            <ChatHeader
              room={currentRoom}
              onMenuClick={toggleSidebar}
              onProfileClick={handleOpenSettings}
            />
            
            <div className="flex-1 overflow-hidden">
              <MessageList
                messages={messages}
                typingIndicator={typingIndicator}
                currentUserId={user?._id || ''}
              />
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700">
              <MessageInput
                onSendMessage={handleSendMessage}
                onTypingChange={handleTypingChange}
                disabled={!!socketError}
              />
              
              {socketError && (
                <div className="p-2 text-red-500 text-sm flex items-center justify-between bg-red-50 dark:bg-red-900/20">
                  <span className="truncate">{socketError}</span>
                  <button 
                    onClick={retryConnection}
                    className="ml-2 px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 whitespace-nowrap"
                  >
                    Reconnect
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4 text-center text-gray-500 dark:text-gray-400">
            <div className="max-w-md w-full">
              <h3 className="text-xl font-semibold mb-2">Welcome to Chat</h3>
              <p className="mb-4">Select a conversation or start a new one</p>
              
              {/* Mobile-only button to open sidebar */}
              <button 
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md md:hidden hover:bg-blue-600 transition"
                onClick={toggleSidebar}
              >
                View conversations
              </button>
              
              {socketError && (
                <div className="mt-4 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                  <p className="mb-2">{socketError}</p>
                  <button 
                    onClick={retryConnection}
                    className="w-full px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                  >
                    Reconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* User profile modal */}
      {isProfileModalOpen && (
        <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)} 
        />
      )}
    </div>
  );
} 