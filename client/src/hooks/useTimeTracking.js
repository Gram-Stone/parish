import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTimeOutOfBounds } from '../store/slices/qualitySlice.js';
import { selectStartTime, selectTimeOutOfBounds } from '../store/selectors.js';

// Time tracking hook - silent until time runs out
export const useTimeTracking = () => {
  const dispatch = useDispatch();
  const startTime = useSelector(selectStartTime);
  const timeOutOfBounds = useSelector(selectTimeOutOfBounds);

  useEffect(() => {
    if (!startTime || timeOutOfBounds) return;

    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(startTime);
      const elapsedMs = now - start;

      // Check if time limit exceeded (60 minutes)
      const timeLimit = 60 * 60 * 1000;
      if (elapsedMs > timeLimit) {
        dispatch(setTimeOutOfBounds(true));
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [startTime, timeOutOfBounds, dispatch]);

  return { timeOutOfBounds };
};