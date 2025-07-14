import express from 'express';
import { body, validationResult } from 'express-validator';
import Response from '../models/Response.js';
import ExperimentControl from '../models/ExperimentControl.js';
import { generateCompletionCode } from '../services/utils.js';
import { validateAttentionCheck, validateCompletionTime } from '../services/validation.js';

const router = express.Router();

// Test endpoint to verify API connectivity
router.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Experiment API is working', timestamp: new Date().toISOString() });
});

// Get client IP address
router.get('/get-ip', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.connection.socket ? req.connection.socket.remoteAddress : null);
  
  res.json({ ip: ip || 'unknown' });
});

// Validation middleware for experiment submission
const validateSubmission = [
  body('workerId').trim().notEmpty().withMessage('Worker ID is required'),
  body('assignmentId').trim().notEmpty().withMessage('Assignment ID is required'),
  body('hitId').trim().notEmpty().withMessage('HIT ID is required'),
  body('fontCondition').isIn(['easy', 'hard']).withMessage('Invalid font condition'),
  body('responses.lottery1').isIn(['A', 'B']).withMessage('Invalid lottery 1 choice'),
  body('responses.lottery2').isIn(['C', 'D']).withMessage('Invalid lottery 2 choice'),
  body('responses.math').isNumeric().withMessage('Math answer must be numeric'),
  body('timing.startTime').isISO8601().withMessage('Invalid start time'),
  body('timing.endTime').isISO8601().withMessage('Invalid end time'),
  body('timing.durationMs').isNumeric().withMessage('Duration must be numeric'),
];

// Submit experiment data
router.post('/submit', validateSubmission, async (req, res) => {
  try {
    console.log('Received submission data:', JSON.stringify(req.body, null, 2));
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const {
      workerId,
      assignmentId,
      hitId,
      fontCondition,
      responses,
      timing,
      browserInfo,
      experimentId = 'allais-fluency-v1'
    } = req.body;

    // Check for duplicate submission
    const existing = await Response.findOne({ workerId, assignmentId });
    if (existing) {
      return res.status(409).json({ 
        error: 'Duplicate submission detected',
        completionCode: existing.completionCode 
      });
    }

    // Quality control checks
    console.log('Math response:', responses.math, 'Type:', typeof responses.math);
    const attentionPassed = validateAttentionCheck(parseInt(responses.math));
    console.log('Attention check result:', attentionPassed);
    
    const timeValidation = validateCompletionTime(timing.durationMs);
    console.log('Time validation:', timeValidation);
    
    const failed = !attentionPassed || !timeValidation.isValid;
    const failureReasons = [];
    
    if (!attentionPassed) failureReasons.push('attention_check');
    if (!timeValidation.isValid) {
      failureReasons.push(...timeValidation.reasons);
    }
    
    console.log('Final failure assessment:', { failed, failureReasons, attentionPassed, timeValid: timeValidation.isValid });

    // Generate completion code
    const completionCode = generateCompletionCode();

    // Create response record
    const response = new Response({
      workerId: workerId.trim(),
      assignmentId: assignmentId.trim(),
      hitId: hitId.trim(),
      fontCondition,
      attributionCondition: 'absent', // Default since we removed attribution
      lottery1Choice: responses.lottery1,
      lottery2Choice: responses.lottery2,
      additionalResponses: {
        weather: responses.weather,
        brand: responses.brand,
        age: responses.age,
        gender: responses.gender,
        education: responses.education
      },
      attentionCheckAnswer: parseInt(responses.math),
      attentionCheckPassed: attentionPassed,
      startTime: new Date(timing.startTime),
      endTime: new Date(timing.endTime),
      completionTimeMs: timing.durationMs,
      timeOutOfBounds: !timeValidation.isValid && timeValidation.reasons.includes('time_limit'),
      completionCode,
      ipAddress: req.clientIP,
      browserInfo: {
        userAgent: req.get('User-Agent'),
        language: browserInfo?.language || 'unknown',
        platform: browserInfo?.platform || 'unknown',
        screenResolution: browserInfo?.screenResolution || 'unknown',
        timezone: browserInfo?.timezone || 'unknown'
      },
      failed,
      failureReasons,
      experimentVersion: '1.0.0'
    });

    // Save response
    await response.save();

    // Update experiment control statistics
    try {
      const experimentControl = await ExperimentControl.findOne({ experimentId });
      if (experimentControl) {
        await experimentControl.updateSampleCounts();
      }
    } catch (error) {
      console.error('Error updating experiment control:', error);
      // Don't fail the response submission if control update fails
    }

    // Log submission for monitoring
    console.log(`Submission received: ${workerId} - ${assignmentId} - ${failed ? 'FAILED' : 'SUCCESS'}`);

    res.json({
      success: true,
      completionCode,
      failed,
      failureReasons,
      message: failed 
        ? 'Submission received but did not meet quality requirements'
        : 'Thank you for your participation!'
    });

  } catch (error) {
    console.error('Submission error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Please try again. If the problem persists, contact support.',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
});

// Get experiment configuration
router.get('/config/:experimentId?', async (req, res) => {
  try {
    const experimentId = req.params.experimentId || 'allais-fluency-v1';
    
    const experimentControl = await ExperimentControl.findOne({ 
      experimentId,
      status: 'active'
    });

    if (!experimentControl) {
      return res.status(404).json({ error: 'Experiment not found or not active' });
    }

    res.json({
      experimentId: experimentControl.experimentId,
      title: experimentControl.title,
      description: experimentControl.description,
      version: experimentControl.version,
      qualityControls: experimentControl.qualityControls,
      timeLimit: experimentControl.qualityControls.timeLimit,
      attentionCheckRequired: experimentControl.qualityControls.attentionCheckRequired
    });

  } catch (error) {
    console.error('Config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if worker has already participated
router.get('/check-participation/:workerId/:experimentId?', async (req, res) => {
  try {
    const { workerId } = req.params;
    const experimentId = req.params.experimentId || 'allais-fluency-v1';

    const existingResponse = await Response.findOne({ 
      workerId: workerId.trim(),
      // Don't filter by experimentId in case we want to prevent cross-experiment participation
    });

    res.json({
      hasParticipated: !!existingResponse,
      participationDate: existingResponse?.createdAt,
      completionCode: existingResponse?.completionCode
    });

  } catch (error) {
    console.error('Participation check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get completion code (for workers who lost their code)
router.post('/get-completion-code', [
  body('workerId').trim().notEmpty().withMessage('Worker ID is required'),
  body('assignmentId').trim().notEmpty().withMessage('Assignment ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { workerId, assignmentId } = req.body;

    const response = await Response.findOne({ 
      workerId: workerId.trim(), 
      assignmentId: assignmentId.trim() 
    });

    if (!response) {
      return res.status(404).json({ 
        error: 'No submission found for this worker and assignment' 
      });
    }

    res.json({
      completionCode: response.completionCode,
      submissionDate: response.createdAt,
      failed: response.failed,
      failureReasons: response.failureReasons
    });

  } catch (error) {
    console.error('Completion code retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;