// Calculate Cohen's h effect size for two proportions
export const calculateEffectSize = (p1, p2) => {
  const phi1 = 2 * Math.asin(Math.sqrt(p1));
  const phi2 = 2 * Math.asin(Math.sqrt(p2));
  return Math.abs(phi1 - phi2);
};

// Calculate statistical power for two-proportion test
export const calculatePower = (n, effectSize, alpha = 0.05) => {
  // Simplified power calculation using normal approximation
  const zAlpha = 1.96; // z-score for α = 0.05 (two-tailed)
  const zBeta = (effectSize * Math.sqrt(n / 2)) - zAlpha;
  
  // Convert z-score to power using normal CDF approximation
  const power = 0.5 * (1 + Math.sign(zBeta) * Math.sqrt(1 - Math.exp(-2 * zBeta * zBeta / Math.PI)));
  
  return Math.max(0, Math.min(1, power));
};

// Calculate required sample size for desired power
export const calculateRequiredSampleSize = (effectSize, power = 0.8, alpha = 0.05) => {
  const zAlpha = 1.96; // z-score for α = 0.05
  const zBeta = 0.84;  // z-score for β = 0.20 (power = 0.80)
  
  const n = Math.ceil(2 * Math.pow((zAlpha + zBeta) / effectSize, 2));
  return n;
};

// Perform chi-square test for independence
export const performChiSquareTest = (group1, group2, outcome) => {
  const g1Success = group1.filter(r => r.allaisPattern === outcome).length;
  const g1Total = group1.length;
  const g1Failure = g1Total - g1Success;
  
  const g2Success = group2.filter(r => r.allaisPattern === outcome).length;
  const g2Total = group2.length;
  const g2Failure = g2Total - g2Success;
  
  // 2x2 contingency table
  const observed = [
    [g1Success, g1Failure],
    [g2Success, g2Failure]
  ];
  
  const totalSuccess = g1Success + g2Success;
  const totalFailure = g1Failure + g2Failure;
  const total = g1Total + g2Total;
  
  // Expected frequencies
  const expected = [
    [(g1Total * totalSuccess) / total, (g1Total * totalFailure) / total],
    [(g2Total * totalSuccess) / total, (g2Total * totalFailure) / total]
  ];
  
  // Calculate chi-square statistic
  let chiSquare = 0;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      if (expected[i][j] > 0) {
        chiSquare += Math.pow(observed[i][j] - expected[i][j], 2) / expected[i][j];
      }
    }
  }
  
  // Degrees of freedom for 2x2 table
  const df = 1;
  
  // Approximate p-value using chi-square distribution
  const pValue = calculateChiSquarePValue(chiSquare, df);
  
  return {
    chiSquare: chiSquare.toFixed(3),
    df,
    pValue: pValue.toFixed(4),
    isSignificant: pValue < 0.05,
    contingencyTable: observed,
    expectedTable: expected
  };
};

// Approximate chi-square p-value calculation
const calculateChiSquarePValue = (chiSquare, df) => {
  // Very simplified approximation for df = 1
  if (df === 1) {
    if (chiSquare < 0.004) return 0.95;
    if (chiSquare < 0.016) return 0.90;
    if (chiSquare < 0.102) return 0.75;
    if (chiSquare < 0.455) return 0.50;
    if (chiSquare < 1.074) return 0.30;
    if (chiSquare < 1.642) return 0.20;
    if (chiSquare < 2.706) return 0.10;
    if (chiSquare < 3.841) return 0.05;
    if (chiSquare < 5.024) return 0.025;
    if (chiSquare < 6.635) return 0.01;
    if (chiSquare < 7.879) return 0.005;
    return 0.001;
  }
  
  // For other df values, return a rough approximation
  return Math.max(0.001, 1 - (chiSquare / (chiSquare + df)));
};

// Calculate confidence interval for proportion
export const calculateConfidenceInterval = (successes, total, confidence = 0.95) => {
  if (total === 0) return { lower: 0, upper: 0 };
  
  const p = successes / total;
  const z = confidence === 0.95 ? 1.96 : 2.58; // 95% or 99% CI
  
  const margin = z * Math.sqrt((p * (1 - p)) / total);
  
  return {
    lower: Math.max(0, p - margin),
    upper: Math.min(1, p + margin),
    proportion: p
  };
};

