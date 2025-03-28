import axios from 'axios';
import { User } from '@/store/auth';

// Important: Remove '/api' suffix as it's causing the socket connection issue
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const userApi = axios.create({
  baseURL: `${API_URL}/api/users`,
  withCredentials: true,
});

// Add token to requests if available
userApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage')
      ? JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token
      : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface UpdateProfileData {
  username?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  // Get all users (for searching)
  getUsers: async (search?: string) => {
    try {
      const response = await userApi.get('/', { 
        params: search ? { search } : undefined 
      });
      return response.data.users || [];
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  },
  
  // Get user by ID
  getUserById: async (userId: string) => {
    const response = await userApi.get(`/${userId}`);
    return response.data;
  },
  
  // Update user profile
  updateProfile: async (data: UpdateProfileData) => {
    const response = await userApi.put('/profile', data);
    return response.data;
  },
  
  // Update password
  updatePassword: async (data: UpdatePasswordData) => {
    const response = await userApi.put('/password', data);
    return response.data;
  },
}; 