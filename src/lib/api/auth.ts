import axios from 'axios';

// Important: Remove '/api' suffix to be consistent with other services
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const authApi = axios.create({
  baseURL: `${API_URL}/api/auth`,
  withCredentials: true,
});

// Add token to requests if available
authApi.interceptors.request.use(
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

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export const authService = {
  login: async (data: LoginData) => {
    try {
      console.log('Sending login request to:', `${API_URL}/api/auth/login`);
      const response = await authApi.post('/login', data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  register: async (data: RegisterData) => {
    try {
      console.log('Sending register request to:', `${API_URL}/api/auth/register`);
      console.log('Register data:', data);
      const response = await authApi.post('/register', data);
      console.log('Register response:', response);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      // Log more detailed error information
      if (error.response) {
        // The request was made and the server responded with a non-2xx status
        console.error('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
      } else {
        // Something happened in setting up the request
        console.error('Error message:', error.message);
      }
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await authApi.post('/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await authApi.get('/user');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
}; 