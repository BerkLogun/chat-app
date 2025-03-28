'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/store/AuthProvider';
import { useRouter } from 'next/navigation';
import { initializeSocket, closeSocket, getSocket } from '@/lib/socket';
import { useChatStore } from '@/store/chat';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { fetchRooms } = useChatStore();
  const [initializing, setInitializing] = useState(true);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);
  
  // Initialize socket connection
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 5;
    
    const initializeSocketWithRetry = () => {
      if (isAuthenticated) {
        try {
          console.log('Initializing socket connection...');
          
          // Always close any existing socket first to ensure clean reconnection
          closeSocket();
          
          const socket = initializeSocket();
          if (socket) {
            console.log('Socket initialized in layout', {
              id: socket.id,
              connected: socket.connected,
              url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
              namespace: '/'
            });
            
            // Listen specifically for namespace errors
            socket.on('error', (error: any) => {
              console.error('Socket error detected in layout:', error);
              
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
              console.error('Socket connect error in layout:', error);
              
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
              console.log('Socket connected successfully in layout');
              fetchRooms();
              setInitializing(false);
              retryCount = 0;
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
        }
      } else {
        setInitializing(false);
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
  }, [isAuthenticated, fetchRooms]);
  
  // Debug socket state on initial render
  useEffect(() => {
    if (isAuthenticated) {
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
    }
  }, [isAuthenticated]);
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900">
      {children}
    </div>
  );
} 