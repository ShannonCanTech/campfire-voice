import type { RedisClient } from '@devvit/public-api';
import type { UserProfile } from '../../shared/types/index.js';
import { REDIS_KEYS, APP_CONSTANTS } from '../../shared/index.js';

export class UserRepository {
  constructor(private redis: RedisClient) {}

  // Create or update user profile
  async createOrUpdateUserProfile(
    userId: string,
    username: string,
    interests?: string[]
  ): Promise<UserProfile> {
    const existingProfile = await this.getUserProfile(userId);
    const now = Date.now();
    
    const profile: UserProfile = {
      id: userId,
      username,
      interests: interests || existingProfile?.interests || [],
      activeChats: existingProfile?.activeChats || [],
      createdAt: existingProfile?.createdAt || now,
    };

    // Store user profile data
    await this.redis.hSet(`user:${userId}:profile`, {
      id: userId,
      username,
      interests: JSON.stringify(profile.interests),
      activeChats: JSON.stringify(profile.activeChats),
      createdAt: profile.createdAt.toString(),
    });

    // Store interests separately for easier querying
    if (interests && interests.length > 0) {
      await this.setUserInterests(userId, interests);
    }

    return profile;
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const data = await this.redis.hGetAll(`user:${userId}:profile`);
    
    if (!data.id) {
      return null;
    }

    return {
      id: data.id,
      username: data.username,
      interests: JSON.parse(data.interests || '[]'),
      activeChats: JSON.parse(data.activeChats || '[]'),
      createdAt: parseInt(data.createdAt || '0'),
    };
  }

  // Set user interests
  async setUserInterests(userId: string, interests: string[]): Promise<void> {
    // Validate interest count
    if (interests.length > APP_CONSTANTS.MAX_INTERESTS) {
      throw new Error(`Maximum ${APP_CONSTANTS.MAX_INTERESTS} interests allowed`);
    }

    // Store interests using hash instead of set
    await this.redis.del(REDIS_KEYS.userInterests(userId));
    if (interests.length > 0) {
      const interestHash: Record<string, string> = {};
      interests.forEach(interest => {
        interestHash[interest] = '1';
      });
      await this.redis.hSet(REDIS_KEYS.userInterests(userId), interestHash);
    }

    // Update profile
    const profile = await this.getUserProfile(userId);
    if (profile) {
      await this.redis.hSet(`user:${userId}:profile`, {
        interests: JSON.stringify(interests),
      });
    }
  }

  // Get user interests
  async getUserInterests(userId: string): Promise<string[]> {
    const interestData = await this.redis.hGetAll(REDIS_KEYS.userInterests(userId));
    return Object.keys(interestData);
  }

  // Add user to active chat
  async addUserToActiveChat(userId: string, chatRoomId: string): Promise<void> {
    await this.redis.hSet(REDIS_KEYS.userActiveChats(userId), { [chatRoomId]: '1' });
    
    // Update profile
    const activeChatData = await this.redis.hGetAll(REDIS_KEYS.userActiveChats(userId));
    const activeChats = Object.keys(activeChatData);
    const profile = await this.getUserProfile(userId);
    if (profile) {
      await this.redis.hSet(`user:${userId}:profile`, {
        activeChats: JSON.stringify(activeChats),
      });
    }
  }

  // Remove user from active chat
  async removeUserFromActiveChat(userId: string, chatRoomId: string): Promise<void> {
    await this.redis.hDel(REDIS_KEYS.userActiveChats(userId), [chatRoomId]);
    
    // Update profile
    const activeChatData = await this.redis.hGetAll(REDIS_KEYS.userActiveChats(userId));
    const activeChats = Object.keys(activeChatData);
    const profile = await this.getUserProfile(userId);
    if (profile) {
      await this.redis.hSet(`user:${userId}:profile`, {
        activeChats: JSON.stringify(activeChats),
      });
    }
  }

  // Get user's active chats
  async getUserActiveChats(userId: string): Promise<string[]> {
    const activeChatData = await this.redis.hGetAll(REDIS_KEYS.userActiveChats(userId));
    return Object.keys(activeChatData);
  }

  // Check if user has interest
  async userHasInterest(userId: string, interest: string): Promise<boolean> {
    const interestValue = await this.redis.hGet(REDIS_KEYS.userInterests(userId), interest);
    return interestValue !== null;
  }

  // Get users by interest (for recommendations)
  async getUsersByInterest(interest: string): Promise<string[]> {
    const userIds: string[] = [];
    
    // This is a simplified approach - in a real app you might want to maintain
    // reverse indexes for better performance
    // Note: keys() is not supported in Devvit Redis, so we'll need a different approach
    // For now, return empty array - this would need to be implemented with proper indexing
    console.warn('getUsersByInterest not fully implemented due to Redis limitations');
    
    return userIds;
  }

  // Clean up user data (for user deletion compliance)
  async deleteUserData(userId: string): Promise<void> {
    // Delete all user-related keys
    await this.redis.del(`user:${userId}:profile`);
    await this.redis.del(REDIS_KEYS.userInterests(userId));
    await this.redis.del(REDIS_KEYS.userActiveChats(userId));
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<{
    interestCount: number;
    activeChatCount: number;
    profileExists: boolean;
  }> {
    const profile = await this.getUserProfile(userId);
    const interestData = await this.redis.hGetAll(REDIS_KEYS.userInterests(userId));
    const activeChatData = await this.redis.hGetAll(REDIS_KEYS.userActiveChats(userId));
    const interestCount = Object.keys(interestData).length;
    const activeChatCount = Object.keys(activeChatData).length;

    return {
      interestCount,
      activeChatCount,
      profileExists: profile !== null,
    };
  }

  // Update username (when Reddit username changes)
  async updateUsername(userId: string, newUsername: string): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (profile) {
      await this.redis.hSet(`user:${userId}:profile`, {
        username: newUsername,
      });
    }
  }

  // Check if user exists
  async userExists(userId: string): Promise<boolean> {
    const exists = await this.redis.exists(`user:${userId}:profile`);
    return exists > 0;
  }
}
