import type { RedisClient } from '@devvit/public-api';
import type { Message } from '../../shared/types/index.js';
import { REDIS_KEYS, generateId, APP_CONSTANTS } from '../../shared/index.js';

export class MessageRepository {
  constructor(private redis: RedisClient) {}

  // Store a new message
  async createMessage(
    chatRoomId: string,
    userId: string,
    username: string,
    content: string
  ): Promise<Message> {
    const id = generateId();
    const timestamp = Date.now();
    
    const message: Message = {
      id,
      chatRoomId,
      userId,
      username,
      content,
      timestamp,
    };

    // Store message in sorted set with timestamp as score for chronological ordering
    const messageData = JSON.stringify(message);
    await this.redis.zAdd(REDIS_KEYS.chatRoomMessages(chatRoomId), {
      member: messageData,
      score: timestamp,
    });

    // Keep only the most recent messages (cleanup old ones)
    const messageCount = await this.redis.zCard(REDIS_KEYS.chatRoomMessages(chatRoomId));
    if (messageCount > APP_CONSTANTS.MESSAGE_HISTORY_LIMIT) {
      // Remove oldest messages, keeping only the most recent ones
      const toRemove = messageCount - APP_CONSTANTS.MESSAGE_HISTORY_LIMIT;
      await this.redis.zRemRangeByRank(REDIS_KEYS.chatRoomMessages(chatRoomId), 0, toRemove - 1);
    }

    return message;
  }

  // Get messages for a chat room with pagination
  async getMessages(
    chatRoomId: string,
    limit: number = 50,
    before?: string
  ): Promise<Message[]> {
    let maxScore = '+inf';
    
    // If 'before' timestamp is provided, use it as the maximum score
    if (before) {
      const beforeTimestamp = parseInt(before);
      if (!isNaN(beforeTimestamp)) {
        maxScore = `(${beforeTimestamp}`; // Exclusive upper bound
      }
    }

    // Get messages in reverse chronological order (newest first)
    // Use zRange with by: 'score' since zRevRangeByScore might not be supported
    const messageData = await this.redis.zRange(
      REDIS_KEYS.chatRoomMessages(chatRoomId),
      '-inf',
      maxScore,
      { by: 'score', limit: { offset: 0, count: limit }, rev: true }
    );

    const messages: Message[] = [];
    for (const data of messageData) {
      try {
        const message = JSON.parse(data) as Message;
        messages.push(message);
      } catch (error) {
        console.error('Failed to parse message data:', error);
      }
    }

    return messages;
  }

  // Get the most recent messages (for real-time updates)
  async getRecentMessages(chatRoomId: string, count: number = 20): Promise<Message[]> {
    const messageData = await this.redis.zRevRange(
      REDIS_KEYS.chatRoomMessages(chatRoomId),
      0,
      count - 1
    );

    const messages: Message[] = [];
    for (const data of messageData) {
      try {
        const message = JSON.parse(data) as Message;
        messages.push(message);
      } catch (error) {
        console.error('Failed to parse message data:', error);
      }
    }

    // Return in chronological order (oldest first) for display
    return messages.reverse();
  }

  // Get message count for a chat room
  async getMessageCount(chatRoomId: string): Promise<number> {
    return await this.redis.zCard(REDIS_KEYS.chatRoomMessages(chatRoomId));
  }

  // Delete all messages for a chat room
  async deleteAllMessages(chatRoomId: string): Promise<void> {
    await this.redis.del(REDIS_KEYS.chatRoomMessages(chatRoomId));
  }

  // Get messages after a specific timestamp (for real-time sync)
  async getMessagesAfter(chatRoomId: string, timestamp: number): Promise<Message[]> {
    const messageData = await this.redis.zRangeByScore(
      REDIS_KEYS.chatRoomMessages(chatRoomId),
      `(${timestamp}`, // Exclusive lower bound
      '+inf'
    );

    const messages: Message[] = [];
    for (const data of messageData) {
      try {
        const message = JSON.parse(data) as Message;
        messages.push(message);
      } catch (error) {
        console.error('Failed to parse message data:', error);
      }
    }

    return messages;
  }

  // Delete a specific message (for moderation)
  async deleteMessage(chatRoomId: string, messageId: string): Promise<boolean> {
    // Get all messages to find the one to delete
    const allMessages = await this.redis.zRange(REDIS_KEYS.chatRoomMessages(chatRoomId), 0, -1);
    
    for (const messageData of allMessages) {
      try {
        const message = JSON.parse(messageData) as Message;
        if (message.id === messageId) {
          await this.redis.zRem(REDIS_KEYS.chatRoomMessages(chatRoomId), messageData);
          return true;
        }
      } catch (error) {
        console.error('Failed to parse message data:', error);
      }
    }

    return false;
  }

  // Get message statistics for a chat room
  async getMessageStats(chatRoomId: string): Promise<{
    totalMessages: number;
    oldestMessageTime: number | null;
    newestMessageTime: number | null;
  }> {
    const totalMessages = await this.redis.zCard(REDIS_KEYS.chatRoomMessages(chatRoomId));
    
    if (totalMessages === 0) {
      return {
        totalMessages: 0,
        oldestMessageTime: null,
        newestMessageTime: null,
      };
    }

    // Get oldest message (lowest score)
    const oldestData = await this.redis.zRange(REDIS_KEYS.chatRoomMessages(chatRoomId), 0, 0);
    let oldestMessageTime: number | null = null;
    if (oldestData.length > 0) {
      try {
        const oldestMessage = JSON.parse(oldestData[0]) as Message;
        oldestMessageTime = oldestMessage.timestamp;
      } catch (error) {
        console.error('Failed to parse oldest message:', error);
      }
    }

    // Get newest message (highest score)
    const newestData = await this.redis.zRevRange(REDIS_KEYS.chatRoomMessages(chatRoomId), 0, 0);
    let newestMessageTime: number | null = null;
    if (newestData.length > 0) {
      try {
        const newestMessage = JSON.parse(newestData[0]) as Message;
        newestMessageTime = newestMessage.timestamp;
      } catch (error) {
        console.error('Failed to parse newest message:', error);
      }
    }

    return {
      totalMessages,
      oldestMessageTime,
      newestMessageTime,
    };
  }
}
