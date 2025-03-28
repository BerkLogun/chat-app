'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/store/chat';
import { getSocket, socketEvents, initializeSocket, closeSocket } from '@/lib/socket';
import { useAuth } from '@/store/AuthProvider';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatRoom, Message } from '@/lib/api/chat';

export default function ChatPage() {
  const { user } = useAuth();
  const { 
    rooms, 
    currentRoom, 
    messages, 
    addMessage, 
    markAsRead, 
    fetchMessages, 
    setCurrentRoom, 
    fetchRooms 
  } = useChatStore();
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [lastMessageSent, setLastMessageSent] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<{[roomId: string]: {[userId: string]: {username: string, timestamp: number}}}>({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to ensure socket connection
  const ensureSocketConnection = useCallback(() => {
    if (reconnecting) return null;
    
    let socket = getSocket();
    if (!socket) {
      // Try to re-initialize the socket
      try {
        closeSocket(); // First close any existing socket to prevent conflicts
        socket = initializeSocket();
        if (socket) {
          console.log('Socket re-initialized successfully');
          setSocketError(null);
          
          // Add specific listener for namespace errors
          socket.on('error', (error) => {
            console.error('Socket namespace error detected:', error);
            if (typeof error === 'object' && error !== null && 'message' in error && 
                typeof error.message === 'string' && error.message.includes('Invalid namespace')) {
              setSocketError('Connection error: Invalid namespace. Reconnecting...');
              setReconnecting(true);
              closeSocket();
              setTimeout(() => {
                const newSocket = initializeSocket();
                if (newSocket) {
                  console.log('Socket reconnected after namespace error');
                  setSocketError(null);
                } else {
                  setSocketError('Failed to reconnect after namespace error');
                }
                setReconnecting(false);
              }, 1000);
            }
          });
        } else {
          console.error('Failed to re-initialize socket');
          setSocketError('Connection error. Please try refreshing the page.');
        }
      } catch (error) {
        console.error('Error initializing socket:', error);
        setSocketError('Connection error occurred. Please try again.');
        return null;
      }
    }
    return socket;
  }, [reconnecting]);
  
  // Function to refresh messages for the current room
  const refreshMessages = useCallback(() => {
    if (currentRoom) {
      console.log(`Manually refreshing messages for room ${currentRoom._id}`);
      fetchMessages(currentRoom._id);
    }
  }, [currentRoom, fetchMessages]);
  
  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      setSocketError('Could not connect to chat server. Please try refreshing the page.');
      return;
    }
    
    setSocketError(null);
    
    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      console.log('Message received via socket:', message);
      
      // Force refresh the rooms list first to ensure the UI shows latest messages
      // This needs to happen immediately for ALL messages
      console.log('Force refreshing rooms list after receiving message');
      fetchRooms().catch(err => {
        console.error('Error updating rooms list after message:', err);
      });
      
      // Only add to current room's messages if we're viewing that room
      if (currentRoom && message.roomId === currentRoom._id) {
        console.log('Message is for current room, adding to messages list:', {
          messageId: message._id,
          roomId: message.roomId,
          currentRoomId: currentRoom._id
        });
        
        // Normalize the message for consistent display
        const normalizedMessage = {
          ...message,
          // Ensure message has consistent sender format
          sender: typeof message.sender === 'object' && message.sender?._id
            ? message.sender._id
            : message.sender
        };
        
        // Add the message to the chat
        addMessage(normalizedMessage);
        
        // Mark as read if we're in the room
        socket.emit(socketEvents.READ_MESSAGES, { roomId: currentRoom._id });
      } else {
        console.log('Message is for a different room, not adding to current messages');
      }
    };
    
    // Listen for typing indicators
    const handleUserTyping = (data: { roomId: string, userId: string, username: string, isTyping: boolean }) => {
      console.log('Typing indicator received:', data);
      
      if (data.isTyping) {
        // Add or update typing user
        setTypingUsers(prev => ({
          ...prev,
          [data.roomId]: {
            ...(prev[data.roomId] || {}),
            [data.userId]: {
              username: data.username,
              timestamp: Date.now()
            }
          }
        }));
      } else {
        // Remove typing user
        setTypingUsers(prev => {
          const roomTypers = prev[data.roomId] || {};
          const newRoomTypers = { ...roomTypers };
          delete newRoomTypers[data.userId];
          
          return {
            ...prev,
            [data.roomId]: newRoomTypers
          };
        });
      }
    };
    
    socket.on(socketEvents.RECEIVE_MESSAGE, handleNewMessage);
    socket.on(socketEvents.USER_TYPING, handleUserTyping);

    // Listen for chat list updates
    socket.on(socketEvents.UPDATE_CHAT_LIST, () => {
      console.log('Chat list update event received - refreshing rooms list');
      
      // Always fetch rooms to update room list with the latest data
      // This is critical for when messages are received while the user is not in the chat room
      fetchRooms().then(() => {
        console.log('Rooms list refreshed successfully');
        
        // If we're in a room, also refresh message list
        if (currentRoom) {
          console.log('Currently in a room, refreshing messages');
          refreshMessages();
        }
      }).catch(err => {
        console.error('Error refreshing rooms after update event:', err);
      });
    });
    
    // Listen for connection issues
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected in component:', reason);
      if (reason === 'transport error' || reason === 'transport close') {
        setSocketError('Connection lost. Attempting to reconnect...');
      }
    });
    
    socket.on('connect', () => {
      // Clear any socket errors when reconnected
      setSocketError(null);
      // Rejoin current room if any
      if (currentRoom) {
        socket.emit(socketEvents.JOIN_ROOM, currentRoom._id);
        // Refresh messages after reconnecting
        refreshMessages();
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connect error in chat page:', error);
      setSocketError('Connection error. Attempting to reconnect...');
    });
    
    // Clean up listeners
    return () => {
      socket.off(socketEvents.RECEIVE_MESSAGE, handleNewMessage);
      socket.off(socketEvents.USER_TYPING, handleUserTyping);
      socket.off(socketEvents.UPDATE_CHAT_LIST);
      socket.off('disconnect');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('error');
    };
  }, [currentRoom, addMessage, fetchRooms, refreshMessages]);
  
  // Mark messages as read when entering a room
  useEffect(() => {
    if (currentRoom) {
      fetchMessages(currentRoom._id);
      markAsRead(currentRoom._id);
      
      const socket = ensureSocketConnection();
      if (socket) {
        socket.emit(socketEvents.JOIN_ROOM, currentRoom._id);
        socket.emit(socketEvents.READ_MESSAGES, { roomId: currentRoom._id });
      }
      
      // Close sidebar automatically on mobile when selecting a room
      setShowSidebar(false);
    }
  }, [currentRoom, fetchMessages, markAsRead, ensureSocketConnection]);
  
  const handleSendMessage = (content: string) => {
    if (!currentRoom || !content.trim()) return;
    
    // Create a unique ID for the optimistic message
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const socket = ensureSocketConnection();
    if (socket) {
      try {
        console.log('Sending message via socket:', {
          roomId: currentRoom._id,
          content,
          tempId
        });
        
        // Add optimistic local message
        const optimisticMessage: Partial<Message> = {
          _id: tempId,
          roomId: currentRoom._id,
          content,
          sender: user?._id || '', // Just the ID as a string
          readBy: [user?._id || ''],
          createdAt: new Date().toISOString(),
        };
        
        // Add to messages immediately for instant feedback
        addMessage(optimisticMessage as Message);
        
        // Send via socket
        socket.emit(socketEvents.NEW_MESSAGE, {
          roomId: currentRoom._id,
          content
        });
      } catch (error) {
        console.error('Error sending message:', error);
        setSocketError('Failed to send message. Please try again.');
      }
    } else {
      // Handle error when socket is not available
      setSocketError('Unable to send message. Connection issue detected.');
    }
  };
  
  // Handle typing status changes
  const handleTypingChange = (isCurrentlyTyping: boolean) => {
    if (!currentRoom) return;
    
    // Don't send duplicate typing status
    if (isTyping === isCurrentlyTyping) return;
    
    setIsTyping(isCurrentlyTyping);
    const socket = ensureSocketConnection();
    
    if (socket) {
      socket.emit(socketEvents.TYPING, {
        roomId: currentRoom._id,
        isTyping: isCurrentlyTyping
      });
    }
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // If user is typing, set a timeout to automatically clear typing status
    if (isCurrentlyTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        const socket = ensureSocketConnection();
        if (socket) {
          socket.emit(socketEvents.TYPING, {
            roomId: currentRoom._id,
            isTyping: false
          });
        }
      }, 3000); // Stop showing as typing after 3 seconds of inactivity
    }
  };
  
  // Function to toggle sidebar visibility on mobile
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  const handleSelectRoom = (room: ChatRoom) => {
    setCurrentRoom(room);
    setShowSidebar(false); // Close sidebar on mobile when selecting a room
  };
  
  // Function to handle retry of connection
  const handleRetryConnection = () => {
    setSocketError('Attempting to reconnect...');
    setReconnecting(true);
    
    // Close existing socket first
    closeSocket();
    
    // Wait a moment before reconnecting
    setTimeout(() => {
      const socket = initializeSocket();
      if (socket) {
        setSocketError(null);
        if (currentRoom) {
          socket.emit(socketEvents.JOIN_ROOM, currentRoom._id);
        }
      } else {
        setSocketError('Failed to reconnect. Please try refreshing the page.');
      }
      setReconnecting(false);
    }, 1000);
  };
  
  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  
  // Get active typing users for the current room
  const getActiveTypingUsers = useCallback(() => {
    if (!currentRoom) return [];
    
    const roomTypers = typingUsers[currentRoom._id] || {};
    const activeTypers = Object.entries(roomTypers)
      .filter(([userId]) => userId !== user?._id) // Filter out current user
      .map(([_, userData]) => userData.username);
    
    return activeTypers;
  }, [currentRoom, typingUsers, user?._id]);

  // Format typing users for sidebar display
  const getSidebarTypingUsers = useCallback(() => {
    const result: {[roomId: string]: string[]} = {};
    
    // Convert the typing user structure for sidebar display
    Object.entries(typingUsers).forEach(([roomId, users]) => {
      // Filter out current user and get usernames
      const typingUsernames = Object.entries(users)
        .filter(([userId]) => userId !== user?._id)
        .map(([_, userData]) => userData.username);
      
      if (typingUsernames.length > 0) {
        result[roomId] = typingUsernames;
      }
    });
    
    return result;
  }, [typingUsers, user?._id]);
  
  return (
    <div className="fixed inset-0 w-full h-full flex bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - hidden on mobile unless showSidebar is true */}
      <div 
        className={`
          fixed md:relative inset-0 z-20 md:z-auto h-full 
          transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 transition-transform duration-300 ease-in-out
          md:w-72 bg-white dark:bg-gray-800 shadow-lg
        `}
      >
        <ChatSidebar 
          rooms={rooms} 
          currentRoom={currentRoom}
          onSelectRoom={handleSelectRoom}
          onClose={toggleSidebar}
          typingUsers={getSidebarTypingUsers()}
        />
      </div>
      
      {/* Overlay when sidebar is shown on mobile */}
      {showSidebar && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full md:pl-4 md:pr-4 md:py-4">
        {socketError && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-2 text-sm text-center">
            {socketError}
            <button 
              onClick={handleRetryConnection}
              className="ml-2 underline font-medium"
              disabled={reconnecting}
            >
              {reconnecting ? 'Reconnecting...' : 'Retry'}
            </button>
          </div>
        )}
        
        {currentRoom ? (
          <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <ChatHeader 
              room={currentRoom} 
              onMenuClick={toggleSidebar}
              isMobile={true}
            />
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
              <MessageList messages={messages} currentUser={user} typingUsers={getActiveTypingUsers()} />
            </div>
            <MessageInput 
              onSendMessage={handleSendMessage} 
              onTypingChange={handleTypingChange}
              disabled={reconnecting || !!socketError} 
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            {/* Mobile menu button when no chat is selected */}
            <button 
              className="md:hidden fixed top-4 left-4 p-2 rounded-full bg-white dark:bg-gray-700 shadow-md z-10"
              onClick={toggleSidebar}
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-center">
              <div className="mb-4">
                <div className="h-16 w-16 mx-auto bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-medium mb-2">Welcome to Chat</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Select a conversation from the sidebar or start a new one to begin messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 