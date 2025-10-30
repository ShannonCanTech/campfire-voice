import React, { useState } from 'react';

type NavigationBarProps = {
  onCreateRoom: () => void;
  onSearch: () => void;
  onShowProfile?: () => void;
};

export const NavigationBar: React.FC<NavigationBarProps> = ({
  onCreateRoom,
  onSearch,
  onShowProfile,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🔥</div>
            <h1 className="text-xl font-bold text-gray-900">Campfire</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={onSearch}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-500 
                         hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="font-medium">Search</span>
            </button>

            <button
              onClick={onCreateRoom}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 
                         text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 
                         transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Room</span>
            </button>

            {onShowProfile && (
              <button
                onClick={onShowProfile}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-500 
                           hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">Profile</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            <button
              onClick={() => {
                onSearch();
                setIsMenuOpen(false);
              }}
              className="flex items-center space-x-3 w-full px-4 py-3 text-gray-600 hover:text-red-500 
                         hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="font-medium">Search Rooms</span>
            </button>

            <button
              onClick={() => {
                onCreateRoom();
                setIsMenuOpen(false);
              }}
              className="flex items-center space-x-3 w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 
                         text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 
                         transition-all duration-200 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create New Room</span>
            </button>

            {onShowProfile && (
              <button
                onClick={() => {
                  onShowProfile();
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-4 py-3 text-gray-600 hover:text-red-500 
                           hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">Profile</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
