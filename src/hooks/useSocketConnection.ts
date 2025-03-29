'use client';

import { useEffect, useState, useCallback } from 'react';
import { initializeSocket, closeSocket, getSocket } from '@/lib/socket';
import { useChatStore } from '@/store/chat';

export function useSocketConnection() {
  const { fetchRooms } = useChatStore();
  const [initializing, setInitializing] = useState(true);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);

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

  // Initialize socket connection
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 5;
    
    const initializeSocketWithRetry = () => {
      try {
        console.log('Initializing socket connection...');
        
        // Always close any existing socket first to ensure clean reconnection
        closeSocket();
        
        const socket = initializeSocket();
        if (socket) {
          console.log('Socket initialized', {
            id: socket.id,
            connected: socket.connected,
            url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
            namespace: '/'
          });
          
          // Listen specifically for namespace errors
          socket.on('error', (error: any) => {
            console.error('Socket error detected:', error);
            
            // Check if it's a namespace error
            if (error && typeof error === 'object' && 'message' in error && 
                typeof error.message === 'string' && error.message.includes('Invalid namespace')) {
              console.log('Invalid namespace detected - recreating socket');
              // Close and retry after a delay
              closeSocket();
              setTimeout(() => initializeSocketWithRetry(), 1000);
            }
          });
          
          // Listen for connection error (which often indicates backend issues)
          socket.on('connect_error', (error) => {
            console.error('Socket connect error:', error);
            setSocketError('Failed to connect to chat server');
            
            // Increase retry count and try again if under limit
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              console.log(`Socket connection error, retrying (${retryCount}/${MAX_RETRIES})...`);
              // Close existing socket
              closeSocket();
              // Wait longer between retries as we fail more
              retryTimeout = setTimeout(initializeSocketWithRetry, 1000 * retryCount);
            } else {
              console.error('Max socket connection retries reached');
              setInitializing(false);
            }
          });
          
          // On successful connection, fetch rooms and reset retry count
          socket.on('connect', () => {
            console.log('Socket connected successfully');
            fetchRooms();
            setInitializing(false);
            retryCount = 0;
            setSocketError(null);
          });
          
          // Initial fetch for already connected socket
          if (socket.connected) {
            fetchRooms();
            setInitializing(false);
          }
        } else if (retryCount < MAX_RETRIES) {
          // If socket initialization failed, retry after a delay
          retryCount++;
          console.log(`Socket initialization failed, retrying (${retryCount}/${MAX_RETRIES})...`);
          retryTimeout = setTimeout(initializeSocketWithRetry, 1000 * retryCount);
        } else {
          console.error('Max socket initialization retries reached');
          setInitializing(false);
        }
      } catch (error) {
        console.error('Error initializing socket:', error);
        setInitializing(false);
        setSocketError('Failed to connect to chat server');
      }
    };
    
    initializeSocketWithRetry();
    
    // Cleanup socket connection on unmount
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      closeSocket();
    };
  }, [fetchRooms]);

  // Function to retry connection manually
  const retryConnection = useCallback(() => {
    setReconnecting(true);
    closeSocket();
    
    setTimeout(() => {
      const socket = initializeSocket();
      if (socket) {
        console.log('Socket reconnected after manual retry');
        setSocketError(null);
        fetchRooms();
      } else {
        setSocketError('Failed to reconnect. Please try again.');
      }
      setReconnecting(false);
    }, 1000);
  }, [fetchRooms]);

  // Debug socket state on initial render
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      console.log('Current socket state:', {
        connected: socket.connected,
        id: socket.id,
        namespace: '/'
      });
    } else {
      console.log('No active socket connection');
    }
  }, []);

  return {
    initializing,
    socketError,
    reconnecting,
    ensureSocketConnection,
    retryConnection
  };
} 