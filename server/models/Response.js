import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  // AMT identifiers
  workerId: { 
    type: String, 
    required: true, 
    index: true,
    trim: true
  },
  assignmentId: { 
    type: String, 
    required: true,
    trim: true
  },
  hitId: { 
    type: String, 
    required: true,
    trim: true
  },
  
  // Experimental conditions
  fontCondition: { 
    type: String, 
    enum: ['easy', 'hard'], 
    required: true 
  },
  
  // Core experimental data
  lottery1Choice: { 
    type: String, 
    enum: ['A', 'B'], 
    required: true 
  },
  lottery2Choice: { 
    type: String, 
    enum: ['C', 'D'], 
    required: true 
  },
  
  // Additional responses (filler tasks, etc.)
  additionalResponses: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Quality control
  attentionCheckAnswer: { 
    type: Number, 
    required: true 
  },
  attentionCheckPassed: { 
    type: Boolean, 
    required: true 
  },
  
  // Timing data
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  completionTimeMs: { 
    type: Number, 
    required: true,
    min: 0
  },
  timeOutOfBounds: { 
    type: Boolean, 
    default: false 
  },
  
  // Administrative
  completionCode: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    uppercase: true
  },
  ipAddress: { 
    type: String, 
    required: true 
  },
  browserInfo: {
    userAgent: String,
    language: String,
    platform: String,
    screenResolution: String,
    timezone: String
  },
  
  // Quality flags
  failed: { 
    type: Boolean, 
    default: false 
  },
  failureReasons: [{ 
    type: String, 
    enum: ['attention_check', 'time_limit', 'duplicate', 'invalid_response', 'technical_error'] 
  }],
  
  // Research metadata
  experimentVersion: {
    type: String,
    default: '1.0.0'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
responseSchema.index({ workerId: 1, assignmentId: 1 });
responseSchema.index({ fontCondition: 1 });
responseSchema.index({ failed: 1, attentionCheckPassed: 1 });
responseSchema.index({ createdAt: 1 });

// Virtual for Allais paradox pattern
responseSchema.virtual('allaisPattern').get(function() {
  if (this.lottery1Choice === 'A' && this.lottery2Choice === 'C') {
    return 'consistent_risk_averse';
  }
  if (this.lottery1Choice === 'B' && this.lottery2Choice === 'D') {
    return 'consistent_risk_seeking';
  }
  if (this.lottery1Choice === 'A' && this.lottery2Choice === 'D') {
    return 'allais_paradox';
  }
  return 'other_pattern';
});

// Ensure virtual fields are serialized
responseSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Response', responseSchema);