import { body, validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
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

export const userValidationRules = {
  register: [
    body("email").isEmail().normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/^(?=.*[A-Z])/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/^(?=.*\d)/)
      .withMessage("Password must contain at least one number")
      .matches(/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .withMessage("Password must contain at least one special character"),
    body("firstName").trim().notEmpty().isLength({ min: 2, max: 50 }),
    body("lastName").trim().notEmpty().isLength({ min: 2, max: 50 }),
    body("role").optional().isIn(["admin", "dispatcher", "technician"]),
    body("phone").optional().isMobilePhone(),
  ],

  update: [
    body("email").optional().isEmail().normalizeEmail(),
    body("firstName")
      .optional()
      .trim()
      .notEmpty()
      .isLength({ min: 2, max: 50 }),
    body("lastName").optional().trim().notEmpty().isLength({ min: 2, max: 50 }),
    body("phone").optional().isMobilePhone(),
    body("role").optional().isIn(["admin", "dispatcher", "technician"]),
  ],

  changePassword: [
    body("currentPassword").notEmpty(),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/^(?=.*[A-Z])/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/^(?=.*\d)/)
      .withMessage("Password must contain at least one number")
      .matches(/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .withMessage("Password must contain at least one special character")
      .custom((value, { req }) => value !== req.body.currentPassword)
      .withMessage("New password must be different from current password"),
  ],
  updateProfile: [
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters")
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage(
        "First name can only contain letters, spaces, hyphens, and apostrophes"
      ),

    body("lastName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters")
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage(
        "Last name can only contain letters, spaces, hyphens, and apostrophes"
      ),

    body("email")
      .optional()
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

    body("phone")
      .optional()
      .trim()
      .custom((value) => {
        if (value && value !== "") {
          // Allow various phone number formats
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
            throw new Error("Please provide a valid phone number");
          }
        }
        return true;
      }),

    body("bio")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),

    body("department")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Department cannot exceed 100 characters")
      .matches(/^[a-zA-Z0-9\s\-&.,()]+$/)
      .withMessage("Department contains invalid characters"),

    body("location")
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage("Location cannot exceed 255 characters"),
  ],
};
