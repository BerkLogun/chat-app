import axios from 'axios';

// Important: Remove '/api' suffix to be consistent with other services
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const chatApi = axios.create({
  baseURL: `${API_URL}/api/chat`,
  withCredentials: true,
});

// Add token to requests if available
chatApi.interceptors.request.use(
  (config) => {
    let token = null;
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        token = authData?.state?.token;
      }
    } catch (error) {
      console.error('Error parsing auth storage:', error);
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface ChatRoom {
  _id: string;
  name: string;
  type: 'private' | 'group';
  participants: Array<string | { _id: string; username: string; email?: string; status?: string; avatar?: string }>;
  lastMessage?: {
    _id?: string;
    content: string;
    sender: string;
    timestamp: string;
    createdAt?: string;
    chatRoom?: string;
    readBy?: string[];
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  roomId: string;
  chatRoom?: string;
  content: string;
  sender: string | { _id: string; username?: string; email?: string; avatar?: string };
  readBy: string[];
  createdAt: string;
}

export const chatService = {
  // Get all chat rooms for the current user
  getRooms: async (forceRefresh = false) => {
    try {
      // Add timestamp to force fresh data
      const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
      const response = await chatApi.get(`/rooms${timestamp}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
      return { rooms: [] };
    }
  },
  
  // Create or get a private chat room with another user
  createPrivateRoom: async (userId: string) => {
    try {
      const response = await chatApi.post('/rooms/private', { receiverId: userId });
      return response.data;
    } catch (error) {
      console.error('Failed to create private room:', error);
      throw error;
    }
  },
  
  // Create a group chat room
  createGroupRoom: async (name: string, participants: string[]) => {
    try {
      const response = await chatApi.post('/rooms/group', { name, participants });
      return response.data;
    } catch (error) {
      console.error('Failed to create group room:', error);
      throw error;
    }
  },
  
  // Get all messages for a chat room
  getMessages: async (roomId: string) => {
    try {
      const response = await chatApi.get(`/rooms/${roomId}/messages`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch messages for room ${roomId}:`, error);
      return { messages: [] };
    }
  },
  
  // Send a message to a chat room
  sendMessage: async (roomId: string, content: string) => {
    try {
      const response = await chatApi.post(`/rooms/${roomId}/messages`, { content });
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },
  
  // Mark messages as read in a chat room
  markAsRead: async (roomId: string) => {
    try {
      const response = await chatApi.put(`/rooms/${roomId}/read`);
      return response.data;
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      // Return a less impactful error response
      return { success: false };
    }
  },
}; 