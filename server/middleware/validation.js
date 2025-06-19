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
};
