import { ErrorHandler, RetryHandler } from '../utils/errorHandler.js';
import type {
  ApiResponse,
  GetUserProfileResponse,
  GetUserInterestsResponse,
  SetUserInterestsRequest,
  SetUserInterestsResponse,
  GetChatRoomsRequest,
  GetChatRoomsResponse,
  CreateChatRoomRequest,
  CreateChatRoomResponse,
  GetChatRoomResponse,
  JoinChatRoomResponse,
  LeaveChatRoomResponse,
  GetMessagesRequest,
  GetMessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
  SearchChatRoomsRequest,
  SearchChatRoomsResponse,
  GetInterestTagsResponse,
} from '../../shared/types/index.js';

class ApiClient {
  private baseUrl = '';

  // Helper method for making API requests with retry logic
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryable: boolean = true
  ): Promise<T> {
    const operation = async (): Promise<T> => {
      const url = `${this.baseUrl}${endpoint}`;
      
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: { code: 'HTTP_ERROR', message: `HTTP ${response.status}` } };
        }
        
        throw errorData;
      }

      return await response.json() as T;
    };

    if (retryable) {
      return RetryHandler.withRetry(operation, 3);
    } else {
      try {
        return await operation();
      } catch (error) {
        throw ErrorHandler.fromApiError(error);
      }
    }
  }

  // User Management API
  async getUserProfile(): Promise<GetUserProfileResponse> {
    return this.request<GetUserProfileResponse>('/api/user/profile');
  }

  async getUserInterests(): Promise<GetUserInterestsResponse> {
    return this.request<GetUserInterestsResponse>('/api/user/interests');
  }

  async setUserInterests(interests: string[]): Promise<SetUserInterestsResponse> {
    return this.request<SetUserInterestsResponse>('/api/user/interests', {
      method: 'POST',
      body: JSON.stringify({ interests } as SetUserInterestsRequest),
    });
  }

  // Chat Room Management API
  async getChatRooms(params?: GetChatRoomsRequest): Promise<GetChatRoomsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.interests) {
      params.interests.forEach(interest => searchParams.append('interests', interest));
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      searchParams.append('offset', params.offset.toString());
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/chatrooms?${queryString}` : '/api/chatrooms';
    
    return this.request<GetChatRoomsResponse>(endpoint);
  }

  async createChatRoom(data: CreateChatRoomRequest): Promise<CreateChatRoomResponse> {
    return this.request<CreateChatRoomResponse>('/api/chatrooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getChatRoom(id: string): Promise<GetChatRoomResponse> {
    return this.request<GetChatRoomResponse>(`/api/chatrooms/${id}`);
  }

  async joinChatRoom(id: string): Promise<JoinChatRoomResponse> {
    return this.request<JoinChatRoomResponse>(`/api/chatrooms/${id}/join`, {
      method: 'POST',
    });
  }

  async leaveChatRoom(id: string): Promise<LeaveChatRoomResponse> {
    return this.request<LeaveChatRoomResponse>(`/api/chatrooms/${id}/leave`, {
      method: 'POST',
    });
  }

  async deleteChatRoom(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<ApiResponse<{ success: boolean }>>(`/api/chatrooms/${id}`, {
      method: 'DELETE',
    });
  }

  // Messaging API
  async getMessages(chatRoomId: string, params?: GetMessagesRequest): Promise<GetMessagesResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.before) {
      searchParams.append('before', params.before);
    }

    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `/api/chatrooms/${chatRoomId}/messages?${queryString}`
      : `/api/chatrooms/${chatRoomId}/messages`;
    
    return this.request<GetMessagesResponse>(endpoint);
  }

  async sendMessage(chatRoomId: string, content: string): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>(`/api/chatrooms/${chatRoomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content } as SendMessageRequest),
    });
  }

  // Search & Discovery API
  async searchChatRooms(query: string, limit?: number): Promise<SearchChatRoomsResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('query', query);
    
    if (limit) {
      searchParams.append('limit', limit.toString());
    }

    return this.request<SearchChatRoomsResponse>(`/api/search/chatrooms?${searchParams.toString()}`);
  }

  async getInterestTags(): Promise<GetInterestTagsResponse> {
    return this.request<GetInterestTagsResponse>('/api/interests');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
