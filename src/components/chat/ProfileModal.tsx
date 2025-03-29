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
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Settings">
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex -mb-px">
          <button
            className={`mr-4 py-2 px-3 sm:px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`py-2 px-3 sm:px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
          {success}
        </div>
      )}
      
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600"
              readOnly
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Email cannot be changed</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleProfileChange}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300" htmlFor="status">
              Status
            </label>
            <div className="relative">
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleProfileChange}
                className="w-full appearance-none px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-8"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
              <StatusIndicator status={formData.status as 'online' | 'offline' | 'away'} className="mr-2" />
              <span>Others will see you as {formData.status}</span>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="default"
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Save Profile
            </Button>
          </div>
        </form>
      )}
      
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300" htmlFor="currentPassword">
              Current Password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your current password"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300" htmlFor="newPassword">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter new password"
              required
              minLength={6}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </div>
          
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="default"
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Update Password
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
} 