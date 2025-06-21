import express from "express";
import { User } from "../models/index.js";
import {
  register,
  login,
  refreshToken,
  changePassword,
  updateProfile,
  getExtendedProfile,
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

router.get("/profile", authenticate, getExtendedProfile);

router.patch(
  "/profile",
  authenticate,
  userValidationRules.updateProfile,
  validateRequest,
  updateProfile
);

export default router;
