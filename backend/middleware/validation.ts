import { Request, Response, NextFunction } from "express";
import { body, validationResult, ValidationChain } from "express-validator";

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

interface ValidationErrorResponse {
  message: string;
  errors: ValidationError[];
}

const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ValidationErrorResponse = {
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.type === "field" ? error.path : "unknown",
        message: error.msg,
        value: error.type === "field" ? error.value : undefined,
      })),
    };

    res.status(400).json(response);
    return;
  }
  next();
};

const validateUserCreateRules: ValidationChain[] = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6, max: 255 })
    .withMessage("Password must be between 6 and 255 characters"),

  body("role")
    .isIn(["admin", "technician", "manager", "dispatcher"])
    .withMessage("Role must be one of: admin, technician, manager, dispatcher"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
];

const validateUserUpdateRules: ValidationChain[] = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("role")
    .optional()
    .isIn(["admin", "technician", "manager", "dispatcher"])
    .withMessage("Role must be one of: admin, technician, manager, dispatcher"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
];

const validateCustomerCreateRules: ValidationChain[] = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("phone")
    .isLength({ min: 10, max: 20 })
    .withMessage("Phone number must be between 10 and 20 characters"),

  body("addressStreet")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Street address must be between 5 and 200 characters"),

  body("addressCity")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be between 2 and 100 characters"),

  body("addressState")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters"),

  body("addressZipCode")
    .matches(/^[0-9]{5}(-[0-9]{4})?$/)
    .withMessage("ZIP code must be in format 12345 or 12345-6789"),

  body("addressCountry")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters"),

  body("addressLatitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("addressLongitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
];

const validateCustomerUpdateRules: ValidationChain[] = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("phone")
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage("Phone number must be between 10 and 20 characters"),

  body("addressStreet")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Street address must be between 5 and 200 characters"),

  body("addressCity")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be between 2 and 100 characters"),

  body("addressState")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters"),

  body("addressZipCode")
    .optional()
    .matches(/^[0-9]{5}(-[0-9]{4})?$/)
    .withMessage("ZIP code must be in format 12345 or 12345-6789"),
];

const validateJobCreateRules: ValidationChain[] = [
  body("jobName")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Job name must be between 1 and 200 characters"),

  body("description")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Description must be between 1 and 1000 characters"),

  body("customerId")
    .optional()
    .notEmpty()
    .withMessage("Customer ID is required"),

  body("customer").optional().notEmpty().withMessage("Customer ID is required"),

  body("serviceType")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Service type must be between 1 and 100 characters"),

  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High", "Critical"])
    .withMessage("Priority must be one of: Low, Medium, High, Critical"),

  body("assignedTo")
    .optional()
    .notEmpty()
    .withMessage("Assigned technician ID cannot be empty"),

  body("scheduledDate")
    .optional()
    .notEmpty()
    .withMessage("Scheduled date cannot be empty"),

  body("estimatedDuration")
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage("Estimated duration must be between 1 and 480 minutes"),

  body().custom((_, { req }) => {
    if (!req.body.customerId && !req.body.customer) {
      throw new Error("Either customerId or customer field is required");
    }
    return true;
  }),
];

const validateJobUpdateRules: ValidationChain[] = [
  body("jobName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Job name must be between 1 and 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Description must be between 1 and 1000 characters"),

  body("serviceType")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Service type must be between 1 and 100 characters"),

  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High", "Critical"])
    .withMessage("Priority must be one of: Low, Medium, High, Critical"),

  body("assignedTo")
    .optional()
    .notEmpty()
    .withMessage("Assigned technician ID cannot be empty"),

  body("scheduledDate")
    .optional()
    .notEmpty()
    .withMessage("Scheduled date cannot be empty"),

  body("estimatedDuration")
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage("Estimated duration must be between 1 and 480 minutes"),

  body("status")
    .optional()
    .isIn(["Pending", "In Progress", "Completed", "Cancelled"])
    .withMessage(
      "Status must be one of: Pending, In Progress, Completed, Cancelled"
    ),
];

const validateJobLogCreateRules: ValidationChain[] = [
  body("notes")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Notes must be between 1 and 2000 characters"),

  body("workStartTime")
    .optional()
    .notEmpty()
    .withMessage("Work start time cannot be empty"),

  body("workEndTime")
    .optional()
    .notEmpty()
    .withMessage("Work end time cannot be empty"),

  body("statusUpdate")
    .optional()
    .isIn(["Pending", "In Progress", "Completed", "Cancelled"])
    .withMessage(
      "Status update must be one of: Pending, In Progress, Completed, Cancelled"
    ),
];

// Authentication validation rules
const validateLoginRules: ValidationChain[] = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password").isLength({ min: 1 }).withMessage("Password is required"),
];

const validatePasswordChangeRules: ValidationChain[] = [
  body("currentPassword")
    .isLength({ min: 1 })
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6, max: 255 })
    .withMessage("New password must be between 6 and 255 characters"),
];

// Create validation middleware arrays
const validateUserCreate = [...validateUserCreateRules, handleValidationErrors];
const validateUserUpdate = [...validateUserUpdateRules, handleValidationErrors];
const validateCustomerCreate = [
  ...validateCustomerCreateRules,
  handleValidationErrors,
];
const validateCustomerUpdate = [
  ...validateCustomerUpdateRules,
  handleValidationErrors,
];
const validateJobCreate = [...validateJobCreateRules, handleValidationErrors];
const validateJobUpdate = [...validateJobUpdateRules, handleValidationErrors];
const validateJobLogCreate = [
  ...validateJobLogCreateRules,
  handleValidationErrors,
];
const validateLogin = [...validateLoginRules, handleValidationErrors];
const validatePasswordChange = [
  ...validatePasswordChangeRules,
  handleValidationErrors,
];

export {
  validateUserCreate,
  validateUserUpdate,
  validateCustomerCreate,
  validateCustomerUpdate,
  validateJobCreate,
  validateJobUpdate,
  validateJobLogCreate,
  validateLogin,
  validatePasswordChange,
  handleValidationErrors,
};

export type { ValidationError, ValidationErrorResponse };
