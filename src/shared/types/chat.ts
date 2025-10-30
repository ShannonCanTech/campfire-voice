// Chat Room Types
export type ChatRoom = {
  id: string;
  title: string;
  topic: string;
  creatorId: string;
  creatorUsername: string;
  participants: string[];
  participantCount: number;
  interests: string[];
  isActive: boolean;
  createdAt: number;
  lastActivity: number;
};

// Message Types
export type Message = {
  id: string;
  chatRoomId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
};

// User Profile Types
export type UserProfile = {
  id: string;
  username: string;
  interests: string[];
  activeChats: string[];
  createdAt: number;
};

// Interest Tag Types
export type InterestTag = {
  id: string;
  name: string;
  description: string;
  color: string;
  chatRoomCount: number;
};

// Real-time Message Types
export type RealtimeMessageType = 'message' | 'user_joined' | 'user_left' | 'room_created' | 'room_deleted';

export type RealtimeMessage = {
  type: RealtimeMessageType;
  data: {
    chatRoomId?: string;
    userId: string;
    username: string;
    content?: string;
    timestamp: number;
  };
};

// Channel naming conventions
export const CHANNELS = {
  discovery: 'discovery',
  chatRoom: (id: string) => `chatroom:${id}`,
  user: (userId: string) => `user:${userId}`,
} as const;
