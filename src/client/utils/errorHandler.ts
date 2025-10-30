import type { ToastType } from '../components/Toast.js';

export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'SERVER_ERROR'
  | 'REALTIME_ERROR'
  | 'UNKNOWN_ERROR';

export type AppError = {
  type: ErrorType;
  message: string;
  details?: any;
  retryable?: boolean;
};

export class ErrorHandler {
  static createError(type: ErrorType, message: string, details?: any, retryable = false): AppError {
    return {
      type,
      message,
      details,
      retryable,
    };
  }

  static fromApiError(error: any): AppError {
    if (error?.error?.code) {
      switch (error.error.code) {
        case 'AUTH_REQUIRED':
          return this.createError('AUTH_ERROR', 'Please log in to continue');
        case 'RATE_LIMIT_EXCEEDED':
          return this.createError('RATE_LIMIT_ERROR', 'Too many requests. Please wait a moment.', error.error.details, true);
        case 'VALIDATION_ERROR':
          return this.createError('VALIDATION_ERROR', error.error.message || 'Invalid input');
        case 'NETWORK_ERROR':
          return this.createError('NETWORK_ERROR', 'Network connection failed', error.error.details, true);
        default:
          return this.createError('SERVER_ERROR', error.error.message || 'Server error occurred', error.error.details, true);
      }
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return this.createError('NETWORK_ERROR', 'Unable to connect to server', error, true);
    }

    if (error?.name === 'AbortError') {
      return this.createError('NETWORK_ERROR', 'Request was cancelled', error, true);
    }

    return this.createError('UNKNOWN_ERROR', error?.message || 'An unexpected error occurred', error, true);
  }

  static getToastType(errorType: ErrorType): ToastType {
    switch (errorType) {
      case 'AUTH_ERROR':
        return 'warning';
      case 'VALIDATION_ERROR':
        return 'warning';
      case 'RATE_LIMIT_ERROR':
        return 'warning';
      case 'NETWORK_ERROR':
      case 'SERVER_ERROR':
      case 'REALTIME_ERROR':
      case 'UNKNOWN_ERROR':
      default:
        return 'error';
    }
  }

  static getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case 'NETWORK_ERROR':
        return 'Connection problem. Please check your internet and try again.';
      case 'AUTH_ERROR':
        return 'You need to be logged in to do that.';
      case 'VALIDATION_ERROR':
        return error.message;
      case 'RATE_LIMIT_ERROR':
        return 'You\'re doing that too fast. Please wait a moment.';
      case 'SERVER_ERROR':
        return 'Something went wrong on our end. Please try again.';
      case 'REALTIME_ERROR':
        return 'Connection to chat lost. Trying to reconnect...';
      case 'UNKNOWN_ERROR':
      default:
        return 'Something unexpected happened. Please try again.';
    }
  }

  static shouldShowRetryButton(error: AppError): boolean {
    return error.retryable === true;
  }

  static getRetryDelay(errorType: ErrorType, attemptCount: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    switch (errorType) {
      case 'NETWORK_ERROR':
        return Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
      case 'RATE_LIMIT_ERROR':
        return Math.min(baseDelay * 2 * attemptCount, maxDelay);
      case 'SERVER_ERROR':
        return Math.min(baseDelay * Math.pow(1.5, attemptCount), maxDelay);
      default:
        return baseDelay;
    }
  }
}

// Retry utility with exponential backoff
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    onError?: (error: AppError, attempt: number) => void
  ): Promise<T> {
    let lastError: AppError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = ErrorHandler.fromApiError(error);
        
        if (onError) {
          onError(lastError, attempt);
        }

        // Don't retry if it's not retryable or if it's the last attempt
        if (!lastError.retryable || attempt === maxAttempts) {
          throw lastError;
        }

        // Wait before retrying
        const delay = ErrorHandler.getRetryDelay(lastError.type, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// Network status monitoring
export class NetworkMonitor {
  private static listeners: Array<(online: boolean) => void> = [];
  private static isOnline = navigator.onLine;

  static {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
    });
  }

  static addListener(callback: (online: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  static getStatus(): boolean {
    return this.isOnline;
  }

  private static notifyListeners(online: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(online);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }
}

// Global error boundary for unhandled errors
export const setupGlobalErrorHandling = (onError: (error: AppError) => void) => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = ErrorHandler.fromApiError(event.reason);
    onError(error);
    event.preventDefault();
  });

  // Handle JavaScript errors
  window.addEventListener('error', (event) => {
    const error = ErrorHandler.createError(
      'UNKNOWN_ERROR',
      event.message || 'JavaScript error occurred',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      }
    );
    onError(error);
  });
};
