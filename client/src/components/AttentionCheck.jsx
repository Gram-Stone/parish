import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateResponse, 
  nextPage, 
  previousPage 
} from '../store/slices/experimentSlice.js';
import { setAttentionCheck } from '../store/slices/qualitySlice.js';
import { selectResponses } from '../store/selectors.js';

const AttentionCheck = () => {
  const dispatch = useDispatch();
  const responses = useSelector(selectResponses);
  
  const [answer, setAnswer] = useState(responses.math || '');
  const [isValid, setIsValid] = useState(false);

  const correctAnswer = 42;
  const mathProblem = "15 + 27";

  useEffect(() => {
    const numericAnswer = parseInt(answer);
    const valid = numericAnswer === correctAnswer;
    setIsValid(valid);
    
    if (answer) {
      dispatch(updateResponse({ key: 'math', value: answer }));
      dispatch(setAttentionCheck({ 
        answer: numericAnswer, 
        passed: valid 
      }));
    }
  }, [answer, dispatch]);

  const handleNext = () => {
    if (answer) {
      dispatch(nextPage());
    }
  };

  const handlePrevious = () => {
    dispatch(previousPage());
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setAnswer(value);
    }
  };

  return (
    <div className="experiment-content">
      <div className="card">
        <p>
          Please solve this simple math problem:
        </p>
        
        <div className="math-problem">
          {mathProblem} = ?
        </div>
        
        <div className="form-group">
          <label htmlFor="math-answer">Your Answer:</label>
          <input
            id="math-answer"
            type="text"
            className="math-input"
            value={answer}
            onChange={handleInputChange}
            placeholder="Enter your answer"
            autoComplete="off"
          />
        </div>
        
      </div>

      <div className="page-navigation">
        <button 
          className="btn-secondary"
          onClick={handlePrevious}
        >
          Previous
        </button>
        
        <button 
          className="btn-primary"
          onClick={handleNext}
          disabled={!answer}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default AttentionCheck;