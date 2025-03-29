'use client';

import { create } from 'zustand';
import { ChatRoom, Message, chatService } from '@/lib/api/chat';
import { User } from './auth';

interface ChatState {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setRooms: (rooms: ChatRoom[]) => void;
  setCurrentRoom: (room: ChatRoom | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Async actions
  fetchRooms: (forceRefresh?: boolean) => Promise<void>;
  fetchMessages: (roomId: string) => Promise<void>;
  sendMessage: (roomId: string, content: string) => Promise<void>;
  markAsRead: (roomId: string) => Promise<void>;
  createPrivateRoom: (userId: string) => Promise<ChatRoom>;
  createGroupRoom: (name: string, participants: string[]) => Promise<ChatRoom>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  messages: [],
  isLoading: false,
  error: null,
  
  // Synchronous actions
  setRooms: (rooms) => set({ rooms }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setMessages: (messages) => set({ messages }),
  
  // Add a message to the current chat, avoid duplicates
  addMessage: (message) => {
    console.log('Adding message to store:', message);
    const currentMessages = get().messages;
    
    // Check if message already exists by ID (avoid duplicates)
    const messageExists = currentMessages.some(m => m._id === message._id);

    // Handle temporary messages that should be replaced by server messages
    const isServerMessage = !message._id.startsWith('temp-');
    const tempMessageWithSameContent = currentMessages.find(m => 
      m._id.startsWith('temp-') && 
      m.content === message.content && 
      isServerMessage
    );
    
    if (tempMessageWithSameContent) {
      console.log('Replacing temporary message with server message');
      // Replace the temporary message with the server message
      const updatedMessages = currentMessages.map(m => 
        m._id === tempMessageWithSameContent._id ? message : m
      );
      
      set({ messages: updatedMessages });
    } else if (!messageExists) {
      console.log('Message is new, adding to store');
      
      // Ensure consistent roomId/chatRoom fields 
      const normalizedMessage = {
        ...message,
        // Make sure we have both fields for consistent access
        roomId: message.roomId || message.chatRoom || '',
        chatRoom: message.chatRoom || message.roomId || ''
      };
      
      // Make sure we sort by timestamp if available
      let updatedMessages = [...currentMessages, normalizedMessage];
      
      // Sort messages by createdAt if available
      if (message.createdAt) {
        updatedMessages = updatedMessages.sort((a: Message, b: Message) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      }
      
      set({ messages: updatedMessages });
    } else {
      console.log('Message already exists in store, skipping');
    }
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // Asynchronous actions
  fetchRooms: async (forceRefresh = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chatService.getRooms(forceRefresh);
      console.log('Fetched chat rooms with forceRefresh=', forceRefresh, response);
      
      // Process chat rooms to handle various lastMessage formats
      const normalizedChatRooms = (response.chatRooms || []).map((room: any) => {
        // Make a copy of the room to avoid mutation issues
        const processedRoom = { ...room };
        
        // Check if lastMessage exists and process it
        if (room.lastMessage) {
          // This can be a reference ID or a full Message object depending on populate settings
          const lastMessage = room.lastMessage;
          
          console.log('Raw lastMessage from server:', {
            roomId: room._id,
            lastMessage,
            hasContent: !!lastMessage.content,
            hasCreatedAt: !!lastMessage.createdAt,
            senderType: typeof lastMessage.sender
          });
          
          // Create a properly formatted lastMessage object that works with our UI
          processedRoom.lastMessage = {
            _id: lastMessage._id || '',
            content: lastMessage.content || '',
            // Handle sender being either a string ID or an object with _id
            sender: typeof lastMessage.sender === 'object' && lastMessage.sender?._id 
              ? lastMessage.sender._id 
              : (lastMessage.sender || ''),
            // Ensure we always have a valid timestamp for relative time display
            timestamp: lastMessage.createdAt || lastMessage.timestamp || new Date().toISOString(),
            // Keep original fields as well in case they're needed
            createdAt: lastMessage.createdAt || '',
            readBy: lastMessage.readBy || []
          };
        }
        
        return processedRoom;
      });
      
      console.log('Normalized chat rooms:', normalizedChatRooms);
      set({ rooms: normalizedChatRooms, isLoading: false });
    } catch (error) {
      console.error('Error fetching rooms:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  fetchMessages: async (roomId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chatService.getMessages(roomId);
      console.log(`Fetched ${response.messages?.length || 0} messages for room ${roomId}`);
      
      // Sort messages by timestamp before setting them
      const sortedMessages = (response.messages || []).sort((a: Message, b: Message) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      set({ messages: sortedMessages, isLoading: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  sendMessage: async (roomId, content) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chatService.sendMessage(roomId, content);
      const message = response.message;
      console.log('Message sent and received from server:', message);
      
      // Update messages with the confirmed message from server
      const currentMessages = get().messages;
      
      // Replace any temporary message with the same content
      const updatedMessages = currentMessages.filter(m => 
        !(m._id.startsWith('temp-') && m.content === content)
      );
      
      set({
        messages: [...updatedMessages, message],
        isLoading: false
      });
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  markAsRead: async (roomId) => {
    try {
      await chatService.markAsRead(roomId);
      
      // Update room unread counts
      const rooms = get().rooms.map(room => 
        room._id === roomId ? { ...room, unreadCount: 0 } : room
      );
      set({ rooms });
      
      console.log(`Marked messages as read in room ${roomId}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      set({ error: (error as Error).message });
    }
  },
  
  createPrivateRoom: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chatService.createPrivateRoom(userId);
      const room = response.chatRoom;
      console.log('Created private room:', room);
      
      // Check if room already exists in list
      const roomExists = get().rooms.some(r => r._id === room._id);
      
      set({
        rooms: roomExists ? get().rooms : [...get().rooms, room],
        currentRoom: room,
        isLoading: false
      });
      return room;
    } catch (error) {
      console.error('Error creating private room:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  createGroupRoom: async (name, participants) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chatService.createGroupRoom(name, participants);
      const room = response.chatRoom;
      console.log('Created group room:', room);
      
      set({
        rooms: [...get().rooms, room],
        currentRoom: room,
        isLoading: false
      });
      return room;
    } catch (error) {
      console.error('Error creating group room:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  }
})); 