// Input validation utilities

export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

// Basic profanity filter - simple word list approach
const PROFANITY_WORDS = [
  // Add common profanity words here - keeping it minimal for demo
  'spam', 'scam', 'fake', 'bot', 'hack'
];

// Spam patterns
const SPAM_PATTERNS = [
  /(.)\1{4,}/g, // Repeated characters (5+ times)
  /https?:\/\/[^\s]+/gi, // URLs
  /\b\d{10,}\b/g, // Long numbers (phone numbers, etc.)
  /[A-Z]{5,}/g, // Excessive caps
];

export class ContentValidator {
  // Validate message content
  static validateMessage(content: string): ValidationResult {
    if (!content || content.trim().length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }

    if (content.length > 500) {
      return { isValid: false, error: 'Message too long (max 500 characters)' };
    }

    // Check for profanity
    const profanityCheck = this.checkProfanity(content);
    if (!profanityCheck.isValid) {
      return profanityCheck;
    }

    // Check for spam patterns
    const spamCheck = this.checkSpam(content);
    if (!spamCheck.isValid) {
      return spamCheck;
    }

    return { isValid: true };
  }

  // Validate chat room title
  static validateChatRoomTitle(title: string): ValidationResult {
    if (!title || title.trim().length === 0) {
      return { isValid: false, error: 'Title cannot be empty' };
    }

    if (title.length > 100) {
      return { isValid: false, error: 'Title too long (max 100 characters)' };
    }

    if (title.trim().length < 3) {
      return { isValid: false, error: 'Title must be at least 3 characters' };
    }

    // Check for profanity
    const profanityCheck = this.checkProfanity(title);
    if (!profanityCheck.isValid) {
      return profanityCheck;
    }

    return { isValid: true };
  }

  // Validate chat room topic
  static validateChatRoomTopic(topic: string): ValidationResult {
    if (!topic || topic.trim().length === 0) {
      return { isValid: false, error: 'Topic cannot be empty' };
    }

    if (topic.length > 200) {
      return { isValid: false, error: 'Topic too long (max 200 characters)' };
    }

    if (topic.trim().length < 10) {
      return { isValid: false, error: 'Topic must be at least 10 characters' };
    }

    // Check for profanity
    const profanityCheck = this.checkProfanity(topic);
    if (!profanityCheck.isValid) {
      return profanityCheck;
    }

    return { isValid: true };
  }

  // Basic profanity check
  private static checkProfanity(text: string): ValidationResult {
    const lowerText = text.toLowerCase();
    
    for (const word of PROFANITY_WORDS) {
      if (lowerText.includes(word.toLowerCase())) {
        return { isValid: false, error: 'Content contains inappropriate language' };
      }
    }

    return { isValid: true };
  }

  // Basic spam detection
  private static checkSpam(text: string): ValidationResult {
    // Check for repeated characters
    if (SPAM_PATTERNS[0].test(text)) {
      return { isValid: false, error: 'Message contains too many repeated characters' };
    }

    // Check for URLs (not allowed in basic version)
    if (SPAM_PATTERNS[1].test(text)) {
      return { isValid: false, error: 'URLs are not allowed in messages' };
    }

    // Check for long numbers
    if (SPAM_PATTERNS[2].test(text)) {
      return { isValid: false, error: 'Phone numbers and long numbers are not allowed' };
    }

    // Check for excessive caps
    const capsCount = (text.match(/[A-Z]/g) || []).length;
    const totalLetters = (text.match(/[A-Za-z]/g) || []).length;
    if (totalLetters > 10 && capsCount / totalLetters > 0.7) {
      return { isValid: false, error: 'Please don\'t use excessive capital letters' };
    }

    return { isValid: true };
  }

  // Sanitize input by removing/replacing dangerous characters
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  // Rate limiting helper
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();

    return (userId: string): boolean => {
      const now = Date.now();
      const userRequests = requests.get(userId) || [];
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }

      // Add current request
      validRequests.push(now);
      requests.set(userId, validRequests);
      
      return true; // Request allowed
    };
  }
}

// Form validation helpers
export class FormValidator {
  // Validate email format
  static validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
  }

  // Validate required field
  static validateRequired(value: string, fieldName: string): ValidationResult {
    if (!value || value.trim().length === 0) {
      return { isValid: false, error: `${fieldName} is required` };
    }

    return { isValid: true };
  }

  // Validate minimum length
  static validateMinLength(value: string, minLength: number, fieldName: string): ValidationResult {
    if (value.trim().length < minLength) {
      return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }

    return { isValid: true };
  }

  // Validate maximum length
  static validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationResult {
    if (value.length > maxLength) {
      return { isValid: false, error: `${fieldName} must be ${maxLength} characters or less` };
    }

    return { isValid: true };
  }

  // Validate array selection
  static validateSelection(
    selected: string[], 
    min: number, 
    max: number, 
    fieldName: string
  ): ValidationResult {
    if (selected.length < min) {
      return { isValid: false, error: `Please select at least ${min} ${fieldName}` };
    }

    if (selected.length > max) {
      return { isValid: false, error: `Please select no more than ${max} ${fieldName}` };
    }

    return { isValid: true };
  }
}

// Real-time validation hook for React components
export const useValidation = () => {
  const validateField = (value: string, rules: Array<(value: string) => ValidationResult>): ValidationResult => {
    for (const rule of rules) {
      const result = rule(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };

  const validateForm = (fields: Record<string, { value: string; rules: Array<(value: string) => ValidationResult> }>): Record<string, string> => {
    const errors: Record<string, string> = {};

    for (const [fieldName, field] of Object.entries(fields)) {
      const result = validateField(field.value, field.rules);
      if (!result.isValid) {
        errors[fieldName] = result.error!;
      }
    }

    return errors;
  };

  return { validateField, validateForm };
};

// Content reporting system
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other';

export type ContentReport = {
  contentId: string;
  contentType: 'message' | 'chatroom';
  reason: ReportReason;
  description?: string;
  reporterId: string;
  timestamp: number;
};

export class ContentReporter {
  // Create a content report
  static createReport(
    contentId: string,
    contentType: 'message' | 'chatroom',
    reason: ReportReason,
    reporterId: string,
    description?: string
  ): ContentReport {
    return {
      contentId,
      contentType,
      reason,
      description: description ? ContentValidator.sanitizeInput(description) : undefined,
      reporterId,
      timestamp: Date.now(),
    };
  }

  // Validate report data
  static validateReport(report: Partial<ContentReport>): ValidationResult {
    if (!report.contentId) {
      return { isValid: false, error: 'Content ID is required' };
    }

    if (!report.contentType) {
      return { isValid: false, error: 'Content type is required' };
    }

    if (!report.reason) {
      return { isValid: false, error: 'Report reason is required' };
    }

    if (!report.reporterId) {
      return { isValid: false, error: 'Reporter ID is required' };
    }

    if (report.description && report.description.length > 500) {
      return { isValid: false, error: 'Description too long (max 500 characters)' };
    }

    return { isValid: true };
  }
}
