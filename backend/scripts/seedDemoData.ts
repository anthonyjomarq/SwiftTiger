import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Job from '../models/Job.js';
import JobLog from '../models/JobLog.js';
import bcrypt from 'bcryptjs';

const demoUsers = [
  {
    name: 'Sarah Johnson',
    email: 'admin@swifttiger.com',
    password: 'Admin123!',
    role: 'admin' as const,
    isMainAdmin: true,
    isActive: true
  },
  {
    name: 'Mike Chen',
    email: 'manager@swifttiger.com', 
    password: 'Manager123!',
    role: 'manager' as const,
    isMainAdmin: false,
    isActive: true
  },
  {
    name: 'Lisa Rodriguez',
    email: 'dispatcher@swifttiger.com',
    password: 'Dispatcher123!',
    role: 'dispatcher' as const,
    isMainAdmin: false,
    isActive: true
  },
  {
    name: 'John Smith',
    email: 'tech1@swifttiger.com',
    password: 'Tech123!',
    role: 'technician' as const,
    isMainAdmin: false,
    isActive: true
  },
  {
    name: 'Emma Wilson',
    email: 'tech2@swifttiger.com',
    password: 'Tech123!',
    role: 'technician' as const,
    isMainAdmin: false,
    isActive: true
  },
  {
    name: 'David Brown',
    email: 'tech3@swifttiger.com',
    password: 'Tech123!',
    role: 'technician' as const,
    isMainAdmin: false,
    isActive: true
  }
];

const demoCustomers = [
  {
    name: 'Acme Corporation',
    email: 'contact@acmecorp.com',
    phone: '(555) 123-4567',
    addressStreet: '123 Business Ave',
    addressCity: 'New York',
    addressState: 'NY',
    addressZipCode: '10001',
    addressCountry: 'USA',
    addressLatitude: 40.7128,
    addressLongitude: -74.0060,
    isActive: true
  },
  {
    name: 'Green Valley Restaurant',
    email: 'manager@greenvalley.com',
    phone: '(555) 234-5678',
    addressStreet: '456 Main St',
    addressCity: 'Los Angeles',
    addressState: 'CA',
    addressZipCode: '90210',
    addressCountry: 'USA',
    addressLatitude: 34.0522,
    addressLongitude: -118.2437,
    isActive: true,
  },
  {
    name: 'Tech Solutions Inc',
    email: 'support@techsolutions.com',
    phone: '(555) 345-6789',
    addressStreet: '789 Silicon Valley Blvd',
    addressCity: 'San Francisco',
    addressState: 'CA',
    addressZipCode: '94105',
    addressCountry: 'USA',
    addressLatitude: 37.7749,
    addressLongitude: -122.4194,
    isActive: true,
  },
  {
    name: 'Downtown Medical Center',
    email: 'facilities@downtownmed.com',
    phone: '(555) 456-7890',
    addressStreet: '321 Health Plaza',
    addressCity: 'Chicago',
    addressState: 'IL',
    addressZipCode: '60601',
    addressCountry: 'USA',
    addressLatitude: 41.8781,
    addressLongitude: -87.6298,
    isActive: true,
  },
  {
    name: 'Sunrise Manufacturing',
    email: 'maintenance@sunrisemanufacturing.com',
    phone: '(555) 567-8901',
    addressStreet: '654 Industrial Way',
    addressCity: 'Houston',
    addressState: 'TX',
    addressZipCode: '77001',
    addressCountry: 'USA',
    addressLatitude: 29.7604,
    addressLongitude: -95.3698,
    isActive: true,
  },
  {
    name: 'Coastal Retail Group',
    email: 'operations@coastalretail.com',
    phone: '(555) 678-9012',
    addressStreet: '987 Ocean Blvd',
    addressCity: 'Miami',
    addressState: 'FL',
    addressZipCode: '33101',
    addressCountry: 'USA',
    addressLatitude: 25.7617,
    addressLongitude: -80.1918,
    isActive: true,
  }
];

const serviceTypes: Array<'New Account' | 'Replacement' | 'Training' | 'Maintenance'> = [
  'New Account',
  'Replacement', 
  'Training',
  'Maintenance'
];

const jobStatuses: Array<'Pending' | 'In Progress' | 'Completed' | 'Cancelled'> = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
const jobPriorities: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomFutureDate(daysAhead: number): Date {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * daysAhead));
  return futureDate;
}

