import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentPage: 0,
  responses: {},
  startTime: null,
  endTime: null,
  completionTimeMs: 0,
  fontCondition: null, // 'easy' or 'hard'
  completionCode: null,
  isSubmitted: false,
  isComplete: false,
  pageOrder: null, // Array of page objects with randomized order
};

const experimentSlice = createSlice({
  name: 'experiment',
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    updateResponse: (state, action) => {
      const { key, value } = action.payload;
      state.responses[key] = value;
    },
    setMultipleResponses: (state, action) => {
      state.responses = { ...state.responses, ...action.payload };
    },
    setStartTime: (state, action) => {
      state.startTime = action.payload;
    },
    setEndTime: (state, action) => {
      state.endTime = action.payload;
      if (state.startTime) {
        state.completionTimeMs = new Date(action.payload) - new Date(state.startTime);
      }
    },
    setConditions: (state, action) => {
      const { fontCondition } = action.payload;
      state.fontCondition = fontCondition;
    },
    setCompletionCode: (state, action) => {
      state.completionCode = action.payload;
    },
    setSubmitted: (state, action) => {
      state.isSubmitted = action.payload;
    },
    setComplete: (state) => {
      state.isComplete = true;
      if (!state.endTime) {
        state.endTime = new Date().toISOString();
        if (state.startTime) {
          state.completionTimeMs = new Date(state.endTime) - new Date(state.startTime);
        }
      }
    },
    nextPage: (state) => {
      state.currentPage += 1;
    },
    previousPage: (state) => {
      if (state.currentPage > 0) {
        state.currentPage -= 1;
      }
    },
    setPageOrder: (state, action) => {
      state.pageOrder = action.payload;
    },
    resetExperiment: () => initialState,
  },
});

export const {
  setCurrentPage,
  updateResponse,
  setMultipleResponses,
  setStartTime,
  setEndTime,
  setConditions,
  setCompletionCode,
  setSubmitted,
  setComplete,
  nextPage,
  previousPage,
  setPageOrder,
  resetExperiment,
} = experimentSlice.actions;

export default experimentSlice.reducer;