/**
 * Job Status Workflow Validation Middleware
 * Validates job status transitions and enforces business rules
 */

const { JOB_STATUSES, USER_ROLES } = require('../config/constants');
const { pool } = require('../database');
const { log } = require('../utils/logger');

/**
 * Valid status transitions map
 * Defines which status transitions are allowed
 */
const ALLOWED_TRANSITIONS = {
  [JOB_STATUSES.PENDING]: [
    JOB_STATUSES.IN_PROGRESS,
    JOB_STATUSES.CANCELLED,
    JOB_STATUSES.ON_HOLD
  ],
  [JOB_STATUSES.IN_PROGRESS]: [
    JOB_STATUSES.COMPLETED,
    JOB_STATUSES.ON_HOLD,
    JOB_STATUSES.CANCELLED,
    JOB_STATUSES.PENDING // Allow back to pending if needed
  ],
  [JOB_STATUSES.ON_HOLD]: [
    JOB_STATUSES.PENDING,
    JOB_STATUSES.IN_PROGRESS,
    JOB_STATUSES.CANCELLED
  ],
  [JOB_STATUSES.COMPLETED]: [
    JOB_STATUSES.IN_PROGRESS // Allow reopening if needed
  ],
  [JOB_STATUSES.CANCELLED]: [
    JOB_STATUSES.PENDING // Allow reactivation
  ]
};

/**
 * Role-based status transition restrictions
 * Defines which roles can perform which status changes
 */
const ROLE_RESTRICTIONS = {
  [USER_ROLES.TECHNICIAN]: {
    // Technicians can only update status of jobs assigned to them
    allowed_statuses: [
      JOB_STATUSES.IN_PROGRESS,
      JOB_STATUSES.COMPLETED,
      JOB_STATUSES.ON_HOLD
    ],
    forbidden_transitions: {
      // Technicians cannot cancel jobs - only managers/admin can
      [JOB_STATUSES.CANCELLED]: 'Only managers and administrators can cancel jobs'
    }
  },
  [USER_ROLES.DISPATCHER]: {
    allowed_statuses: Object.values(JOB_STATUSES),
    forbidden_transitions: {}
  },
  [USER_ROLES.MANAGER]: {
    allowed_statuses: Object.values(JOB_STATUSES),
    forbidden_transitions: {}
  },
  [USER_ROLES.ADMIN]: {
    allowed_statuses: Object.values(JOB_STATUSES),
    forbidden_transitions: {}
  }
};

/**
 * Enhanced workflow configuration
 */
const WORKFLOW_CONFIG = {
  // Statuses that require mandatory comments
  REQUIRES_COMMENT: [
    JOB_STATUSES.COMPLETED,
    JOB_STATUSES.CANCELLED,
    JOB_STATUSES.ON_HOLD
  ],
  
  // Statuses that trigger time tracking
  TIME_TRACKED_STATUSES: [
    JOB_STATUSES.IN_PROGRESS,
    JOB_STATUSES.COMPLETED,
    JOB_STATUSES.ON_HOLD
  ],
  
  // Statuses that require assignment
  REQUIRES_ASSIGNMENT: [
    JOB_STATUSES.IN_PROGRESS,
    JOB_STATUSES.COMPLETED
  ]
};

/**
 * Business rules for status transitions
 */
const BUSINESS_RULES = {
  /**
   * Check if a job can be moved to IN_PROGRESS
   */
  [JOB_STATUSES.IN_PROGRESS]: async (jobData, userId) => {
    // Job must be assigned to someone
    if (!jobData.assigned_to) {
      return {
        valid: false,
        message: 'Job must be assigned to a technician before it can be started'
      };
    }

    // Only assigned technician can start the job (unless user is admin/manager)
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    const userRole = userResult.rows[0]?.role;
    
    if (userRole === USER_ROLES.TECHNICIAN && jobData.assigned_to !== userId) {
      return {
        valid: false,
        message: 'Only the assigned technician can start this job'
      };
    }

    return { valid: true };
  },

  /**
   * Check if a job can be completed
   */
  [JOB_STATUSES.COMPLETED]: async (jobData, userId) => {
    // Job must be assigned and in progress (or on hold)
    if (!jobData.assigned_to) {
      return {
        valid: false,
        message: 'Job must be assigned before it can be completed'
      };
    }

    // Check if there are any pending requirements
    if (jobData.status === JOB_STATUSES.PENDING) {
      return {
        valid: false,
        message: 'Job must be started before it can be completed'
      };
    }

    return { valid: true };
  },

  /**
   * Check if a job can be cancelled
   */
  [JOB_STATUSES.CANCELLED]: async (jobData, userId) => {
    // Cannot cancel already completed jobs
    if (jobData.status === JOB_STATUSES.COMPLETED) {
      return {
        valid: false,
        message: 'Cannot cancel a completed job'
      };
    }

    return { valid: true };
  }
};

