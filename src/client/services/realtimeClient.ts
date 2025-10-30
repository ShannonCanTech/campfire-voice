import { connectRealtime } from '@devvit/web/client';
import { ErrorHandler, NetworkMonitor } from '../utils/errorHandler.js';
import type { RealtimeMessage } from '../../shared/types/index.js';
import { CHANNELS } from '../../shared/index.js';

type Connection = {
  disconnect(): Promise<void>;
};

type ConnectionCallbacks = {
  onConnect?: (channel: string) => void;
  onDisconnect?: (channel: string) => void;
  onMessage: (data: RealtimeMessage) => void;
};

class RealtimeClient {
  private connections = new Map<string, Connection>();
  private reconnectAttempts = new Map<string, number>();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private networkStatusListener?: () => void;

  // Connect to a chat room channel
  async connectToChatRoom(
    chatRoomId: string,
    callbacks: ConnectionCallbacks
  ): Promise<void> {
    const channel = CHANNELS.chatRoom(chatRoomId);
    await this.connect(channel, callbacks);
  }

  // Connect to discovery channel
  async connectToDiscovery(callbacks: ConnectionCallbacks): Promise<void> {
    await this.connect(CHANNELS.discovery, callbacks);
  }

  // Connect to user channel
  async connectToUser(userId: string, callbacks: ConnectionCallbacks): Promise<void> {
    const channel = CHANNELS.user(userId);
    await this.connect(channel, callbacks);
  }

  // Generic connect method
  private async connect(
    channel: string,
    callbacks: ConnectionCallbacks
  ): Promise<void> {
    try {
      // Check network status before attempting connection
      if (!NetworkMonitor.getStatus()) {
        throw ErrorHandler.createError('NETWORK_ERROR', 'No internet connection');
      }

      // Disconnect existing connection if any
      await this.disconnect(channel);

      const connection = await connectRealtime({
        channel,
        onConnect: (connectedChannel) => {
          console.log(`Connected to ${connectedChannel}`);
          this.reconnectAttempts.delete(channel);
          callbacks.onConnect?.(connectedChannel);
        },
        onDisconnect: (disconnectedChannel) => {
          console.log(`Disconnected from ${disconnectedChannel}`);
          this.connections.delete(channel);
          callbacks.onDisconnect?.(disconnectedChannel);
          
          // Only attempt to reconnect if we have network connectivity
          if (NetworkMonitor.getStatus()) {
            this.attemptReconnect(channel, callbacks);
          }
        },
        onMessage: (data) => {
          try {
            callbacks.onMessage(data as RealtimeMessage);
          } catch (error) {
            console.error('Error processing real-time message:', error);
            const appError = ErrorHandler.createError('REALTIME_ERROR', 'Failed to process message', error);
            // Could emit error event here if needed
          }
        },
      });

      this.connections.set(channel, connection);
      
      // Set up network status monitoring for this connection
      if (!this.networkStatusListener) {
        this.networkStatusListener = NetworkMonitor.addListener((online) => {
          if (online) {
            // Network came back online, attempt to reconnect all channels
            this.handleNetworkReconnect();
          }
        });
      }
    } catch (error) {
      console.error(`Failed to connect to ${channel}:`, error);
      const appError = ErrorHandler.fromApiError(error);
      
      // Only attempt reconnect for retryable errors
      if (appError.retryable) {
        this.attemptReconnect(channel, callbacks);
      }
    }
  }

  // Disconnect from a specific channel
  async disconnect(channel: string): Promise<void> {
    const connection = this.connections.get(channel);
    if (connection) {
      try {
        await connection.disconnect();
      } catch (error) {
        console.error(`Error disconnecting from ${channel}:`, error);
      }
      this.connections.delete(channel);
    }
  }

  // Disconnect from chat room
  async disconnectFromChatRoom(chatRoomId: string): Promise<void> {
    const channel = CHANNELS.chatRoom(chatRoomId);
    await this.disconnect(channel);
  }

  // Disconnect from discovery
  async disconnectFromDiscovery(): Promise<void> {
    await this.disconnect(CHANNELS.discovery);
  }

  // Disconnect from user channel
  async disconnectFromUser(userId: string): Promise<void> {
    const channel = CHANNELS.user(userId);
    await this.disconnect(channel);
  }

  // Disconnect from all channels
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map(channel =>
      this.disconnect(channel)
    );
    await Promise.all(disconnectPromises);
  }

  // Check if connected to a channel
  isConnected(channel: string): boolean {
    return this.connections.has(channel);
  }

  // Check if connected to chat room
  isConnectedToChatRoom(chatRoomId: string): boolean {
    const channel = CHANNELS.chatRoom(chatRoomId);
    return this.isConnected(channel);
  }

  // Get connection status
  getConnectionStatus(): { [channel: string]: boolean } {
    const status: { [channel: string]: boolean } = {};
    this.connections.forEach((_, channel) => {
      status[channel] = true;
    });
    return status;
  }

  // Attempt to reconnect with exponential backoff
  private async attemptReconnect(
    channel: string,
    callbacks: ConnectionCallbacks
  ): Promise<void> {
    const attempts = this.reconnectAttempts.get(channel) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${channel}`);
      return;
    }

    this.reconnectAttempts.set(channel, attempts + 1);
    
    const delay = this.reconnectDelay * Math.pow(2, attempts); // Exponential backoff
    console.log(`Attempting to reconnect to ${channel} in ${delay}ms (attempt ${attempts + 1})`);
    
    setTimeout(async () => {
      try {
        await this.connect(channel, callbacks);
      } catch (error) {
        console.error(`Reconnection attempt ${attempts + 1} failed for ${channel}:`, error);
      }
    }, delay);
  }

  // Reset reconnection attempts (useful when user manually reconnects)
  resetReconnectAttempts(channel?: string): void {
    if (channel) {
      this.reconnectAttempts.delete(channel);
    } else {
      this.reconnectAttempts.clear();
    }
  }

  // Handle network reconnection
  private handleNetworkReconnect(): void {
    console.log('Network reconnected, attempting to restore connections...');
    
    // Reset all reconnection attempts
    this.reconnectAttempts.clear();
    
    // Note: In a real implementation, you'd want to store the callback functions
    // to be able to reconnect automatically. For now, the UI components will
    // need to handle reconnection when they detect network is back online.
  }

  // Cleanup method
  cleanup(): void {
    if (this.networkStatusListener) {
      this.networkStatusListener();
      this.networkStatusListener = undefined;
    }
    this.disconnectAll();
  }
}

// Export singleton instance
export const realtimeClient = new RealtimeClient();
