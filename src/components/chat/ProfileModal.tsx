'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/store/AuthProvider';
import { userService, UpdateProfileData } from '@/lib/api/user';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { socketEvents, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Modal } from '@/components/Modal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const { setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UpdateProfileData>({
    username: '',
    status: 'online',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  useEffect(() => {
    // Reset form data when modal is opened
    if (isOpen && user) {
      setFormData({
        username: user.username,
        status: user.status,
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, user]);
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await userService.updateProfile(formData);
      const updatedUser = response.user;
      
      console.log('Updated user data received:', updatedUser);
      
      // Update the local auth store with the new user info from the server
      if (user && updatedUser) {
        setUser({
          ...user,
          username: updatedUser.username || formData.username || user.username,
          status: (updatedUser.status || formData.status) as 'online' | 'offline' | 'away'
        });
      }
      
      // Notify other clients about the user update via socket
      const socket = getSocket();
      if (socket) {
        console.log('Emitting user status change to all clients');
        socket.emit(socketEvents.USER_STATUS_CHANGE, {
          userId: user?._id,
          status: formData.status,
          username: formData.username
        });
      }
      
      setSuccess('Profile updated successfully');
    } catch (error) {
      setError('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New password and confirmation do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      await userService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setSuccess('Password updated successfully');
      
      // Clear form after successful update
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setError('Failed to update password. Check if your current password is correct.');
      console.error('Password update error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const statusOptions = [
    { value: 'online', label: 'Online' },
    { value: 'away', label: 'Away' },
    { value: 'offline', label: 'Offline' }
  ];
  
  if (!user) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Settings">
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex -mb-px">
          <button
            className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}
      
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={user.email}
              disabled
              className="opacity-70"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleProfileChange}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1" htmlFor="status">
              Status
            </label>
            <div className="relative">
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 pl-9 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
              >
                {statusOptions.map((option) => (
                  <option 
                    key={option.value} 
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <StatusIndicator status={formData.status as 'online' | 'offline' | 'away'} />
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      )}
      
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="currentPassword">
              Current Password
            </label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="newPassword">
              New Password
            </label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              minLength={6}
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Change Password'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
} 