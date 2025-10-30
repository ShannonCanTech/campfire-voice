import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.js';
import { apiClient } from '../services/index.js';
import type { InterestTag } from '../../shared/types/index.js';

export const InterestSelection: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useAppContext();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<InterestTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    try {
      const result = await apiClient.getInterestTags();
      
      if (result.success) {
        setAvailableInterests(result.data);
      } else {
        console.error('Failed to load interests:', result.error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load interests' });
      }
    } catch (error) {
      console.error('Error loading interests:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load interests' });
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
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      if (selectedInterests.length > 0) {
        const result = await apiClient.setUserInterests(selectedInterests);
        if (!result.success) {
          console.error('Failed to save interests:', result.error);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to save interests' });
          return;
        }
      }

      navigate('/discovery');
    } catch (error) {
      console.error('Error saving interests:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save interests' });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate('/discovery');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-5xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mb-4">
            <span className="text-4xl mb-4 block">🎯</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            What sparks your interest?
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Choose up to 5 topics you're passionate about. We'll use these to recommend 
            the most engaging chat rooms for you!
          </p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i < selectedInterests.length
                      ? 'bg-red-500 scale-110'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {selectedInterests.length}/5 interests selected
          </div>
        </div>

        {/* Interest Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {availableInterests.map((interest, index) => {
            const isSelected = selectedInterests.includes(interest.id);
            const isDisabled = !isSelected && selectedInterests.length >= 5;

            return (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                disabled={isDisabled}
                className={`
                  group relative p-5 rounded-xl border-2 transition-all duration-300 text-left
                  transform hover:scale-105 hover:shadow-lg
                  ${isSelected
                    ? 'border-red-400 bg-gradient-to-br from-red-50 to-pink-50 text-red-700 shadow-md scale-105'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50'
                  }
                `}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  backgroundColor: isSelected ? `${interest.color}15` : undefined,
                  borderColor: isSelected ? interest.color : undefined
                }}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold animate-bounce">
                    ✓
                  </div>
                )}
                
                <div className="font-semibold mb-2 text-lg group-hover:text-red-600 transition-colors">
                  {interest.name}
                </div>
                <div className="text-sm opacity-80 mb-3 leading-relaxed">
                  {interest.description}
                </div>
                
                {interest.chatRoomCount > 0 && (
                  <div className="flex items-center space-x-1 text-xs opacity-70">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span>{interest.chatRoomCount} active rooms</span>
                  </div>
                )}

                {/* Hover effect overlay */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-400 to-pink-400 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            onClick={handleSkip}
            disabled={saving}
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-medium
                       hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip for now
          </button>
          
          <button
            onClick={handleContinue}
            disabled={saving || selectedInterests.length === 0}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold
                       hover:from-red-600 hover:to-pink-600 transform hover:scale-105 
                       transition-all duration-200 shadow-lg hover:shadow-xl
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       flex items-center space-x-2 min-w-[140px] justify-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <span className="text-lg">🚀</span>
              </>
            )}
          </button>
        </div>

        {/* Helpful tip */}
        {selectedInterests.length === 0 && (
          <div className="text-center mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Select at least one interest to get personalized chat room recommendations!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
