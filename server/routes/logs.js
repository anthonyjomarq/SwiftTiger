import express from "express";
import { getLogs } from "../controllers/logsController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get("/", requireRole("admin"), getLogs);

export default router;
