const { validationResult } = require("express-validator");
const { validationErrorResponse } = require("../utils/apiResponse");

/**
 * Middleware to handle validation errors from express-validator
 * This should be used after validation schemas in route definitions
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(validationErrorResponse(errors.array()));
  }

  next();
};

/**
 * Custom validation middleware for specific business logic
 * Can be extended for complex validation scenarios
 */
const validateBusinessRules = (req, res, next) => {
  // Add any custom business logic validation here
  // For example, checking if a customer exists before creating a job

  next();
};

/**
 * Sanitize and normalize request data
 * This middleware can be used to clean up request data before processing
 */
const sanitizeRequest = (req, res, next) => {
  // Trim whitespace from string fields
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  next();
};

module.exports = {
  handleValidationErrors,
  validateBusinessRules,
  sanitizeRequest,
};
