import type { ApiResponse } from './types/api.js';

// Utility function to create success API responses
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

// Utility function to create error API responses
export function createErrorResponse(code: string, message: string, details?: any): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Validate message content
export function validateMessageContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 500) {
    return { valid: false, error: 'Message too long (max 500 characters)' };
  }
  
  return { valid: true };
}

// Validate chat room title
export function validateChatRoomTitle(title: string): { valid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Chat room title cannot be empty' };
  }
  
  if (title.length > 100) {
    return { valid: false, error: 'Title too long (max 100 characters)' };
  }
  
  return { valid: true };
}

// Validate chat room topic
export function validateChatRoomTopic(topic: string): { valid: boolean; error?: string } {
  if (!topic || topic.trim().length === 0) {
    return { valid: false, error: 'Chat room topic cannot be empty' };
  }
  
  if (topic.length > 200) {
    return { valid: false, error: 'Topic too long (max 200 characters)' };
  }
  
  return { valid: true };
}

// Format timestamp for display
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}
