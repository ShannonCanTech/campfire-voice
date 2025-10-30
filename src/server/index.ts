import express from 'express';
import { redis, reddit, createServer, context, getServerPort, realtime } from '@devvit/web/server';
import { createPost } from './core/post.js';
import { UserRepository, ChatRoomRepository, MessageRepository } from './data/index.js';
import { RealtimeService } from './services/realtimeService.js';
import type {
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
} from '../shared/types/index.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  INTEREST_TAGS,
  validateChatRoomTitle,
  validateChatRoomTopic,
  validateMessageContent,
  sanitizeInput,
  CHANNELS
} from '../shared/index.js';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

// Initialize repositories and services
const userRepository = new UserRepository(redis);
const chatRoomRepository = new ChatRoomRepository(redis);
const messageRepository = new MessageRepository(redis);
const realtimeService = new RealtimeService();

const router = express.Router();

// User Management Endpoints

// GET /api/user/profile - Get current user information
router.get('/api/user/profile', async (_req, res): Promise<void> => {
  try {
    const { userId, username } = context;
    
    if (!userId || !username) {
      res.status(401).json(createErrorResponse('AUTH_REQUIRED', 'User authentication required'));
      return;
    }

    let profile = await userRepository.getUserProfile(userId);
    
    // Create profile if it doesn't exist
    if (!profile) {
      profile = await userRepository.createOrUpdateUserProfile(userId, username);
    }

    res.json(createSuccessResponse(profile) as GetUserProfileResponse);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get user profile'));
  }
});

// GET /api/user/interests - Get user interests
router.get('/api/user/interests', async (_req, res): Promise<void> => {
  try {
    const { userId } = context;
    
    if (!userId) {
      res.status(401).json(createErrorResponse('AUTH_REQUIRED', 'User authentication required'));
      return;
    }

    const interests = await userRepository.getUserInterests(userId);
    res.json(createSuccessResponse(interests) as GetUserInterestsResponse);
  } catch (error) {
    console.error('Error getting user interests:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get user interests'));
  }
});

// POST /api/user/interests - Set user interests
router.post<{}, SetUserInterestsResponse, SetUserInterestsRequest>(
  '/api/user/interests',
  async (req, res): Promise<void> => {
    try {
      const { userId, username } = context;
      
      if (!userId || !username) {
        res.status(401).json(createErrorResponse('AUTH_REQUIRED', 'User authentication required'));
        return;
      }

      const { interests } = req.body;
      
      if (!Array.isArray(interests)) {
        res.status(400).json(createErrorResponse('INVALID_INPUT', 'Interests must be an array'));
        return;
      }

      // Validate interests against available tags
      const validInterestIds = INTEREST_TAGS.map(tag => tag.id);
      const invalidInterests = interests.filter(interest => !validInterestIds.includes(interest));
      
      if (invalidInterests.length > 0) {
        res.status(400).json(createErrorResponse(
          'INVALID_INTERESTS', 
          `Invalid interests: ${invalidInterests.join(', ')}`
        ));
        return;
      }

      if (interests.length > 5) {
        res.status(400).json(createErrorResponse('TOO_MANY_INTERESTS', 'Maximum 5 interests allowed'));
        return;
      }

      await userRepository.setUserInterests(userId, interests);
      await userRepository.createOrUpdateUserProfile(userId, username, interests);

      res.json(createSuccessResponse({ success: true }) as SetUserInterestsResponse);
    } catch (error) {
      console.error('Error setting user interests:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to set user interests'));
    }
  }
);

// Chat Room Management Endpoints

// GET /api/chatrooms - Get available chat rooms (with optional filtering)
router.get('/api/chatrooms', async (req, res): Promise<void> => {
  try {
    const { userId } = context;
    
    if (!userId) {
      res.status(401).json(createErrorResponse('AUTH_REQUIRED', 'User authentication required'));
      return;
    }

    const { interests, limit = 50, offset = 0 } = req.query as Partial<GetChatRoomsRequest>;
    
    let chatRooms;
    if (interests && Array.isArray(interests)) {
      chatRooms = await chatRoomRepository.getChatRoomsByInterests(interests);
    } else {
      chatRooms = await chatRoomRepository.getActiveChatRooms();
    }

    // Apply pagination
    const startIndex = Number(offset) || 0;
    const limitNum = Math.min(Number(limit) || 50, 100); // Max 100 rooms per request
    const paginatedRooms = chatRooms.slice(startIndex, startIndex + limitNum);

    res.json(createSuccessResponse(paginatedRooms) as GetChatRoomsResponse);
  } catch (error) {
    console.error('Error getting chat rooms:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get chat rooms'));
  }
});

