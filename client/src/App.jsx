import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import ExperimentFlow from './components/ExperimentFlow.jsx';
import { initializeAMTParams } from './hooks/useAMTInitialization.js';
import './styles/App.css';
import './styles/fontConditions.css';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize AMT parameters and experiment conditions on app load
    initializeAMTParams(dispatch);
  }, [dispatch]);

  return (
    <div className="App">
      <ExperimentFlow />
    </div>
  );
}

export default App;