// Validate attention check answer
export const validateAttentionCheck = (answer, correctAnswer = 42) => {
  return parseInt(answer) === correctAnswer;
};

// Validate completion time
export const validateCompletionTime = (durationMs, minTime = 300000, maxTime = 3600000) => {
  // minTime: 5 minutes (300,000 ms)
  // maxTime: 60 minutes (3,600,000 ms)
  
  const reasons = [];
  
  if (durationMs < minTime) {
    reasons.push('time_limit');
  }
  
  if (durationMs > maxTime) {
    reasons.push('time_limit');
  }
  
  return {
    isValid: reasons.length === 0,
    reasons,
    durationMinutes: Math.round(durationMs / 60000)
  };
};

// Validate lottery choices
export const validateLotteryChoices = (responses) => {
  const errors = {};
  
  if (!responses.lottery1 || !['A', 'B'].includes(responses.lottery1)) {
    errors.lottery1 = 'Invalid lottery 1 choice';
  }
  
  if (!responses.lottery2 || !['C', 'D'].includes(responses.lottery2)) {
    errors.lottery2 = 'Invalid lottery 2 choice';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate experimental conditions
export const validateConditions = (fontCondition, attributionCondition) => {
  const errors = {};
  
  if (!['easy', 'hard'].includes(fontCondition)) {
    errors.fontCondition = 'Invalid font condition';
  }
  
  if (!['present', 'absent'].includes(attributionCondition)) {
    errors.attributionCondition = 'Invalid attribution condition';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate AMT worker ID format
export const validateWorkerID = (workerId) => {
  // AMT worker IDs typically start with 'A' and are alphanumeric
  const workerIdRegex = /^A[A-Z0-9]{10,}$/;
  return workerIdRegex.test(workerId);
};

// Validate AMT assignment ID format
export const validateAssignmentID = (assignmentId) => {
  // Check for preview mode
  if (assignmentId === 'ASSIGNMENT_ID_NOT_AVAILABLE') {
    return { isValid: true, isPreview: true };
  }
  
  // AMT assignment IDs typically start with numbers
  const assignmentIdRegex = /^[0-9A-Z]{20,}$/;
  return { 
    isValid: assignmentIdRegex.test(assignmentId), 
    isPreview: false 
  };
};

// Validate HIT ID format
export const validateHITID = (hitId) => {
  // AMT HIT IDs are typically alphanumeric strings
  const hitIdRegex = /^[A-Z0-9]{20,}$/;
  return hitIdRegex.test(hitId);
};

// Comprehensive response validation
export const validateExperimentResponse = (data) => {
  const errors = {};
  
  // Validate AMT parameters
  if (!validateWorkerID(data.workerId)) {
    errors.workerId = 'Invalid worker ID format';
  }
  
  const assignmentValidation = validateAssignmentID(data.assignmentId);
  if (!assignmentValidation.isValid) {
    errors.assignmentId = 'Invalid assignment ID format';
  }
  
  if (!validateHITID(data.hitId)) {
    errors.hitId = 'Invalid HIT ID format';
  }
  
  // Validate conditions
  const conditionValidation = validateConditions(data.fontCondition, data.attributionCondition);
  if (!conditionValidation.isValid) {
    Object.assign(errors, conditionValidation.errors);
  }
  
  // Validate lottery choices
  const choiceValidation = validateLotteryChoices(data.responses);
  if (!choiceValidation.isValid) {
    Object.assign(errors, choiceValidation.errors);
  }
  
  // Validate attention check
  if (!data.responses.math || isNaN(parseInt(data.responses.math))) {
    errors.attentionCheck = 'Invalid attention check answer';
  }
  
  // Validate timing
  if (!data.timing || !data.timing.startTime || !data.timing.endTime) {
    errors.timing = 'Invalid timing data';
  } else {
    const timeValidation = validateCompletionTime(data.timing.durationMs);
    if (!timeValidation.isValid) {
      errors.completionTime = `Completion time ${timeValidation.reasons.join(', ')}`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    isPreview: assignmentValidation.isPreview
  };
};

// Validate browser info for fraud detection
export const validateBrowserInfo = (browserInfo) => {
  if (!browserInfo) return { isValid: false, issues: ['Missing browser info'] };
  
  const issues = [];
  
  // Check for suspicious user agents
  const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];
  if (browserInfo.userAgent && suspiciousAgents.some(agent => 
    browserInfo.userAgent.toLowerCase().includes(agent))) {
    issues.push('Suspicious user agent');
  }
  
  // Check for reasonable screen resolution
  if (browserInfo.screenResolution) {
    const [width, height] = browserInfo.screenResolution.split('x').map(Number);
    if (width < 800 || height < 600) {
      issues.push('Unusually small screen resolution');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};