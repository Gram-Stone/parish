import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateResponse, 
  nextPage, 
  previousPage 
} from '../store/slices/experimentSlice.js';
import { selectResponses } from '../store/selectors.js';

const EducationQuestion = () => {
  const dispatch = useDispatch();
  const responses = useSelector(selectResponses);
  
  const [answer, setAnswer] = useState(responses.education || '');

  const handleInputChange = (value) => {
    setAnswer(value);
    dispatch(updateResponse({ key: 'education', value }));
  };

  const handleNext = () => {
    // Education is optional, so we can continue even without an answer
    dispatch(nextPage());
  };

  const handlePrevious = () => {
    dispatch(previousPage());
  };

  return (
    <div className="experiment-content">
      <div className="card">
        <div className="form-group">
          <label>What is your highest level of education? (Optional)</label>
          <select
            value={answer}
            onChange={(e) => handleInputChange(e.target.value)}
          >
            <option value="">Please select...</option>
            <option value="less_than_high_school">Less than high school</option>
            <option value="high_school">High school diploma/GED</option>
            <option value="some_college">Some college</option>
            <option value="associates">Associate's degree</option>
            <option value="bachelors">Bachelor's degree</option>
            <option value="masters">Master's degree</option>
            <option value="doctoral">Doctoral degree</option>
            <option value="professional">Professional degree</option>
          </select>
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
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default EducationQuestion;