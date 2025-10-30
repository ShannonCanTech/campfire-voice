// Redis key patterns
export const REDIS_KEYS = {
  chatRoom: (id: string) => `chatroom:${id}`,
  chatRoomMessages: (id: string) => `chatroom:${id}:messages`,
  userInterests: (userId: string) => `user:${userId}:interests`,
  userActiveChats: (userId: string) => `user:${userId}:active_chats`,
  interestChatRooms: (tag: string) => `interests:${tag}`,
  activeChatRooms: 'active_chatrooms',
} as const;

// Application constants
export const APP_CONSTANTS = {
  MAX_INTERESTS: 5,
  MAX_MESSAGE_LENGTH: 500,
  MAX_CHAT_ROOM_PARTICIPANTS: 50,
  MESSAGE_HISTORY_LIMIT: 100,
  CHAT_ROOM_TITLE_MAX_LENGTH: 100,
  CHAT_ROOM_TOPIC_MAX_LENGTH: 200,
} as const;

// Available interest tags
export const INTEREST_TAGS = [
  { id: 'gaming', name: 'Gaming', description: 'Video games and gaming culture', color: '#FF6B6B' },
  { id: 'technology', name: 'Technology', description: 'Tech news and discussions', color: '#4ECDC4' },
  { id: 'music', name: 'Music', description: 'All genres and music discussion', color: '#45B7D1' },
  { id: 'movies', name: 'Movies & TV', description: 'Film and television', color: '#96CEB4' },
  { id: 'sports', name: 'Sports', description: 'Sports and athletics', color: '#FFEAA7' },
  { id: 'food', name: 'Food & Cooking', description: 'Recipes and culinary arts', color: '#DDA0DD' },
  { id: 'travel', name: 'Travel', description: 'Travel experiences and tips', color: '#98D8C8' },
  { id: 'books', name: 'Books & Reading', description: 'Literature and reading', color: '#F7DC6F' },
  { id: 'art', name: 'Art & Design', description: 'Visual arts and creativity', color: '#BB8FCE' },
  { id: 'science', name: 'Science', description: 'Scientific discussions', color: '#85C1E9' },
  { id: 'fitness', name: 'Fitness & Health', description: 'Health and wellness', color: '#82E0AA' },
  { id: 'photography', name: 'Photography', description: 'Photo sharing and techniques', color: '#F8C471' },
] as const;
