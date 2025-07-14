// API utilities for client-side requests

const API_BASE = '/api';

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const config = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Experiment API functions
export const experimentAPI = {
  // Submit experiment data
  submit: async (experimentData) => {
    return apiRequest('/experiment/submit', {
      method: 'POST',
      body: JSON.stringify(experimentData),
    });
  },
  
  // Get experiment configuration
  getConfig: async (experimentId = 'allais-fluency-v1') => {
    return apiRequest(`/experiment/config/${experimentId}`);
  },
  
  // Check if worker has already participated
  checkParticipation: async (workerId, experimentId = 'allais-fluency-v1') => {
    return apiRequest(`/experiment/check-participation/${workerId}/${experimentId}`);
  },
  
  // Get completion code for existing submission
  getCompletionCode: async (workerId, assignmentId) => {
    return apiRequest('/experiment/get-completion-code', {
      method: 'POST',
      body: JSON.stringify({ workerId, assignmentId }),
    });
  },
};

// AMT API functions
export const amtAPI = {
  // Get HIT status
  getHITStatus: async (hitId) => {
    return apiRequest(`/amt/hit-status/${hitId}`);
  },
  
  // List assignments for a HIT
  getAssignments: async (hitId) => {
    return apiRequest(`/amt/hit/${hitId}/assignments`);
  },
};

// Dashboard API functions  
export const dashboardAPI = {
  // Get all experiments
  getExperiments: async () => {
    return apiRequest('/dashboard/experiments');
  },
  
  // Get experiment statistics
  getExperimentStats: async (experimentId) => {
    return apiRequest(`/dashboard/experiment/${experimentId}/stats`);
  },
  
  // Get recent responses
  getRecentResponses: async (experimentId, limit = 50) => {
    return apiRequest(`/dashboard/experiment/${experimentId}/recent-responses?limit=${limit}`);
  },
  
  // Export experiment data
  exportData: async (experimentId, format = 'json') => {
    const url = `/dashboard/experiment/${experimentId}/export?format=${format}`;
    
    if (format === 'csv') {
      // Handle CSV download
      const response = await fetch(`${API_BASE}${url}`);
      const blob = await response.blob();
      return blob;
    } else {
      return apiRequest(url);
    }
  },
  
  // Update experiment status
  updateExperimentStatus: async (experimentId, status) => {
    return apiRequest(`/dashboard/experiment/${experimentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Utility functions
export const utils = {
  // Generate browser fingerprint
  getBrowserInfo: () => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
    };
  },
  
  // Validate AMT parameters
  validateAMTParams: (params) => {
    const { workerId, assignmentId, hitId, turkSubmitTo } = params;
    
    const errors = [];
    
    if (!workerId || workerId.trim().length === 0) {
      errors.push('Worker ID is missing');
    }
    
    if (!assignmentId || assignmentId.trim().length === 0) {
      errors.push('Assignment ID is missing');
    }
    
    if (!hitId || hitId.trim().length === 0) {
      errors.push('HIT ID is missing');
    }
    
    if (!turkSubmitTo || !turkSubmitTo.includes('mturk')) {
      errors.push('Invalid submission endpoint');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      isPreview: assignmentId === 'ASSIGNMENT_ID_NOT_AVAILABLE'
    };
  },
  
  // Format time duration
  formatDuration: (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },
  
  // Save data to localStorage with error handling
  saveToLocalStorage: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
      return false;
    }
  },
  
  // Load data from localStorage with error handling
  loadFromLocalStorage: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return defaultValue;
    }
  },
  
  // Clear localStorage data
  clearLocalStorage: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  },
};