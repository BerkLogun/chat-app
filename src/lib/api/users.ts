import axios from 'axios';
import { User } from '@/store/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const usersApi = axios.create({
  baseURL: `${API_URL}/users`,
  withCredentials: true,
});

// Add token to requests if available
usersApi.interceptors.request.use(
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

export const usersService = {
  // Search for users
  searchUsers: async (search: string) => {
    try {
      const response = await usersApi.get(`?search=${search}`);
      return response.data;
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  },
  
  // Get user profile
  getUserProfile: async (userId: string) => {
    try {
      const response = await usersApi.get(`/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  },
}; 