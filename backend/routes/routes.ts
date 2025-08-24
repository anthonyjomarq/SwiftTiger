import express, { Response } from 'express';
import { Op } from 'sequelize';
import { Job } from '@models/Job.js';
import { Customer } from '@models/Customer.js';
import { User } from '@models/User.js';
import { authenticate, authorize } from '@middleware/auth.js';
import {
  AuthenticatedRequest,
  ErrorResponse
} from '../types/api.js';

const router = express.Router();

interface RouteOptimizationQuery {
  date?: string;
  technicianIds?: string;
}

interface RouteOptimizationResponse {
  date: string;
  jobs: Array<{
    jobId: string;
    jobName: string;
    customer: string;
    address: string;
    priority: string;
    estimatedDuration: number;
    assignedTo: any;
    serviceType: string;
  }>;
  totalJobs: number;
}

interface RouteAssignmentRequest {
  assignments: Array<{
    jobId: string;
    technicianId: string;
    scheduledDate: Date | string;
  }>;
}

interface WorkloadQuery {
  date?: string;
}

interface WorkloadResponse {
  technicianId: string;
  technicianName: string;
  totalJobs: number;
  totalDuration: number;
  jobs: string[];
}

// Get route optimization data
router.get('/optimize', authenticate, authorize('admin', 'manager', 'dispatcher'), async (req: any, res: any) => {
  try {
    const { date, technicianIds } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const filter: any = {
      scheduledDate: { [Op.gte]: startDate, [Op.lt]: endDate },
      status: { [Op.in]: ['Pending', 'In Progress'] }
    };

    if (technicianIds) {
      filter.assignedTo = { [Op.in]: technicianIds.split(',') };
    }

    const jobs = await Job.findAll({
      where: filter,
      include: [
        {
          model: Customer,
          as: 'Customer',
          attributes: ['name', 'addressStreet', 'addressCity', 'addressState']
        },
        {
          model: User,
          as: 'AssignedTechnician',
          attributes: ['name', 'email']
        }
      ],
      order: [['priority', 'DESC'], ['scheduledDate', 'ASC']]
    });

    const optimizationData = jobs.map(job => ({
      jobId: job.id,
      jobName: job.jobName,
      customer: (job as any).Customer?.name || '',
      address: `${(job as any).Customer?.addressStreet || ''} ${(job as any).Customer?.addressCity || ''} ${(job as any).Customer?.addressState || ''}`.trim(),
      priority: job.priority,
      estimatedDuration: job.estimatedDuration,
      assignedTo: (job as any).AssignedTechnician,
      serviceType: job.serviceType
    }));

    res.json({
      date,
      jobs: optimizationData,
      totalJobs: jobs.length
    });
  } catch (error: any) {
    console.error('Route optimization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create optimized route assignment
router.post('/assign', authenticate, authorize('admin', 'manager', 'dispatcher'), async (req: any, res: any) => {
  try {
    const { assignments } = req.body;
    
    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ message: 'Assignments array is required' });
    }

    const updatePromises = assignments.map(assignment => {
      return Job.update(
        { 
          assignedTo: assignment.technicianId,
          scheduledDate: new Date(assignment.scheduledDate),
          updatedBy: req.user.id
        },
        { where: { id: assignment.jobId } }
      );
    });

    await Promise.all(updatePromises);

    res.json({ message: 'Route assignments updated successfully' });
  } catch (error: any) {
    console.error('Route assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get technician workload
router.get('/workload', authenticate, authorize('admin', 'manager', 'dispatcher'), async (req: any, res: any) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    // Since this is Sequelize (not MongoDB), we need to adjust the aggregation logic
    const jobs = await Job.findAll({
      where: {
        scheduledDate: { [Op.gte]: startDate, [Op.lt]: endDate },
        status: { [Op.in]: ['Pending', 'In Progress'] },
        assignedTo: { [Op.ne]: null }
      },
      include: [
        {
          model: User,
          as: 'AssignedTechnician',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Group by technician
    const workloadMap = new Map<string, {
      technicianId: string;
      technicianName: string;
      totalJobs: number;
      totalDuration: number;
      jobs: string[];
    }>();

    jobs.forEach(job => {
      if (job.assignedTo && (job as any).AssignedTechnician) {
        const techId = job.assignedTo;
        if (!workloadMap.has(techId)) {
          workloadMap.set(techId, {
            technicianId: techId,
            technicianName: (job as any).AssignedTechnician.name,
            totalJobs: 0,
            totalDuration: 0,
            jobs: []
          });
        }
        
        const workload = workloadMap.get(techId)!;
        workload.totalJobs += 1;
        workload.totalDuration += job.estimatedDuration;
        workload.jobs.push(job.id);
      }
    });

    const workloadArray = Array.from(workloadMap.values());
    res.json(workloadArray);
  } catch (error: any) {
    console.error('Workload calculation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;