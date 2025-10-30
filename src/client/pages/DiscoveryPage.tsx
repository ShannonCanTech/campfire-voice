import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.js';
import { NavigationBar } from '../components/NavigationBar.js';
import { SearchModal } from '../components/SearchModal.js';
import { CreateRoomModal } from '../components/CreateRoomModal.js';
import { apiClient, realtimeClient } from '../services/index.js';
import type { ChatRoom, RealtimeMessage } from '../../shared/types/index.js';

export const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'interests'>('all');
  const [joinLoading, setJoinLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  useEffect(() => {
    loadChatRooms();
    setupRealtimeConnection();
    
    return () => {
      realtimeClient.disconnectFromDiscovery();
    };
  }, [filter]);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      let result;
      
      if (filter === 'interests' && state.user?.interests.length) {
        result = await apiClient.getChatRooms({ interests: state.user.interests });
      } else {
        result = await apiClient.getChatRooms();
      }

      if (result.success) {
        setChatRooms(result.data);
        dispatch({ type: 'SET_CHAT_ROOMS', payload: result.data });
      } else {
        console.error('Failed to load chat rooms:', result.error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load chat rooms' });
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load chat rooms' });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeConnection = async () => {
    try {
      await realtimeClient.connectToDiscovery({
        onConnect: (channel) => {
          console.log('Connected to discovery channel:', channel);
        },
        onDisconnect: (channel) => {
          console.log('Disconnected from discovery channel:', channel);
        },
        onMessage: (message: RealtimeMessage) => {
          handleRealtimeMessage(message);
        },
      });
    } catch (error) {
      console.error('Failed to connect to discovery channel:', error);
    }
  };

  const handleRealtimeMessage = (message: RealtimeMessage) => {
    switch (message.type) {
      case 'room_created':
        // Refresh chat rooms to include the new one
        loadChatRooms();
        break;
      case 'room_deleted':
        // Remove the deleted room from the list
        setChatRooms(prev => prev.filter(room => room.id !== message.data.chatRoomId));
        dispatch({ type: 'REMOVE_CHAT_ROOM', payload: message.data.chatRoomId! });
        break;
      default:
        break;
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      setJoinLoading(roomId);
      const result = await apiClient.joinChatRoom(roomId);
      
      if (result.success) {
        // Navigate to chat room
        navigate(`/chat/${roomId}`);
      } else {
        console.error('Failed to join room:', result.error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to join chat room' });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to join chat room' });
    } finally {
      setJoinLoading(null);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="max-w-6xl mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading chat rooms...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateRoom = () => {
    setShowCreateModal(true);
  };

  const handleSearch = () => {
    setShowSearchModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <NavigationBar 
        onCreateRoom={handleCreateRoom}
        onSearch={handleSearch}
      />
      <div className="p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔥 Discover Chat Rooms
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Join live conversations happening right now
          </p>
          
          {/* Filter Tabs */}
          <div className="flex justify-center space-x-1 bg-white rounded-full p-1 shadow-md max-w-md mx-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              All Rooms ({chatRooms.length})
            </button>
            <button
              onClick={() => setFilter('interests')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                filter === 'interests'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              My Interests
            </button>
          </div>
        </div>

        {/* Chat Rooms Grid */}
        {chatRooms.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏕️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No chat rooms found
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'interests' 
                ? "No active rooms match your interests. Try viewing all rooms or create your own!"
                : "Be the first to start a conversation! Create a new chat room."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Room Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
                      {room.title}
                    </h3>
                    <div className="flex items-center space-x-1 text-green-500 ml-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Live</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {room.topic}
                  </p>

                  {/* Room Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <span>👥</span>
                        <span>{room.participantCount} active</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>⏰</span>
                        <span>{formatTimeAgo(room.lastActivity)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Interest Tags */}
                  {room.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {room.interests.slice(0, 3).map((interest) => (
                        <span
                          key={interest}
                          className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                      {room.interests.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                          +{room.interests.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Creator Info */}
                  <div className="text-xs text-gray-400 mb-4">
                    Created by {room.creatorUsername}
                  </div>
                </div>

                {/* Join Button */}
                <div className="px-6 pb-6">
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={joinLoading === room.id}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold
                               hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                               flex items-center justify-center space-x-2"
                  >
                    {joinLoading === room.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Joining...</span>
                      </>
                    ) : (
                      <>
                        <span>Join Conversation</span>
                        <span>💬</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Modals */}
        <CreateRoomModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />

        <SearchModal 
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
        />
      </div>
      </div>
    </div>
  );
};
