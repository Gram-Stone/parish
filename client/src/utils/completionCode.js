// Completion code generation and validation utilities

// Generate a unique completion code
export const generateCompletionCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'STUDY';
  
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add timestamp component for uniqueness
  const timestamp = Date.now().toString().slice(-3);
  code += timestamp;
  
  return code;
};

// Validate completion code format
export const validateCompletionCode = (code) => {
  // Expected format: STUDYXXXX### where X is alphanumeric and # is numeric
  const codeRegex = /^STUDY[A-Z0-9]{4}[0-9]{3}$/;
  
  return {
    isValid: codeRegex.test(code),
    error: codeRegex.test(code) ? null : 'Invalid completion code format'
  };
};

// Check if completion code has been used
export const checkCompletionCodeUniqueness = async (code) => {
  try {
    const response = await fetch('/api/experiment/check-completion-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ completionCode: code }),
    });
    
    const result = await response.json();
    
    return {
      isUnique: !result.exists,
      error: result.exists ? 'Completion code already exists' : null
    };
  } catch (error) {
    console.error('Error checking completion code uniqueness:', error);
    return {
      isUnique: true, // Assume unique if check fails
      error: null
    };
  }
};

// Generate completion code with uniqueness check
export const generateUniqueCompletionCode = async (maxAttempts = 5) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateCompletionCode();
    const uniquenessCheck = await checkCompletionCodeUniqueness(code);
    
    if (uniquenessCheck.isUnique) {
      return {
        code,
        isValid: true,
        error: null
      };
    }
  }
  
  // If we couldn't generate a unique code after max attempts
  return {
    code: null,
    isValid: false,
    error: 'Unable to generate unique completion code'
  };
};

// Format completion code for display
export const formatCompletionCode = (code) => {
  if (!code) return '';
  
  // Add spaces for readability: STUDY XXXX ###
  return code.replace(/^(STUDY)([A-Z0-9]{4})([0-9]{3})$/, '$1 $2 $3');
};

// Extract information from completion code
export const parseCompletionCode = (code) => {
  const match = code.match(/^STUDY([A-Z0-9]{4})([0-9]{3})$/);
  
  if (!match) {
    return {
      isValid: false,
      randomPart: null,
      timestampPart: null,
      error: 'Invalid completion code format'
    };
  }
  
  return {
    isValid: true,
    randomPart: match[1],
    timestampPart: match[2],
    error: null
  };
};

// Generate backup completion codes (in case primary fails)
export const generateBackupCodes = (count = 3) => {
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    codes.push(generateCompletionCode());
  }
  
  return codes;
};

// Validate completion code against worker/assignment
export const validateCompletionForWorker = async (code, workerId, assignmentId) => {
  try {
    const response = await fetch('/api/experiment/validate-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        completionCode: code,
        workerId,
        assignmentId
      }),
    });
    
    const result = await response.json();
    
    return {
      isValid: result.valid,
      belongsToWorker: result.belongsToWorker,
      submissionDate: result.submissionDate,
      error: result.error || null
    };
  } catch (error) {
    console.error('Error validating completion code:', error);
    return {
      isValid: false,
      belongsToWorker: false,
      submissionDate: null,
      error: 'Validation failed'
    };
  }
};