// Calculate descriptive statistics for completion times
export const calculateDescriptiveStats = (values) => {
  if (values.length === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      std: 0,
      min: 0,
      max: 0,
      q25: 0,
      q75: 0
    };
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);
  
  const q25 = sorted[Math.floor(n * 0.25)];
  const q75 = sorted[Math.floor(n * 0.75)];
  
  return {
    count: n,
    mean: mean.toFixed(2),
    median: median.toFixed(2),
    std: std.toFixed(2),
    min: sorted[0],
    max: sorted[n - 1],
    q25,
    q75
  };
};

// Perform sequential analysis for early stopping
export const performSequentialAnalysis = (data, alpha = 0.05, targetPower = 0.8) => {
  const n = data.length;
  const adjustedAlpha = alpha / Math.log(n); // Adjusted for multiple testing
  
  // Calculate current effect and significance
  const easyResponses = data.filter(r => r.fontCondition === 'easy');
  const hardResponses = data.filter(r => r.fontCondition === 'hard');
  
  if (easyResponses.length < 10 || hardResponses.length < 10) {
    return {
      shouldStop: false,
      reason: 'Insufficient data for analysis',
      currentN: n,
      recommendation: 'Continue data collection'
    };
  }
  
  const chiSquareResult = performChiSquareTest(easyResponses, hardResponses, 'allais_paradox');
  const currentPower = calculatePower(n, 0.5); // Assuming medium effect size
  
  // Stopping rules
  if (parseFloat(chiSquareResult.pValue) < adjustedAlpha) {
    return {
      shouldStop: true,
      reason: 'Significant effect detected',
      currentN: n,
      pValue: chiSquareResult.pValue,
      recommendation: 'Stop data collection - significant results obtained'
    };
  }
  
  if (currentPower >= targetPower && parseFloat(chiSquareResult.pValue) > 0.5) {
    return {
      shouldStop: true,
      reason: 'Sufficient power reached with no effect',
      currentN: n,
      currentPower: currentPower.toFixed(3),
      recommendation: 'Stop data collection - adequate power for null result'
    };
  }
  
  return {
    shouldStop: false,
    reason: 'Continue data collection',
    currentN: n,
    currentPower: currentPower.toFixed(3),
    recommendation: `Continue until N = ${calculateRequiredSampleSize(0.5, targetPower)}`
  };
};

// Calculate Bayes Factor for effect vs no effect
export const calculateBayesFactor = (data) => {
  // Simplified BF calculation for educational purposes
  // In practice, would use more sophisticated methods
  
  const easyResponses = data.filter(r => r.fontCondition === 'easy');
  const hardResponses = data.filter(r => r.fontCondition === 'hard');
  
  if (easyResponses.length < 5 || hardResponses.length < 5) {
    return {
      bf10: 'Insufficient data',
      interpretation: 'Need more data'
    };
  }
  
  const easyRate = easyResponses.filter(r => r.allaisPattern === 'allais_paradox').length / easyResponses.length;
  const hardRate = hardResponses.filter(r => r.allaisPattern === 'allais_paradox').length / hardResponses.length;
  
  const effectSize = Math.abs(easyRate - hardRate);
  
  // Very rough BF approximation based on effect size
  let bf10;
  if (effectSize < 0.05) bf10 = 0.1;
  else if (effectSize < 0.1) bf10 = 0.3;
  else if (effectSize < 0.2) bf10 = 1.0;
  else if (effectSize < 0.3) bf10 = 3.0;
  else bf10 = 10.0;
  
  let interpretation;
  if (bf10 < 0.33) interpretation = 'Evidence for null hypothesis';
  else if (bf10 < 3) interpretation = 'Inconclusive evidence';
  else if (bf10 < 10) interpretation = 'Moderate evidence for effect';
  else interpretation = 'Strong evidence for effect';
  
  return {
    bf10: bf10.toFixed(2),
    interpretation,
    effectSize: effectSize.toFixed(3)
  };
};