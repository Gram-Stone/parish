import express from 'express';
import Response from '../models/Response.js';
import ExperimentControl from '../models/ExperimentControl.js';
import { calculateEffectSize, calculatePower, performChiSquareTest } from '../services/statistics.js';

const router = express.Router();

// Get experiment overview
router.get('/experiments', async (req, res) => {
  try {
    let experiments = await ExperimentControl.find({})
      .sort({ createdAt: -1 })
      .select('-notes -adminNotes');

    // If no experiments exist, create a default one
    if (experiments.length === 0) {
      const defaultExperiment = new ExperimentControl({
        experimentId: 'allais-fluency-v1',
        title: 'Allais Paradox with Fluency Manipulation',
        description: 'Psychology experiment investigating the Allais paradox with font-based fluency conditions',
        version: '1.0.0',
        status: 'active',
        targetSampleSize: {
          total: 200,
          byCondition: {
            easy: 100,
            hard: 100
          }
        },
        budget: {
          total: 200,
          rewardPerParticipant: 1.00
        },
        hitConfig: {
          title: 'Decision Making Study (15-20 minutes)',
          description: 'Participate in a psychology study about decision making. You will make choices about investment scenarios and answer brief questions.',
          keywords: ['psychology', 'decision making', 'survey', 'research'],
          reward: '$1.00',
          assignmentDuration: 3600,
          lifetime: 604800,
          maxAssignments: 1
        },
        researcher: {
          name: 'Research Team',
          email: 'researcher@example.com',
          institution: 'University'
        }
      });

      await defaultExperiment.save();
      experiments = [defaultExperiment];
    }

    res.json(experiments);

  } catch (error) {
    console.error('Dashboard experiments error:', error);
    res.status(500).json({ error: 'Failed to fetch experiments' });
  }
});

