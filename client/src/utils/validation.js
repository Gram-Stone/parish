// Client-side validation utilities

// Validate lottery choice responses
export const validateLotteryChoices = (responses) => {
  const errors = {};
  
  if (!responses.lottery1 || !['A', 'B'].includes(responses.lottery1)) {
    errors.lottery1 = 'Please select an option for Investment Scenario A';
  }
  
  if (!responses.lottery2 || !['C', 'D'].includes(responses.lottery2)) {
    errors.lottery2 = 'Please select an option for Investment Scenario B';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate attention check answer
export const validateAttentionCheck = (answer, correctAnswer = 42) => {
  const numericAnswer = parseInt(answer);
  const isValid = numericAnswer === correctAnswer;
  
  return {
    isValid,
    numericAnswer,
    error: isValid ? null : 'Please check your calculation and try again'
  };
};

// Validate background/filler task responses
export const validateFillerTasks = (responses) => {
  const errors = {};
  const required = ['weather', 'brand', 'age', 'gender'];
  
  required.forEach(field => {
    if (!responses[field] || responses[field].trim() === '') {
      errors[field] = 'This field is required';
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate AMT parameters
export const validateAMTParams = (params) => {
  const errors = {};
  
  if (!params.workerId || params.workerId.trim().length === 0) {
    errors.workerId = 'Worker ID is required';
  }
  
  if (!params.assignmentId || params.assignmentId.trim().length === 0) {
    errors.assignmentId = 'Assignment ID is required';
  }
  
  if (!params.hitId || params.hitId.trim().length === 0) {
    errors.hitId = 'HIT ID is required';
  }
  
  if (!params.turkSubmitTo || !params.turkSubmitTo.includes('mturk')) {
    errors.turkSubmitTo = 'Invalid submission endpoint';
  }
  
  const isPreview = params.assignmentId === 'ASSIGNMENT_ID_NOT_AVAILABLE';
  
  return {
    isValid: Object.keys(errors).length === 0 || isPreview,
    errors,
    isPreview
  };
};

// Validate completion time
export const validateCompletionTime = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return {
      isValid: false,
      error: 'Invalid timing data',
      durationMs: 0
    };
  }
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end - start;
  
  const minTime = 5 * 60 * 1000; // 5 minutes
  const maxTime = 60 * 60 * 1000; // 60 minutes
  
  const issues = [];
  
  if (durationMs < minTime) {
    issues.push('Study completed too quickly');
  }
  
  if (durationMs > maxTime) {
    issues.push('Study took longer than allowed time');
  }
  
  if (durationMs < 0) {
    issues.push('Invalid timing data');
  }
  
  return {
    isValid: issues.length === 0,
    durationMs,
    durationMinutes: Math.round(durationMs / 60000),
    issues,
    error: issues.length > 0 ? issues.join(', ') : null
  };
};

// Validate browser compatibility
export const validateBrowserCompatibility = () => {
  const issues = [];
  
  // Check for basic JavaScript features
  if (!window.localStorage) {
    issues.push('LocalStorage not available');
  }
  
  if (!window.fetch) {
    issues.push('Fetch API not available');
  }
  
  if (!window.URLSearchParams) {
    issues.push('URLSearchParams not available');
  }
  
  // Check screen size
  if (screen.width < 800 || screen.height < 600) {
    issues.push('Screen resolution too small (minimum 800x600 required)');
  }
  
  // Check for suspicious user agents
  const userAgent = navigator.userAgent.toLowerCase();
  const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];
  
  if (suspiciousAgents.some(agent => userAgent.includes(agent))) {
    issues.push('Automated browser detected');
  }
  
  return {
    isCompatible: issues.length === 0,
    issues
  };
};

// Comprehensive pre-submission validation
export const validateExperimentData = (data) => {
  const errors = {};
  
  // Validate AMT parameters
  const amtValidation = validateAMTParams(data.amtParams || {});
  if (!amtValidation.isValid && !amtValidation.isPreview) {
    errors.amt = amtValidation.errors;
  }
  
  // Validate lottery choices
  const lotteryValidation = validateLotteryChoices(data.responses || {});
  if (!lotteryValidation.isValid) {
    errors.lottery = lotteryValidation.errors;
  }
  
  // Validate attention check
  if (data.responses && data.responses.math) {
    const attentionValidation = validateAttentionCheck(data.responses.math);
    if (!attentionValidation.isValid) {
      errors.attention = attentionValidation.error;
    }
  } else {
    errors.attention = 'Attention check answer is required';
  }
  
  // Validate filler tasks
  const fillerValidation = validateFillerTasks(data.responses || {});
  if (!fillerValidation.isValid) {
    errors.filler = fillerValidation.errors;
  }
  
  // Validate timing
  if (data.startTime && data.endTime) {
    const timingValidation = validateCompletionTime(data.startTime, data.endTime);
    if (!timingValidation.isValid) {
      errors.timing = timingValidation.error;
    }
  } else {
    errors.timing = 'Timing data is incomplete';
  }
  
  // Validate conditions
  if (!data.fontCondition || !['easy', 'hard'].includes(data.fontCondition)) {
    errors.fontCondition = 'Invalid font condition';
  }
  
  if (!data.attributionCondition || !['present', 'absent'].includes(data.attributionCondition)) {
    errors.attributionCondition = 'Invalid attribution condition';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    errorCount: Object.keys(errors).length
  };
};

// Real-time validation for form fields
export const getFieldValidation = (fieldName, value, context = {}) => {
  switch (fieldName) {
    case 'lottery1':
    case 'lottery2':
      return {
        isValid: ['A', 'B', 'C', 'D'].includes(value),
        error: value ? null : 'Please select an option'
      };
      
    case 'math':
      return validateAttentionCheck(value);
      
    case 'weather':
    case 'brand':
    case 'age':
    case 'gender':
      return {
        isValid: value && value.trim() !== '',
        error: value ? null : 'This field is required'
      };
      
    case 'education':
      return {
        isValid: true, // Optional field
        error: null
      };
      
    default:
      return {
        isValid: true,
        error: null
      };
  }
};

// Generate quality control flags
export const generateQualityFlags = (data) => {
  const flags = [];
  
  // Check attention check
  const attentionValidation = validateAttentionCheck(data.responses?.math);
  if (!attentionValidation.isValid) {
    flags.push({
      type: 'attention_check',
      severity: 'high',
      message: 'Attention check failed'
    });
  }
  
  // Check completion time
  const timingValidation = validateCompletionTime(data.startTime, data.endTime);
  if (!timingValidation.isValid) {
    flags.push({
      type: 'timing',
      severity: timingValidation.issues.includes('too quickly') ? 'high' : 'medium',
      message: timingValidation.error
    });
  }
  
  // Check for inconsistent choices (Allais paradox pattern)
  if (data.responses?.lottery1 === 'A' && data.responses?.lottery2 === 'D') {
    flags.push({
      type: 'choice_pattern',
      severity: 'low',
      message: 'Shows Allais paradox pattern'
    });
  }
  
  // Check browser info for suspicious patterns
  const browserValidation = validateBrowserCompatibility();
  if (!browserValidation.isCompatible) {
    flags.push({
      type: 'browser',
      severity: 'medium',
      message: browserValidation.issues.join(', ')
    });
  }
  
  return {
    flags,
    flagCount: flags.length,
    highSeverityCount: flags.filter(f => f.severity === 'high').length,
    shouldReject: flags.filter(f => f.severity === 'high').length > 0
  };
};