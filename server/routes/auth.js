import express from "express";
import { User } from "../models/index.js";
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

// Profile endpoint
router.get("/profile", authenticate, async (req, res) => {
  try {
    console.log("👤 Profile request for user:", req.user.email);

    // If using the simple/mock user (not from database)
    if (req.user && !req.user.get) {
      return res.json({
        success: true,
        data: {
          user: req.user,
        },
      });
    }

    // For real users from database
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
});

export default router;
