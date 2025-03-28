import { LoginData, RegisterData } from './auth';
import { User } from '@/store/auth';

// Mock data
const mockUsers: User[] = [
  {
    _id: '1',
    username: 'testuser',
    email: 'test@example.com',
    status: 'online',
  },
];

// Mock token
const mockToken = 'mock-jwt-token';

// Simulated delay to mimic network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuthService = {
  login: async (data: LoginData) => {
    await delay(500); // Simulate network delay
    
    const user = mockUsers.find(u => u.email === data.email);
    
    if (!user || data.password !== 'password') {
      throw new Error('Invalid email or password');
    }
    
    return { user, token: mockToken };
  },
  
  register: async (data: RegisterData) => {
    await delay(500); // Simulate network delay
    
    // Check if user already exists
    if (mockUsers.some(u => u.email === data.email)) {
      throw new Error('Email already in use');
    }
    
    // Create new user
    const newUser: User = {
      _id: String(mockUsers.length + 1),
      username: data.username,
      email: data.email,
      status: 'online',
    };
    
    mockUsers.push(newUser);
    
    return { user: newUser, token: mockToken };
  },
  
  logout: async () => {
    await delay(300);
    return { success: true };
  },
  
  getCurrentUser: async () => {
    await delay(300);
    return { user: mockUsers[0] };
  },
}; 