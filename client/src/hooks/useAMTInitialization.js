import { setAMTParams } from '../store/slices/amtSlice.js';
import { setConditions, setStartTime } from '../store/slices/experimentSlice.js';
import { setBrowserInfo, setIPAddress } from '../store/slices/qualitySlice.js';

// Initialize AMT parameters and experiment conditions
export const initializeAMTParams = (dispatch) => {
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  
  const amtParams = {
    workerId: urlParams.get('workerId'),
    assignmentId: urlParams.get('assignmentId'),
    hitId: urlParams.get('hitId'),
    turkSubmitTo: urlParams.get('turkSubmitTo')
  };
  
  // Set AMT parameters in Redux
  dispatch(setAMTParams(amtParams));
  
  // Only initialize experiment conditions if not in preview mode
  if (amtParams.assignmentId !== 'ASSIGNMENT_ID_NOT_AVAILABLE') {
    // Random condition assignment
    const fontCondition = Math.random() < 0.5 ? 'easy' : 'hard';
    
    dispatch(setConditions({ fontCondition }));
    // Don't start timer yet - wait for "Begin Study" click
    
    // Collect browser information for quality control
    const browserInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine
    };
    
    dispatch(setBrowserInfo(browserInfo));
    
    // Get IP address (will be set by server during submission)
    // This is just for client-side logging
    fetch('/api/experiment/get-ip')
      .then(response => response.json())
      .then(data => {
        if (data.ip) {
          dispatch(setIPAddress(data.ip));
        }
      })
      .catch(error => {
        console.log('Could not fetch IP address:', error);
      });
  }
  
  // Log initialization for debugging
  console.log('AMT Parameters:', amtParams);
  
  // Store in localStorage as backup
  try {
    localStorage.setItem('amt_params', JSON.stringify(amtParams));
  } catch (error) {
    console.warn('Could not store AMT params in localStorage:', error);
  }
};