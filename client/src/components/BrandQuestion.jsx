import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateResponse, 
  nextPage, 
  previousPage 
} from '../store/slices/experimentSlice.js';
import { selectResponses } from '../store/selectors.js';

const BrandQuestion = () => {
  const dispatch = useDispatch();
  const responses = useSelector(selectResponses);
  
  const [answer, setAnswer] = useState(responses.brand || '');

  const handleInputChange = (value) => {
    setAnswer(value);
    dispatch(updateResponse({ key: 'brand', value }));
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
          <label>Which brand do you prefer for everyday products?</label>
          <select
            value={answer}
            onChange={(e) => handleInputChange(e.target.value)}
          >
            <option value="">Please select...</option>
            <option value="name_brand">Well-known name brands</option>
            <option value="store_brand">Store brands/generics</option>
            <option value="premium">Premium/luxury brands</option>
            <option value="no_preference">No particular preference</option>
            <option value="varies">It depends on the product</option>
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

export default BrandQuestion;