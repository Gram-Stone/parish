// Generate unique completion code
export const generateCompletionCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'STUDY';
  
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
};

// Get client IP address from request
export const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Format duration in milliseconds to human readable
export const formatDuration = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Safe JSON parse
export const safeJSONParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return defaultValue;
  }
};

// Sanitize string for database storage
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

// Generate random condition assignment
export const assignRandomCondition = () => {
  const fontCondition = Math.random() < 0.5 ? 'easy' : 'hard';
  const attributionCondition = Math.random() < 0.5 ? 'present' : 'absent';
  
  return {
    fontCondition,
    attributionCondition
  };
};

// Validate AMT parameters
export const validateAMTParams = (params) => {
  const { workerId, assignmentId, hitId, turkSubmitTo } = params;
  
  const errors = [];
  
  if (!workerId || workerId.trim().length === 0) {
    errors.push('Worker ID is required');
  }
  
  if (!assignmentId || assignmentId.trim().length === 0) {
    errors.push('Assignment ID is required');
  }
  
  if (!hitId || hitId.trim().length === 0) {
    errors.push('HIT ID is required');
  }
  
  if (!turkSubmitTo || !turkSubmitTo.includes('mturk')) {
    errors.push('Invalid submission endpoint');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Check if in preview mode
export const isPreviewMode = (assignmentId) => {
  return assignmentId === 'ASSIGNMENT_ID_NOT_AVAILABLE';
};

// Calculate completion percentage
export const calculateProgress = (current, target) => {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
};

// Generate browser fingerprint for fraud detection
export const generateBrowserFingerprint = (browserInfo) => {
  const components = [
    browserInfo.userAgent || '',
    browserInfo.language || '',
    browserInfo.platform || '',
    browserInfo.screenResolution || '',
    browserInfo.timezone || ''
  ];
  
  // Simple hash of browser components
  let hash = 0;
  const str = components.join('|');
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};