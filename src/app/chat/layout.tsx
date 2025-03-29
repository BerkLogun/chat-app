'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/store/AuthProvider';
import { useRouter } from 'next/navigation';
import { useSocketConnection } from '@/hooks/useSocketConnection';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { initializing } = useSocketConnection();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900">
      {children}
    </div>
  );
} 