// POST /api/chatrooms - Create new chat room
router.post<{}, CreateChatRoomResponse, CreateChatRoomRequest>(
  '/api/chatrooms',
  async (req, res): Promise<void> => {
    try {
      const { userId, username } = context;
      
      if (!userId || !username) {
        res.status(401).json(createErrorResponse('AUTH_REQUIRED', 'User authentication required'));
        return;
      }

      const { title, topic, interests } = req.body;

      // Validate input
      const titleValidation = validateChatRoomTitle(title);
      if (!titleValidation.valid) {
        res.status(400).json(createErrorResponse('INVALID_TITLE', titleValidation.error!));
        return;
      }

      const topicValidation = validateChatRoomTopic(topic);
      if (!topicValidation.valid) {
        res.status(400).json(createErrorResponse('INVALID_TOPIC', topicValidation.error!));
        return;
      }

      if (!Array.isArray(interests)) {
        res.status(400).json(createErrorResponse('INVALID_INTERESTS', 'Interests must be an array'));
        return;
      }

      // Validate interests
      const validInterestIds = INTEREST_TAGS.map(tag => tag.id);
      const invalidInterests = interests.filter(interest => !validInterestIds.includes(interest));
      
      if (invalidInterests.length > 0) {
        res.status(400).json(createErrorResponse(
          'INVALID_INTERESTS', 
          `Invalid interests: ${invalidInterests.join(', ')}`
        ));
        return;
      }

      // Create chat room
      const chatRoom = await chatRoomRepository.createChatRoom(
        title.trim(),
        topic.trim(),
        userId,
        username,
        interests
      );

      // Add user to active chats
      await userRepository.addUserToActiveChat(userId, chatRoom.id);

      // Send real-time notification about new room
      await realtimeService.sendRoomCreatedNotification(chatRoom);

      res.status(201).json(createSuccessResponse(chatRoom) as CreateChatRoomResponse);
    } catch (error) {
      console.error('Error creating chat room:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to create chat room'));
    }
  }
);

// GET /api/chatrooms/:id - Get specific chat room details
router.get('/api/chatrooms/:id', async (req, res): Promise<void> => {
  try {
    const { userId } = context;
    
    if (!userId) {
      res.status(401).json(createErrorResponse('AUTH_REQUIRED', 'User authentication required'));
      return;
    }

    const { id } = req.params;
    const chatRoom = await chatRoomRepository.getChatRoom(id);

    if (!chatRoom) {
      res.status(404).json(createErrorResponse('CHAT_ROOM_NOT_FOUND', 'Chat room not found'));
      return;
    }

    res.json(createSuccessResponse(chatRoom) as GetChatRoomResponse);
  } catch (error) {
    console.error('Error getting chat room:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get chat room'));
  }
});

// POST /api/chatrooms/:id/join - Join a chat room
router.post('/api/chatrooms/:id/join', async (req, res): Promise<void> => {
  try {
    const { userId, username } = context;
    
    if (!userId) {
      res.status(401).json(createErrorResponse('AUTH_REQUIRED', 'User authentication required'));
      return;
    }

    const { id } = req.params;
    const success = await chatRoomRepository.joinChatRoom(id, userId);

    if (!success) {
      res.status(404).json(createErrorResponse('CHAT_ROOM_NOT_FOUND', 'Chat room not found or inactive'));
      return;
    }

    // Add to user's active chats
    await userRepository.addUserToActiveChat(userId, id);

    // Send real-time notification about user joining
    if (username) {
      await realtimeService.sendUserJoinedNotification(id, userId, username);
    }

    res.json(createSuccessResponse({ success: true }) as JoinChatRoomResponse);
  } catch (error) {
    console.error('Error joining chat room:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to join chat room'));
  }
});

// POST /api/chatrooms/:id/leave - Leave a chat room
router.post('/api/chatrooms/:id/leave', async (req, res): Promise<void> => {
  try {
    const { userId, username } = context;
    
    if (!userId) {
      res.status(401).json(createErrorResponse('AUTH_REQUIRED', 'User authentication required'));
      return;
    }

    const { id } = req.params;
    const success = await chatRoomRepository.leaveChatRoom(id, userId);

    if (!success) {
      res.status(404).json(createErrorResponse('CHAT_ROOM_NOT_FOUND', 'Chat room not found'));
      return;
    }

    // Remove from user's active chats
    await userRepository.removeUserFromActiveChat(userId, id);

    // Send real-time notification about user leaving
    if (username) {
      await realtimeService.sendUserLeftNotification(id, userId, username);
    }

    res.json(createSuccessResponse({ success: true }) as LeaveChatRoomResponse);
  } catch (error) {
    console.error('Error leaving chat room:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to leave chat room'));
  }
});

// DELETE /api/chatrooms/:id - Delete chat room (creator only)
router.delete('/api/chatrooms/:id', async (req, res): Promise<void> => {
  try {
    const { userId, username } = context;
    
    if (!userId) {
      res.status(401).json(createErrorResponse('AUTH_REQUIRED', 'User authentication required'));
      return;
    }

    const { id } = req.params;
    const success = await chatRoomRepository.deleteChatRoom(id, userId);

    if (!success) {
      res.status(403).json(createErrorResponse('FORBIDDEN', 'Only chat room creator can delete the room'));
      return;
    }

    // Send real-time notification about room deletion
    if (username) {
      await realtimeService.sendRoomDeletedNotification(id, userId, username);
    }

    res.json(createSuccessResponse({ success: true }));
  } catch (error) {
    console.error('Error deleting chat room:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to delete chat room'));
  }
});

