import { useState } from 'react';

const AMTSubmissionForm = ({ completionCode, amtParams }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitToAMT = () => {
    setIsSubmitting(true);
    
    // Create and submit the form to AMT
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${amtParams.turkSubmitTo}/mturk/externalSubmit`;
    form.target = '_parent'; // Critical for breaking out of iframe
    
    // Add hidden fields
    const assignmentIdField = document.createElement('input');
    assignmentIdField.type = 'hidden';
    assignmentIdField.name = 'assignmentId';
    assignmentIdField.value = amtParams.assignmentId;
    form.appendChild(assignmentIdField);
    
    const completionCodeField = document.createElement('input');
    completionCodeField.type = 'hidden';
    completionCodeField.name = 'completion_code';
    completionCodeField.value = completionCode;
    form.appendChild(completionCodeField);
    
    // Add form to document and submit
    document.body.appendChild(form);
    form.submit();
  };

  const canSubmitToAMT = amtParams.turkSubmitTo && 
                        amtParams.assignmentId && 
                        amtParams.assignmentId !== 'ASSIGNMENT_ID_NOT_AVAILABLE' &&
                        completionCode;

  if (!canSubmitToAMT) {
    return (
      <div className="alert alert-warning">
        <strong>Note:</strong> AMT submission is not available. Please manually copy 
        your completion code and submit it on the AMT page.
      </div>
    );
  }

  return (
    <div className="amt-submit-form">
      <h3>Submit to Amazon Mechanical Turk</h3>
      
      <p>
        Click the button below to automatically submit your completion code to AMT 
        and receive payment.
      </p>
      
      <div className="alert alert-info">
        <strong>Important:</strong> After clicking this button, you will be redirected 
        to Amazon Mechanical Turk to complete your submission. Make sure you have 
        copied your completion code: <strong>{completionCode}</strong>
      </div>
      
      <button
        className="submit-button"
        onClick={handleSubmitToAMT}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit to Amazon Mechanical Turk'}
      </button>
      
      <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '16px' }}>
        If the automatic submission doesn't work, please manually enter your 
        completion code <strong>{completionCode}</strong> on the AMT page.
      </p>
    </div>
  );
};

export default AMTSubmissionForm;