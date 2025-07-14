import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import {
  selectCurrentPage,
  selectIsPreview,
  selectFontCondition,
  selectTimeOutOfBounds,
  selectPageOrder
} from '../store/selectors.js';
import { setPageOrder } from '../store/slices/experimentSlice.js';
import { useTimeTracking } from '../hooks/useTimeTracking.js';

// Import page components
import LoadingPage from '../components/LoadingPage.jsx';
import PreviewPage from '../components/PreviewPage.jsx';

const ExperimentEngine = ({ experimentConfig }) => {
  const dispatch = useDispatch();
  const currentPage = useSelector(selectCurrentPage);
  const isPreview = useSelector(selectIsPreview);
  const fontCondition = useSelector(selectFontCondition);
  const timeOutOfBounds = useSelector(selectTimeOutOfBounds);
  const pageOrder = useSelector(selectPageOrder);
  
  // Time tracking starts when timer starts (after "Begin Study")
  useTimeTracking();

  // Generate page order based on experiment configuration
  useEffect(() => {
    if (!pageOrder && !isPreview) {
      const generatePageOrder = () => {
        const { fixedPages, randomizablePages, constrainedPages, finalPages } = experimentConfig;
        
        // Start with fixed pages in order
        const orderedPages = [...fixedPages].sort((a, b) => a.order - b.order);
        
        // Shuffle randomizable pages
        const shuffledPages = [...randomizablePages].sort(() => Math.random() - 0.5);
        
        // Insert constrained pages
        constrainedPages.forEach(constrainedPage => {
          const { constraints } = constrainedPage;
          
          if (constraints.notAfter) {
            // Find the latest page it cannot be after
            const latestNotAfterIndex = Math.max(
              ...constraints.notAfter.map(pageId => 
                orderedPages.findIndex(p => p.id === pageId)
              )
            );
            
            // Insert with minimum separation
            const minIndex = latestNotAfterIndex + (constraints.minSeparation || 0) + 1;
            const maxIndex = shuffledPages.length;
            const insertIndex = Math.floor(Math.random() * (maxIndex - minIndex)) + minIndex;
            
            shuffledPages.splice(Math.min(insertIndex, shuffledPages.length), 0, constrainedPage);
          } else {
            // Insert randomly if no constraints
            const insertIndex = Math.floor(Math.random() * shuffledPages.length);
            shuffledPages.splice(insertIndex, 0, constrainedPage);
          }
        });
        
        // Add randomized pages to ordered pages
        orderedPages.push(...shuffledPages);
        
        // Add final pages
        const sortedFinalPages = [...finalPages].sort((a, b) => (b.order || 0) - (a.order || 0));
        orderedPages.push(...sortedFinalPages);
        
        // Convert to page objects with components
        return orderedPages.map(page => ({
          id: page.id,
          component: <page.component {...(page.props || {})} />
        }));
      };

      dispatch(setPageOrder(generatePageOrder()));
    }
  }, [pageOrder, isPreview, dispatch, experimentConfig]);

  // Show loading if conditions or page order haven't been set yet (and not in preview)
  if (!isPreview && (!fontCondition || !pageOrder)) {
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
            You have exceeded the {Math.round(experimentConfig.qualityControls.timeLimit / 60000)}-minute time limit for this study. 
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

  // Use the generated page order
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

export default ExperimentEngine;