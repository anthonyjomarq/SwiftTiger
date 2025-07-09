const express = require('express');
const { Op } = require('sequelize');
const Job = require('../models/Job');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [
      totalCustomers,
      activeJobs,
      pendingJobs,
      completedToday,
      highPriority,
      mediumPriority,
      lowPriority,
      totalUsers
    ] = await Promise.all([
      Customer.count({ where: { isActive: true } }),
      Job.count({ where: { status: 'In Progress' } }),
      Job.count({ where: { status: 'Pending' } }),
      Job.count({ 
        where: {
          status: 'Completed',
          completedDate: { 
            [Op.gte]: startOfDay, 
            [Op.lt]: endOfDay 
          }
        }
      }),
      Job.count({ 
        where: { 
          priority: 'High', 
          status: { [Op.ne]: 'Completed' } 
        }
      }),
      Job.count({ 
        where: { 
          priority: 'Medium', 
          status: { [Op.ne]: 'Completed' } 
        }
      }),
      Job.count({ 
        where: { 
          priority: 'Low', 
          status: { [Op.ne]: 'Completed' } 
        }
      }),
      User.count({ where: { isActive: true } })
    ]);

    res.json({
      totalCustomers,
      activeJobs,
      pendingJobs,
      completedToday,
      highPriority,
      mediumPriority,
      lowPriority,
      totalUsers
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;