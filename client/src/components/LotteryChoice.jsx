import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateResponse, 
  nextPage, 
  previousPage 
} from '../store/slices/experimentSlice.js';
import { 
  selectResponses, 
  selectFontCondition, 
  selectAttributionCondition 
} from '../store/selectors.js';

const LotteryChoice = ({ scenario, responseKey, title }) => {
  const dispatch = useDispatch();
  const responses = useSelector(selectResponses);
  const fontCondition = useSelector(selectFontCondition);
  const attributionCondition = useSelector(selectAttributionCondition);
  
  const [selectedChoice, setSelectedChoice] = useState(responses[responseKey] || '');

  const handleChoiceSelect = (choice) => {
    setSelectedChoice(choice);
    dispatch(updateResponse({ key: responseKey, value: choice }));
  };

  const handleNext = () => {
    if (selectedChoice) {
      dispatch(nextPage());
    }
  };

  const handlePrevious = () => {
    dispatch(previousPage());
  };

  // Scenario content
  const scenarioContent = {
    A: {
      title: "Investment Scenario A",
      description: "Imagine you are choosing between two investment options:",
      options: [
        {
          id: 'A',
          title: 'Investment A',
          description: 'You receive $1 million with certainty.',
          details: '100% chance of $1,000,000'
        },
        {
          id: 'B', 
          title: 'Investment B',
          description: 'Lottery with multiple possible outcomes.',
          details: '89% chance of $1M, 10% chance of $5M, 1% chance of $0'
        }
      ]
    },
    B: {
      title: "Investment Scenario B", 
      description: "Now consider this different scenario:",
      options: [
        {
          id: 'C',
          title: 'Investment C',
          description: 'Lottery with a chance of receiving money.',
          details: '89% chance of $0, 11% chance of $1,000,000'
        },
        {
          id: 'D',
          title: 'Investment D', 
          description: 'Different lottery with a chance of receiving money.',
          details: '90% chance of $0, 10% chance of $5,000,000'
        }
      ]
    }
  };

  const currentScenario = scenarioContent[scenario];

  return (
    <div className="experiment-content">
      <div className="lottery-scenario fluency-content">
        <p style={{ fontSize: '18px', marginBottom: '32px' }}>
          {currentScenario.description}
        </p>
        
        <div style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '500' }}>
          Which investment would you choose?
        </div>
      </div>

      <div className="choice-buttons">
        {currentScenario.options.map((option) => (
          <button
            key={option.id}
            className={`choice-button ${selectedChoice === option.id ? 'selected' : ''}`}
            onClick={() => handleChoiceSelect(option.id)}
          >
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              {option.title}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {option.details}
            </div>
          </button>
        ))}
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
          disabled={!selectedChoice}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default LotteryChoice;