import express from 'express';
import { body, validationResult } from 'express-validator';
import { MTurkClient } from '@aws-sdk/client-mturk';
import ExperimentControl from '../models/ExperimentControl.js';
import Response from '../models/Response.js';
import { createHIT, approveAssignment, rejectAssignment, getHITStatus } from '../services/amtService.js';

const router = express.Router();

// Create HIT
router.post('/create-hit', [
  body('experimentId').trim().notEmpty().withMessage('Experiment ID is required'),
  body('maxAssignments').isInt({ min: 1 }).withMessage('Max assignments must be a positive integer'),
  body('reward').isDecimal({ decimal_digits: '0,2' }).withMessage('Reward must be a valid amount')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { experimentId, maxAssignments, reward, customTitle, customDescription } = req.body;

    // Get experiment configuration
    const experimentControl = await ExperimentControl.findOne({ experimentId });
    if (!experimentControl) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    if (experimentControl.status !== 'active') {
      return res.status(400).json({ error: 'Experiment is not active' });
    }

    // Check budget
    const estimatedCost = parseFloat(reward) * maxAssignments * 1.4; // Include AMT fees
    if (experimentControl.budget.spent + estimatedCost > experimentControl.budget.total) {
      return res.status(400).json({ error: 'Insufficient budget for this HIT' });
    }

    // Prepare HIT configuration
    const hitConfig = {
      title: customTitle || experimentControl.hitConfig.title || experimentControl.title,
      description: customDescription || experimentControl.hitConfig.description || experimentControl.description,
      reward: reward || experimentControl.hitConfig.reward,
      maxAssignments,
      assignmentDuration: experimentControl.hitConfig.assignmentDuration,
      lifetime: experimentControl.hitConfig.lifetime,
      keywords: experimentControl.hitConfig.keywords,
      externalURL: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?experiment=${experimentId}`
    };

    // Create HIT using AMT service
    const hitResult = await createHIT(hitConfig);

    // Update experiment control with new HIT
    experimentControl.activeHits.push({
      hitId: hitResult.HIT.HITId,
      assignmentsRemaining: maxAssignments,
      status: 'assignable'
    });

    // Update estimated spending
    experimentControl.budget.estimatedFees += estimatedCost;
    await experimentControl.save();

    console.log(`HIT created: ${hitResult.HIT.HITId} for experiment ${experimentId}`);

    res.json({
      success: true,
      hitId: hitResult.HIT.HITId,
      hitTypeId: hitResult.HIT.HITTypeId,
      hitStatus: hitResult.HIT.HITStatus,
      externalURL: hitConfig.externalURL,
      estimatedCost
    });

  } catch (error) {
    console.error('HIT creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create HIT',
      message: error.message 
    });
  }
});

// Get HIT status
router.get('/hit-status/:hitId', async (req, res) => {
  try {
    const { hitId } = req.params;

    const hitStatus = await getHITStatus(hitId);

    res.json({
      hitId,
      status: hitStatus.HIT.HITStatus,
      assignmentsAvailable: hitStatus.HIT.NumberOfAssignmentsAvailable,
      assignmentsPending: hitStatus.HIT.NumberOfAssignmentsPending,
      assignmentsCompleted: hitStatus.HIT.NumberOfAssignmentsCompleted,
      creationTime: hitStatus.HIT.CreationTime,
      expiration: hitStatus.HIT.Expiration,
      reward: hitStatus.HIT.Reward
    });

  } catch (error) {
    console.error('HIT status error:', error);
    res.status(500).json({ 
      error: 'Failed to get HIT status',
      message: error.message 
    });
  }
});

// List assignments for a HIT
router.get('/hit/:hitId/assignments', async (req, res) => {
  try {
    const { hitId } = req.params;

    const mturk = new MTurkClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.NODE_ENV === 'production' 
        ? process.env.MTURK_ENDPOINT_PRODUCTION 
        : process.env.MTURK_ENDPOINT_SANDBOX,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const result = await mturk.listAssignmentsForHIT({ HITId: hitId });

    res.json({
      hitId,
      assignments: result.Assignments.map(assignment => ({
        assignmentId: assignment.AssignmentId,
        workerId: assignment.WorkerId,
        status: assignment.AssignmentStatus,
        submitTime: assignment.SubmitTime,
        acceptTime: assignment.AcceptTime,
        answer: assignment.Answer
      }))
    });

  } catch (error) {
    console.error('Assignments list error:', error);
    res.status(500).json({ 
      error: 'Failed to list assignments',
      message: error.message 
    });
  }
});

// Approve assignment
router.post('/approve-assignment', [
  body('assignmentId').trim().notEmpty().withMessage('Assignment ID is required'),
  body('feedback').optional().isLength({ max: 1024 }).withMessage('Feedback too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { assignmentId, feedback } = req.body;

    // Check if we have a response record for this assignment
    const response = await Response.findOne({ assignmentId });
    if (!response) {
      return res.status(404).json({ 
        error: 'No response found for this assignment' 
      });
    }

    // Only approve if response passed quality checks
    if (response.failed) {
      return res.status(400).json({ 
        error: 'Cannot approve failed response',
        failureReasons: response.failureReasons 
      });
    }

    await approveAssignment(assignmentId, feedback || 'Thank you for your participation!');

    console.log(`Assignment approved: ${assignmentId}`);

    res.json({
      success: true,
      assignmentId,
      message: 'Assignment approved successfully'
    });

  } catch (error) {
    console.error('Assignment approval error:', error);
    res.status(500).json({ 
      error: 'Failed to approve assignment',
      message: error.message 
    });
  }
});

// Reject assignment
router.post('/reject-assignment', [
  body('assignmentId').trim().notEmpty().withMessage('Assignment ID is required'),
  body('reason').trim().notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { assignmentId, reason } = req.body;

    await rejectAssignment(assignmentId, reason);

    console.log(`Assignment rejected: ${assignmentId} - Reason: ${reason}`);

    res.json({
      success: true,
      assignmentId,
      message: 'Assignment rejected successfully'
    });

  } catch (error) {
    console.error('Assignment rejection error:', error);
    res.status(500).json({ 
      error: 'Failed to reject assignment',
      message: error.message 
    });
  }
});

// Bulk approve assignments
router.post('/bulk-approve', [
  body('assignmentIds').isArray({ min: 1 }).withMessage('Assignment IDs array is required'),
  body('feedback').optional().isLength({ max: 1024 }).withMessage('Feedback too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { assignmentIds, feedback } = req.body;
    const results = [];

    for (const assignmentId of assignmentIds) {
      try {
        // Check response quality
        const response = await Response.findOne({ assignmentId });
        if (!response || response.failed) {
          results.push({
            assignmentId,
            success: false,
            reason: response ? 'Failed quality checks' : 'No response found'
          });
          continue;
        }

        await approveAssignment(assignmentId, feedback || 'Thank you for your participation!');
        results.push({
          assignmentId,
          success: true
        });

      } catch (error) {
        results.push({
          assignmentId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    console.log(`Bulk approval completed: ${successCount}/${assignmentIds.length} successful`);

    res.json({
      success: true,
      results,
      summary: {
        total: assignmentIds.length,
        approved: successCount,
        failed: assignmentIds.length - successCount
      }
    });

  } catch (error) {
    console.error('Bulk approval error:', error);
    res.status(500).json({ 
      error: 'Bulk approval failed',
      message: error.message 
    });
  }
});

export default router;