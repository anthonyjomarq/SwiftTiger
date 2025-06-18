import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  activateUser,
  getUserStats,
} from "../controllers/userController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import {
  userValidationRules,
  validateRequest,
} from "../middleware/validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.get("/", requireRole("admin"), getAllUsers);
router.get("/stats", requireRole("admin"), getUserStats);
router.get("/:id", requireRole("admin"), getUserById);
router.patch(
  "/:id",
  requireRole("admin"),
  userValidationRules.update,
  validateRequest,
  updateUser
);
router.delete("/:id", requireRole("admin"), deactivateUser);
router.patch("/:id/activate", requireRole("admin"), activateUser);

export default router;