/**
 * Enhanced workflow validation with time tracking and mandatory comments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function validateJobWorkflow(req, res, next) {
  try {
    const jobId = req.params.id;
    const newStatus = req.body.status;
    const comment = req.body.comment;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Skip validation if no status change is requested
    if (!newStatus) {
      return next();
    }

    // Get current job data
    const jobResult = await pool.query(
      'SELECT * FROM jobs WHERE id = $1',
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const currentJob = jobResult.rows[0];
    const currentStatus = currentJob.status;

    // Skip if status is not changing
    if (currentStatus === newStatus) {
      return next();
    }

    // Check if transition is allowed
    const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
        allowed_transitions: allowedTransitions
      });
    }

    // Check role-based restrictions
    const roleRestrictions = ROLE_RESTRICTIONS[userRole] || {};
    
    // Check if user's role allows this status
    if (!roleRestrictions.allowed_statuses?.includes(newStatus)) {
      return res.status(403).json({
        success: false,
        error: `Your role (${userRole}) is not authorized to set jobs to '${newStatus}' status`
      });
    }

    // Check for specific forbidden transitions for this role
    const forbiddenMessage = roleRestrictions.forbidden_transitions?.[newStatus];
    if (forbiddenMessage) {
      return res.status(403).json({
        success: false,
        error: forbiddenMessage
      });
    }

    // Check for mandatory comment requirement
    if (WORKFLOW_CONFIG.REQUIRES_COMMENT.includes(newStatus) && !comment?.trim()) {
      return res.status(400).json({
        success: false,
        error: `A comment is required when changing status to '${newStatus}'`
      });
    }

    // Check for assignment requirement
    if (WORKFLOW_CONFIG.REQUIRES_ASSIGNMENT.includes(newStatus) && !currentJob.assigned_to) {
      return res.status(400).json({
        success: false,
        error: `Job must be assigned to a technician before changing status to '${newStatus}'`
      });
    }

    // Apply business rules
    const businessRule = BUSINESS_RULES[newStatus];
    if (businessRule) {
      const ruleResult = await businessRule(currentJob, userId);
      if (!ruleResult.valid) {
        return res.status(400).json({
          success: false,
          error: ruleResult.message
        });
      }
    }

    // Log the status change attempt
    log.info('Job status transition validated', {
      jobId,
      userId,
      userRole,
      fromStatus: currentStatus,
      toStatus: newStatus,
      assignedTo: currentJob.assigned_to
    });

    // Calculate time tracking data
    const now = new Date();
    const timeTrackingData = {};
    
    if (newStatus === JOB_STATUSES.IN_PROGRESS && currentStatus === JOB_STATUSES.PENDING) {
      timeTrackingData.started_at = now;
    }
    
    if (newStatus === JOB_STATUSES.COMPLETED) {
      timeTrackingData.completed_at = now;
      
      // Calculate actual duration if job was started
      if (currentJob.started_at) {
        const startTime = new Date(currentJob.started_at);
        timeTrackingData.actual_duration = Math.round((now - startTime) / (1000 * 60)); // minutes
      }
    }

    // Add workflow context to request for use in the job service
    req.workflowContext = {
      currentStatus,
      newStatus,
      comment,
      isStatusChange: true,
      validatedAt: now.toISOString(),
      timeTrackingData,
      requiresHistoryLog: true
    };

    next();
  } catch (error) {
    log.error('Job workflow validation error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during workflow validation'
    });
  }
}

/**
 * Validates job assignment changes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function validateJobAssignment(req, res, next) {
  try {
    const jobId = req.params.id;
    const newAssignedTo = req.body.assigned_to;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Skip validation if no assignment change is requested
    if (newAssignedTo === undefined) {
      return next();
    }

    // Get current job data
    const jobResult = await pool.query(
      'SELECT * FROM jobs WHERE id = $1',
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const currentJob = jobResult.rows[0];

    // Technicians cannot reassign jobs
    if (userRole === USER_ROLES.TECHNICIAN && currentJob.assigned_to !== newAssignedTo) {
      return res.status(403).json({
        success: false,
        error: 'Technicians cannot reassign jobs to other technicians'
      });
    }

    // If assigning to someone, verify they exist and are a technician
    if (newAssignedTo) {
      const assigneeResult = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [newAssignedTo]
      );

      if (assigneeResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Assigned user not found'
        });
      }

      const assigneeRole = assigneeResult.rows[0].role;
      if (assigneeRole !== USER_ROLES.TECHNICIAN) {
        return res.status(400).json({
          success: false,
          error: 'Jobs can only be assigned to technicians'
        });
      }
    }

    // Log the assignment change attempt
    log.info('Job assignment change validated', {
      jobId,
      userId,
      userRole,
      fromAssignee: currentJob.assigned_to,
      toAssignee: newAssignedTo
    });

    next();
  } catch (error) {
    log.error('Job assignment validation error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during assignment validation'
    });
  }
}

/**
 * Get available status transitions for a job
 * @param {string} currentStatus - Current job status
 * @param {string} userRole - User's role
 * @returns {Array} Array of available status transitions
 */
