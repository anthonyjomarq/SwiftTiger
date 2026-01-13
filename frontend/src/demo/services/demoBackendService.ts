import { Customer, Job, User, JobLog } from '@/shared/types/business';
import { demoAddressSuggestions } from '@/demo/data/demoData';

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
  // Check if we need to reinitialize due to updates
  const currentVersion = localStorage.getItem('demo-data-version');
  if (localStorage.getItem(STORAGE_KEYS.INITIALIZED) && currentVersion === '2.2') {
    return; // Already initialized with correct version
  }

  // Demo customers - Diverse business types with realistic scenarios
  const demoCustomers: Customer[] = [
    {
      id: '1',
      name: 'TechFlow Solutions',
      email: 'facilities@techflow.com',
      phone: '+1-787-555-0100',
      addressStreet: '1250 Ave. Muñoz Rivera, Torre Chardon',
      addressCity: 'San Juan',
      addressState: 'PR',
      addressZipCode: '00918',
      addressCountry: 'US',
      businessType: 'Technology Company',
      region: 'Metropolitan',
      addressPlaceId: 'demo_1',
      addressLatitude: 18.4655,
      addressLongitude: -66.1057,
      createdAt: new Date('2023-11-15'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: '2',
      name: 'Caribbean Medical Center',
      email: 'maintenance@caribmedcenter.com',
      phone: '+1-787-555-0200',
      addressStreet: '456 Ave. Ashford, Suite 302',
      addressCity: 'San Juan',
      addressState: 'PR',
      addressZipCode: '00907',
      addressCountry: 'US',
      businessType: 'Healthcare Facility',
      region: 'Metropolitan',
      addressPlaceId: 'demo_2',
      addressLatitude: 18.4580,
      addressLongitude: -66.1050,
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2024-01-18')
    },
    {
      id: '3',
      name: 'El Jibarito Restaurant',
      email: 'manager@eljibarito.pr',
      phone: '+1-787-555-0300',
      addressStreet: '789 Calle Loíza',
      addressCity: 'Carolina',
      addressState: 'PR',
      addressZipCode: '00979',
      addressCountry: 'US',
      businessType: 'Restaurant',
      region: 'East',
      addressPlaceId: 'demo_3',
      addressLatitude: 18.3951,
      addressLongitude: -66.0764,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-25')
    },
    {
      id: '4',
      name: 'Plaza del Caribe Mall',
      email: 'operations@plazadelcaribe.com',
      phone: '+1-787-555-0400',
      addressStreet: '525 Ave. Franklin Delano Roosevelt',
      addressCity: 'Ponce',
      addressState: 'PR',
      addressZipCode: '00716',
      addressCountry: 'US',
      businessType: 'Shopping Center',
      region: 'South',
      addressPlaceId: 'demo_4',
      addressLatitude: 18.0111,
      addressLongitude: -66.6141,
      createdAt: new Date('2023-10-20'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '5',
      name: 'Sunrise Beach Hotel',
      email: 'maintenance@sunrisebeach.com',
      phone: '+1-787-555-0500',
      addressStreet: '1 Calle Flamboyan',
      addressCity: 'Luquillo',
      addressState: 'PR',
      addressZipCode: '00773',
      addressCountry: 'US',
      businessType: 'Hotel',
      region: 'Northeast',
      addressPlaceId: 'demo_5',
      addressLatitude: 18.3726,
      addressLongitude: -65.7031,
      createdAt: new Date('2023-09-10'),
      updatedAt: new Date('2024-01-22')
    },
    {
      id: '6',
      name: 'Industrial Manufacturing Corp',
      email: 'facilities@indmfg.pr',
      phone: '+1-787-555-0600',
      addressStreet: '2000 Carr. 165, Km 8.2',
      addressCity: 'Toa Baja',
      addressState: 'PR',
      addressZipCode: '00949',
      addressCountry: 'US',
      businessType: 'Manufacturing',
      region: 'North',
      addressPlaceId: 'demo_6',
      addressLatitude: 18.4444,
      addressLongitude: -66.2540,
      createdAt: new Date('2023-08-05'),
      updatedAt: new Date('2024-01-12')
    },
    {
      id: '7',
      name: 'Paradise Elementary School',
      email: 'principal@paradise-school.edu',
      phone: '+1-787-555-0700',
      addressStreet: '45 Calle Las Flores',
      addressCity: 'Bayamón',
      addressState: 'PR',
      addressZipCode: '00956',
      addressCountry: 'US',
      businessType: 'Educational Institution',
      region: 'Central',
      addressPlaceId: 'demo_7',
      addressLatitude: 18.3833,
      addressLongitude: -66.1500,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-28')
    },
    {
      id: '8',
      name: 'Ocean View Office Complex',
      email: 'property@oceanview.pr',
      phone: '+1-787-555-0800',
      addressStreet: '100 Calle del Mar, Building A',
      addressCity: 'Arecibo',
      addressState: 'PR',
      addressZipCode: '00612',
      addressCountry: 'US',
      businessType: 'Office Complex',
      region: 'Northwest',
      addressPlaceId: 'demo_8',
      addressLatitude: 18.4744,
      addressLongitude: -66.7199,
      createdAt: new Date('2023-12-20'),
      updatedAt: new Date('2024-01-16')
    }
  ];

  // Demo users
  const demoUsers: User[] = [
    {
      id: 'demo-admin',
      name: 'Maria Rodriguez',
      email: 'admin@demo.com',
      role: 'admin',
      isMainAdmin: true,
      isActive: true,
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2024-01-20'),
      lastLogin: new Date()
    },
    {
      id: 'demo-manager',
      name: 'Carlos Santos',
      email: 'manager@demo.com',
      role: 'manager',
      isMainAdmin: false,
      isActive: true,
      createdAt: new Date('2023-12-15'),
      updatedAt: new Date('2024-01-18'),
      lastLogin: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
      id: 'demo-dispatcher',
      name: 'Ana Morales',
      email: 'dispatcher@demo.com',
      role: 'dispatcher',
      isMainAdmin: false,
      isActive: true,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-19'),
      lastLogin: new Date(Date.now() - 7200000) // 2 hours ago
    },
    {
      id: 'demo-tech1',
      name: 'Luis Ramirez',
      email: 'tech@demo.com',
      role: 'technician',
      isMainAdmin: false,
      isActive: true,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-19'),
      lastLogin: new Date(Date.now() - 14400000) // 4 hours ago
    },
    {
      id: 'demo-tech2',
      name: 'Jose Martinez',
      email: 'jose.martinez@swifttiger.com',
      role: 'technician',
      isMainAdmin: false,
      isActive: true,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-20'),
      lastLogin: new Date(Date.now() - 86400000) // 1 day ago
    },
    {
      id: 'demo-tech3',
      name: 'Pedro Gonzalez',
      email: 'pedro.gonzalez@swifttiger.com',
      role: 'technician',
      isMainAdmin: false,
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-17'),
      lastLogin: new Date(Date.now() - 172800000) // 2 days ago
    },
    {
      id: 'demo-tech4',
      name: 'Roberto Silva',
      email: 'roberto.silva@swifttiger.com',
      role: 'technician',
      isMainAdmin: false,
      isActive: true,
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-16'),
      lastLogin: new Date(Date.now() - 259200000) // 3 days ago
    },
    {
      id: 'demo-tech5',
      name: 'Elena Vasquez',
      email: 'elena.vasquez@swifttiger.com',
      role: 'technician',
      isMainAdmin: false,
      isActive: true,
      createdAt: new Date('2024-01-22'),
      updatedAt: new Date('2024-01-25'),
      lastLogin: new Date(Date.now() - 1800000) // 30 minutes ago
    },
    {
      id: 'demo-tech6',
      name: 'Miguel Torres',
      email: 'miguel.torres@swifttiger.com',
      role: 'technician',
      isMainAdmin: false,
      isActive: true,
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-24'),
      lastLogin: new Date(Date.now() - 10800000) // 3 hours ago
    },
    {
      id: 'demo-dispatcher2',
      name: 'Sofia Gutierrez',
      email: 'sofia.gutierrez@swifttiger.com',
      role: 'dispatcher',
      isMainAdmin: false,
      isActive: true,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-26'),
      lastLogin: new Date(Date.now() - 5400000) // 1.5 hours ago
    },
    {
      id: 'demo-manager2',
      name: 'Diego Fernandez',
      email: 'diego.fernandez@swifttiger.com',
      role: 'manager',
      isMainAdmin: false,
      isActive: true,
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-23'),
      lastLogin: new Date(Date.now() - 21600000) // 6 hours ago
    },
    {
      id: 'demo-tech7',
      name: 'Carmen Lopez',
      email: 'carmen.lopez@swifttiger.com',
      role: 'technician',
      isMainAdmin: false,
      isActive: true,
      createdAt: new Date('2024-01-11'),
      updatedAt: new Date('2024-01-21'),
      lastLogin: new Date(Date.now() - 43200000) // 12 hours ago
    },
    {
      id: 'demo-tech8',
      name: 'Fernando Ruiz',
      email: 'fernando.ruiz@swifttiger.com',
      role: 'technician',
      isMainAdmin: false,
      isActive: true,
      createdAt: new Date('2024-01-13'),
      updatedAt: new Date('2024-01-22'),
      lastLogin: new Date(Date.now() - 28800000) // 8 hours ago
    }
  ];

  // Demo jobs - Realistic stories with varied statuses and business contexts
  const demoJobs: Job[] = [
    // URGENT: Medical facility critical system
    {
      id: '1',
      jobName: 'Emergency HVAC Repair - Surgery Wing',
      description: 'Critical temperature control failure in surgery wing. Operating room temperatures must be maintained for patient safety. High priority emergency response required.',
      serviceType: 'Maintenance',
      priority: 'High',
      status: 'In Progress',
      scheduledDate: new Date(Date.now() - 3600000).toISOString(), // Started 1 hour ago
      estimatedDuration: 180,
      actualDuration: 120,
      workStartTime: new Date(Date.now() - 3600000),
      customerId: '2',
      assignedTo: 'demo-tech1',
      createdAt: new Date(Date.now() - 7200000), // Created 2 hours ago
      updatedAt: new Date(Date.now() - 1800000), // Updated 30 min ago
      Customer: demoCustomers[1],
      AssignedTechnician: demoUsers[4] // Luis Ramirez
    },
    
    // NEW ACCOUNT: Tech company office setup
    {
      id: '2',
      jobName: 'Complete Office Infrastructure Setup',
      description: 'New tech company expansion. Install networking infrastructure, conference room AV systems, and security cameras. Full building technology integration for 50+ employees.',
      serviceType: 'New Account',
      priority: 'Medium',
      status: 'Pending',
      scheduledDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      estimatedDuration: 480, // 8 hours
      customerId: '1',
      assignedTo: 'demo-tech5', // Elena Vasquez
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      updatedAt: new Date(Date.now() - 43200000), // 12 hours ago
      Customer: demoCustomers[0],
      AssignedTechnician: demoUsers[6]
    },

    // COMPLETED: Restaurant equipment training
    {
      id: '3',
      jobName: 'Kitchen Equipment Training Session',
      description: 'Staff training on new commercial kitchen equipment. Covers proper operation, safety protocols, and basic troubleshooting for new dishwasher and prep equipment.',
      serviceType: 'Training',
      priority: 'Low',
      status: 'Completed',
      scheduledDate: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      estimatedDuration: 120,
      actualDuration: 105,
      workStartTime: new Date(Date.now() - 259200000 + 28800000), // 8 AM start
      workEndTime: new Date(Date.now() - 259200000 + 35700000), // Ended 1h45m later
      customerId: '3',
      assignedTo: 'demo-tech2',
      createdAt: new Date(Date.now() - 604800000), // 1 week ago
      updatedAt: new Date(Date.now() - 255600000), // 3 days ago
      Customer: demoCustomers[2],
      AssignedTechnician: demoUsers[5] // Jose Martinez
    },

    // HIGH PRIORITY: Mall escalator replacement
    {
      id: '4',
      jobName: 'Main Entrance Escalator Replacement',
      description: 'Replace main entrance escalator due to motor failure. Critical for mall accessibility and customer flow. Requires coordination with mall operations and safety protocols.',
      serviceType: 'Replacement',
      priority: 'High',
      status: 'Pending',
      scheduledDate: new Date(Date.now() + 172800000).toISOString(), // In 2 days
      estimatedDuration: 360, // 6 hours
      customerId: '4',
      assignedTo: 'demo-tech6', // Miguel Torres
      createdAt: new Date(Date.now() - 86400000), // Yesterday
      updatedAt: new Date(Date.now() - 21600000), // 6 hours ago
      Customer: demoCustomers[3],
      AssignedTechnician: demoUsers[7]
    },

    // IN PROGRESS: Hotel maintenance
    {
      id: '5',
      jobName: 'Pool Filtration System Maintenance',
      description: 'Quarterly maintenance of hotel pool filtration and chemical systems. Includes equipment inspection, filter replacement, and water quality testing for guest safety.',
      serviceType: 'Maintenance',
      priority: 'Medium',
      status: 'In Progress',
      scheduledDate: new Date(Date.now() - 1800000).toISOString(), // Started 30 min ago
      estimatedDuration: 150,
      workStartTime: new Date(Date.now() - 1800000),
      customerId: '5',
      assignedTo: 'demo-tech3',
      createdAt: new Date(Date.now() - 432000000), // 5 days ago
      updatedAt: new Date(Date.now() - 900000), // 15 min ago
      Customer: demoCustomers[4],
      AssignedTechnician: demoUsers[6] // Pedro Gonzalez
    },

    // NEW ACCOUNT: Manufacturing facility setup
    {
      id: '6',
      jobName: 'Industrial Equipment Installation & Training',
      description: 'Install new production line equipment and train operators. Includes safety system integration, quality control sensors, and comprehensive staff training program.',
      serviceType: 'New Account',
      priority: 'High',
      status: 'Pending',
      scheduledDate: new Date(Date.now() + 345600000).toISOString(), // In 4 days
      estimatedDuration: 720, // 12 hours (2 days)
      customerId: '6',
      assignedTo: 'demo-tech7', // Carmen Lopez
      createdAt: new Date(Date.now() - 518400000), // 6 days ago
      updatedAt: new Date(Date.now() - 259200000), // 3 days ago
      Customer: demoCustomers[5],
      AssignedTechnician: demoUsers[8]
    },

    // COMPLETED: School equipment replacement
    {
      id: '7',
      jobName: 'Classroom Projector System Upgrade',
      description: 'Replace outdated projectors in 12 classrooms with modern smart board systems. Includes installation, network configuration, and teacher training sessions.',
      serviceType: 'Replacement',
      priority: 'Medium',
      status: 'Completed',
      scheduledDate: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
      estimatedDuration: 300,
      actualDuration: 285,
      workStartTime: new Date(Date.now() - 432000000 + 28800000), // 8 AM start
      workEndTime: new Date(Date.now() - 432000000 + 46500000), // 1:15 PM end
      customerId: '7',
      assignedTo: 'demo-tech8', // Fernando Ruiz
      createdAt: new Date(Date.now() - 1209600000), // 2 weeks ago
      updatedAt: new Date(Date.now() - 428400000), // 5 days ago
      Customer: demoCustomers[6],
      AssignedTechnician: demoUsers[9]
    },

    // URGENT: Office building fire safety system
    {
      id: '8',
      jobName: 'Fire Safety System Inspection & Repair',
      description: 'Annual fire safety system inspection revealed several non-compliant issues. Immediate repairs required for occupancy permit renewal. Includes sprinkler heads, alarm panels, and exit lighting.',
      serviceType: 'Maintenance',
      priority: 'High',
      status: 'Pending',
      scheduledDate: new Date(Date.now() + 43200000).toISOString(), // In 12 hours
      estimatedDuration: 240,
      customerId: '8',
      assignedTo: 'demo-tech4', // Roberto Silva
      createdAt: new Date(Date.now() - 129600000), // 1.5 days ago
      updatedAt: new Date(Date.now() - 86400000), // Yesterday
      Customer: demoCustomers[7],
      AssignedTechnician: demoUsers[7]
    },

    // TRAINING: Hotel staff training
    {
      id: '9',
      jobName: 'New POS System Training - Front Desk',
      description: 'Train hotel front desk and restaurant staff on new point-of-sale system. Covers check-in procedures, payment processing, and reporting functions for seamless guest experience.',
      serviceType: 'Training',
      priority: 'Medium',
      status: 'Pending',
      scheduledDate: new Date(Date.now() + 604800000).toISOString(), // Next week
      estimatedDuration: 180,
      customerId: '5',
      assignedTo: 'demo-dispatcher2', // Sofia Gutierrez (dispatcher doing training)
      createdAt: new Date(Date.now() - 345600000), // 4 days ago
      updatedAt: new Date(Date.now() - 172800000), // 2 days ago
      Customer: demoCustomers[4],
      AssignedTechnician: demoUsers[8] // Sofia Gutierrez
    },

    // CANCELLED: Weather-related cancellation
    {
      id: '10',
      jobName: 'Outdoor Digital Signage Installation',
      description: 'Install new LED digital signage at mall entrance. Cancelled due to severe weather conditions and rescheduled pending weather clearance.',
      serviceType: 'New Account',
      priority: 'Low',
      status: 'Cancelled',
      scheduledDate: new Date(Date.now() - 86400000).toISOString(), // Was yesterday
      estimatedDuration: 180,
      customerId: '4',
      assignedTo: 'demo-tech6',
      createdAt: new Date(Date.now() - 345600000), // 4 days ago
      updatedAt: new Date(Date.now() - 64800000), // 18 hours ago
      Customer: demoCustomers[3],
      AssignedTechnician: demoUsers[7] // Miguel Torres
    }
  ];

  // Demo job logs - Detailed progression stories for each job
  const demoJobLogs: JobLog[] = [
    // Job 1: Emergency HVAC Repair - Surgery Wing (In Progress)
    {
      id: '1',
      jobId: '1',
      notes: 'EMERGENCY RESPONSE: Arrived at medical facility. Surgery wing HVAC system showing critical temperature fluctuations. Immediate assessment required.',
      statusUpdate: 'In Progress',
      workStartTime: new Date(Date.now() - 3600000).toISOString(),
      photos: [],
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      jobId: '1',
      notes: 'Diagnostic complete. Main air handler motor bearing failure detected. Temporary cooling system deployed to maintain OR temperatures. Ordering replacement parts.',
      statusUpdate: 'In Progress',
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 2700000), // 45 min ago
      updatedAt: new Date(Date.now() - 2700000)
    },
    {
      id: '3',
      jobId: '1',
      notes: 'Replacement motor installed. Testing system performance. OR temperatures stabilized at 68°F. Monitoring for 30 minutes before final sign-off.',
      statusUpdate: 'In Progress',
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 1800000), // 30 min ago
      updatedAt: new Date(Date.now() - 1800000)
    },

    // Job 3: Kitchen Equipment Training (Completed)
    {
      id: '4',
      jobId: '3',
      notes: 'Arrived at El Jibarito Restaurant. Met with kitchen manager Maria Santos. Beginning training session on new commercial dishwasher and prep equipment.',
      workStartTime: new Date(Date.now() - 259200000 + 28800000).toISOString(),
      photos: [],
      createdAt: new Date(Date.now() - 259200000 + 28800000),
      updatedAt: new Date(Date.now() - 259200000 + 28800000)
    },
    {
      id: '5',
      jobId: '3',
      notes: 'Completed hands-on training with 8 kitchen staff members. Covered proper loading techniques, chemical dispensing, and safety protocols. All staff demonstrated proficiency.',
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 259200000 + 32400000), // 1 hour later
      updatedAt: new Date(Date.now() - 259200000 + 32400000)
    },
    {
      id: '6',
      jobId: '3',
      notes: 'Training completed successfully. Left training materials and emergency contact information. Manager signed off on completion. Equipment running smoothly.',
      statusUpdate: 'Completed',
      workEndTime: new Date(Date.now() - 259200000 + 35700000).toISOString(),
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 259200000 + 35700000),
      updatedAt: new Date(Date.now() - 259200000 + 35700000)
    },

    // Job 5: Pool Filtration System Maintenance (In Progress)
    {
      id: '7',
      jobId: '5',
      notes: 'Starting quarterly maintenance at Sunrise Beach Hotel pool area. Checking chemical levels and filtration system performance.',
      statusUpdate: 'In Progress',
      workStartTime: new Date(Date.now() - 1800000).toISOString(),
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 1800000),
      updatedAt: new Date(Date.now() - 1800000)
    },
    {
      id: '8',
      jobId: '5',
      notes: 'Filter cartridges replaced. Chemical levels adjusted - pH balanced to 7.4. Pool vacuum system cleaned. Testing circulation pump efficiency.',
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 900000), // 15 min ago
      updatedAt: new Date(Date.now() - 900000)
    },

    // Job 7: School Projector Upgrade (Completed)
    {
      id: '9',
      jobId: '7',
      notes: 'Day 1: Arrived at Paradise Elementary School. Beginning projector removal in classrooms 101-106. Coordinating with teachers to minimize class disruption.',
      workStartTime: new Date(Date.now() - 432000000 + 28800000).toISOString(),
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 432000000 + 28800000),
      updatedAt: new Date(Date.now() - 432000000 + 28800000)
    },
    {
      id: '10',
      jobId: '7',
      notes: 'Smart boards installed in 6 classrooms. Network configuration completed. Teachers Ms. Rodriguez and Mr. García received initial training on basic functions.',
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 432000000 + 36000000), // 2 hours later
      updatedAt: new Date(Date.now() - 432000000 + 36000000)
    },
    {
      id: '11',
      jobId: '7',
      notes: 'Day 2: Completed installation in remaining 6 classrooms. All systems tested and calibrated. Comprehensive training session with 12 teachers completed. Principal Mrs. López signed final approval.',
      statusUpdate: 'Completed',
      workEndTime: new Date(Date.now() - 432000000 + 46500000).toISOString(),
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 432000000 + 46500000),
      updatedAt: new Date(Date.now() - 432000000 + 46500000)
    },

    // Job 10: Cancelled Digital Signage (Weather)
    {
      id: '12',
      jobId: '10',
      notes: 'Arrived at Plaza del Caribe Mall for outdoor digital signage installation. Weather conditions deteriorating - high winds and heavy rain approaching.',
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 86400000 + 28800000), // Yesterday 8 AM
      updatedAt: new Date(Date.now() - 86400000 + 28800000)
    },
    {
      id: '13',
      jobId: '10',
      notes: 'Installation cancelled due to severe weather alert. Equipment secured and stored safely. Rescheduling pending weather clearance. Customer notified.',
      statusUpdate: 'Cancelled',
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 86400000 + 32400000), // Yesterday 9 AM
      updatedAt: new Date(Date.now() - 86400000 + 32400000)
    },

    // Additional logs for job variety
    {
      id: '14',
      jobId: '2',
      notes: 'Site survey completed at TechFlow Solutions. Networking infrastructure requirements documented. Conference room AV specifications reviewed with IT manager.',
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 129600000), // 1.5 days ago
      updatedAt: new Date(Date.now() - 129600000)
    },
    {
      id: '15',
      jobId: '4',
      notes: 'Coordination meeting with mall management completed. Escalator shutdown scheduled for low-traffic hours (6 AM - 12 PM). Safety barriers ordered.',
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 43200000), // 12 hours ago
      updatedAt: new Date(Date.now() - 43200000)
    },
    {
      id: '16',
      jobId: '6',
      notes: 'Equipment delivery confirmed for Industrial Manufacturing Corp. Production line shutdown scheduled for next Tuesday. Safety training materials prepared.',
      photos: ['https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=400&h=300&fit=crop'],
      createdAt: new Date(Date.now() - 259200000), // 3 days ago
      updatedAt: new Date(Date.now() - 259200000)
    }
  ];

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(demoCustomers));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(demoUsers));
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(demoJobs));
  localStorage.setItem(STORAGE_KEYS.JOB_LOGS, JSON.stringify(demoJobLogs));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  localStorage.setItem('demo-data-version', '2.2');
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

// Demo authentication service
export const demoAuthService = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    initializeDemoData();
    
    // Check demo credentials
    if (password !== 'demo123') {
      throw new Error('Invalid credentials');
    }
    
    const users = getStoredData<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Create mock token and save auth data
    const token = 'demo-token-' + Date.now();
    localStorage.setItem('swifttiger-token', token);
    localStorage.setItem('swifttiger-user', JSON.stringify(user));
    
    return { token, user };
  }
};