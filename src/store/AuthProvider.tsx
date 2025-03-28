'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore, User } from './auth';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, token, isAuthenticated, isLoading, setUser, setToken, setAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Function to handle login
  const login = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    setAuthenticated(true);
  };

  // Check if user is authenticated and redirect if needed
  useEffect(() => {
    const publicRoutes = ['/auth/login', '/auth/register'];
    
    if (!isAuthenticated && !publicRoutes.includes(pathname) && pathname !== '/') {
      router.push('/auth/login');
    }
    
    if (isAuthenticated && publicRoutes.includes(pathname)) {
      router.push('/chat');
    }
  }, [isAuthenticated, pathname, router]);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 