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
 * Validates job status workflow transitions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function validateJobWorkflow(req, res, next) {
  try {
    const jobId = req.params.id;
    const newStatus = req.body.status;
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

    // Add workflow context to request for use in the job service
    req.workflowContext = {
      currentStatus,
      newStatus,
      isStatusChange: true,
      validatedAt: new Date().toISOString()
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

module.exports = {
  validateJobWorkflow,
  validateJobAssignment,
  getAvailableTransitions,
  ALLOWED_TRANSITIONS,
  ROLE_RESTRICTIONS,
  BUSINESS_RULES
};