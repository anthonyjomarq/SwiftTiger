import { body, validationResult } from "express-validator";

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  body("firstName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "First name can only contain letters, spaces, apostrophes, and hyphens"
    ),

  body("lastName")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Last name can only contain letters, spaces, apostrophes, and hyphens"
    ),

  body("role")
    .optional()
    .isIn(["admin", "dispatcher", "technician"])
    .withMessage("Role must be admin, dispatcher, or technician"),

  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),

  handleValidationErrors,
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

const updateUserValidation = [
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "First name can only contain letters, spaces, apostrophes, and hyphens"
    ),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Last name can only contain letters, spaces, apostrophes, and hyphens"
    ),

  body("role")
    .optional()
    .isIn(["admin", "dispatcher", "technician"])
    .withMessage("Role must be admin, dispatcher, or technician"),

  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),

  handleValidationErrors,
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  handleValidationErrors,
];

export {
  registerValidation,
  loginValidation,
  updateUserValidation,
  changePasswordValidation,
  handleValidationErrors,
};
