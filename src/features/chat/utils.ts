'use client';

import { ChatRoom, Message } from '@/lib/api/chat';
import { User } from '@/store/auth';

/**
 * Format a typing indicator message based on who is typing
 */
export const formatTypingIndicator = (
  typingUsers: {[userId: string]: {username: string, timestamp: number}},
  currentUserId: string
): string => {
  // Filter out current user and get usernames
  const usernames = Object.entries(typingUsers)
    .filter(([userId]) => userId !== currentUserId)
    .map(([_, data]) => data.username);
  
  if (usernames.length === 0) {
    return '';
  } else if (usernames.length === 1) {
    return `${usernames[0]} is typing...`;
  } else if (usernames.length === 2) {
    return `${usernames[0]} and ${usernames[1]} are typing...`;
  } else {
    return `${usernames.length} people are typing...`;
  }
};

/**
 * Check if current user has unread messages in a room
 */
export const hasUnreadMessages = (room: ChatRoom, userId: string): boolean => {
  if (!room.lastMessage) return false;
  
  // Check if this user has read the last message
  return !room.lastMessage.readBy?.includes(userId);
};

/**
 * Format a timestamp for display
 */
export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Different formats based on how old the message is
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    // More than a week ago, show the date
    return date.toLocaleDateString();
  }
};

/**
 * Format a chat room name for display
 */
export const formatChatRoomName = (room: ChatRoom, currentUserId: string): string => {
  // If it's a direct message, show the other user's name
  if (room.type === 'private') {
    // Find the participant who isn't the current user
    const otherParticipant = room.participants?.find(
      participant => {
        // Handle both populated participant objects and ids
        const participantId = typeof participant === 'object' ? participant._id : participant;
        return participantId !== currentUserId;
      }
    );
    
    // Get the name from the participant object or use a fallback
    if (otherParticipant && typeof otherParticipant === 'object') {
      return otherParticipant.username || 'Unknown User';
    }
    
    return room.name || 'Direct Message';
  }
  
  // For groups, just use the name
  return room.name || 'Group Chat';
};

/**
 * Get avatar details for a user or room
 */
export const getAvatarDetails = (
  entity: User | ChatRoom, 
  currentUserId: string
): { initials: string, color: string } => {
  let name = '';
  
  // Handle user avatar
  if ('username' in entity) {
    name = entity.username || '';
  } 
  // Handle room avatar
  else {
    name = formatChatRoomName(entity, currentUserId);
  }
  
  // Generate initials from name
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  
  // Generate a consistent color from the entity ID
  const id = 'username' in entity ? entity._id : entity._id;
  const colorIndex = id
    ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarColors.length
    : 0;
  
  return {
    initials: initials || '?',
    color: avatarColors[colorIndex]
  };
};

// Color palette for avatars
const avatarColors = [
  '#f44336', // Red
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#2196f3', // Blue
  '#03a9f4', // Light Blue
  '#00bcd4', // Cyan
  '#009688', // Teal
  '#4caf50', // Green
  '#8bc34a', // Light Green
  '#cddc39', // Lime
  '#ffeb3b', // Yellow
  '#ffc107', // Amber
  '#ff9800', // Orange
  '#ff5722', // Deep Orange
  '#795548', // Brown
  '#607d8b', // Blue Grey
]; 