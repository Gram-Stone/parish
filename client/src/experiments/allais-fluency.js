// Allais Paradox with Fluency Manipulation Experiment Configuration

import WelcomePage from '../components/WelcomePage.jsx';
import LotteryChoice from '../components/LotteryChoice.jsx';
import AttentionCheck from '../components/AttentionCheck.jsx';
import WeatherQuestion from '../components/WeatherQuestion.jsx';
import BrandQuestion from '../components/BrandQuestion.jsx';
import EducationQuestion from '../components/EducationQuestion.jsx';
import CompletionPage from '../components/CompletionPage.jsx';

export const allaisFluencyExperiment = {
  // Experiment metadata
  id: 'allais-fluency-v1',
  title: 'Allais Paradox with Fluency Manipulation',
  description: 'Psychology experiment investigating the Allais paradox with font-based fluency conditions',
  version: '1.0.0',
  
  // Experimental conditions
  conditions: {
    fontCondition: {
      type: 'categorical',
      levels: ['easy', 'hard'],
      randomization: 'between-subjects'
    }
  },
  
  // Fixed pages that must appear in order
  fixedPages: [
    {
      id: 'welcome',
      component: WelcomePage,
      order: 0
    },
    {
      id: 'lottery1',
      component: LotteryChoice,
      props: {
        scenario: 'A',
        responseKey: 'lottery1',
        title: 'Investment Scenario A'
      },
      order: 1
    }
  ],
  
  // Randomizable pages
  randomizablePages: [
    {
      id: 'attention',
      component: AttentionCheck,
      required: true
    },
    {
      id: 'weather',
      component: WeatherQuestion,
      required: false
    },
    {
      id: 'brand',
      component: BrandQuestion,
      required: false
    },
    {
      id: 'education',
      component: EducationQuestion,
      required: false
    }
  ],
  
  // Pages with constraints
  constrainedPages: [
    {
      id: 'lottery2',
      component: LotteryChoice,
      props: {
        scenario: 'B',
        responseKey: 'lottery2',
        title: 'Investment Scenario B'
      },
      constraints: {
        notAfter: ['lottery1'], // Cannot be immediately after lottery1
        minSeparation: 1 // At least 1 page between lottery1 and lottery2
      }
    }
  ],
  
  // Final pages
  finalPages: [
    {
      id: 'completion',
      component: CompletionPage,
      order: -1 // Always last
    }
  ],
  
  // Quality controls
  qualityControls: {
    timeLimit: 3600000, // 60 minutes in ms
    attentionCheck: {
      required: true,
      correctAnswer: 42,
      maxAttempts: 1
    },
    minimumTime: 300000, // 5 minutes minimum
    allowRetakes: false
  },
  
  // Data collection
  dataStructure: {
    primaryOutcome: ['lottery1Choice', 'lottery2Choice'],
    demographics: ['weather', 'brand', 'education'],
    qualityMetrics: ['attentionCheckPassed', 'completionTimeMs']
  },
  
  // AMT configuration
  amtConfig: {
    title: 'Decision Making Study (15-20 minutes)',
    description: 'Participate in a psychology study about decision making. You will make choices about investment scenarios and answer brief questions.',
    keywords: ['psychology', 'decision making', 'survey', 'research'],
    reward: '$1.00',
    duration: 3600, // 1 hour
    qualifications: []
  }
};

export default allaisFluencyExperiment;