import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setMultipleResponses, 
  nextPage, 
  previousPage 
} from '../store/slices/experimentSlice.js';
import { selectResponses } from '../store/selectors.js';

const FillerTasks = () => {
  const dispatch = useDispatch();
  const responses = useSelector(selectResponses);
  
  const [formData, setFormData] = useState({
    weather: responses.weather || '',
    brand: responses.brand || '',
    age: responses.age || '',
    gender: responses.gender || '',
    education: responses.education || ''
  });

  const handleInputChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    dispatch(setMultipleResponses(updatedData));
  };

  const handleNext = () => {
    // Check if required fields are filled
    if (formData.weather && formData.brand && formData.age && formData.gender) {
      dispatch(nextPage());
    }
  };

  const handlePrevious = () => {
    dispatch(previousPage());
  };

  const isFormComplete = formData.weather && formData.brand && formData.age && formData.gender;

  return (
    <div className="experiment-content">
      <h2>Background Questions</h2>
      
      <p style={{ marginBottom: '2rem', color: '#6c757d' }}>
        Please answer these brief questions about yourself and your preferences.
      </p>

      <div className="card">
        {/* Weather Preference */}
        <div className="form-group">
          <label>What type of weather do you prefer?</label>
          <select
            value={formData.weather}
            onChange={(e) => handleInputChange('weather', e.target.value)}
          >
            <option value="">Please select...</option>
            <option value="sunny">Sunny and warm</option>
            <option value="mild">Mild and comfortable</option>
            <option value="cool">Cool and crisp</option>
            <option value="rainy">Rainy and cozy</option>
            <option value="snowy">Snowy and cold</option>
          </select>
        </div>

        {/* Brand Preference */}
        <div className="form-group">
          <label>Which brand do you prefer for everyday products?</label>
          <select
            value={formData.brand}
            onChange={(e) => handleInputChange('brand', e.target.value)}
          >
            <option value="">Please select...</option>
            <option value="name_brand">Well-known name brands</option>
            <option value="store_brand">Store brands/generics</option>
            <option value="premium">Premium/luxury brands</option>
            <option value="no_preference">No particular preference</option>
            <option value="varies">It depends on the product</option>
          </select>
        </div>

        {/* Demographics */}
        <div className="form-group">
          <label>What is your age?</label>
          <select
            value={formData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
          >
            <option value="">Please select...</option>
            <option value="18-24">18-24</option>
            <option value="25-34">25-34</option>
            <option value="35-44">35-44</option>
            <option value="45-54">45-54</option>
            <option value="55-64">55-64</option>
            <option value="65+">65 or older</option>
          </select>
        </div>

        <div className="form-group">
          <label>What is your gender?</label>
          <select
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
          >
            <option value="">Please select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non_binary">Non-binary</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>What is your highest level of education? (Optional)</label>
          <select
            value={formData.education}
            onChange={(e) => handleInputChange('education', e.target.value)}
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

      {!isFormComplete && (
        <div className="alert alert-info">
          Please complete all required fields to continue.
        </div>
      )}

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
          disabled={!isFormComplete}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default FillerTasks;