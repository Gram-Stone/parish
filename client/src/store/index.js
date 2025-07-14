import { configureStore } from '@reduxjs/toolkit';
import experimentReducer from './slices/experimentSlice.js';
import amtReducer from './slices/amtSlice.js';
import qualityReducer from './slices/qualitySlice.js';

export const store = configureStore({
  reducer: {
    experiment: experimentReducer,
    amt: amtReducer,
    quality: qualityReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['experiment/setStartTime', 'experiment/setEndTime'],
        ignoredPaths: ['experiment.startTime', 'experiment.endTime'],
      },
    }),
});

export default store;