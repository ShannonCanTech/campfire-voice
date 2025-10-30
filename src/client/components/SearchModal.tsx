import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/index.js';
import type { ChatRoom } from '../../shared/types/index.js';

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search for empty queries
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    // Don't search for queries less than 2 characters
    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query.trim());
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      setHasSearched(true);
      
      const result = await apiClient.searchChatRooms(searchQuery, 20);
      
      if (result.success) {
        setResults(result.data);
      } else {
        console.error('Search failed:', result.error);
        setResults([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      const result = await apiClient.joinChatRoom(roomId);
      
      if (result.success) {
        onClose();
        navigate(`/chat/${roomId}`);
      } else {
        console.error('Failed to join room:', result.error);
      }
    } catch (error) {
      console.error('Error joining room:', error);
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

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-16">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Search Chat Rooms</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, topic, or interests..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-96">
          {!hasSearched && !query.trim() && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">Search for Chat Rooms</h4>
              <p className="text-gray-500">
                Type at least 2 characters to search by room title, topic, or interests
              </p>
            </div>
          )}

          {query.trim().length > 0 && query.trim().length < 2 && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">⌨️</div>
              <p className="text-gray-500">
                Keep typing... (minimum 2 characters)
              </p>
            </div>
          )}

          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Searching...</p>
            </div>
          )}

          {hasSearched && !loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">😔</div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">No rooms found</h4>
              <p className="text-gray-500">
                Try searching with different keywords or create a new room
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-4 space-y-3">
              {results.map((room) => (
                <div
                  key={room.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 truncate">
                          {highlightMatch(room.title, query)}
                        </h4>
                        <div className="flex items-center space-x-1 text-green-500">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium">Live</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {highlightMatch(room.topic, query)}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>{room.participantCount}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatTimeAgo(room.lastActivity)}</span>
                          </span>
                        </div>

                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium
                                     hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200
                                     text-sm flex items-center space-x-1"
                        >
                          <span>Join</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Interest Tags */}
                      {room.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {room.interests.slice(0, 3).map((interest) => (
                            <span
                              key={interest}
                              className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium"
                            >
                              {highlightMatch(interest, query)}
                            </span>
                          ))}
                          {room.interests.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                              +{room.interests.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
