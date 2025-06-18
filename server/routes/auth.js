import express from "express";
import {
  register,
  login,
  refreshToken,
  changePassword,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import {
  userValidationRules,
  validateRequest,
} from "../middleware/validation.js";

const router = express.Router();

// Public routes
router.post(
  "/register",
  userValidationRules.register,
  validateRequest,
  register
);

router.post("/login", login);
router.post("/refresh", refreshToken);

// Protected routes
router.post(
  "/change-password",
  authenticate,
  userValidationRules.changePassword,
  validateRequest,
  changePassword
);

export default router;
