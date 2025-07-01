const { body, param, query } = require("express-validator");
const { VALIDATION } = require("../config/constants");

/**
 * Validation schema for creating a new customer
 */
const validateCreateCustomer = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Customer name is required")
    .isLength({
      min: VALIDATION.CUSTOMER_NAME_MIN_LENGTH,
      max: VALIDATION.CUSTOMER_NAME_MAX_LENGTH,
    })
    .withMessage(
      `Customer name must be between ${VALIDATION.CUSTOMER_NAME_MIN_LENGTH} and ${VALIDATION.CUSTOMER_NAME_MAX_LENGTH} characters`
    ),

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
    .isLength({ max: VALIDATION.CUSTOMER_ADDRESS_MAX_LENGTH })
    .withMessage(
      `Address must not exceed ${VALIDATION.CUSTOMER_ADDRESS_MAX_LENGTH} characters`
    ),
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
    .isLength({
      min: VALIDATION.CUSTOMER_NAME_MIN_LENGTH,
      max: VALIDATION.CUSTOMER_NAME_MAX_LENGTH,
    })
    .withMessage(
      `Customer name must be between ${VALIDATION.CUSTOMER_NAME_MIN_LENGTH} and ${VALIDATION.CUSTOMER_NAME_MAX_LENGTH} characters`
    ),

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
    .isLength({ max: VALIDATION.CUSTOMER_ADDRESS_MAX_LENGTH })
    .withMessage(
      `Address must not exceed ${VALIDATION.CUSTOMER_ADDRESS_MAX_LENGTH} characters`
    ),
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
    .isLength({
      min: VALIDATION.SEARCH_MIN_LENGTH,
      max: VALIDATION.SEARCH_MAX_LENGTH,
    })
    .withMessage(
      `Search term must be between ${VALIDATION.SEARCH_MIN_LENGTH} and ${VALIDATION.SEARCH_MAX_LENGTH} characters`
    ),

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
