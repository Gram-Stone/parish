import { useSelector } from 'react-redux';
import {
  selectCurrentPage,
  selectIsPreview,
  selectFontCondition,
  selectAttributionCondition,
  selectTimeOutOfBounds
} from '../store/selectors.js';
import { useTimeTracking } from '../hooks/useTimeTracking.js';

// Import page components
import LoadingPage from './LoadingPage.jsx';
import PreviewPage from './PreviewPage.jsx';
import WelcomePage from './WelcomePage.jsx';
import LotteryChoice from './LotteryChoice.jsx';
import AttentionCheck from './AttentionCheck.jsx';
import FillerTasks from './FillerTasks.jsx';
import CompletionPage from './CompletionPage.jsx';

const ExperimentFlow = () => {
  const currentPage = useSelector(selectCurrentPage);
  const isPreview = useSelector(selectIsPreview);
  const fontCondition = useSelector(selectFontCondition);
  const attributionCondition = useSelector(selectAttributionCondition);
  const timeOutOfBounds = useSelector(selectTimeOutOfBounds);
  
  // Time tracking starts when timer starts (after "Begin Study")
  useTimeTracking();

  // Show loading if conditions haven't been set yet (and not in preview)
  if (!isPreview && (!fontCondition || !attributionCondition)) {
    return <LoadingPage />;
  }

  // Show preview page if in preview mode
  if (isPreview) {
    return <PreviewPage />;
  }

  // Show timeout message if time limit exceeded
  if (timeOutOfBounds) {
    return (
      <div className="experiment-content">
        <div className="error-container">
          <div className="error-title">Time Limit Exceeded</div>
          <div className="error-message">
            You have exceeded the 60-minute time limit for this study. 
            Unfortunately, your HIT submission will be rejected as you were 
            unable to complete the study within the required timeframe.
          </div>
          <p style={{ marginTop: '1rem', fontSize: '14px', color: '#6c757d' }}>
            Please return the HIT on Amazon Mechanical Turk.
          </p>
        </div>
      </div>
    );
  }

  // Define experiment pages
  const pages = [
    { id: 'welcome', component: <WelcomePage /> },
    { 
      id: 'lottery1', 
      component: <LotteryChoice 
        scenario="A" 
        responseKey="lottery1"
        title="Investment Scenario A"
      /> 
    },
    { id: 'attention', component: <AttentionCheck /> },
    { id: 'filler', component: <FillerTasks /> },
    { 
      id: 'lottery2', 
      component: <LotteryChoice 
        scenario="B" 
        responseKey="lottery2"
        title="Investment Scenario B"
      /> 
    },
    { id: 'completion', component: <CompletionPage /> }
  ];

  const currentPageComponent = pages[currentPage]?.component;

  if (!currentPageComponent) {
    return (
      <div className="error-container">
        <div className="error-title">Page Not Found</div>
        <div className="error-message">
          The requested page could not be found.
        </div>
      </div>
    );
  }

  return (
    <div className={`experiment-container ${fontCondition}-font`}>
      
      {/* Current page content */}
      <div className="experiment-page">
        {currentPageComponent}
      </div>
    </div>
  );
};

export default ExperimentFlow;