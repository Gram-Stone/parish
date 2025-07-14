import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  workerId: null,
  assignmentId: null,
  hitId: null,
  turkSubmitTo: null,
  isPreview: false,
  isAMTEnvironment: false,
  submissionStatus: 'pending', // 'pending', 'submitting', 'submitted', 'error'
  submissionError: null,
};

const amtSlice = createSlice({
  name: 'amt',
  initialState,
  reducers: {
    setAMTParams: (state, action) => {
      const { workerId, assignmentId, hitId, turkSubmitTo } = action.payload;
      state.workerId = workerId;
      state.assignmentId = assignmentId;
      state.hitId = hitId;
      state.turkSubmitTo = turkSubmitTo;
      state.isPreview = assignmentId === 'ASSIGNMENT_ID_NOT_AVAILABLE';
      state.isAMTEnvironment = !!(workerId && assignmentId && hitId && turkSubmitTo);
    },
    setSubmissionStatus: (state, action) => {
      state.submissionStatus = action.payload;
      if (action.payload !== 'error') {
        state.submissionError = null;
      }
    },
    setSubmissionError: (state, action) => {
      state.submissionStatus = 'error';
      state.submissionError = action.payload;
    },
    clearSubmissionError: (state) => {
      state.submissionError = null;
      if (state.submissionStatus === 'error') {
        state.submissionStatus = 'pending';
      }
    },
    resetAMT: () => initialState,
  },
});

export const {
  setAMTParams,
  setSubmissionStatus,
  setSubmissionError,
  clearSubmissionError,
  resetAMT,
} = amtSlice.actions;

export default amtSlice.reducer;