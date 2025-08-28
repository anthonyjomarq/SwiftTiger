import { Request, Response, NextFunction } from "express";
import { User } from "../types/index.js";

interface AuditUser extends User {
  ipAddress?: string;
  userAgent?: string;
}

interface AuditDetails {
  method: string;
  path: string;
  body?: any;
  params?: any;
  query?: any;
  [key: string]: any;
}

const createAuditLog = async (
  user: AuditUser,
  action: string,
  resource: string,
  resourceId: number | string | null = null,
  details: AuditDetails | Record<string, any> = {}
): Promise<void> => {
  try {
    const AuditLogModel = require("../models/AuditLog");

    await AuditLogModel.create({
      userId: user.id,
      action,
      resource,
      resourceId,
      details,
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};

const auditMiddleware = (action: string, resource: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      next();
      return;
    }

    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = data?._id || data?.id || req.params?.id;
        const details: AuditDetails = {
          method: req.method,
          path: req.path,
          body: req.body,
          params: req.params,
          query: req.query,
        };

        const auditUser: AuditUser = {
          ...req.user!,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        };

        createAuditLog(auditUser, action, resource, resourceId, details);
      }

      return originalJson(data);
    };

    next();
  };
};

export { createAuditLog, auditMiddleware };
export type { AuditUser, AuditDetails };
