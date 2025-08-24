import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../types/index.js";

// Extend the JWT payload interface
interface JwtPayload {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Enhanced Request interface with user and additional properties
interface AuthenticatedRequest extends Request {
  user: User & {
    ipAddress?: string;
    userAgent?: string;
  };
}

// Type for roles
type UserRole = "admin" | "technician" | "manager" | "dispatcher";

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "Access denied. No token provided." });
      return;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    // Assuming you have a User model with findByPk method
    const User = require("../models/User");
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      res.status(401).json({ message: "Invalid token or user inactive." });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token." });
  }
};

const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      });
      return;
    }
    next();
  };
};

const requireMainAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }

  if (!req.user.isMainAdmin) {
    res.status(403).json({
      message: "Access denied. Main admin privileges required.",
    });
    return;
  }
  next();
};

export { authenticate, authorize, requireMainAdmin };
export type { AuthenticatedRequest, UserRole };
