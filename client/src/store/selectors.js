// Experiment selectors
export const selectCurrentPage = (state) => state.experiment.currentPage;
export const selectResponses = (state) => state.experiment.responses;
export const selectFontCondition = (state) => state.experiment.fontCondition;
export const selectAttributionCondition = (state) => state.experiment.attributionCondition;
export const selectCompletionCode = (state) => state.experiment.completionCode;
export const selectIsComplete = (state) => state.experiment.isComplete;
export const selectIsSubmitted = (state) => state.experiment.isSubmitted;
export const selectCompletionTime = (state) => state.experiment.completionTimeMs;
export const selectStartTime = (state) => state.experiment.startTime;

// AMT selectors
export const selectAMTParams = (state) => ({
  workerId: state.amt.workerId,
  assignmentId: state.amt.assignmentId,
  hitId: state.amt.hitId,
  turkSubmitTo: state.amt.turkSubmitTo,
});
export const selectIsPreview = (state) => state.amt.isPreview;
export const selectIsAMTEnvironment = (state) => state.amt.isAMTEnvironment;
export const selectSubmissionStatus = (state) => state.amt.submissionStatus;
export const selectSubmissionError = (state) => state.amt.submissionError;

// Quality selectors
export const selectAttentionCheckPassed = (state) => state.quality.attentionCheckPassed;
export const selectFailed = (state) => state.quality.failed;
export const selectFailureReasons = (state) => state.quality.failureReasons;
export const selectValidationErrors = (state) => state.quality.validationErrors;
export const selectTimeOutOfBounds = (state) => state.quality.timeOutOfBounds;

// Computed selectors
export const selectCanProceed = (state) => {
  const hasValidationErrors = Object.keys(state.quality.validationErrors).length > 0;
  const hasFailed = state.quality.failed;
  return !hasValidationErrors && !hasFailed;
};

export const selectAllExperimentData = (state) => ({
  // Experiment data
  responses: state.experiment.responses,
  fontCondition: state.experiment.fontCondition,
  attributionCondition: state.experiment.attributionCondition,
  startTime: state.experiment.startTime,
  endTime: state.experiment.endTime,
  completionTimeMs: state.experiment.completionTimeMs,
  
  // AMT data
  workerId: state.amt.workerId,
  assignmentId: state.amt.assignmentId,
  hitId: state.amt.hitId,
  
  // Quality data
  attentionCheckAnswer: state.quality.attentionCheckAnswer,
  attentionCheckPassed: state.quality.attentionCheckPassed,
  timeOutOfBounds: state.quality.timeOutOfBounds,
  failed: state.quality.failed,
  failureReasons: state.quality.failureReasons,
  ipAddress: state.quality.ipAddress,
  browserInfo: state.quality.browserInfo,
});