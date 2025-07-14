import { MTurkClient, CreateHITCommand, ApproveAssignmentCommand, RejectAssignmentCommand, GetHITCommand } from '@aws-sdk/client-mturk';

// Initialize MTurk client
const createMTurkClient = () => {
  return new MTurkClient({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.NODE_ENV === 'production' 
      ? process.env.MTURK_ENDPOINT_PRODUCTION 
      : process.env.MTURK_ENDPOINT_SANDBOX,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AMT_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.AMT_SECRET_ACCESS_KEY
    }
  });
};

// Create a new HIT
export const createHIT = async (hitConfig) => {
  try {
    const mturk = createMTurkClient();
    
    const params = {
      Title: hitConfig.title,
      Description: hitConfig.description,
      Reward: hitConfig.reward,
      MaxAssignments: hitConfig.maxAssignments,
      AssignmentDurationInSeconds: hitConfig.assignmentDuration || 3600,
      LifetimeInSeconds: hitConfig.lifetime || 604800,
      Keywords: hitConfig.keywords ? hitConfig.keywords.join(', ') : 'psychology, decision making, research',
      Question: `
        <ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd">
          <ExternalURL>${hitConfig.externalURL}</ExternalURL>
          <FrameHeight>600</FrameHeight>
        </ExternalQuestion>
      `,
      QualificationRequirements: [
        {
          QualificationTypeId: '00000000000000000071', // US Locale
          Comparator: 'EqualTo',
          LocaleValues: [{ Country: 'US' }]
        },
        {
          QualificationTypeId: '000000000000000000L0', // Approval Rate
          Comparator: 'GreaterThanOrEqualTo',
          IntegerValues: [95]
        },
        {
          QualificationTypeId: '00000000000000000040', // Number of HITs Approved
          Comparator: 'GreaterThanOrEqualTo',
          IntegerValues: [100]
        }
      ],
      AutoApprovalDelayInSeconds: 259200 // 3 days
    };
    
    const command = new CreateHITCommand(params);
    const response = await mturk.send(command);
    
    // Generate sandbox preview URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://worker.mturk.com'
      : 'https://workersandbox.mturk.com';
    const previewUrl = `${baseUrl}/mturk/preview?groupId=${response.HIT.HITTypeId}`;
    
    return {
      success: true,
      hitId: response.HIT.HITId,
      hitTypeId: response.HIT.HITTypeId,
      previewUrl: previewUrl,
      status: response.HIT.HITStatus
    };
  } catch (error) {
    console.error('Error creating HIT:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Approve an assignment
export const approveAssignment = async (assignmentId, feedback = 'Thank you for your participation!') => {
  const mturk = createMTurkClient();
  
  const params = {
    AssignmentId: assignmentId,
    RequesterFeedback: feedback
  };
  
  const command = new ApproveAssignmentCommand(params);
  return await mturk.send(command);
};

// Reject an assignment
export const rejectAssignment = async (assignmentId, feedback) => {
  const mturk = createMTurkClient();
  
  const params = {
    AssignmentId: assignmentId,
    RequesterFeedback: feedback
  };
  
  const command = new RejectAssignmentCommand(params);
  return await mturk.send(command);
};

// Get HIT status
export const getHITStatus = async (hitId) => {
  const mturk = createMTurkClient();
  
  const params = {
    HITId: hitId
  };
  
  const command = new GetHITCommand(params);
  return await mturk.send(command);
};

// Get account balance
export const getAccountBalance = async () => {
  const mturk = createMTurkClient();
  
  try {
    const result = await mturk.getAccountBalance();
    return result.AvailableBalance;
  } catch (error) {
    console.error('Error getting account balance:', error);
    throw error;
  }
};

// List all HITs
export const listHITs = async (maxResults = 100) => {
  const mturk = createMTurkClient();
  
  try {
    const result = await mturk.listHITs({
      MaxResults: maxResults
    });
    return result.HITs;
  } catch (error) {
    console.error('Error listing HITs:', error);
    throw error;
  }
};

// List assignments for a HIT
export const listAssignmentsForHIT = async (hitId) => {
  const mturk = createMTurkClient();
  
  try {
    const result = await mturk.listAssignmentsForHIT({
      HITId: hitId
    });
    return result.Assignments;
  } catch (error) {
    console.error('Error listing assignments:', error);
    throw error;
  }
};

// Delete a HIT (if no assignments)
export const deleteHIT = async (hitId) => {
  const mturk = createMTurkClient();
  
  try {
    const result = await mturk.deleteHIT({
      HITId: hitId
    });
    return result;
  } catch (error) {
    console.error('Error deleting HIT:', error);
    throw error;
  }
};

// Expire a HIT (stop accepting new assignments)
export const expireHIT = async (hitId) => {
  const mturk = createMTurkClient();
  
  try {
    const result = await mturk.updateExpirationForHIT({
      HITId: hitId,
      ExpireAt: new Date() // Expire immediately
    });
    return result;
  } catch (error) {
    console.error('Error expiring HIT:', error);
    throw error;
  }
};

// Send bonus to worker
export const sendBonus = async (workerId, assignmentId, bonusAmount, reason) => {
  const mturk = createMTurkClient();
  
  try {
    const result = await mturk.sendBonus({
      WorkerId: workerId,
      AssignmentId: assignmentId,
      BonusAmount: bonusAmount,
      Reason: reason
    });
    return result;
  } catch (error) {
    console.error('Error sending bonus:', error);
    throw error;
  }
};

// Get worker information
export const getWorker = async (workerId) => {
  const mturk = createMTurkClient();
  
  try {
    const result = await mturk.getWorker({
      WorkerId: workerId
    });
    return result.Worker;
  } catch (error) {
    console.error('Error getting worker info:', error);
    throw error;
  }
};