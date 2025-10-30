import type { RedisClient } from '@devvit/public-api';
import type { ChatRoom } from '../../shared/types/index.js';
import { REDIS_KEYS, generateId } from '../../shared/index.js';

export class ChatRoomRepository {
  constructor(private redis: RedisClient) {}

  // Create a new chat room
  async createChatRoom(
    title: string,
    topic: string,
    creatorId: string,
    creatorUsername: string,
    interests: string[]
  ): Promise<ChatRoom> {
    const id = generateId();
    const now = Date.now();
    
    const chatRoom: ChatRoom = {
      id,
      title,
      topic,
      creatorId,
      creatorUsername,
      participants: [creatorId],
      participantCount: 1,
      interests,
      isActive: true,
      createdAt: now,
      lastActivity: now,
    };

    // Store chat room data
    await this.redis.hSet(REDIS_KEYS.chatRoom(id), {
      id,
      title,
      topic,
      creatorId,
      creatorUsername,
      participants: JSON.stringify([creatorId]),
      participantCount: '1',
      interests: JSON.stringify(interests),
      isActive: 'true',
      createdAt: now.toString(),
      lastActivity: now.toString(),
    });

    // Add to active chat rooms hash (using hash instead of set)
    await this.redis.hSet(REDIS_KEYS.activeChatRooms, { [id]: '1' });

    // Index by interests (using hash instead of set)
    for (const interest of interests) {
      await this.redis.hSet(REDIS_KEYS.interestChatRooms(interest), { [id]: '1' });
    }

    return chatRoom;
  }

  // Get chat room by ID
  async getChatRoom(id: string): Promise<ChatRoom | null> {
    const data = await this.redis.hGetAll(REDIS_KEYS.chatRoom(id));
    
    if (!data.id) {
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      topic: data.topic,
      creatorId: data.creatorId,
      creatorUsername: data.creatorUsername,
      participants: JSON.parse(data.participants || '[]'),
      participantCount: parseInt(data.participantCount || '0'),
      interests: JSON.parse(data.interests || '[]'),
      isActive: data.isActive === 'true',
      createdAt: parseInt(data.createdAt || '0'),
      lastActivity: parseInt(data.lastActivity || '0'),
    };
  }

  // Get all active chat rooms
  async getActiveChatRooms(): Promise<ChatRoom[]> {
    const chatRoomData = await this.redis.hGetAll(REDIS_KEYS.activeChatRooms);
    const chatRoomIds = Object.keys(chatRoomData);
    const chatRooms: ChatRoom[] = [];

    for (const id of chatRoomIds) {
      const chatRoom = await this.getChatRoom(id);
      if (chatRoom && chatRoom.isActive) {
        chatRooms.push(chatRoom);
      }
    }

    // Sort by last activity (most recent first)
    return chatRooms.sort((a, b) => b.lastActivity - a.lastActivity);
  }

  // Get chat rooms by interests
  async getChatRoomsByInterests(interests: string[]): Promise<ChatRoom[]> {
    if (interests.length === 0) {
      return this.getActiveChatRooms();
    }

    const chatRoomIds = new Set<string>();
    
    // Get chat rooms for each interest
    for (const interest of interests) {
      const interestData = await this.redis.hGetAll(REDIS_KEYS.interestChatRooms(interest));
      Object.keys(interestData).forEach(id => chatRoomIds.add(id));
    }

    const chatRooms: ChatRoom[] = [];
    for (const id of chatRoomIds) {
      const chatRoom = await this.getChatRoom(id);
      if (chatRoom && chatRoom.isActive) {
        chatRooms.push(chatRoom);
      }
    }

    // Sort by relevance (number of matching interests) and then by activity
    return chatRooms.sort((a, b) => {
      const aMatches = a.interests.filter(i => interests.includes(i)).length;
      const bMatches = b.interests.filter(i => interests.includes(i)).length;
      
      if (aMatches !== bMatches) {
        return bMatches - aMatches; // More matches first
      }
      
      return b.lastActivity - a.lastActivity; // More recent first
    });
  }

  // Join a chat room
  async joinChatRoom(chatRoomId: string, userId: string): Promise<boolean> {
    const chatRoom = await this.getChatRoom(chatRoomId);
    if (!chatRoom || !chatRoom.isActive) {
      return false;
    }

    // Check if user is already a participant
    if (chatRoom.participants.includes(userId)) {
      return true;
    }

    // Add user to participants
    const updatedParticipants = [...chatRoom.participants, userId];
    
    await this.redis.hSet(REDIS_KEYS.chatRoom(chatRoomId), {
      participants: JSON.stringify(updatedParticipants),
      participantCount: updatedParticipants.length.toString(),
      lastActivity: Date.now().toString(),
    });

    return true;
  }

  // Leave a chat room
  async leaveChatRoom(chatRoomId: string, userId: string): Promise<boolean> {
    const chatRoom = await this.getChatRoom(chatRoomId);
    if (!chatRoom) {
      return false;
    }

    // Remove user from participants
    const updatedParticipants = chatRoom.participants.filter(id => id !== userId);
    
    // If no participants left, deactivate the room
    if (updatedParticipants.length === 0) {
      await this.deactivateChatRoom(chatRoomId);
      return true;
    }

    await this.redis.hSet(REDIS_KEYS.chatRoom(chatRoomId), {
      participants: JSON.stringify(updatedParticipants),
      participantCount: updatedParticipants.length.toString(),
      lastActivity: Date.now().toString(),
    });

    return true;
  }

  // Update last activity timestamp
  async updateLastActivity(chatRoomId: string): Promise<void> {
    await this.redis.hSet(REDIS_KEYS.chatRoom(chatRoomId), {
      lastActivity: Date.now().toString(),
    });
  }

  // Deactivate a chat room
  async deactivateChatRoom(chatRoomId: string): Promise<void> {
    const chatRoom = await this.getChatRoom(chatRoomId);
    if (!chatRoom) {
      return;
    }

    // Mark as inactive
    await this.redis.hSet(REDIS_KEYS.chatRoom(chatRoomId), {
      isActive: 'false',
    });

    // Remove from active hash
    await this.redis.hDel(REDIS_KEYS.activeChatRooms, [chatRoomId]);

    // Remove from interest indexes
    for (const interest of chatRoom.interests) {
      await this.redis.hDel(REDIS_KEYS.interestChatRooms(interest), [chatRoomId]);
    }
  }

  // Delete a chat room (creator only)
  async deleteChatRoom(chatRoomId: string, userId: string): Promise<boolean> {
    const chatRoom = await this.getChatRoom(chatRoomId);
    if (!chatRoom || chatRoom.creatorId !== userId) {
      return false;
    }

    // Deactivate first
    await this.deactivateChatRoom(chatRoomId);

    // Delete the chat room data
    await this.redis.del(REDIS_KEYS.chatRoom(chatRoomId));
    
    // Delete associated messages
    await this.redis.del(REDIS_KEYS.chatRoomMessages(chatRoomId));

    return true;
  }

  // Search chat rooms by query
  async searchChatRooms(query: string): Promise<ChatRoom[]> {
    const allChatRooms = await this.getActiveChatRooms();
    const lowerQuery = query.toLowerCase();

    return allChatRooms.filter(room => 
      room.title.toLowerCase().includes(lowerQuery) ||
      room.topic.toLowerCase().includes(lowerQuery) ||
      room.interests.some(interest => interest.toLowerCase().includes(lowerQuery))
    );
  }
}
