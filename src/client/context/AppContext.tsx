import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useToast } from '../components/ToastContainer.js';
import type { UserProfile, ChatRoom } from '../../shared/types/index.js';

// App State Types
type AppState = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  activeChatRooms: ChatRoom[];
  currentChatRoom: ChatRoom | null;
  loading: boolean;
  error: string | null;
};

// Action Types
type AppAction =
  | { type: 'SET_USER'; payload: UserProfile }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CHAT_ROOMS'; payload: ChatRoom[] }
  | { type: 'ADD_CHAT_ROOM'; payload: ChatRoom }
  | { type: 'UPDATE_CHAT_ROOM'; payload: ChatRoom }
  | { type: 'REMOVE_CHAT_ROOM'; payload: string }
  | { type: 'SET_CURRENT_CHAT_ROOM'; payload: ChatRoom | null }
  | { type: 'CLEAR_USER' };

// Initial State
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  activeChatRooms: [],
  currentChatRoom: null,
  loading: true,
  error: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'CLEAR_USER':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        currentChatRoom: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'SET_CHAT_ROOMS':
      return {
        ...state,
        activeChatRooms: action.payload,
      };
    case 'ADD_CHAT_ROOM':
      return {
        ...state,
        activeChatRooms: [action.payload, ...state.activeChatRooms],
      };
    case 'UPDATE_CHAT_ROOM':
      return {
        ...state,
        activeChatRooms: state.activeChatRooms.map(room =>
          room.id === action.payload.id ? action.payload : room
        ),
        currentChatRoom: state.currentChatRoom?.id === action.payload.id 
          ? action.payload 
          : state.currentChatRoom,
      };
    case 'REMOVE_CHAT_ROOM':
      return {
        ...state,
        activeChatRooms: state.activeChatRooms.filter(room => room.id !== action.payload),
        currentChatRoom: state.currentChatRoom?.id === action.payload 
          ? null 
          : state.currentChatRoom,
      };
    case 'SET_CURRENT_CHAT_ROOM':
      return {
        ...state,
        currentChatRoom: action.payload,
      };
    default:
      return state;
  }
}

// Context
type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const toast = useToast();

  // Show toast notifications for errors
  useEffect(() => {
    if (state.error) {
      toast.showError('Error', state.error);
      // Clear error after showing toast
      dispatch({ type: 'SET_ERROR', payload: null });
    }
  }, [state.error, toast]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