function getAvailableTransitions(currentStatus, userRole) {
  const baseTransitions = ALLOWED_TRANSITIONS[currentStatus] || [];
  const roleRestrictions = ROLE_RESTRICTIONS[userRole] || {};
  
  return baseTransitions.filter(status => {
    // Check if role allows this status
    if (!roleRestrictions.allowed_statuses?.includes(status)) {
      return false;
    }
    
    // Check if there are specific restrictions
    return !roleRestrictions.forbidden_transitions?.[status];
  });
}

/**
 * Log status change to history table
 * @param {number} jobId - Job ID
 * @param {string} fromStatus - Previous status
 * @param {string} toStatus - New status
 * @param {number} userId - User making the change
 * @param {string} comment - Optional comment
 * @param {number} durationInStatus - Time spent in previous status (minutes)
 */
async function logStatusChange(jobId, fromStatus, toStatus, userId, comment = null, durationInStatus = null) {
  try {
    await pool.query(`
      INSERT INTO job_status_history 
      (job_id, from_status, to_status, changed_by, comment, duration_in_status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [jobId, fromStatus, toStatus, userId, comment, durationInStatus]);
    
    log.info('Status change logged to history', {
      jobId,
      fromStatus,
      toStatus,
      userId,
      durationInStatus
    });
  } catch (error) {
    log.error('Failed to log status change', { error, jobId, fromStatus, toStatus });
  }
}

/**
 * Get workflow analytics for a job
 * @param {number} jobId - Job ID
 * @returns {Object} Workflow analytics data
 */
async function getJobWorkflowAnalytics(jobId) {
  try {
    const historyResult = await pool.query(`
      SELECT 
        from_status,
        to_status,
        duration_in_status,
        changed_at,
        changed_by,
        u.name as changed_by_name
      FROM job_status_history jsh
      LEFT JOIN users u ON jsh.changed_by = u.id
      WHERE job_id = $1
      ORDER BY changed_at ASC
    `, [jobId]);
    
    const jobResult = await pool.query(`
      SELECT 
        status,
        estimated_duration,
        actual_duration,
        started_at,
        completed_at,
        created_at
      FROM jobs
      WHERE id = $1
    `, [jobId]);
    
    if (jobResult.rows.length === 0) {
      return { success: false, error: 'Job not found' };
    }
    
    const job = jobResult.rows[0];
    const history = historyResult.rows;
    
    // Calculate analytics
    const totalTimeInStatuses = history.reduce((sum, entry) => 
      sum + (entry.duration_in_status || 0), 0
    );
    
    const statusBreakdown = history.reduce((breakdown, entry) => {
      if (entry.from_status) {
        breakdown[entry.from_status] = (breakdown[entry.from_status] || 0) + (entry.duration_in_status || 0);
      }
      return breakdown;
    }, {});
    
    return {
      success: true,
      data: {
        currentStatus: job.status,
        estimatedDuration: job.estimated_duration,
        actualDuration: job.actual_duration,
        totalTimeTracked: totalTimeInStatuses,
        statusBreakdown,
        statusHistory: history,
        timeline: {
          created: job.created_at,
          started: job.started_at,
          completed: job.completed_at
        }
      }
    };
  } catch (error) {
    log.error('Failed to get workflow analytics', { error, jobId });
    return { success: false, error: 'Failed to retrieve analytics' };
  }
}

/**
 * Get workflow rules from database
 * @param {string} fromStatus - Source status (optional)
 * @param {string} toStatus - Target status
 * @returns {Object} Workflow rules
 */
async function getWorkflowRules(fromStatus = null, toStatus) {
  try {
    const result = await pool.query(`
      SELECT * FROM workflow_rules 
      WHERE (from_status = $1 OR from_status IS NULL) 
      AND to_status = $2 
      AND is_active = true
    `, [fromStatus, toStatus]);
    
    return result.rows;
  } catch (error) {
    log.error('Failed to get workflow rules', { error, fromStatus, toStatus });
    return [];
  }
}

module.exports = {
  validateJobWorkflow,
  validateJobAssignment,
  getAvailableTransitions,
  logStatusChange,
  getJobWorkflowAnalytics,
  getWorkflowRules,
  ALLOWED_TRANSITIONS,
  ROLE_RESTRICTIONS,
  BUSINESS_RULES,
  WORKFLOW_CONFIG
};