// Get detailed experiment statistics
router.get('/experiment/:experimentId/stats', async (req, res) => {
  try {
    const { experimentId } = req.params;

    // Get experiment control
    const experimentControl = await ExperimentControl.findOne({ experimentId });
    if (!experimentControl) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    // Get all responses
    const allResponses = await Response.find({ experimentId })
      .sort({ createdAt: -1 });

    // Get valid responses only
    const validResponses = allResponses.filter(r => !r.failed && r.attentionCheckPassed);

    // Calculate statistics by condition
    const statsByCondition = {};
    const conditions = ['easyFont_present', 'easyFont_absent', 'hardFont_present', 'hardFont_absent'];

    conditions.forEach(condition => {
      const [font, attribution] = condition.split('_');
      const fontCondition = font.replace('Font', '');
      
      const conditionResponses = validResponses.filter(r => 
        r.fontCondition === fontCondition && 
        r.attributionCondition === attribution
      );

      const choiceDistribution = {
        lottery1: { A: 0, B: 0 },
        lottery2: { C: 0, D: 0 },
        allaisPattern: {
          consistent_risk_averse: 0,
          consistent_risk_seeking: 0,
          allais_paradox: 0,
          other_pattern: 0
        }
      };

      conditionResponses.forEach(r => {
        choiceDistribution.lottery1[r.lottery1Choice]++;
        choiceDistribution.lottery2[r.lottery2Choice]++;
        choiceDistribution.allaisPattern[r.allaisPattern]++;
      });

      statsByCondition[condition] = {
        sampleSize: conditionResponses.length,
        choiceDistribution,
        averageCompletionTime: conditionResponses.length > 0 
          ? Math.round(conditionResponses.reduce((sum, r) => sum + r.completionTimeMs, 0) / conditionResponses.length / 1000)
          : 0
      };
    });

    // Calculate effect sizes
    const effectSizes = {};
    
    // Font condition effect (easy vs hard)
    const easyResponses = validResponses.filter(r => r.fontCondition === 'easy');
    const hardResponses = validResponses.filter(r => r.fontCondition === 'hard');
    
    if (easyResponses.length > 0 && hardResponses.length > 0) {
      const easyAllaisRate = easyResponses.filter(r => r.allaisPattern === 'allais_paradox').length / easyResponses.length;
      const hardAllaisRate = hardResponses.filter(r => r.allaisPattern === 'allais_paradox').length / hardResponses.length;
      
      effectSizes.fontEffect = {
        easyAllaisRate: (easyAllaisRate * 100).toFixed(1),
        hardAllaisRate: (hardAllaisRate * 100).toFixed(1),
        cohensH: calculateEffectSize(easyAllaisRate, hardAllaisRate),
        significance: performChiSquareTest(easyResponses, hardResponses, 'allais_paradox')
      };
    }

    // Attribution condition effect
    const presentResponses = validResponses.filter(r => r.attributionCondition === 'present');
    const absentResponses = validResponses.filter(r => r.attributionCondition === 'absent');
    
    if (presentResponses.length > 0 && absentResponses.length > 0) {
      const presentAllaisRate = presentResponses.filter(r => r.allaisPattern === 'allais_paradox').length / presentResponses.length;
      const absentAllaisRate = absentResponses.filter(r => r.allaisPattern === 'allais_paradox').length / absentResponses.length;
      
      effectSizes.attributionEffect = {
        presentAllaisRate: (presentAllaisRate * 100).toFixed(1),
        absentAllaisRate: (absentAllaisRate * 100).toFixed(1),
        cohensH: calculateEffectSize(presentAllaisRate, absentAllaisRate),
        significance: performChiSquareTest(presentResponses, absentResponses, 'allais_paradox')
      };
    }

    // Power analysis
    const currentN = validResponses.length;
    const targetN = experimentControl.targetSampleSize.total;
    const powerAnalysis = {
      currentN,
      targetN,
      currentPower: currentN > 10 ? calculatePower(currentN, 0.5) : 0,
      progressPercentage: Math.round((currentN / targetN) * 100)
    };

    // Financial summary
    const financialSummary = {
      budgetTotal: experimentControl.budget.total,
      budgetSpent: experimentControl.budget.spent,
      budgetRemaining: experimentControl.budget.total - experimentControl.budget.spent,
      estimatedCostPerParticipant: experimentControl.budget.rewardPerParticipant,
      projectedTotalCost: experimentControl.budget.rewardPerParticipant * targetN
    };

    // Quality metrics
    const qualityMetrics = {
      totalResponses: allResponses.length,
      validResponses: validResponses.length,
      failedResponses: allResponses.length - validResponses.length,
      attentionCheckFailures: allResponses.filter(r => !r.attentionCheckPassed).length,
      timeoutFailures: allResponses.filter(r => r.timeOutOfBounds).length,
      duplicateAttempts: 0 // Could be calculated by checking for duplicate workerIds
    };

    res.json({
      experimentControl,
      statsByCondition,
      effectSizes,
      powerAnalysis,
      financialSummary,
      qualityMetrics,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch experiment statistics' });
  }
});

// Get recent responses
router.get('/experiment/:experimentId/recent-responses', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const responses = await Response.find({ experimentId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('workerId assignmentId fontCondition attributionCondition lottery1Choice lottery2Choice allaisPattern attentionCheckPassed failed failureReasons completionTimeMs createdAt');

    res.json(responses);

  } catch (error) {
    console.error('Recent responses error:', error);
    res.status(500).json({ error: 'Failed to fetch recent responses' });
  }
});

// Export data for analysis
router.get('/experiment/:experimentId/export', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const format = req.query.format || 'json';

    const responses = await Response.find({ 
      experimentId,
      failed: false,
      attentionCheckPassed: true 
    }).sort({ createdAt: 1 });

    if (format === 'csv') {
      // Convert to CSV format
      const headers = [
        'workerId', 'assignmentId', 'fontCondition', 'attributionCondition',
        'lottery1Choice', 'lottery2Choice', 'allaisPattern', 
        'completionTimeMs', 'createdAt'
      ];

      const csvData = responses.map(r => [
        r.workerId, r.assignmentId, r.fontCondition, r.attributionCondition,
        r.lottery1Choice, r.lottery2Choice, r.allaisPattern,
        r.completionTimeMs, r.createdAt.toISOString()
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${experimentId}_data.csv`);
      res.send(csvContent);

    } else {
      // Return JSON format
      const cleanData = responses.map(r => ({
        workerId: r.workerId,
        assignmentId: r.assignmentId,
        fontCondition: r.fontCondition,
        attributionCondition: r.attributionCondition,
        lottery1Choice: r.lottery1Choice,
        lottery2Choice: r.lottery2Choice,
        allaisPattern: r.allaisPattern,
        completionTimeMinutes: Math.round(r.completionTimeMs / 60000),
        submissionDate: r.createdAt
      }));

      res.json({
        experimentId,
        exportDate: new Date().toISOString(),
        totalRecords: cleanData.length,
        data: cleanData
      });
    }

  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Update experiment status
router.patch('/experiment/:experimentId/status', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const { status } = req.body;

    if (!['draft', 'active', 'paused', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const experimentControl = await ExperimentControl.findOneAndUpdate(
      { experimentId },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!experimentControl) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    console.log(`Experiment ${experimentId} status updated to: ${status}`);

    res.json({
      success: true,
      experimentId,
      newStatus: status,
      experiment: experimentControl
    });

  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update experiment status' });
  }
});

// Create a new HIT for an experiment
router.post('/experiments/:experimentId/hits', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const { maxAssignments = 1, customTitle, customDescription } = req.body;

    console.log(`Creating HIT for experiment: ${experimentId}`);

    // List all experiments for debugging
    const allExperiments = await ExperimentControl.find({}, 'experimentId title');
    console.log('All experiments in database:', allExperiments.map(e => ({ id: e.experimentId, title: e.title })));

    // Get experiment control
    const experimentControl = await ExperimentControl.findOne({ experimentId });
    if (!experimentControl) {
      console.log(`Experiment not found: ${experimentId}`);
      console.log('Available experiments:', allExperiments.map(e => e.experimentId));
      return res.status(404).json({ 
        error: `Experiment '${experimentId}' not found`,
        availableExperiments: allExperiments.map(e => e.experimentId)
      });
    }

    console.log(`Found experiment: ${experimentControl.title}`);

    // For now, just return a mock HIT ID since AMT integration requires credentials
    const mockHitId = `MOCK_HIT_${Date.now()}`;
    
    // Add to active HITs
    experimentControl.activeHits.push({
      hitId: mockHitId,
      assignmentsRemaining: maxAssignments,
      status: 'assignable'
    });

    console.log(`Saving experiment with new HIT: ${mockHitId}`);
    await experimentControl.save();
    console.log(`HIT created successfully: ${mockHitId}`);

    res.json({
      success: true,
      hitId: mockHitId,
      message: 'Mock HIT created successfully. In production, this would create a real AMT HIT.',
      experimentUrl: `${req.protocol}://${req.get('host')}/?workerId=MOCK_WORKER&assignmentId=MOCK_ASSIGNMENT&hitId=${mockHitId}`
    });

  } catch (error) {
    console.error('HIT creation error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create HIT', 
      details: error.message 
    });
  }
});

export default router;