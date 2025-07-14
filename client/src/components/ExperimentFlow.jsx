import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import {
  selectCurrentPage,
  selectIsPreview,
  selectFontCondition,
  selectAttributionCondition,
  selectTimeOutOfBounds,
  selectPageOrder
} from '../store/selectors.js';
import { setPageOrder } from '../store/slices/experimentSlice.js';
import { useTimeTracking } from '../hooks/useTimeTracking.js';

// Import page components
import LoadingPage from './LoadingPage.jsx';
import PreviewPage from './PreviewPage.jsx';
import WelcomePage from './WelcomePage.jsx';
import LotteryChoice from './LotteryChoice.jsx';
import AttentionCheck from './AttentionCheck.jsx';
import WeatherQuestion from './WeatherQuestion.jsx';
import BrandQuestion from './BrandQuestion.jsx';
import EducationQuestion from './EducationQuestion.jsx';
import CompletionPage from './CompletionPage.jsx';

const ExperimentFlow = () => {
  const dispatch = useDispatch();
  const currentPage = useSelector(selectCurrentPage);
  const isPreview = useSelector(selectIsPreview);
  const fontCondition = useSelector(selectFontCondition);
  const attributionCondition = useSelector(selectAttributionCondition);
  const timeOutOfBounds = useSelector(selectTimeOutOfBounds);
  const pageOrder = useSelector(selectPageOrder);
  
  // Time tracking starts when timer starts (after "Begin Study")
  useTimeTracking();

  // Generate randomized page order on first load
  useEffect(() => {
    if (!pageOrder && !isPreview) {
      const generatePageOrder = () => {
        // Fixed pages that must be in order
        const fixedPages = [
          { id: 'welcome', component: <WelcomePage /> },
          { 
            id: 'lottery1', 
            component: <LotteryChoice 
              scenario="A" 
              responseKey="lottery1"
              title="Investment Scenario A"
            /> 
          }
        ];

        // Questions that can be randomized (excluding age and gender)
        const randomizablePages = [
          { id: 'attention', component: <AttentionCheck /> },
          { id: 'weather', component: <WeatherQuestion /> },
          { id: 'brand', component: <BrandQuestion /> },
          { id: 'education', component: <EducationQuestion /> }
        ];

        // Shuffle the randomizable pages
        const shuffled = [...randomizablePages].sort(() => Math.random() - 0.5);

        // Insert lottery2 such that it's never consecutive with lottery1
        // and ensure at least one question separates them
        const insertIndex = Math.min(
          Math.floor(Math.random() * (shuffled.length - 1)) + 1, 
          shuffled.length - 1
        ); // Insert somewhere in the middle, not at the very end
        
        const lottery2Page = { 
          id: 'lottery2', 
          component: <LotteryChoice 
            scenario="B" 
            responseKey="lottery2"
            title="Investment Scenario B"
          /> 
        };

        shuffled.splice(insertIndex, 0, lottery2Page);

        // Final order: welcome, lottery1, then randomized questions with lottery2 inserted
        const finalOrder = [
          ...fixedPages,
          ...shuffled,
          { id: 'completion', component: <CompletionPage /> }
        ];

        return finalOrder;
      };

      dispatch(setPageOrder(generatePageOrder()));
    }
  }, [pageOrder, isPreview, dispatch]);

  // Show loading if conditions or page order haven't been set yet (and not in preview)
  if (!isPreview && (!fontCondition || !attributionCondition || !pageOrder)) {
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

  // Use the randomized page order
  const currentPageComponent = pageOrder?.[currentPage]?.component;

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