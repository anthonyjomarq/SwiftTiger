const express = require('express');
const Job = require('../models/Job');
const Customer = require('../models/Customer');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get route optimization data
router.get('/optimize', authenticate, authorize('admin', 'manager', 'dispatcher'), async (req, res) => {
  try {
    const { date, technicianIds } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const filter = {
      scheduledDate: { $gte: startDate, $lt: endDate },
      status: { $in: ['Pending', 'In Progress'] }
    };

    if (technicianIds) {
      filter.assignedTo = { $in: technicianIds.split(',') };
    }

    const jobs = await Job.find(filter)
      .populate('customer', 'name address')
      .populate('assignedTo', 'name email')
      .sort({ priority: -1, scheduledDate: 1 });

    const optimizationData = jobs.map(job => ({
      jobId: job._id,
      jobName: job.jobName,
      customer: job.customer.name,
      address: job.customer.address,
      priority: job.priority,
      estimatedDuration: job.estimatedDuration,
      assignedTo: job.assignedTo,
      serviceType: job.serviceType
    }));

    res.json({
      date,
      jobs: optimizationData,
      totalJobs: jobs.length
    });
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create optimized route assignment
router.post('/assign', authenticate, authorize('admin', 'manager', 'dispatcher'), async (req, res) => {
  try {
    const { assignments } = req.body;
    
    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ message: 'Assignments array is required' });
    }

    const updatePromises = assignments.map(assignment => {
      return Job.findByIdAndUpdate(
        assignment.jobId,
        { 
          assignedTo: assignment.technicianId,
          scheduledDate: assignment.scheduledDate,
          updatedBy: req.user._id
        },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    res.json({ message: 'Route assignments updated successfully' });
  } catch (error) {
    console.error('Route assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get technician workload
router.get('/workload', authenticate, authorize('admin', 'manager', 'dispatcher'), async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const workload = await Job.aggregate([
      {
        $match: {
          scheduledDate: { $gte: startDate, $lt: endDate },
          status: { $in: ['Pending', 'In Progress'] },
          assignedTo: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          totalJobs: { $sum: 1 },
          totalDuration: { $sum: '$estimatedDuration' },
          jobs: { $push: '$_id' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'technician'
        }
      },
      {
        $unwind: '$technician'
      },
      {
        $project: {
          technicianId: '$_id',
          technicianName: '$technician.name',
          totalJobs: 1,
          totalDuration: 1,
          jobs: 1
        }
      }
    ]);

    res.json(workload);
  } catch (error) {
    console.error('Workload calculation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;