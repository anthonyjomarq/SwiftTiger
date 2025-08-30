import { Customer, Job, User, JobLog } from '../types';
import { demoAddressSuggestions } from '../utils/demoData';

// Local storage keys
const STORAGE_KEYS = {
  CUSTOMERS: 'swifttiger_demo_customers',
  JOBS: 'swifttiger_demo_jobs',
  USERS: 'swifttiger_demo_users',
  JOB_LOGS: 'swifttiger_demo_job_logs',
  INITIALIZED: 'swifttiger_demo_initialized'
};

// Initialize demo data
const initializeDemoData = () => {
  if (localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
    return; // Already initialized
  }

  // Demo customers
  const demoCustomers: Customer[] = [
    {
      id: '1',
      name: 'ABC Corporation',
      email: 'contact@abccorp.pr',
      phone: '+1-787-555-0100',
      addressStreet: '123 Calle Fortaleza',
      addressCity: 'San Juan',
      addressState: 'PR',
      addressZipCode: '00901',
      addressCountry: 'US',
      addressPlaceId: 'demo_1',
      addressLatitude: 18.4655,
      addressLongitude: -66.1057,
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString()
    },
    {
      id: '2',
      name: 'Home Depot',
      email: 'services@homedepot.pr',
      phone: '+1-787-555-0200',
      addressStreet: '456 Ave. Ashford',
      addressCity: 'San Juan',
      addressState: 'PR',
      addressZipCode: '00907',
      addressCountry: 'US',
      addressPlaceId: 'demo_2',
      addressLatitude: 18.4580,
      addressLongitude: -66.1050,
      createdAt: new Date('2024-01-16').toISOString(),
      updatedAt: new Date('2024-01-16').toISOString()
    },
    {
      id: '3',
      name: 'Local Restaurant',
      email: 'manager@localrest.pr',
      phone: '+1-787-555-0300',
      addressStreet: '789 Calle Loíza',
      addressCity: 'Carolina',
      addressState: 'PR',
      addressZipCode: '00979',
      addressCountry: 'US',
      addressPlaceId: 'demo_3',
      addressLatitude: 18.3951,
      addressLongitude: -66.0764,
      createdAt: new Date('2024-01-17').toISOString(),
      updatedAt: new Date('2024-01-17').toISOString()
    }
  ];

  // Demo users
  const demoUsers: User[] = [
    {
      id: 'demo-admin',
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@swifttiger.com',
      role: 'admin',
      permissions: ['all'],
      createdAt: new Date('2023-12-01').toISOString(),
      updatedAt: new Date('2024-01-20').toISOString(),
      lastLogin: new Date().toISOString()
    },
    {
      id: 'demo-manager',
      name: 'Carlos Santos',
      email: 'carlos.santos@swifttiger.com',
      role: 'manager',
      permissions: ['read', 'write'],
      createdAt: new Date('2023-12-15').toISOString(),
      updatedAt: new Date('2024-01-18').toISOString(),
      lastLogin: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      id: 'demo-dispatcher',
      name: 'Ana Morales',
      email: 'ana.morales@swifttiger.com',
      role: 'dispatcher',
      permissions: ['read', 'write'],
      createdAt: new Date('2024-01-05').toISOString(),
      updatedAt: new Date('2024-01-19').toISOString(),
      lastLogin: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    },
    {
      id: 'demo-tech1',
      name: 'Luis Ramirez',
      email: 'luis.ramirez@swifttiger.com',
      role: 'technician',
      permissions: ['read'],
      createdAt: new Date('2024-01-10').toISOString(),
      updatedAt: new Date('2024-01-19').toISOString(),
      lastLogin: new Date(Date.now() - 14400000).toISOString() // 4 hours ago
    },
    {
      id: 'demo-tech2',
      name: 'Jose Martinez',
      email: 'jose.martinez@swifttiger.com',
      role: 'technician',
      permissions: ['read'],
      createdAt: new Date('2024-01-12').toISOString(),
      updatedAt: new Date('2024-01-20').toISOString(),
      lastLogin: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: 'demo-tech3',
      name: 'Pedro Gonzalez',
      email: 'pedro.gonzalez@swifttiger.com',
      role: 'technician',
      permissions: ['read'],
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-17').toISOString(),
      lastLogin: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    },
    {
      id: 'demo-tech4',
      name: 'Roberto Silva',
      email: 'roberto.silva@swifttiger.com',
      role: 'technician',
      permissions: ['read'],
      createdAt: new Date('2024-01-08').toISOString(),
      updatedAt: new Date('2024-01-16').toISOString(),
      lastLogin: new Date(Date.now() - 259200000).toISOString() // 3 days ago
    }
  ];

  // Demo jobs
  const demoJobs: Job[] = [
    {
      id: '1',
      jobName: 'AC Repair - Downtown Office',
      description: 'HVAC system maintenance and repair',
      serviceType: 'HVAC',
      priority: 'High',
      status: 'Scheduled',
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      estimatedDuration: 120,
      customerId: '1',
      assignedTechnicianId: 'demo-tech1',
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString(),
      Customer: demoCustomers[0],
      assignedUser: demoUsers[3]
    },
    {
      id: '2',
      jobName: 'Electrical Installation',
      description: 'Install new electrical panel',
      serviceType: 'Electrical',
      priority: 'Medium',
      status: 'In Progress',
      scheduledDate: new Date().toISOString(),
      estimatedDuration: 180,
      customerId: '2',
      assignedTechnicianId: 'demo-tech2',
      createdAt: new Date('2024-01-16').toISOString(),
      updatedAt: new Date().toISOString(),
      Customer: demoCustomers[1],
      assignedUser: demoUsers[4]
    },
    {
      id: '3',
      jobName: 'Plumbing Maintenance',
      description: 'Kitchen sink repair and maintenance',
      serviceType: 'Plumbing',
      priority: 'Low',
      status: 'Completed',
      scheduledDate: new Date(Date.now() - 86400000).toISOString(),
      estimatedDuration: 90,
      customerId: '3',
      assignedTechnicianId: 'demo-tech3',
      createdAt: new Date('2024-01-17').toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      Customer: demoCustomers[2],
      assignedUser: demoUsers[5]
    }
  ];

  // Demo job logs
  const demoJobLogs: JobLog[] = [
    {
      id: '1',
      jobId: '1',
      notes: 'Started inspection of HVAC system. Found minor dust buildup in filters.',
      statusUpdate: 'In Progress',
      photos: [],
      createdAt: new Date('2024-01-18T09:30:00').toISOString(),
      updatedAt: new Date('2024-01-18T09:30:00').toISOString(),
      technicianId: 'demo-tech1'
    },
    {
      id: '2',
      jobId: '1',
      notes: 'Replaced filters and cleaned air ducts. System running efficiently.',
      statusUpdate: 'Completed',
      photos: [],
      createdAt: new Date('2024-01-18T11:15:00').toISOString(),
      updatedAt: new Date('2024-01-18T11:15:00').toISOString(),
      technicianId: 'demo-tech1'
    },
    {
      id: '3',
      jobId: '2',
      notes: 'Arrived on site. Assessing electrical panel and circuits.',
      statusUpdate: 'In Progress',
      photos: [],
      createdAt: new Date('2024-01-19T10:00:00').toISOString(),
      updatedAt: new Date('2024-01-19T10:00:00').toISOString(),
      technicianId: 'demo-tech2'
    },
    {
      id: '4',
      jobId: '3',
      notes: 'Customer requested quote. Will prepare detailed estimate.',
      photos: [],
      createdAt: new Date('2024-01-20T14:30:00').toISOString(),
      updatedAt: new Date('2024-01-20T14:30:00').toISOString(),
      technicianId: 'demo-tech3'
    }
  ];

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(demoCustomers));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(demoUsers));
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(demoJobs));
  localStorage.setItem(STORAGE_KEYS.JOB_LOGS, JSON.stringify(demoJobLogs));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
};