async function seedDemoData() {
  try {
    console.log('Starting demo data seed...');
    
    await sequelize.sync({ force: true });
    console.log('Database synced');

    console.log('Creating demo users...');
    const users = [];
    for (const userData of demoUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });
      users.push(user);
      console.log(`   Created user: ${userData.name} (${userData.role})`);
    }

    console.log('Creating demo customers...');
    const customers = [];
    const adminUser = users.find(u => u.role === 'admin');
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    for (const customerData of demoCustomers) {
      const customer = await Customer.create({
        ...customerData,
        createdBy: adminUser.id
      });
      customers.push(customer);
      console.log(`   Created customer: ${customerData.name}`);
    }

    console.log('Creating demo jobs...');
    const technicians = users.filter(u => u.role === 'technician');
    const jobs = [];

    // Create 100 jobs with various statuses and dates
    for (let i = 0; i < 100; i++) {
      const customer = getRandomElement(customers);
      const assignedTechnician = Math.random() > 0.2 ? getRandomElement(technicians) : null;
      const status = getRandomElement(jobStatuses);
      const priority = getRandomElement(jobPriorities);
      const serviceType = getRandomElement(serviceTypes);
      
      let scheduledDate: Date;
      let completedDate: Date | null = null;
      
      if (status === 'Completed') {
        // Completed jobs are in the past
        scheduledDate = getRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
        completedDate = new Date(scheduledDate.getTime() + (2 + Math.random() * 6) * 60 * 60 * 1000); // 2-8 hours later
      } else if (status === 'Cancelled') {
        // Cancelled jobs could be past or future
        scheduledDate = getRandomDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), getRandomFutureDate(30));
      } else {
        // Pending, In Progress jobs are mostly future
        scheduledDate = getRandomFutureDate(60);
      }

      const estimatedDuration = 60 + Math.random() * 240; // 1-5 hours

      const job = await Job.create({
        jobName: `${serviceType} - ${customer.name}`,
        description: `${serviceType} required at ${customer.name}. ${getRandomElement([
          'Routine maintenance and inspection needed.',
          'Customer reported issues that require immediate attention.',
          'Scheduled upgrade and system optimization.',
          'Emergency repair request - high priority.',
          'Annual service contract fulfillment.',
          'New installation and setup required.',
          'Follow-up service from previous job.',
          'Preventive maintenance to avoid future issues.'
        ])}`,
        customerId: customer.id,
        assignedTo: assignedTechnician?.id || null,
        serviceType,
        priority,
        status,
        scheduledDate,
        estimatedDuration: Math.floor(estimatedDuration),
        completedDate,
        createdBy: adminUser.id
      });

      jobs.push(job);

      if (i % 20 === 0) {
        console.log(`   Created ${i + 1} jobs...`);
      }
    }

    console.log(`Created ${jobs.length} jobs`);

    console.log('Creating job logs...');
    const completedJobs = jobs.filter(j => j.status === 'Completed');
    let logCount = 0;

    for (const job of completedJobs.slice(0, 50)) { // Add logs to first 50 completed jobs
      const logEntries = Math.floor(Math.random() * 3) + 1; // 1-3 log entries per job
      
      for (let i = 0; i < logEntries; i++) {
        const techNotes = getRandomElement([
          'Arrived on site and began initial assessment.',
          'Identified the root cause of the issue.',
          'Completed repair and tested all systems.',
          'Performed thorough cleaning and maintenance.',
          'Installed new components as per specifications.',
          'Conducted final inspection and quality check.',
          'Job completed successfully. Customer satisfied.',
          'Left site in clean condition. All tools accounted for.',
          'Customer provided positive feedback.',
          'Recommended future maintenance schedule.'
        ]);

        const startTime = new Date(job.scheduledDate!.getTime() + i * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + (Math.floor(Math.random() * 180) + 30) * 60 * 1000);

        await JobLog.create({
          jobId: job.id,
          technicianId: job.assignedTo!,
          notes: techNotes,
          photos: [],
          workStartTime: startTime,
          workEndTime: endTime,
          statusUpdate: i === logEntries - 1 ? 'Completed' : 'In Progress'
        });

        logCount++;
      }
    }

    console.log(`Created ${logCount} job log entries`);

    console.log('\nDemo data seed completed successfully!');
    console.log('\nDemo Login Credentials:');
    console.log('===========================================');
    console.log('Admin:       admin@swifttiger.com       / Admin123!');
    console.log('Manager:     manager@swifttiger.com     / Manager123!');
    console.log('Dispatcher:  dispatcher@swifttiger.com / Dispatcher123!');
    console.log('Technician:  tech1@swifttiger.com      / Tech123!');
    console.log('Technician:  tech2@swifttiger.com      / Tech123!');
    console.log('Technician:  tech3@swifttiger.com      / Tech123!');
    console.log('===========================================');
    console.log('\nData Summary:');
    console.log(`   • ${users.length} users created`);
    console.log(`   • ${customers.length} customers created`);
    console.log(`   • ${jobs.length} jobs created`);
    console.log(`   • ${logCount} job logs created`);
    console.log(`   • Job statuses: ${jobStatuses.join(', ')}`);
    console.log(`   • Service types: ${serviceTypes.slice(0, 5).join(', ')}, ...`);
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedDemoData;