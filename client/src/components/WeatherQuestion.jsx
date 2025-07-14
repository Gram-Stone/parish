import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateResponse, 
  nextPage, 
  previousPage 
} from '../store/slices/experimentSlice.js';
import { selectResponses } from '../store/selectors.js';

const WeatherQuestion = () => {
  const dispatch = useDispatch();
  const responses = useSelector(selectResponses);
  
  const [answer, setAnswer] = useState(responses.weather || '');

  const handleInputChange = (value) => {
    setAnswer(value);
    dispatch(updateResponse({ key: 'weather', value }));
  };

  const handleNext = () => {
    if (answer) {
      dispatch(nextPage());
    }
  };

  const handlePrevious = () => {
    dispatch(previousPage());
  };

  return (
    <div className="experiment-content">
      <div className="card">
        <div className="form-group">
          <label>What type of weather do you prefer?</label>
          <select
            value={answer}
            onChange={(e) => handleInputChange(e.target.value)}
          >
            <option value="">Please select...</option>
            <option value="sunny">Sunny and warm</option>
            <option value="mild">Mild and comfortable</option>
            <option value="cool">Cool and crisp</option>
            <option value="rainy">Rainy and cozy</option>
            <option value="snowy">Snowy and cold</option>
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
          disabled={!answer}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default WeatherQuestion;