import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.js';
import { apiClient, realtimeClient } from '../services/index.js';
import { ContentValidator } from '../utils/validation.js';
import type { ChatRoom as ChatRoomType, Message, RealtimeMessage } from '../../shared/types/index.js';

export const ChatRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [chatRoom, setChatRoom] = useState<ChatRoomType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/discovery');
      return;
    }

    loadChatRoom();
    loadMessages();
    setupRealtimeConnection();

    return () => {
      if (id) {
        realtimeClient.disconnectFromChatRoom(id);
      }
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatRoom = async () => {
    if (!id) return;
    
    try {
      const result = await apiClient.getChatRoom(id);
      
      if (result.success) {
        setChatRoom(result.data);
        dispatch({ type: 'SET_CURRENT_CHAT_ROOM', payload: result.data });
      } else {
        console.error('Failed to load chat room:', result.error);
        dispatch({ type: 'SET_ERROR', payload: 'Chat room not found' });
        navigate('/discovery');
      }
    } catch (error) {
      console.error('Error loading chat room:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load chat room' });
      navigate('/discovery');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!id) return;
    
    try {
      const result = await apiClient.getMessages(id, { limit: 50 });
      
      if (result.success) {
        // Messages come in reverse chronological order, so reverse them for display
        setMessages(result.data.reverse());
      } else {
        console.error('Failed to load messages:', result.error);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const setupRealtimeConnection = async () => {
    if (!id) return;
    
    try {
      setConnectionStatus('connecting');
      
      await realtimeClient.connectToChatRoom(id, {
        onConnect: (channel) => {
          console.log('Connected to chat room:', channel);
          setConnectionStatus('connected');
        },
        onDisconnect: (channel) => {
          console.log('Disconnected from chat room:', channel);
          setConnectionStatus('disconnected');
        },
        onMessage: (message: RealtimeMessage) => {
          handleRealtimeMessage(message);
        },
      });
    } catch (error) {
      console.error('Failed to connect to chat room:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleRealtimeMessage = (message: RealtimeMessage) => {
    switch (message.type) {
      case 'message':
        // Add new message to the list
        const newMessage: Message = {
          id: `${message.data.timestamp}-${message.data.userId}`,
          chatRoomId: message.data.chatRoomId!,
          userId: message.data.userId,
          username: message.data.username,
          content: message.data.content!,
          timestamp: message.data.timestamp,
        };
        setMessages(prev => [...prev, newMessage]);
        break;
      case 'user_joined':
        // Update participant count
        setChatRoom(prev => prev ? {
          ...prev,
          participantCount: prev.participantCount + 1,
          participants: [...prev.participants, message.data.userId]
        } : null);
        break;
      case 'user_left':
        // Update participant count
        setChatRoom(prev => prev ? {
          ...prev,
          participantCount: Math.max(0, prev.participantCount - 1),
          participants: prev.participants.filter(id => id !== message.data.userId)
        } : null);
        break;
      default:
        break;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleLeaveRoom = async () => {
    if (!id) return;
    
    try {
      const result = await apiClient.leaveChatRoom(id);
      if (result.success) {
        navigate('/discovery');
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !messageInput.trim() || sendingMessage || connectionStatus !== 'connected') {
      return;
    }

    const content = messageInput.trim();
    
    // Validate message content
    const validation = ContentValidator.validateMessage(content);
    if (!validation.isValid) {
      dispatch({ type: 'SET_ERROR', payload: validation.error! });
      return;
    }

    try {
      setSendingMessage(true);
      setMessageInput(''); // Clear input immediately for better UX
      
      const result = await apiClient.sendMessage(id, content);
      
      if (!result.success) {
        console.error('Failed to send message:', result.error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to send message' });
        // Restore message input on failure
        setMessageInput(content);
      }
      // Note: We don't add the message to local state here because it will come back via real-time
    } catch (error) {
      console.error('Error sending message:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send message' });
      // Restore message input on failure
      setMessageInput(content);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat room...</p>
        </div>
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Chat room not found</h2>
          <button
            onClick={() => navigate('/discovery')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Back to Discovery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Room Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/discovery')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{chatRoom.title}</h1>
              <p className="text-sm text-gray-500">{chatRoom.topic}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-500 capitalize">{connectionStatus}</span>
            </div>
            
            {/* Participant Count - Clickable */}
            <button
              onClick={() => setShowParticipants(true)}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{chatRoom.participantCount}</span>
            </button>

            {/* Room Info Button */}
            <button
              onClick={() => setShowRoomInfo(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {/* Leave Button */}
            <button
              onClick={handleLeaveRoom}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.userId === state.user?.id;
            const showAvatar = index === 0 || messages[index - 1].userId !== message.userId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-2 max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  {showAvatar && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {message.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  
                  {/* Message Bubble */}
                  <div className={`${showAvatar ? '' : 'ml-10'}`}>
                    {showAvatar && (
                      <div className={`text-xs text-gray-500 mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        {message.username} • {formatTime(message.timestamp)}
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isCurrentUser
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                          : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                connectionStatus === 'connected' 
                  ? "Type your message..." 
                  : connectionStatus === 'connecting'
                  ? "Connecting..."
                  : "Disconnected - trying to reconnect..."
              }
              disabled={connectionStatus !== 'connected' || sendingMessage}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={1}
              maxLength={500}
              style={{
                minHeight: '48px',
                maxHeight: '120px',
                resize: 'none',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            
            {/* Character count */}
            {messageInput.length > 400 && (
              <div className={`absolute bottom-1 right-2 text-xs ${
                messageInput.length > 500 ? 'text-red-500' : 'text-gray-400'
              }`}>
                {messageInput.length}/500
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!messageInput.trim() || sendingMessage || connectionStatus !== 'connected'}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold
                       hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       flex items-center space-x-2 min-w-[80px] justify-center"
          >
            {sendingMessage ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </form>
        
        {/* Connection status indicator */}
        {connectionStatus !== 'connected' && (
          <div className="mt-2 flex items-center justify-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <span className="text-gray-500">
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected - trying to reconnect...'}
            </span>
          </div>
        )}
      </div>

      {/* Participants Modal */}
      {showParticipants && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-96 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Participants ({chatRoom.participantCount})
                </h3>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-64">
              <div className="space-y-3">
                {chatRoom.participants.map((participantId, index) => (
                  <div key={participantId} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {participantId === chatRoom.creatorId ? (
                          <span className="flex items-center space-x-2">
                            <span>{chatRoom.creatorUsername}</span>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                              Creator
                            </span>
                          </span>
                        ) : (
                          `User ${index + 1}` // In a real app, you'd fetch usernames
                        )}
                      </div>
                      {participantId === state.user?.id && (
                        <div className="text-xs text-gray-500">You</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Info Modal */}
      {showRoomInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Room Information</h3>
                <button
                  onClick={() => setShowRoomInfo(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Title</h4>
                <p className="text-gray-900">{chatRoom.title}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Topic</h4>
                <p className="text-gray-600">{chatRoom.topic}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Created by</h4>
                <p className="text-gray-900">{chatRoom.creatorUsername}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Created</h4>
                <p className="text-gray-600">
                  {new Date(chatRoom.createdAt).toLocaleDateString()} at{' '}
                  {new Date(chatRoom.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              
              {chatRoom.interests.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {chatRoom.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Active participants</span>
                  <span className="font-medium">{chatRoom.participantCount}</span>
                </div>
              </div>

              {/* Room Controls for Creator */}
              {chatRoom.creatorId === state.user?.id && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Room Controls</h4>
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
                          try {
                            const result = await apiClient.deleteChatRoom(chatRoom.id);
                            if (result.success) {
                              navigate('/discovery');
                            } else {
                              dispatch({ type: 'SET_ERROR', payload: 'Failed to delete room' });
                            }
                          } catch (error) {
                            console.error('Error deleting room:', error);
                            dispatch({ type: 'SET_ERROR', payload: 'Failed to delete room' });
                          }
                        }
                      }}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      Delete Room
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
