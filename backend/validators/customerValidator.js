const { body, param, query } = require("express-validator");

/**
 * Validation schema for creating a new customer
 */
const validateCreateCustomer = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Customer name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Customer name must be between 1 and 255 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Email must be a valid email address"),

  body("phone")
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Phone number must be a valid international phone number"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Address must not exceed 1000 characters"),
];

/**
 * Validation schema for updating an existing customer
 */
const validateUpdateCustomer = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Customer ID must be a positive integer"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Customer name cannot be empty")
    .isLength({ min: 1, max: 255 })
    .withMessage("Customer name must be between 1 and 255 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Email must be a valid email address"),

  body("phone")
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Phone number must be a valid international phone number"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Address must not exceed 1000 characters"),
];

/**
 * Validation schema for customer ID parameter
 */
const validateCustomerId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Customer ID must be a positive integer"),
];

/**
 * Validation schema for customer search
 */
const validateCustomerSearch = [
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be a non-negative integer"),
];

/**
 * Validation schema for customer geocoding
 */
const validateCustomerGeocoding = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Customer ID must be a positive integer"),
];

/**
 * Validation schema for bulk customer operations
 */
const validateBulkCustomerOperation = [
  body("customer_ids")
    .isArray({ min: 1 })
    .withMessage("At least one customer ID is required"),

  body("customer_ids.*")
    .isInt({ min: 1 })
    .withMessage("All customer IDs must be positive integers"),
];

module.exports = {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCustomerId,
  validateCustomerSearch,
  validateCustomerGeocoding,
  validateBulkCustomerOperation,
};
