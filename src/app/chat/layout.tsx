'use client';

import React from 'react';
import { useAuth } from '@/store/AuthProvider';
import { useSocketConnection } from '@/hooks/useSocketConnection';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { initializing } = useSocketConnection();
  
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900">
      {children}
    </div>
  );
} 