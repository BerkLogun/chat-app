'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useChatStore } from '@/store/chat';
import { getSocket, socketEvents } from '@/lib/socket';
import { ChatRoom, Message } from '@/lib/api/chat';
import { useAuth } from '@/store/AuthProvider';
import { useAuthStore } from '@/store/auth';

export function useChatMessaging() {
  const { user } = useAuth();
  const { setUser } = useAuthStore();
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

  const [lastMessageSent, setLastMessageSent] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<{[roomId: string]: {[userId: string]: {username: string, timestamp: number}}}>({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      console.error('Could not connect to chat server.');
      return;
    }
    
    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      console.log('Message received via socket:', message);
      
      // Force refresh the rooms list first to ensure the UI shows latest messages
      console.log('Force refreshing rooms list after receiving message');
      fetchRooms().catch(err => {
        console.error('Error updating rooms list after message:', err);
      });
      
      // Only add to current room's messages if we're viewing that room
      if (currentRoom && message.roomId === currentRoom._id) {
        console.log('Message is for current room, adding to messages list');
        
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
    
    // Listen for user profile updates
    const handleUserStatusChange = (data: { userId: string, status?: string, username?: string }) => {
      console.log('User status change received:', data);
      
      // Track whether rooms need to be refreshed
      let needsRoomRefresh = false;
      
      // If this is the current user's update, update the auth store
      if (data.userId === user?._id && user) {
        console.log('Updating current user status:', data);
        const updatedUser = {
          ...user,
          status: (data.status as 'online' | 'offline' | 'away') || user.status,
          username: data.username || user.username
        };
        setUser(updatedUser);
        needsRoomRefresh = true;
      } else {
        console.log('Received status update for another user:', data);
        needsRoomRefresh = true;
      }
      
      // Force refresh rooms if needed
      if (needsRoomRefresh) {
        console.log('Refreshing rooms to update user status:', data);
        fetchRooms(true).catch(err => {
          console.error('Error refreshing rooms after user status change:', err);
        });
      }
    };
    
    // Listen for messages being read by other users
    const handleMessagesRead = (data: { roomId: string, userId: string }) => {
      console.log('Messages read event received:', data);
      
      // Force refresh rooms to update read status
      fetchRooms();
    };
    
    // Listen for chat list updates
    const handleChatListUpdate = () => {
      console.log('Chat list update received');
      fetchRooms(true);
    };
    
    // Register event listeners
    socket.on(socketEvents.RECEIVE_MESSAGE, handleNewMessage);
    socket.on(socketEvents.USER_TYPING, handleUserTyping);
    socket.on(socketEvents.USER_STATUS_CHANGE, handleUserStatusChange);
    socket.on(socketEvents.MESSAGES_READ, handleMessagesRead);
    socket.on(socketEvents.UPDATE_CHAT_LIST, handleChatListUpdate);
    
    // Cleanup listeners on unmount
    return () => {
      socket.off(socketEvents.RECEIVE_MESSAGE, handleNewMessage);
      socket.off(socketEvents.USER_TYPING, handleUserTyping);
      socket.off(socketEvents.USER_STATUS_CHANGE, handleUserStatusChange);
      socket.off(socketEvents.MESSAGES_READ, handleMessagesRead);
      socket.off(socketEvents.UPDATE_CHAT_LIST, handleChatListUpdate);
    };
  }, [currentRoom, fetchRooms, addMessage, fetchMessages, user, setUser]);

  // Clean up typing indicators that are stale (older than 5 seconds)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleTime = 5000; // 5 seconds
      
      setTypingUsers(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        
        // Check each room
        Object.keys(updated).forEach(roomId => {
          const roomTypers = updated[roomId];
          
          // Check each typer in the room
          Object.keys(roomTypers).forEach(userId => {
            const typer = roomTypers[userId];
            
            // Remove if stale
            if (now - typer.timestamp > staleTime) {
              delete roomTypers[userId];
              hasChanges = true;
            }
          });
          
          // Remove empty room
          if (Object.keys(roomTypers).length === 0) {
            delete updated[roomId];
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, 1000); // Check every second
    
    return () => clearInterval(cleanupInterval);
  }, []);

  // Handle sending messages
  const handleSendMessage = useCallback((content: string) => {
    if (!currentRoom || !content.trim() || !getSocket()) {
      return;
    }
    
    // Generate a temporary message ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create temporary message for immediate display
    const tempMessage: Message = {
      _id: tempId,
      roomId: currentRoom._id,
      content,
      sender: user?._id || '',
      createdAt: new Date().toISOString(),
      readBy: [user?._id || ''],
    };
    
    // Add temporary message to the UI immediately
    addMessage(tempMessage);
    
    // Send message to server
    const socket = getSocket();
    if (socket) {
      socket.emit(socketEvents.NEW_MESSAGE, {
        roomId: currentRoom._id,
        content
      });
      
      // Store the message for potential retry
      setLastMessageSent(content);
      
      // Clear typing indicator since we just sent a message
      if (isTyping) {
        setIsTyping(false);
        socket.emit(socketEvents.TYPING, {
          roomId: currentRoom._id,
          isTyping: false
        });
      }
    }
  }, [currentRoom, user, addMessage, isTyping]);

  // Handle typing indicator
  const handleTypingChange = useCallback((isCurrentlyTyping: boolean) => {
    // Skip if there's no change in typing state
    if (isTyping === isCurrentlyTyping) return;
    
    setIsTyping(isCurrentlyTyping);
    
    // Only send typing updates if we have an active room
    if (currentRoom) {
      const socket = getSocket();
      if (socket) {
        socket.emit(socketEvents.TYPING, {
          roomId: currentRoom._id,
          isTyping: isCurrentlyTyping
        });
      }
    }
    
    // Clear any existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // If user is typing, set a timeout to automatically clear it after 5 seconds
    if (isCurrentlyTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        
        if (currentRoom) {
          const socket = getSocket();
          if (socket) {
            socket.emit(socketEvents.TYPING, {
              roomId: currentRoom._id,
              isTyping: false
            });
          }
        }
      }, 5000);
    }
  }, [isTyping, currentRoom]);

  // Handle selecting a room
  const handleSelectRoom = useCallback((room: ChatRoom) => {
    setCurrentRoom(room);
    fetchMessages(room._id);
    
    // Mark room as read
    const socket = getSocket();
    if (socket) {
      socket.emit(socketEvents.READ_MESSAGES, { roomId: room._id });
    }
    
    // Reset typing state when switching rooms
    setIsTyping(false);
  }, [setCurrentRoom, fetchMessages]);

  return {
    rooms,
    currentRoom,
    messages,
    typingUsers,
    isTyping,
    lastMessageSent,
    refreshMessages,
    handleSendMessage,
    handleTypingChange,
    handleSelectRoom
  };
} 