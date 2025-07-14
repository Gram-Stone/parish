import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ExperimentEngine from './engine/ExperimentEngine.jsx';
import Dashboard from './components/Dashboard.jsx';
import { initializeAMTParams } from './hooks/useAMTInitialization.js';
import allaisFluencyExperiment from './experiments/allais-fluency.js';
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
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={<ExperimentEngine experimentConfig={allaisFluencyExperiment} />} 
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;