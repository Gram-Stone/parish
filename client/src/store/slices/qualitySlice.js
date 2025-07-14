import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  attentionCheckPassed: null,
  attentionCheckAnswer: null,
  timeOutOfBounds: false,
  failed: false,
  failureReasons: [],
  validationErrors: {},
  ipAddress: null,
  browserInfo: null,
};

const qualitySlice = createSlice({
  name: 'quality',
  initialState,
  reducers: {
    setAttentionCheck: (state, action) => {
      const { answer, passed } = action.payload;
      state.attentionCheckAnswer = answer;
      state.attentionCheckPassed = passed;
      
      if (!passed && !state.failureReasons.includes('attention_check')) {
        state.failureReasons.push('attention_check');
        state.failed = true;
      }
    },
    setTimeOutOfBounds: (state, action) => {
      state.timeOutOfBounds = action.payload;
      
      if (action.payload && !state.failureReasons.includes('time_limit')) {
        state.failureReasons.push('time_limit');
        state.failed = true;
      }
    },
    addFailureReason: (state, action) => {
      const reason = action.payload;
      if (!state.failureReasons.includes(reason)) {
        state.failureReasons.push(reason);
        state.failed = true;
      }
    },
    removeFailureReason: (state, action) => {
      const reason = action.payload;
      state.failureReasons = state.failureReasons.filter(r => r !== reason);
      state.failed = state.failureReasons.length > 0;
    },
    setValidationError: (state, action) => {
      const { field, error } = action.payload;
      if (error) {
        state.validationErrors[field] = error;
      } else {
        delete state.validationErrors[field];
      }
    },
    clearValidationErrors: (state) => {
      state.validationErrors = {};
    },
    setIPAddress: (state, action) => {
      state.ipAddress = action.payload;
    },
    setBrowserInfo: (state, action) => {
      state.browserInfo = action.payload;
    },
    resetQuality: () => initialState,
  },
});

export const {
  setAttentionCheck,
  setTimeOutOfBounds,
  addFailureReason,
  removeFailureReason,
  setValidationError,
  clearValidationErrors,
  setIPAddress,
  setBrowserInfo,
  resetQuality,
} = qualitySlice.actions;

export default qualitySlice.reducer;