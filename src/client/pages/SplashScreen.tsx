import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    navigate('/interests');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className={`text-center text-white relative z-10 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        {/* Campfire Logo/Animation */}
        <div className="mb-8">
          <div className="relative">
            {/* Animated campfire */}
            <div className="relative mb-6">
              <div className="text-8xl mb-4 animate-pulse">🔥</div>
              {/* Floating sparks */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                <div className="animate-ping absolute -top-2 -left-2 w-2 h-2 bg-yellow-400 rounded-full opacity-75"></div>
                <div className="animate-ping absolute -top-4 left-4 w-1 h-1 bg-orange-400 rounded-full opacity-75 animation-delay-1000"></div>
                <div className="animate-ping absolute -top-3 -right-2 w-1.5 h-1.5 bg-red-400 rounded-full opacity-75 animation-delay-2000"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-2 drop-shadow-lg bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
              Campfire
            </h1>
            <p className="text-xl md:text-2xl opacity-90 drop-shadow font-medium">
              Chat around the digital campfire
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="max-w-lg mx-auto mb-8 space-y-4">
          <div className="flex items-center justify-center space-x-3 text-lg opacity-90">
            <span className="text-2xl">💬</span>
            <span>Real-time conversations</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-lg opacity-90">
            <span className="text-2xl">🎯</span>
            <span>Interest-based matching</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-lg opacity-90">
            <span className="text-2xl">👥</span>
            <span>Connect with Redditors</span>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-4">
          <button
            onClick={handleGetStarted}
            className="group bg-white text-red-500 px-8 py-4 rounded-full text-xl font-bold 
                       hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 
                       shadow-lg hover:shadow-xl relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <span>Join the Conversation</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">🚀</span>
            </span>
            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
          </button>
          
          <p className="text-sm opacity-75 max-w-md mx-auto">
            Discover live chat rooms, share your interests, and make new connections in the Reddit community
          </p>
        </div>

        {/* Fun decorative elements */}
        <div className="mt-12 flex justify-center space-x-6 text-3xl opacity-60">
          <span className="animate-bounce hover:scale-125 transition-transform cursor-default">💬</span>
          <span className="animate-bounce hover:scale-125 transition-transform cursor-default" style={{ animationDelay: '0.1s' }}>🎉</span>
          <span className="animate-bounce hover:scale-125 transition-transform cursor-default" style={{ animationDelay: '0.2s' }}>👥</span>
          <span className="animate-bounce hover:scale-125 transition-transform cursor-default" style={{ animationDelay: '0.3s' }}>🌟</span>
          <span className="animate-bounce hover:scale-125 transition-transform cursor-default" style={{ animationDelay: '0.4s' }}>🔥</span>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};