// Utility functions
const getStoredData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveStoredData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// Customer services
export const demoCustomerService = {
  async getAll(): Promise<{ data: Customer[] }> {
    initializeDemoData();
    const customers = getStoredData<Customer>(STORAGE_KEYS.CUSTOMERS);
    return { data: customers };
  },

  async getById(id: string): Promise<{ data: Customer }> {
    const customers = getStoredData<Customer>(STORAGE_KEYS.CUSTOMERS);
    const customer = customers.find(c => c.id === id);
    if (!customer) throw new Error('Customer not found');
    return { data: customer };
  },

  async create(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: Customer }> {
    const customers = getStoredData<Customer>(STORAGE_KEYS.CUSTOMERS);
    const newCustomer: Customer = {
      ...customerData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    customers.push(newCustomer);
    saveStoredData(STORAGE_KEYS.CUSTOMERS, customers);
    return { data: newCustomer };
  },

  async update(id: string, customerData: Partial<Customer>): Promise<{ data: Customer }> {
    const customers = getStoredData<Customer>(STORAGE_KEYS.CUSTOMERS);
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Customer not found');
    
    customers[index] = {
      ...customers[index],
      ...customerData,
      updatedAt: new Date().toISOString()
    };
    saveStoredData(STORAGE_KEYS.CUSTOMERS, customers);
    return { data: customers[index] };
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const customers = getStoredData<Customer>(STORAGE_KEYS.CUSTOMERS);
    const filteredCustomers = customers.filter(c => c.id !== id);
    saveStoredData(STORAGE_KEYS.CUSTOMERS, filteredCustomers);
    return { success: true };
  }
};

// Job services
export const demoJobService = {
  async getAll(): Promise<{ data: Job[] }> {
    initializeDemoData();
    const jobs = getStoredData<Job>(STORAGE_KEYS.JOBS);
    const customers = getStoredData<Customer>(STORAGE_KEYS.CUSTOMERS);
    const users = getStoredData<User>(STORAGE_KEYS.USERS);
    
    // Populate relations
    const populatedJobs = jobs.map(job => ({
      ...job,
      Customer: customers.find(c => c.id === job.customerId),
      assignedUser: users.find(u => u.id === job.assignedUserId)
    }));
    
    return { data: populatedJobs };
  },

  async getById(id: string): Promise<{ data: Job }> {
    const jobs = getStoredData<Job>(STORAGE_KEYS.JOBS);
    const customers = getStoredData<Customer>(STORAGE_KEYS.CUSTOMERS);
    const users = getStoredData<User>(STORAGE_KEYS.USERS);
    
    const job = jobs.find(j => j.id === id);
    if (!job) throw new Error('Job not found');
    
    const populatedJob = {
      ...job,
      Customer: customers.find(c => c.id === job.customerId),
      assignedUser: users.find(u => u.id === job.assignedUserId)
    };
    
    return { data: populatedJob };
  },

  async create(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'Customer' | 'assignedUser'>): Promise<{ data: Job }> {
    const jobs = getStoredData<Job>(STORAGE_KEYS.JOBS);
    const customers = getStoredData<Customer>(STORAGE_KEYS.CUSTOMERS);
    const users = getStoredData<User>(STORAGE_KEYS.USERS);
    
    const newJob: Job = {
      ...jobData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      Customer: customers.find(c => c.id === jobData.customerId),
      assignedUser: users.find(u => u.id === jobData.assignedUserId)
    };
    
    jobs.push(newJob);
    saveStoredData(STORAGE_KEYS.JOBS, jobs);
    return { data: newJob };
  },

  async update(id: string, jobData: Partial<Job>): Promise<{ data: Job }> {
    const jobs = getStoredData<Job>(STORAGE_KEYS.JOBS);
    const customers = getStoredData<Customer>(STORAGE_KEYS.CUSTOMERS);
    const users = getStoredData<User>(STORAGE_KEYS.USERS);
    
    const index = jobs.findIndex(j => j.id === id);
    if (index === -1) throw new Error('Job not found');
    
    jobs[index] = {
      ...jobs[index],
      ...jobData,
      updatedAt: new Date().toISOString()
    };
    
    const updatedJob = {
      ...jobs[index],
      Customer: customers.find(c => c.id === jobs[index].customerId),
      assignedUser: users.find(u => u.id === jobs[index].assignedUserId)
    };
    
    saveStoredData(STORAGE_KEYS.JOBS, jobs);
    return { data: updatedJob };
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const jobs = getStoredData<Job>(STORAGE_KEYS.JOBS);
    const filteredJobs = jobs.filter(j => j.id !== id);
    saveStoredData(STORAGE_KEYS.JOBS, filteredJobs);
    return { success: true };
  }
};

// User services
export const demoUserService = {
  async getAll(): Promise<{ data: User[] }> {
    initializeDemoData();
    const users = getStoredData<User>(STORAGE_KEYS.USERS);
    return { data: users };
  },

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): Promise<{ data: User }> {
    const users = getStoredData<User>(STORAGE_KEYS.USERS);
    const newUser: User = {
      ...userData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    users.push(newUser);
    saveStoredData(STORAGE_KEYS.USERS, users);
    return { data: newUser };
  },

  async update(id: string, userData: Partial<User>): Promise<{ data: User }> {
    const users = getStoredData<User>(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    
    users[index] = {
      ...users[index],
      ...userData,
      updatedAt: new Date().toISOString()
    };
    saveStoredData(STORAGE_KEYS.USERS, users);
    return { data: users[index] };
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const users = getStoredData<User>(STORAGE_KEYS.USERS);
    const filteredUsers = users.filter(u => u.id !== id);
    saveStoredData(STORAGE_KEYS.USERS, filteredUsers);
    return { success: true };
  }
};

// Job Logs services
export const demoJobLogService = {
  async getJobLogs(jobId: string): Promise<JobLog[]> {
    initializeDemoData();
    const jobLogs = getStoredData<JobLog>(STORAGE_KEYS.JOB_LOGS);
    return jobLogs.filter(log => log.jobId === jobId);
  },

  async createJobLog(jobId: string, logData: any): Promise<JobLog> {
    const jobLogs = getStoredData<JobLog>(STORAGE_KEYS.JOB_LOGS);
    const newJobLog: JobLog = {
      id: generateId(),
      jobId,
      notes: logData.notes || '',
      statusUpdate: logData.statusUpdate || undefined,
      photos: logData.photos || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      technicianId: logData.technicianId
    };
    
    jobLogs.push(newJobLog);
    saveStoredData(STORAGE_KEYS.JOB_LOGS, jobLogs);
    return newJobLog;
  },

  async updateJobLog(jobId: string, logId: string, logData: any): Promise<JobLog> {
    const jobLogs = getStoredData<JobLog>(STORAGE_KEYS.JOB_LOGS);
    const logIndex = jobLogs.findIndex(log => log.id === logId && log.jobId === jobId);
    if (logIndex === -1) throw new Error('Job log not found');
    
    jobLogs[logIndex] = {
      ...jobLogs[logIndex],
      notes: logData.notes !== undefined ? logData.notes : jobLogs[logIndex].notes,
      statusUpdate: logData.statusUpdate !== undefined ? logData.statusUpdate : jobLogs[logIndex].statusUpdate,
      photos: logData.photos !== undefined ? logData.photos : jobLogs[logIndex].photos,
      updatedAt: new Date().toISOString()
    };
    
    saveStoredData(STORAGE_KEYS.JOB_LOGS, jobLogs);
    return jobLogs[logIndex];
  },

  async deleteJobLog(jobId: string, logId: string): Promise<{ success: boolean }> {
    const jobLogs = getStoredData<JobLog>(STORAGE_KEYS.JOB_LOGS);
    const filteredLogs = jobLogs.filter(log => !(log.id === logId && log.jobId === jobId));
    saveStoredData(STORAGE_KEYS.JOB_LOGS, filteredLogs);
    return { success: true };
  }
};

// Address autocomplete for demo
export const demoAddressService = {
  search(query: string) {
    if (query.length < 2) return [];
    return demoAddressSuggestions.filter(addr => 
      addr.description.toLowerCase().includes(query.toLowerCase())
    );
  }
};

// Main demo backend service export
export const demoBackendService = {
  // Customer methods
  getCustomers: demoCustomerService.getAll,
  getCustomer: demoCustomerService.getById,
  createCustomer: demoCustomerService.create,
  updateCustomer: demoCustomerService.update,
  deleteCustomer: demoCustomerService.delete,

  // Job methods
  getJobs: demoJobService.getAll,
  getJob: demoJobService.getById,
  createJob: demoJobService.create,
  updateJob: demoJobService.update,
  deleteJob: demoJobService.delete,

  // User methods
  getUsers: demoUserService.getAll,
  createUser: demoUserService.create,
  updateUser: demoUserService.update,
  deleteUser: demoUserService.delete,

  // Job Log methods
  getJobLogs: demoJobLogService.getJobLogs,
  createJobLog: demoJobLogService.createJobLog,
  updateJobLog: demoJobLogService.updateJobLog,
  deleteJobLog: demoJobLogService.deleteJobLog,

  // Address methods
  searchAddress: demoAddressService.search
};