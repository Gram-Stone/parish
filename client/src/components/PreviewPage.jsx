const PreviewPage = () => {
  return (
    <div className="experiment-content">
      <div className="preview-container">
        <div className="preview-title">
          🔍 Preview Mode - Decision Making Study
        </div>
        
        <div className="preview-description">
          <h2>Study Overview</h2>
          
          <p>
            <strong>Title:</strong> Decision Making Under Different Conditions
          </p>
          
          <p>
            <strong>Duration:</strong> Approximately 15-20 minutes
          </p>
          
          <p>
            <strong>Compensation:</strong> $2.00 upon successful completion
          </p>
          
          <h3>What You'll Do:</h3>
          <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
            <li>Make decisions about investment scenarios</li>
            <li>Answer some brief questions about your preferences</li>
            <li>Complete a simple attention check</li>
            <li>Provide basic demographic information</li>
          </ul>
          
          <h3>Requirements:</h3>
          <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
            <li>US location</li>
            <li>95%+ approval rating</li>
            <li>100+ approved HITs</li>
            <li>Complete attention check correctly</li>
            <li>Finish within 60 minutes</li>
          </ul>
          
          <div className="alert alert-info" style={{ marginTop: '2rem' }}>
            <strong>Note:</strong> This is a preview. To participate in the actual study, 
            please accept the HIT and you will be redirected to the full experiment.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;