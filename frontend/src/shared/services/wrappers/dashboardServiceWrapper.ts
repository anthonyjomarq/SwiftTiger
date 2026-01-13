import { customerService } from './customerServiceWrapper';
import { jobService } from './jobServiceWrapper';
import { userService } from './userServiceWrapper';
import { Job, JobStatus, JobPriority } from '@/shared/types/business';

interface DashboardStats {
  totalCustomers: number;
  activeJobs: number;
  pendingJobs: number;
  completedToday: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  jobStatusDistribution: Array<{
    status: string;
    count: number;
  }>;
  technicianWorkload: Array<{
    name: string;
    assigned: number;
    completed: number;
    inProgress: number;
  }>;
  jobTrends: Array<{
    date: string;
    created: number;
    completed: number;
    cancelled: number;
  }>;
}

// Check if in demo mode
const isDemoMode = (): boolean => {
  try {
    const saved = localStorage.getItem('swifttiger-demo-mode');
    return saved !== null ? JSON.parse(saved) : true;
  } catch {
    return true;
  }
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    if (isDemoMode()) {
      // Get demo data
      const customers = await customerService.getCustomers();
      const jobs = await jobService.getJobs();
      const users = await userService.getUsers();

      const allJobs = jobs.jobs;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Calculate stats
      const activeJobs = allJobs.filter(job => 
        job.status === 'In Progress' || job.status === 'Scheduled'
      ).length;

      const pendingJobs = allJobs.filter(job => job.status === 'Pending').length;

      const completedToday = allJobs.filter(job => {
        const jobDate = new Date(job.updatedAt);
        return job.status === 'Completed' && 
               jobDate >= today && 
               jobDate < tomorrow;
      }).length;

      // Priority counts
      const highPriority = allJobs.filter(job => job.priority === 'High').length;
      const mediumPriority = allJobs.filter(job => job.priority === 'Medium').length;
      const lowPriority = allJobs.filter(job => job.priority === 'Low').length;

      // Status distribution
      const statusCounts: Record<string, number> = {};
      allJobs.forEach(job => {
        statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
      });

      const jobStatusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));

      // Technician workload
      const technicianWorkload = users
        .filter(user => user.role === 'technician')
        .map(tech => {
          const assignedJobs = allJobs.filter(job => job.assignedUserId === tech.id);
          return {
            name: tech.name,
            assigned: assignedJobs.length,
            completed: assignedJobs.filter(job => job.status === 'Completed').length,
            inProgress: assignedJobs.filter(job => job.status === 'In Progress').length
          };
        });

      // Job trends (last 7 days)
      const jobTrends = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayJobs = allJobs.filter(job => {
          const jobCreated = new Date(job.createdAt);
          return jobCreated >= date && jobCreated < nextDate;
        });

        const dayCompleted = allJobs.filter(job => {
          const jobUpdated = new Date(job.updatedAt);
          return job.status === 'Completed' && jobUpdated >= date && jobUpdated < nextDate;
        });

        jobTrends.push({
          date: date.toISOString().split('T')[0],
          created: dayJobs.length,
          completed: dayCompleted.length,
          cancelled: 0 // Demo data doesn't have cancelled status
        });
      }

      return {
        totalCustomers: customers.customers.length,
        activeJobs,
        pendingJobs,
        completedToday,
        highPriority,
        mediumPriority,
        lowPriority,
        jobStatusDistribution,
        technicianWorkload,
        jobTrends
      };
    }

    // If not in demo mode, use real API (this would need to be implemented)
    throw new Error('Real API dashboard stats not implemented');
  },

  async getRecentJobs(): Promise<Job[]> {
    const { jobs } = await jobService.getJobs({ limit: 5 });
    return jobs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
};