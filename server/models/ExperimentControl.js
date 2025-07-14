import mongoose from 'mongoose';

const experimentControlSchema = new mongoose.Schema({
  // Experiment identification
  experimentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  version: {
    type: String,
    default: '1.0.0',
    trim: true
  },
  
  // Experiment status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft'
  },
  
  // Target sample sizes
  targetSampleSize: {
    total: { type: Number, required: true, min: 1 },
    byCondition: {
      easy: { type: Number, default: 0 },
      hard: { type: Number, default: 0 }
    }
  },
  
  // Current sample counts
  currentSampleSize: {
    total: { type: Number, default: 0 },
    valid: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    byCondition: {
      easy: { type: Number, default: 0 },
      hard: { type: Number, default: 0 }
    }
  },
  
  // Budget and financial controls
  budget: {
    total: { type: Number, required: true, min: 0 },
    spent: { type: Number, default: 0, min: 0 },
    rewardPerParticipant: { type: Number, required: true, min: 0 },
    estimatedFees: { type: Number, default: 0, min: 0 }
  },
  
  // Quality control settings
  qualityControls: {
    timeLimit: { type: Number, default: 3600000 }, // 60 minutes in ms
    attentionCheckRequired: { type: Boolean, default: true },
    attentionCheckAnswer: { type: Number, default: 42 },
    minimumCompletionTime: { type: Number, default: 300000 }, // 5 minutes in ms
    allowRetakes: { type: Boolean, default: false }
  },
  
  // AMT HIT configuration
  hitConfig: {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    keywords: [{ type: String, trim: true }],
    reward: { type: String, trim: true },
    assignmentDuration: { type: Number, default: 3600 }, // 60 minutes in seconds
    lifetime: { type: Number, default: 604800 }, // 7 days in seconds
    maxAssignments: { type: Number, default: 1 },
    autoApprovalDelay: { type: Number, default: 259200 } // 3 days in seconds
  },
  
  // Active HITs
  activeHits: [{
    hitId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    assignmentsRemaining: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['assignable', 'unassignable', 'reviewable', 'reviewing', 'disposed'],
      default: 'assignable'
    }
  }],
  
  // Statistical monitoring
  statistics: {
    lastCalculated: { type: Date },
    effectSize: { type: Number },
    pValue: { type: Number },
    power: { type: Number },
    confidenceInterval: {
      lower: { type: Number },
      upper: { type: Number }
    }
  },
  
  // Timestamps and metadata
  startDate: { type: Date },
  endDate: { type: Date },
  lastDataCollection: { type: Date },
  dataLocked: { type: Boolean, default: false },
  
  // Researcher information
  researcher: {
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    institution: { type: String, trim: true }
  },
  
  // Notes and comments
  notes: { type: String, trim: true },
  adminNotes: { type: String, trim: true }
}, {
  timestamps: true
});

// Indexes for efficient querying
// Note: experimentId already has unique index from schema definition
experimentControlSchema.index({ status: 1 });
experimentControlSchema.index({ 'researcher.email': 1 });
experimentControlSchema.index({ createdAt: 1 });

// Virtual for completion percentage
experimentControlSchema.virtual('completionPercentage').get(function() {
  if (this.targetSampleSize.total === 0) return 0;
  return Math.round((this.currentSampleSize.valid / this.targetSampleSize.total) * 100);
});

// Virtual for budget utilization
experimentControlSchema.virtual('budgetUtilization').get(function() {
  if (this.budget.total === 0) return 0;
  return Math.round((this.budget.spent / this.budget.total) * 100);
});

// Method to check if experiment should auto-stop
experimentControlSchema.methods.shouldAutoStop = function() {
  const budgetExceeded = this.budget.spent >= this.budget.total * 0.95;
  const sampleReached = this.currentSampleSize.valid >= this.targetSampleSize.total;
  return budgetExceeded || sampleReached;
};

// Method to update sample counts
experimentControlSchema.methods.updateSampleCounts = async function() {
  const Response = mongoose.model('Response');
  
  const totalCount = await Response.countDocuments({ 
    experimentId: this.experimentId 
  });
  
  const validCount = await Response.countDocuments({ 
    experimentId: this.experimentId,
    failed: false,
    attentionCheckPassed: true
  });
  
  const failedCount = totalCount - validCount;
  
  // Count by condition
  const conditionCounts = await Response.aggregate([
    { 
      $match: { 
        experimentId: this.experimentId,
        failed: false,
        attentionCheckPassed: true
      }
    },
    {
      $group: {
        _id: {
          font: '$fontCondition',
          attribution: '$attributionCondition'
        },
        count: { $sum: 1 }
      }
    }
  ]);
  
  this.currentSampleSize.total = totalCount;
  this.currentSampleSize.valid = validCount;
  this.currentSampleSize.failed = failedCount;
  
  // Reset condition counts
  this.currentSampleSize.byCondition = {
    easyFont_present: 0,
    easyFont_absent: 0,
    hardFont_present: 0,
    hardFont_absent: 0
  };
  
  // Update condition counts
  conditionCounts.forEach(item => {
    const key = `${item._id.font}Font_${item._id.attribution}`;
    if (this.currentSampleSize.byCondition.hasOwnProperty(key)) {
      this.currentSampleSize.byCondition[key] = item.count;
    }
  });
  
  this.lastDataCollection = new Date();
  return this.save();
};

// Ensure virtual fields are serialized
experimentControlSchema.set('toJSON', { virtuals: true });

export default mongoose.model('ExperimentControl', experimentControlSchema);