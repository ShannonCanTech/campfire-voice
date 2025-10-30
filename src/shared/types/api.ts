import type { ChatRoom, Message, UserProfile, InterestTag } from './chat.js';

// Base API Response Types
export type ApiResponse<T = any> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
};

// Error Response Type
export type ErrorResponse = {
  error: true;
  code: string;
  message: string;
  details?: any;
};

// User API Types
export type GetUserProfileResponse = ApiResponse<UserProfile>;
export type GetUserInterestsResponse = ApiResponse<string[]>;
export type SetUserInterestsRequest = {
  interests: string[];
};
export type SetUserInterestsResponse = ApiResponse<{ success: boolean }>;

// Chat Room API Types
export type GetChatRoomsRequest = {
  interests?: string[];
  limit?: number;
  offset?: number;
};
export type GetChatRoomsResponse = ApiResponse<ChatRoom[]>;

export type CreateChatRoomRequest = {
  title: string;
  topic: string;
  interests: string[];
};
export type CreateChatRoomResponse = ApiResponse<ChatRoom>;

export type GetChatRoomResponse = ApiResponse<ChatRoom>;

export type JoinChatRoomResponse = ApiResponse<{ success: boolean }>;
export type LeaveChatRoomResponse = ApiResponse<{ success: boolean }>;

// Message API Types
export type GetMessagesRequest = {
  limit?: number;
  before?: string;
};
export type GetMessagesResponse = ApiResponse<Message[]>;

export type SendMessageRequest = {
  content: string;
};
export type SendMessageResponse = ApiResponse<Message>;

// Search API Types
export type SearchChatRoomsRequest = {
  query: string;
  limit?: number;
};
export type SearchChatRoomsResponse = ApiResponse<ChatRoom[]>;

export type GetInterestTagsResponse = ApiResponse<InterestTag[]>;
