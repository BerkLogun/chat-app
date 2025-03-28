import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merges class names with Tailwind CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to readable format
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString();
}

// Format time only
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Get initials from a name
export function getInitials(name?: string): string {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

// Truncate text to a certain length
export function truncateText(text?: string, length: number = 20): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
}

// Get a user-friendly relative time (e.g., "2 hours ago")
export function getRelativeTime(date: string | Date): string {
  if (!date) return 'just now';
  
  try {
    const now = new Date();
    const past = new Date(date);
    
    // Check for invalid date
    if (isNaN(past.getTime())) {
      console.warn('Invalid date provided to getRelativeTime:', date);
      return 'just now';
    }
    
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return formatDate(date);
  } catch (error) {
    console.error('Error in getRelativeTime:', error);
    return 'just now';
  }
} 