import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { AppProvider } from './context/AppContext.js';
import { ToastProvider } from './components/ToastContainer.js';
import { SplashScreen } from './pages/SplashScreen.js';
import { InterestSelection } from './pages/InterestSelection.js';
import { DiscoveryPage } from './pages/DiscoveryPage.js';
import { ChatRoom } from './pages/ChatRoom.js';

export const App = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <Router>
          <div className="min-h-screen">
            <Routes>
              <Route path="/" element={<SplashScreen />} />
              <Route path="/interests" element={<InterestSelection />} />
              <Route path="/discovery" element={<DiscoveryPage />} />
              <Route path="/chat/:id" element={<ChatRoom />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};
