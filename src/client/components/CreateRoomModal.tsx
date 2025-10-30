import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.js';
import { apiClient } from '../services/index.js';
import { ContentValidator } from '../utils/validation.js';
import type { InterestTag } from '../../shared/types/index.js';

type CreateRoomModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { dispatch } = useAppContext();
  
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<InterestTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [errors, setErrors] = useState<{
    title?: string;
    topic?: string;
    interests?: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      loadInterests();
      // Reset form when modal opens
      setTitle('');
      setTopic('');
      setSelectedInterests([]);
      setErrors({});
    }
  }, [isOpen]);

  const loadInterests = async () => {
    try {
      setInterestsLoading(true);
      const result = await apiClient.getInterestTags();
      
      if (result.success) {
        setAvailableInterests(result.data);
      } else {
        console.error('Failed to load interests:', result.error);
      }
    } catch (error) {
      console.error('Error loading interests:', error);
    } finally {
      setInterestsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Validate title
    const titleValidation = ContentValidator.validateChatRoomTitle(title);
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.error!;
    }

    // Validate topic
    const topicValidation = ContentValidator.validateChatRoomTopic(topic);
    if (!topicValidation.isValid) {
      newErrors.topic = topicValidation.error!;
    }

    // Validate interests
    if (selectedInterests.length === 0) {
      newErrors.interests = 'Please select at least one interest';
    } else if (selectedInterests.length > 5) {
      newErrors.interests = 'Maximum 5 interests allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const result = await apiClient.createChatRoom({
        title: ContentValidator.sanitizeInput(title.trim()),
        topic: ContentValidator.sanitizeInput(topic.trim()),
        interests: selectedInterests,
      });

      if (result.success) {
        onClose();
        // Navigate to the new chat room
        navigate(`/chat/${result.data.id}`);
      } else {
        console.error('Failed to create room:', result.error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create chat room' });
      }
    } catch (error) {
      console.error('Error creating room:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create chat room' });
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else if (prev.length < 5) {
        return [...prev, interestId];
      }
      return prev;
    });
    
    // Clear interests error when user makes a selection
    if (errors.interests) {
      setErrors(prev => ({ ...prev, interests: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Create New Chat Room</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Room Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Room Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) {
                    setErrors(prev => ({ ...prev, title: undefined }));
                  }
                }}
                placeholder="Enter a catchy title for your chat room"
                maxLength={100}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">{title.length}/100 characters</p>
            </div>

            {/* Room Topic */}
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                Room Topic *
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (errors.topic) {
                    setErrors(prev => ({ ...prev, topic: undefined }));
                  }
                }}
                placeholder="Describe what this chat room is about"
                maxLength={200}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${
                  errors.topic ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.topic && (
                <p className="mt-1 text-sm text-red-600">{errors.topic}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">{topic.length}/200 characters</p>
            </div>

            {/* Interests Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interests * (Select up to 5)
              </label>
              {interestsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableInterests.map((interest) => {
                    const isSelected = selectedInterests.includes(interest.id);
                    const isDisabled = !isSelected && selectedInterests.length >= 5;

                    return (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => toggleInterest(interest.id)}
                        disabled={isDisabled}
                        className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-red-400 bg-red-50 text-red-700'
                            : isDisabled
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50'
                        }`}
                        style={{ 
                          backgroundColor: isSelected ? `${interest.color}15` : undefined,
                          borderColor: isSelected ? interest.color : undefined
                        }}
                      >
                        <div className="font-medium text-sm mb-1">{interest.name}</div>
                        <div className="text-xs opacity-75 line-clamp-2">{interest.description}</div>
                        {interest.chatRoomCount > 0 && (
                          <div className="text-xs mt-1 opacity-60">
                            {interest.chatRoomCount} active rooms
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.interests && (
                <p className="mt-2 text-sm text-red-600">{errors.interests}</p>
              )}
              <div className="mt-2 text-sm text-gray-500">
                {selectedInterests.length}/5 interests selected
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium
                           hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !topic.trim() || selectedInterests.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold
                           hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                           flex items-center space-x-2 min-w-[120px] justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Create Room</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
