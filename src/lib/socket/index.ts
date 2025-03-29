'use client';

import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let autoReconnectInterval: NodeJS.Timeout | null = null;

// Debug logger for socket events
const logSocketEvent = (event: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[SOCKET ${timestamp}] ${event}`, data || '');
};

export const initializeSocket = () => {
  const token = useAuthStore.getState().token;
  
  if (!token) {
    logSocketEvent('ERROR', 'No auth token available');
    return null;
  }
  
  if (!socket) {
    // Use the environment API URL or default to localhost
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    try {
      logSocketEvent('INIT', { url: API_URL });
      
      // Create new socket connection with proper configuration
      // IMPORTANT: Don't append /api to URL - use the root namespace
      socket = io(API_URL, {
        auth: {
          token,
        },
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling'],
        forceNew: true,
      });
      
      // Track all emitted events for debugging
      const originalEmit = socket.emit;
      socket.emit = function(event: string, ...args: any[]) {
        logSocketEvent(`EMIT: ${event}`, args.length ? args[0] : null);
        return originalEmit.apply(this, [event, ...args]);
      };
      
      // Log connection details for debugging
      socket.on('connect', () => {
        logSocketEvent('CONNECTED', {
          id: socket?.id,
          connected: socket?.connected,
          namespace: '/'
        });
        reconnectAttempts = 0;
        // Clear any auto reconnect interval
        if (autoReconnectInterval) {
          clearInterval(autoReconnectInterval);
          autoReconnectInterval = null;
        }
      });
      
      socket.on('disconnect', (reason) => {
        logSocketEvent('DISCONNECTED', { reason });
        
        if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'transport error') {
          // Server closed the connection or connection lost, try to reconnect
          startAutoReconnect();
        }
      });
      
      socket.on('connect_error', (error) => {
        logSocketEvent('CONNECT_ERROR', {
          message: error.message,
          // Socket.io errors may have additional properties not in standard Error
          ...(error as any),
          url: API_URL,
          tokenExists: !!token,
          reconnectAttempts
        });
        
        reconnectAttempts++;
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          logSocketEvent('MAX_RECONNECT_ATTEMPTS_REACHED');
          socket?.disconnect();
          socket = null;
          
          // Start automatic reconnection after regular attempts fail
          startAutoReconnect();
        }
      });
      
      // Custom error event from server
      socket.on('error', (error) => {
        logSocketEvent('SERVER_ERROR', error);
      });
      
      // Add listeners for all standard events
      socket.io.on('reconnect_attempt', (attempt) => {
        logSocketEvent('RECONNECT_ATTEMPT', { attempt });
      });
      
      socket.io.on('reconnect_error', (error) => {
        logSocketEvent('RECONNECT_ERROR', {
          message: error.message,
          // Socket.io errors may have additional properties not in standard Error
          ...(error as any)
        });
      });
      
      socket.io.on('reconnect_failed', () => {
        logSocketEvent('RECONNECT_FAILED');
        socket = null;
        
        // Start automatic reconnection after socket.io reconnection fails
        startAutoReconnect();
      });
      
      socket.io.on('reconnect', (attemptNumber) => {
        logSocketEvent('RECONNECTED', { attemptNumber });
      });
      
      // Listen for all socket events to debug
      Object.values(socketEvents).forEach(eventName => {
        socket?.on(eventName, (data) => {
          logSocketEvent(`RECEIVED: ${eventName}`, data);
        });
      });
      
    } catch (err) {
      logSocketEvent('ERROR_CREATING_SOCKET', err);
      return null;
    }
  }
  
  return socket;
};

// Start our own auto-reconnect system if the socket.io one fails
const startAutoReconnect = () => {
  if (autoReconnectInterval) return; // Already trying to reconnect
  
  logSocketEvent('STARTING_AUTO_RECONNECT');
  
  // Try to reconnect every 5 seconds
  autoReconnectInterval = setInterval(() => {
    logSocketEvent('AUTO_RECONNECT_ATTEMPT');
    
    // Close existing socket if any
    if (socket) {
      try {
        socket.disconnect();
      } catch (e) {
        // Ignore errors on disconnect
      }
      socket = null;
    }
    
    // Try to create a new connection
    const newSocket = initializeSocket();
    
    if (newSocket && newSocket.connected) {
      logSocketEvent('AUTO_RECONNECT_SUCCESSFUL');
      
      // Clear interval once connected
      if (autoReconnectInterval) {
        clearInterval(autoReconnectInterval);
        autoReconnectInterval = null;
      }
    }
  }, 5000);
};

export const getSocket = () => socket;

export const closeSocket = () => {
  if (socket) {
    try {
      logSocketEvent('CLOSING');
      socket.disconnect();
    } catch (err) {
      logSocketEvent('ERROR_DISCONNECTING', err);
    }
    socket = null;
    reconnectAttempts = 0;
    
    // Clear any auto reconnect interval
    if (autoReconnectInterval) {
      clearInterval(autoReconnectInterval);
      autoReconnectInterval = null;
    }
  }
};

// Socket events
export const socketEvents = {
  // Client -> Server events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  NEW_MESSAGE: 'new_message',
  TYPING: 'typing',
  READ_MESSAGES: 'read_messages',
  
  // Server -> Client events
  RECEIVE_MESSAGE: 'receive_message',
  USER_TYPING: 'user_typing',
  MESSAGES_READ: 'messages_read',
  USER_STATUS_CHANGE: 'user_status_change',
  UPDATE_CHAT_LIST: 'update_chat_list',
}; 