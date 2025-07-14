import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  setComplete, 
  setCompletionCode, 
  setEndTime 
} from '../store/slices/experimentSlice.js';
import { setSubmissionStatus } from '../store/slices/amtSlice.js';
import { 
  selectAllExperimentData, 
  selectAMTParams, 
  selectCompletionCode,
  selectFailed,
  selectFailureReasons,
  selectSubmissionStatus
} from '../store/selectors.js';
import AMTSubmissionForm from './AMTSubmissionForm.jsx';

const CompletionPage = () => {
  const dispatch = useDispatch();
  const experimentData = useSelector(selectAllExperimentData);
  const amtParams = useSelector(selectAMTParams);
  const completionCode = useSelector(selectCompletionCode);
  const failed = useSelector(selectFailed);
  const failureReasons = useSelector(selectFailureReasons);
  const submissionStatus = useSelector(selectSubmissionStatus);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Mark experiment as complete when component mounts
    dispatch(setComplete());
    dispatch(setEndTime(new Date().toISOString()));
    
    // Submit data to our backend
    submitExperimentData();
  }, [dispatch]);

  const submitExperimentData = async () => {
    if (isSubmitting || submissionComplete) return;
    
    setIsSubmitting(true);
    dispatch(setSubmissionStatus('submitting'));
    
    try {
      const submissionData = {
        ...experimentData,
        timing: {
          startTime: experimentData.startTime,
          endTime: new Date().toISOString(),
          durationMs: experimentData.completionTimeMs
        },
        responses: {
          lottery1: experimentData.responses.lottery1,
          lottery2: experimentData.responses.lottery2,
          math: experimentData.responses.math,
          weather: experimentData.responses.weather,
          brand: experimentData.responses.brand,
          age: experimentData.responses.age,
          gender: experimentData.responses.gender,
          education: experimentData.responses.education
        },
        browserInfo: experimentData.browserInfo
      };

      // Use absolute URL to ensure it goes to our server, not AMT's domain
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/experiment/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok) {
        dispatch(setCompletionCode(result.completionCode));
        dispatch(setSubmissionStatus('submitted'));
        setSubmissionComplete(true);
        
        if (result.failed) {
          console.warn('Submission marked as failed:', result.failureReasons);
        }
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setError(error.message);
      dispatch(setSubmissionStatus('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmissionMessage = () => {
    if (failed) {
      return {
        type: 'warning',
        title: 'Submission Received with Issues',
        message: `Your responses have been recorded, but there were some quality control issues: ${failureReasons.join(', ')}. You may not be eligible for payment.`
      };
    } else {
      return {
        type: 'success',
        title: 'Study Complete!',
        message: 'Thank you for participating in our research study. Your responses have been successfully recorded.'
      };
    }
  };

  if (isSubmitting) {
    return (
      <div className="experiment-content">
        <div className="loading">
          <div className="spinner"></div>
        </div>
        <h3>Submitting Your Responses...</h3>
        <p>Please wait while we save your data.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="experiment-content">
        <div className="error-container">
          <div className="error-title">Submission Error</div>
          <div className="error-message">
            There was an error submitting your responses: {error}
          </div>
          <button 
            className="btn-primary mt-3"
            onClick={submitExperimentData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const submissionMessage = getSubmissionMessage();

  return (
    <div className="experiment-content">
      <div className="completion-container">
        <div className={`alert alert-${submissionMessage.type}`}>
          <h2>{submissionMessage.title}</h2>
          <p>{submissionMessage.message}</p>
        </div>

        {completionCode && (
          <>
            <h3>Your Completion Code:</h3>
            <div className="completion-code">
              {completionCode}
            </div>
            <p>
              <strong>Important:</strong> Please copy this code and submit it on the 
              Amazon Mechanical Turk page to receive payment.
            </p>
          </>
        )}

        {submissionComplete && (
          <AMTSubmissionForm 
            completionCode={completionCode}
            amtParams={amtParams}
          />
        )}

        <div className="card mt-4">
          <h4>Study Summary</h4>
          <p>
            This study investigated decision-making under different presentation conditions. 
            Your participation helps us understand how various factors influence choice behavior.
          </p>
          
          <p>
            If you have any questions about this research, please contact the research team 
            at [researcher email].
          </p>
          
          <p>
            <strong>Thank you for your time and participation!</strong>
          </p>
        </div>

        {failed && (
          <div className="alert alert-info mt-3">
            <strong>Quality Control Information:</strong>
            <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
              {failureReasons.includes('attention_check') && (
                <li>Attention check was not answered correctly</li>
              )}
              {failureReasons.includes('time_limit') && (
                <li>Study was completed too quickly or too slowly</li>
              )}
              {failureReasons.includes('duplicate') && (
                <li>Multiple submissions detected</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletionPage;