import { useState, useEffect } from 'react';
import { dashboardAPI } from '../utils/api.js';

const Dashboard = () => {
  const [experiments, setExperiments] = useState([]);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentResponses, setRecentResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getExperiments();
      setExperiments(data);
      
      if (data.length > 0) {
        setSelectedExperiment(data[0].experimentId);
        await loadExperimentData(data[0].experimentId);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExperimentData = async (experimentId) => {
    try {
      const [statsData, responsesData] = await Promise.all([
        dashboardAPI.getExperimentStats(experimentId),
        dashboardAPI.getRecentResponses(experimentId, 20)
      ]);
      
      setStats(statsData);
      setRecentResponses(responsesData);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleExperimentChange = (experimentId) => {
    setSelectedExperiment(experimentId);
    loadExperimentData(experimentId);
  };

  const handleExportData = async (format = 'csv') => {
    if (!selectedExperiment) return;
    
    try {
      if (format === 'csv') {
        const blob = await dashboardAPI.exportData(selectedExperiment, 'csv');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedExperiment}_data.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await dashboardAPI.exportData(selectedExperiment, 'json');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedExperiment}_data.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
        <h3>Loading Dashboard...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-container">
          <div className="error-title">Dashboard Error</div>
          <div className="error-message">{error}</div>
          <button className="btn-primary mt-3" onClick={loadExperiments}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Research Dashboard</h1>
      
      {/* Experiment Selector */}
      <div className="card">
        <h3>Select Experiment</h3>
        <select 
          value={selectedExperiment || ''} 
          onChange={(e) => handleExperimentChange(e.target.value)}
        >
          <option value="">Select an experiment...</option>
          {experiments.map(exp => (
            <option key={exp.experimentId} value={exp.experimentId}>
              {exp.title} ({exp.status})
            </option>
          ))}
        </select>
      </div>

      {stats && (
        <>
          {/* Summary Statistics */}
          <div className="card">
            <h3>Experiment Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <h4>Sample Size</h4>
                <p><strong>{stats.qualityMetrics.validResponses}</strong> valid responses</p>
                <p>{stats.qualityMetrics.totalResponses} total submissions</p>
                <p>{stats.powerAnalysis.progressPercentage}% of target</p>
              </div>
              
              <div>
                <h4>Quality Control</h4>
                <p>{stats.qualityMetrics.failedResponses} failed responses</p>
                <p>{stats.qualityMetrics.attentionCheckFailures} attention failures</p>
                <p>{stats.qualityMetrics.timeoutFailures} timeout failures</p>
              </div>
              
              <div>
                <h4>Budget</h4>
                <p><strong>${stats.financialSummary.budgetSpent}</strong> spent</p>
                <p>${stats.financialSummary.budgetTotal} total budget</p>
                <p>${stats.financialSummary.budgetRemaining} remaining</p>
              </div>
              
              <div>
                <h4>Progress</h4>
                <p>Target N: {stats.powerAnalysis.targetN}</p>
                <p>Current N: {stats.powerAnalysis.currentN}</p>
                <p>Power: {(stats.powerAnalysis.currentPower * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Effect Sizes */}
          {stats.effectSizes && (
            <div className="card">
              <h3>Effect Sizes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {stats.effectSizes.fontEffect && (
                  <div>
                    <h4>Font Condition Effect</h4>
                    <p>Easy Font Allais Rate: {stats.effectSizes.fontEffect.easyAllaisRate}%</p>
                    <p>Hard Font Allais Rate: {stats.effectSizes.fontEffect.hardAllaisRate}%</p>
                    <p>Cohen's h: {stats.effectSizes.fontEffect.cohensH}</p>
                    <p>p-value: {stats.effectSizes.fontEffect.significance.pValue}</p>
                  </div>
                )}
                
                {stats.effectSizes.attributionEffect && (
                  <div>
                    <h4>Attribution Effect</h4>
                    <p>Present: {stats.effectSizes.attributionEffect.presentAllaisRate}%</p>
                    <p>Absent: {stats.effectSizes.attributionEffect.absentAllaisRate}%</p>
                    <p>Cohen's h: {stats.effectSizes.attributionEffect.cohensH}</p>
                    <p>p-value: {stats.effectSizes.attributionEffect.significance.pValue}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Condition Breakdown */}
          <div className="card">
            <h3>Sample by Condition</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              {Object.entries(stats.statsByCondition).map(([condition, data]) => (
                <div key={condition}>
                  <h4>{condition.replace('_', ' + ')}</h4>
                  <p><strong>N = {data.sampleSize}</strong></p>
                  <p>Lottery 1: A={data.choiceDistribution.lottery1.A}, B={data.choiceDistribution.lottery1.B}</p>
                  <p>Lottery 2: C={data.choiceDistribution.lottery2.C}, D={data.choiceDistribution.lottery2.D}</p>
                  <p>Avg Time: {data.averageCompletionTime}s</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Recent Responses */}
      <div className="card">
        <h3>Recent Responses</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e9ecef' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Worker ID</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Condition</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Choices</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Pattern</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentResponses.map((response, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '8px' }}>{response.workerId.substring(0, 8)}...</td>
                  <td style={{ padding: '8px' }}>{response.fontCondition}/{response.attributionCondition}</td>
                  <td style={{ padding: '8px' }}>{response.lottery1Choice}-{response.lottery2Choice}</td>
                  <td style={{ padding: '8px' }}>{response.allaisPattern}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ 
                      color: response.failed ? '#dc3545' : '#28a745',
                      fontWeight: 'bold'
                    }}>
                      {response.failed ? 'Failed' : 'Valid'}
                    </span>
                  </td>
                  <td style={{ padding: '8px' }}>{Math.round(response.completionTimeMs / 1000)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Controls */}
      <div className="card">
        <h3>Data Export</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            className="btn-primary"
            onClick={() => handleExportData('csv')}
            disabled={!selectedExperiment}
          >
            Export CSV
          </button>
          <button 
            className="btn-secondary"
            onClick={() => handleExportData('json')}
            disabled={!selectedExperiment}
          >
            Export JSON
          </button>
        </div>
        <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '8px' }}>
          Export includes only valid responses (passed quality checks)
        </p>
      </div>
    </div>
  );
};

export default Dashboard;