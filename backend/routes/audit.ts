import express, { Response } from 'express';
import { AuditLog, User } from '@models/index.js';
import { authenticate, authorize } from '@middleware/auth.js';
import { Op } from 'sequelize';
import { sequelize } from '@config/database.js';
import {
  AuthenticatedRequest,
  AuditLogsListResponse,
  AuditStatsResponse,
  ErrorResponse,
  AuditLogsQuery,
  AuditStatsQuery
} from '../types/api.js';

const router = express.Router();

// Get audit logs
router.get('/', authenticate, authorize('admin', 'manager'), async (req: any, res: any) => {
  try {
    const { page = '1', limit = '20', action, resource, userId, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    const { rows: logs, count: total } = await AuditLog.findAndCountAll({
      where,
      include: [{
        model: User,
        attributes: ['name', 'email', 'role']
      }],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    res.json({
      logs: logs as any[],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get audit log statistics
router.get('/stats', authenticate, authorize('admin', 'manager'), async (req: any, res: any) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    // Get action statistics
    const actionStats = await AuditLog.findAll({
      where,
      attributes: [
        'action',
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['action'],
      order: [[sequelize.literal('count'), 'DESC']]
    });

    // Get user statistics
    const userStats = await AuditLog.findAll({
      where,
      attributes: [
        'userId',
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      include: [{
        model: User,
        attributes: ['name', 'email']
      }],
      group: ['userId', 'User.id', 'User.name', 'User.email'],
      order: [[sequelize.literal('count'), 'DESC']]
    });

    res.json({
      actionStats: actionStats.map(stat => ({
        _id: stat.action,
        count: parseInt(stat.get('count') as string)
      })),
      userStats: userStats.map(stat => ({
        userName: (stat as any).User?.name,
        userEmail: (stat as any).User?.email,
        count: parseInt(stat.get('count') as string)
      }))
    });
  } catch (error: any) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;