// Messaging Endpoints

// GET /api/chatrooms/:id/messages - Get chat history
router.get('/api/chatrooms/:id/messages', async (req, res): Promise<void> => {
  try {
    const { userId } = context;
    
    if (!userId) {
      res.status(401).json(createErrorResponse('AUTH_REQUIRED', 'User authentication required'));
      return;
    }

    const { id } = req.params;
    const { limit = 50, before } = req.query as Partial<GetMessagesRequest>;

    // Check if user has access to this chat room
    const chatRoom = await chatRoomRepository.getChatRoom(id);
    if (!chatRoom) {
      res.status(404).json(createErrorResponse('CHAT_ROOM_NOT_FOUND', 'Chat room not found'));
      return;
    }

    if (!chatRoom.participants.includes(userId)) {
      res.status(403).json(createErrorResponse('ACCESS_DENIED', 'You must join the chat room to view messages'));
      return;
    }

    const limitNum = Math.min(Number(limit) || 50, 100); // Max 100 messages per request
    const messages = await messageRepository.getMessages(id, limitNum, before as string);

    res.json(createSuccessResponse(messages) as GetMessagesResponse);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get messages'));
  }
});

// POST /api/chatrooms/:id/messages - Send message to chat room
router.post<{ id: string }, SendMessageResponse, SendMessageRequest>(
  '/api/chatrooms/:id/messages',
  async (req, res): Promise<void> => {
    try {
      const { userId, username } = context;
      
      if (!userId || !username) {
        res.status(401).json(createErrorResponse('AUTH_REQUIRED', 'User authentication required'));
        return;
      }

      const { id } = req.params;
      const { content } = req.body;

      // Validate message content
      const validation = validateMessageContent(content);
      if (!validation.valid) {
        res.status(400).json(createErrorResponse('INVALID_MESSAGE', validation.error!));
        return;
      }

      // Check if user has access to this chat room
      const chatRoom = await chatRoomRepository.getChatRoom(id);
      if (!chatRoom) {
        res.status(404).json(createErrorResponse('CHAT_ROOM_NOT_FOUND', 'Chat room not found'));
        return;
      }

      if (!chatRoom.isActive) {
        res.status(403).json(createErrorResponse('CHAT_ROOM_INACTIVE', 'Chat room is no longer active'));
        return;
      }

      if (!chatRoom.participants.includes(userId)) {
        res.status(403).json(createErrorResponse('ACCESS_DENIED', 'You must join the chat room to send messages'));
        return;
      }

      // Sanitize and create message
      const sanitizedContent = ContentValidator.sanitizeInput(content);
      const message = await messageRepository.createMessage(id, userId, username, sanitizedContent);

      // Update chat room last activity
      await chatRoomRepository.updateLastActivity(id);

      // Send real-time message to chat room
      await realtimeService.sendMessageToRoom(id, message);

      res.status(201).json(createSuccessResponse(message) as SendMessageResponse);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to send message'));
    }
  }
);

// Search & Discovery Endpoints

// GET /api/search/chatrooms - Search chat rooms by query
router.get('/api/search/chatrooms', async (req, res): Promise<void> => {
  try {
    const { userId } = context;
    
    if (!userId) {
      res.status(401).json(createErrorResponse('AUTH_REQUIRED', 'User authentication required'));
      return;
    }

    const { query, limit = 20 } = req.query as Partial<SearchChatRoomsRequest>;

    if (!query || typeof query !== 'string') {
      res.status(400).json(createErrorResponse('INVALID_QUERY', 'Search query is required'));
      return;
    }

    if (query.trim().length < 2) {
      res.status(400).json(createErrorResponse('QUERY_TOO_SHORT', 'Search query must be at least 2 characters'));
      return;
    }

    const limitNum = Math.min(Number(limit) || 20, 50); // Max 50 results
    const searchResults = await chatRoomRepository.searchChatRooms(query.trim());
    
    // Apply limit
    const limitedResults = searchResults.slice(0, limitNum);

    res.json(createSuccessResponse(limitedResults) as SearchChatRoomsResponse);
  } catch (error) {
    console.error('Error searching chat rooms:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to search chat rooms'));
  }
});

// GET /api/interests - Get available interest tags
router.get('/api/interests', async (_req, res): Promise<void> => {
  try {
    // Get interest tags with current chat room counts
    const interestTagsWithCounts = await Promise.all(
      INTEREST_TAGS.map(async (tag) => {
        const chatRoomData = await redis.hGetAll(`interests:${tag.id}`);
        return {
          ...tag,
          chatRoomCount: Object.keys(chatRoomData).length,
        };
      })
    );

    res.json(createSuccessResponse(interestTagsWithCounts) as GetInterestTagsResponse);
  } catch (error) {
    console.error('Error getting interest tags:', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get interest tags'));
  }
});

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
