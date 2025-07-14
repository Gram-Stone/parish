import { useDispatch } from 'react-redux';
import { nextPage, setStartTime } from '../store/slices/experimentSlice.js';

const WelcomePage = () => {
  const dispatch = useDispatch();

  const handleStart = () => {
    // Start the timer when they click "Begin Study"
    dispatch(setStartTime(new Date().toISOString()));
    dispatch(nextPage());
  };

  return (
    <div className="experiment-content">
      <h1>Welcome to the Decision Making Study</h1>
      
      <div className="card">
        <h2>Study Information</h2>
        
        <p>
          Thank you for participating in our research study. This study investigates 
          how people make decisions under different conditions.
        </p>
        
        <h3>What to Expect:</h3>
        <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto 2rem' }}>
          <li><strong>Duration:</strong> Approximately 15-20 minutes</li>
          <li><strong>Tasks:</strong> You will make decisions and answer some brief questions</li>
          <li><strong>Completion Code:</strong> You will receive a unique code at the end to submit on AMT</li>
        </ul>
        
        <h3>Important Guidelines:</h3>
        <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto 2rem' }}>
          <li>Please read all instructions carefully</li>
          <li>Answer all questions honestly and to the best of your ability</li>
          <li>You must complete the study within 60 minutes</li>
          <li>You can only participate once in this study</li>
        </ul>
        
        <div className="alert alert-info">
          <strong>Consent:</strong> By clicking "Begin Study" below, you confirm that you:
          <ul style={{ textAlign: 'left', marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li>Are 18 years of age or older</li>
            <li>Understand this is a research study and can withdraw at any time</li>
            <li>Agree to participate voluntarily</li>
          </ul>
        </div>
      </div>
      
      <div className="page-navigation">
        <div></div>
        <button 
          className="btn-primary"
          onClick={handleStart}
        >
          Begin Study
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;