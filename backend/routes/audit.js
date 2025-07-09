const express = require('express');
const { AuditLog, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get audit logs
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { page = 1, limit = 20, action, resource, userId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
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
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get audit log statistics
router.get('/stats', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
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
        [AuditLog.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['action'],
      order: [[AuditLog.sequelize.literal('count'), 'DESC']]
    });

    // Get user statistics
    const userStats = await AuditLog.findAll({
      where,
      attributes: [
        'userId',
        [AuditLog.sequelize.fn('COUNT', '*'), 'count']
      ],
      include: [{
        model: User,
        attributes: ['name', 'email']
      }],
      group: ['userId', 'User.id', 'User.name', 'User.email'],
      order: [[AuditLog.sequelize.literal('count'), 'DESC']]
    });

    res.json({
      actionStats: actionStats.map(stat => ({
        _id: stat.action,
        count: parseInt(stat.get('count'))
      })),
      userStats: userStats.map(stat => ({
        userName: stat.User?.name,
        userEmail: stat.User?.email,
        count: parseInt(stat.get('count'))
      }))
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;