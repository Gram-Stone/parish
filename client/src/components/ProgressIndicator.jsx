const ProgressIndicator = ({ currentPage, totalPages, pageNames }) => {
  const progressPercentage = ((currentPage + 1) / totalPages) * 100;
  
  const getPageDisplayName = (pageName) => {
    const displayNames = {
      welcome: 'Welcome',
      lottery1: 'Scenario A',
      attention: 'Attention Check',
      filler: 'Background',
      lottery2: 'Scenario B', 
      completion: 'Complete'
    };
    return displayNames[pageName] || pageName;
  };

  return (
    <div className="experiment-progress">
      <div className="progress-container">
        <div className="progress-text">
          Step {currentPage + 1} of {totalPages}: {getPageDisplayName(pageNames[currentPage])}
        </div>
        
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;