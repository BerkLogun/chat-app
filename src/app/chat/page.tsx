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
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex">
      {/* Chat Sidebar - Using relative positioning for desktop to allow interactions */}
      <div className="md:relative md:w-72 flex-shrink-0">
        <ChatSidebar
          rooms={rooms}
          currentRoom={currentRoom}
          onSelectRoom={handleRoomSelect}
          isVisible={showSidebar}
          onClose={() => setShowSidebar(false)}
          onOpenSettings={handleOpenSettings}
        />
      </div>
      
      {/* Overlay when sidebar is shown on mobile */}
      {showSidebar && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Main Chat Area */}
      <div className="flex-1 relative">
        {currentRoom ? (
          <>
            {/* Fixed position header - fixed at top */}
            <div className="fixed top-0 right-0 left-0 md:left-72 z-10 shadow-sm">
              <ChatHeader
                room={currentRoom}
                onMenuClick={toggleSidebar}
                onProfileClick={handleOpenSettings}
              />
            </div>
            
            {/* Fixed position message input - fixed at bottom */}
            <div className="fixed bottom-0 right-0 left-0 md:left-72 z-10 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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
            
            {/* Scrollable Message Area - positioned between header and footer */}
            <div className="fixed top-[56px] bottom-[60px] right-0 left-0 md:left-72">
              <MessageList
                messages={messages}
                typingIndicator={typingIndicator}
                currentUserId={user?._id || ''}
              />
            </div>
          </>
        ) : (
          <div className="fixed inset-0 md:left-72 flex items-center justify-center p-4 text-center text-gray-500 dark:text-gray-400">
            <div className="max-w-md w-full">
              <div className="absolute top-4 left-4 md:hidden">
                <button 
                  className="p-2 rounded-md bg-white dark:bg-gray-800 shadow-md text-gray-700 dark:text-gray-300"
                  onClick={toggleSidebar}
                  aria-label="Open menu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
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