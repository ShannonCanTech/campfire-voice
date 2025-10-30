import { realtime } from '@devvit/web/server';
import type { RealtimeMessage, ChatRoom, Message } from '../../shared/types/index.js';
import { CHANNELS } from '../../shared/index.js';

export class RealtimeService {
  // Send message to chat room channel
  async sendMessageToRoom(chatRoomId: string, message: Message): Promise<void> {
    const realtimeMessage: RealtimeMessage = {
      type: 'message',
      data: {
        chatRoomId,
        userId: message.userId,
        username: message.username,
        content: message.content,
        timestamp: message.timestamp,
      },
    };

    await realtime.send(CHANNELS.chatRoom(chatRoomId), realtimeMessage);
  }

  // Send user joined notification
  async sendUserJoinedNotification(chatRoomId: string, userId: string, username: string): Promise<void> {
    const realtimeMessage: RealtimeMessage = {
      type: 'user_joined',
      data: {
        chatRoomId,
        userId,
        username,
        timestamp: Date.now(),
      },
    };

    await realtime.send(CHANNELS.chatRoom(chatRoomId), realtimeMessage);
  }

  // Send user left notification
  async sendUserLeftNotification(chatRoomId: string, userId: string, username: string): Promise<void> {
    const realtimeMessage: RealtimeMessage = {
      type: 'user_left',
      data: {
        chatRoomId,
        userId,
        username,
        timestamp: Date.now(),
      },
    };

    await realtime.send(CHANNELS.chatRoom(chatRoomId), realtimeMessage);
  }

  // Send room created notification to discovery channel
  async sendRoomCreatedNotification(chatRoom: ChatRoom): Promise<void> {
    const realtimeMessage: RealtimeMessage = {
      type: 'room_created',
      data: {
        chatRoomId: chatRoom.id,
        userId: chatRoom.creatorId,
        username: chatRoom.creatorUsername,
        timestamp: chatRoom.createdAt,
      },
    };

    await realtime.send(CHANNELS.discovery, realtimeMessage);
  }

  // Send room deleted notification to discovery channel
  async sendRoomDeletedNotification(chatRoomId: string, userId: string, username: string): Promise<void> {
    const realtimeMessage: RealtimeMessage = {
      type: 'room_deleted',
      data: {
        chatRoomId,
        userId,
        username,
        timestamp: Date.now(),
      },
    };

    await realtime.send(CHANNELS.discovery, realtimeMessage);
  }

  // Send personal notification to user
  async sendUserNotification(userId: string, message: RealtimeMessage): Promise<void> {
    await realtime.send(CHANNELS.user(userId), message);
  }

  // Broadcast to multiple channels
  async broadcast(channels: string[], message: RealtimeMessage): Promise<void> {
    await Promise.all(
      channels.map(channel => realtime.send(channel, message))
    );
  }
}
