const { body, param, query } = require("express-validator");
const { JOB_STATUSES, VALIDATION } = require("../config/constants");

/**
 * Validation schema for creating a new job
 */
const validateCreateJob = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Job title is required")
    .isLength({
      min: VALIDATION.JOB_TITLE_MIN_LENGTH,
      max: VALIDATION.JOB_TITLE_MAX_LENGTH,
    })
    .withMessage(
      `Job title must be between ${VALIDATION.JOB_TITLE_MIN_LENGTH} and ${VALIDATION.JOB_TITLE_MAX_LENGTH} characters`
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: VALIDATION.JOB_DESCRIPTION_MAX_LENGTH })
    .withMessage(
      `Description must not exceed ${VALIDATION.JOB_DESCRIPTION_MAX_LENGTH} characters`
    ),

  body("customer_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Customer ID must be a positive integer"),

  body("assigned_to")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Assigned user ID must be a positive integer"),

  body("status")
    .optional()
    .isIn(Object.values(JOB_STATUSES))
    .withMessage(
      `Status must be one of: ${Object.values(JOB_STATUSES).join(", ")}`
    ),

  body("scheduled_date")
    .optional()
    .isISO8601()
    .withMessage("Scheduled date must be a valid date (YYYY-MM-DD)"),

  body("scheduled_time")
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Scheduled time must be in HH:MM format"),

  body("estimated_duration")
    .optional()
    .isInt({
      min: VALIDATION.JOB_ESTIMATED_DURATION_MIN,
      max: VALIDATION.JOB_ESTIMATED_DURATION_MAX,
    })
    .withMessage(
      `Estimated duration must be between ${VALIDATION.JOB_ESTIMATED_DURATION_MIN} and ${VALIDATION.JOB_ESTIMATED_DURATION_MAX} minutes`
    ),
];

/**
 * Validation schema for updating an existing job
 */
const validateUpdateJob = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Job ID must be a positive integer"),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Job title cannot be empty")
    .isLength({
      min: VALIDATION.JOB_TITLE_MIN_LENGTH,
      max: VALIDATION.JOB_TITLE_MAX_LENGTH,
    })
    .withMessage(
      `Job title must be between ${VALIDATION.JOB_TITLE_MIN_LENGTH} and ${VALIDATION.JOB_TITLE_MAX_LENGTH} characters`
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: VALIDATION.JOB_DESCRIPTION_MAX_LENGTH })
    .withMessage(
      `Description must not exceed ${VALIDATION.JOB_DESCRIPTION_MAX_LENGTH} characters`
    ),

  body("customer_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Customer ID must be a positive integer"),

  body("assigned_to")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Assigned user ID must be a positive integer"),

  body("status")
    .optional()
    .isIn(Object.values(JOB_STATUSES))
    .withMessage(
      `Status must be one of: ${Object.values(JOB_STATUSES).join(", ")}`
    ),

  body("scheduled_date")
    .optional()
    .isISO8601()
    .withMessage("Scheduled date must be a valid date (YYYY-MM-DD)"),

  body("scheduled_time")
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Scheduled time must be in HH:MM format"),

  body("estimated_duration")
    .optional()
    .isInt({
      min: VALIDATION.JOB_ESTIMATED_DURATION_MIN,
      max: VALIDATION.JOB_ESTIMATED_DURATION_MAX,
    })
    .withMessage(
      `Estimated duration must be between ${VALIDATION.JOB_ESTIMATED_DURATION_MIN} and ${VALIDATION.JOB_ESTIMATED_DURATION_MAX} minutes`
    ),
];

/**
 * Validation schema for job status updates
 */
const validateJobStatus = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Job ID must be a positive integer"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(Object.values(JOB_STATUSES))
    .withMessage(
      `Status must be one of: ${Object.values(JOB_STATUSES).join(", ")}`
    ),
];

/**
 * Validation schema for job ID parameter
 */
const validateJobId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Job ID must be a positive integer"),
];

/**
 * Validation schema for job updates/comments
 */
const validateJobUpdate = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Job ID must be a positive integer"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Update content is required")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Update content must be between 1 and 2000 characters"),

  body("update_type")
    .optional()
    .isIn(["comment", "status_update", "location_update", "photo", "document"])
    .withMessage(
      "Update type must be one of: comment, status_update, location_update, photo, document"
    ),
];

/**
 * Validation schema for route optimization
 */
const validateRouteOptimization = [
  body("job_ids")
    .isArray({ min: 2 })
    .withMessage("At least 2 job IDs are required for route optimization"),

  body("job_ids.*")
    .isInt({ min: 1 })
    .withMessage("All job IDs must be positive integers"),

  body("start_location")
    .optional()
    .isObject()
    .withMessage("Start location must be an object"),

  body("start_location.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Start location latitude must be between -90 and 90"),

  body("start_location.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Start location longitude must be between -180 and 180"),

  body("end_location")
    .optional()
    .isObject()
    .withMessage("End location must be an object"),

  body("end_location.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("End location latitude must be between -90 and 90"),

  body("end_location.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("End location longitude must be between -180 and 180"),
];

/**
 * Validation schema for ETA calculation
 */
const validateEtaCalculation = [
  body("origin").isObject().withMessage("Origin location is required"),

  body("origin.latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Origin latitude must be between -90 and 90"),

  body("origin.longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Origin longitude must be between -180 and 180"),

  body("destination")
    .isObject()
    .withMessage("Destination location is required"),

  body("destination.latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Destination latitude must be between -90 and 90"),

  body("destination.longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Destination longitude must be between -180 and 180"),

  body("departure_time")
    .optional()
    .isISO8601()
    .withMessage("Departure time must be a valid ISO 8601 date"),
];

module.exports = {
  validateCreateJob,
  validateUpdateJob,
  validateJobStatus,
  validateJobId,
  validateJobUpdate,
  validateRouteOptimization,
  validateEtaCalculation,
};
