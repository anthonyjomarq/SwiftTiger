const express = require('express');
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');
const Job = require('../models/Job');
const JobLog = require('../models/JobLog');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/audit');
const { validateJobCreate, validateJobUpdate, validateJobLogCreate } = require('../middleware/validation');

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all jobs
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('💼 GET /jobs - Fetching jobs with query params:', req.query);
    const { page = 1, limit = 10, status, assignedTo, customerId, scheduledDate } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) {
      // Handle comma-separated status values
      const statusValues = status.split(',').map(s => s.trim());
      filter.status = statusValues;
    }
    if (assignedTo) filter.assignedTo = assignedTo;
    if (customerId) filter.customerId = customerId;
    if (scheduledDate) {
      // Filter by scheduled date - handle date range to match all times on the date
      const startDate = new Date(scheduledDate);
      const endDate = new Date(scheduledDate);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.scheduledDate = {
        [Op.gte]: startDate,
        [Op.lt]: endDate
      };
    }
    
    console.log('🔍 Jobs filter criteria:', filter);

    const jobs = await Job.findAll({
      where: filter,
      include: [
        {
          model: Customer,
          as: 'Customer',
          attributes: ['id', 'name', 'email', 'phone', 'addressStreet', 'addressCity', 'addressState', 'addressLatitude', 'addressLongitude']
        },
        {
          model: User,
          as: 'AssignedTechnician',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: parseInt(limit)
    });

    const total = await Job.count({ where: filter });

    console.log(`✅ Found ${jobs.length} jobs, total: ${total}`);
    res.json({
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get jobs error:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({ 
      message: 'Server error fetching jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get job by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'Customer',
          attributes: ['id', 'name', 'email', 'phone', 'addressStreet', 'addressCity', 'addressState', 'addressLatitude', 'addressLongitude']
        },
        {
          model: User,
          as: 'AssignedTechnician',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create job
router.post('/', 
  authenticate, 
  validateJobCreate,
  auditMiddleware('CREATE_JOB', 'JOB'),
  async (req, res) => {
    try {
      console.log('💼 POST /jobs - Creating job with data:', req.body);
      
      const { 
        jobName, 
        description, 
        customer, 
        customerId, 
        serviceType, 
        priority, 
        assignedTo, 
        scheduledDate, 
        estimatedDuration 
      } = req.body;

      // Accept either 'customer' or 'customerId' for backward compatibility
      const customerIdToUse = customerId || customer;

      if (!jobName || !description || !customerIdToUse || !serviceType) {
        console.log('❌ Missing required fields for job creation');
        return res.status(400).json({ message: 'Job name, description, customer ID, and service type are required' });
      }

      // Verify customer exists
      console.log('🔍 Verifying customer exists:', customerIdToUse);
      const customerExists = await Customer.findByPk(customerIdToUse);
      if (!customerExists) {
        console.log('❌ Customer not found');
        return res.status(400).json({ message: 'Customer not found' });
      }

      // Verify assigned technician exists if provided
      if (assignedTo) {
        console.log('🔍 Verifying technician exists:', assignedTo);
        const technicianExists = await User.findByPk(assignedTo);
        if (!technicianExists) {
          console.log('❌ Technician not found');
          return res.status(400).json({ message: 'Assigned technician not found' });
        }
      }

      console.log('➕ Creating new job...');
      
      const createdById = req.user.id;
      
      const job = await Job.create({
        jobName,
        description,
        customerId: customerIdToUse,
        serviceType,
        priority: priority || 'Medium',
        assignedTo: assignedTo || null,
        scheduledDate: scheduledDate || new Date(),
        estimatedDuration: estimatedDuration || 60,
        createdBy: createdById
      });

      console.log(`✅ Job created with ID: ${job.id}`);
      
      // Return job with simplified includes to avoid association issues
      const jobResponse = await Job.findByPk(job.id, {
        include: [
          {
            model: Customer,
            as: 'Customer',
            attributes: ['id', 'name', 'email', 'phone', 'addressStreet', 'addressCity', 'addressState', 'addressLatitude', 'addressLongitude']
          },
          {
            model: User,
            as: 'AssignedTechnician',
            attributes: ['id', 'name', 'email', 'role']
          }
        ]
      });
      
      res.status(201).json(jobResponse);
    } catch (error) {
      console.error('❌ Create job error:', {
        message: error.message,
        stack: error.stack,
        body: req.body
      });
      
      // Handle specific database errors
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: 'Invalid customer or technician ID provided' });
      }
      
      res.status(500).json({ 
        message: 'Server error creating job',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Update job
router.put('/:id', 
  authenticate, 
  validateJobUpdate,
  auditMiddleware('UPDATE_JOB', 'JOB'),
  async (req, res) => {
    try {
      const { jobName, description, serviceType, priority, assignedTo, scheduledDate, estimatedDuration, status } = req.body;
      
      const job = await Job.findByPk(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      const updateData = {
        updatedBy: req.user.id
      };
      
      if (jobName) updateData.jobName = jobName;
      if (description) updateData.description = description;
      if (serviceType) updateData.serviceType = serviceType;
      if (priority) updateData.priority = priority;
      if (assignedTo) updateData.assignedTo = assignedTo;
      if (scheduledDate) updateData.scheduledDate = scheduledDate;
      if (estimatedDuration) updateData.estimatedDuration = estimatedDuration;
      if (status) updateData.status = status;

      if (status === 'Completed' && !job.completedDate) {
        updateData.completedDate = new Date();
      }

      await job.update(updateData);
      
      const updatedJob = await Job.findByPk(req.params.id, {
        include: [
          {
            model: Customer,
            as: 'Customer',
            attributes: ['id', 'name', 'email', 'phone', 'addressStreet', 'addressCity', 'addressState', 'addressLatitude', 'addressLongitude']
          },
          {
            model: User,
            as: 'AssignedTechnician',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.json(updatedJob);
    } catch (error) {
      console.error('Update job error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete job
router.delete('/:id', 
  authenticate, 
  authorize('admin', 'manager'), 
  auditMiddleware('DELETE_JOB', 'JOB'),
  async (req, res) => {
    try {
      const job = await Job.findByPk(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      await job.destroy();

      res.json({ message: 'Job deleted successfully' });
    } catch (error) {
      console.error('Delete job error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get job logs
router.get('/:id/logs', authenticate, async (req, res) => {
  try {
    const logs = await JobLog.findAll({
      where: { jobId: req.params.id },
      include: [
        {
          model: User,
          as: 'Technician',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(logs);
  } catch (error) {
    console.error('Get job logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create job log
router.post('/:id/logs', 
  authenticate, 
  upload.array('photos', 5),
  validateJobLogCreate,
  auditMiddleware('CREATE_JOB_LOG', 'JOB_LOG'),
  async (req, res) => {
    try {
      const { notes, workStartTime, workEndTime, statusUpdate } = req.body;
      
      if (!notes) {
        return res.status(400).json({ message: 'Notes are required' });
      }

      const photos = req.files ? req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      })) : [];

      const jobLog = await JobLog.create({
        jobId: req.params.id,
        technicianId: req.user.id,
        notes,
        photos,
        workStartTime,
        workEndTime,
        statusUpdate
      });

      const jobLogWithTechnician = await JobLog.findByPk(jobLog.id, {
        include: [
          {
            model: User,
            as: 'Technician',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      // Update job status if provided
      if (statusUpdate) {
        const job = await Job.findByPk(req.params.id);
        if (job) {
          const updateData = {
            status: statusUpdate,
            updatedBy: req.user.id
          };
          
          if (statusUpdate === 'Completed' && !job.completedDate) {
            updateData.completedDate = new Date();
          }
          
          await job.update(updateData);
        }
      }

      res.status(201).json(jobLogWithTechnician);
    } catch (error) {
      console.error('Create job log error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * @swagger
 * /api/jobs/{jobId}/logs/{logId}:
 *   put:
 *     summary: Update a job log
 *     tags: [Job Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job log ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - notes
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Job log notes
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Photo files
 *               workStartTime:
 *                 type: string
 *                 format: date-time
 *               workEndTime:
 *                 type: string
 *                 format: date-time
 *               statusUpdate:
 *                 type: string
 *                 enum: [Pending, In Progress, Completed, Cancelled]
 *     responses:
 *       200:
 *         description: Job log updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobLog'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Job log not found
 */
router.put('/:jobId/logs/:logId', 
  authenticate, 
  upload.array('photos', 5),
  validateJobLogCreate,
  auditMiddleware('UPDATE_JOB_LOG', 'JOB_LOG'),
  async (req, res) => {
    try {
      const { notes, workStartTime, workEndTime, statusUpdate } = req.body;
      
      const jobLog = await JobLog.findOne({
        where: { 
          id: req.params.logId,
          jobId: req.params.jobId 
        },
        include: [
          {
            model: User,
            as: 'Technician',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!jobLog) {
        return res.status(404).json({ message: 'Job log not found' });
      }

      // Only allow the technician who created the log or admin/manager to edit
      if (jobLog.technicianId !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied. You can only edit your own job logs.' });
      }

      if (!notes) {
        return res.status(400).json({ message: 'Notes are required' });
      }

      // Handle new photos if uploaded
      let updatedPhotos = jobLog.photos || [];
      if (req.files && req.files.length > 0) {
        const newPhotos = req.files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        }));
        updatedPhotos = [...updatedPhotos, ...newPhotos];
      }

      // Update the job log
      await jobLog.update({
        notes,
        photos: updatedPhotos,
        workStartTime,
        workEndTime,
        statusUpdate
      });

      // Update job status if provided
      if (statusUpdate) {
        const job = await Job.findByPk(req.params.jobId);
        if (job) {
          const updateData = {
            status: statusUpdate,
            updatedBy: req.user.id
          };
          
          if (statusUpdate === 'Completed' && !job.completedDate) {
            updateData.completedDate = new Date();
          }
          
          await job.update(updateData);
        }
      }

      // Return updated job log
      const updatedJobLog = await JobLog.findByPk(jobLog.id, {
        include: [
          {
            model: User,
            as: 'Technician',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.json(updatedJobLog);
    } catch (error) {
      console.error('Update job log error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * @swagger
 * /api/jobs/{jobId}/logs/{logId}:
 *   delete:
 *     summary: Delete a job log
 *     tags: [Job Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job log ID
 *     responses:
 *       200:
 *         description: Job log deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Job log not found
 */
router.delete('/:jobId/logs/:logId',
  authenticate,
  authorize('admin', 'manager'),
  auditMiddleware('DELETE_JOB_LOG', 'JOB_LOG'),
  async (req, res) => {
    try {
      const jobLog = await JobLog.findOne({
        where: { 
          id: req.params.logId,
          jobId: req.params.jobId 
        }
      });

      if (!jobLog) {
        return res.status(404).json({ message: 'Job log not found' });
      }

      await jobLog.destroy();

      res.json({ message: 'Job log deleted successfully' });
    } catch (error) {
      console.error('Delete job log error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;