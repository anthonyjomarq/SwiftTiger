import api from '../utils/api';
import { 
  Customer, 
  Job, 
  User, 
  Coordinate, 
  RegionMap, 
  PuertoRicoRegion, 
  ServiceType, 
  JobPriority,
  ApiResponse,
  UserRole
} from '@/types';

// Puerto Rico geographic regions with approximate coordinates
const PUERTO_RICO_REGIONS: RegionMap = {
  'San Juan Metro': {
    center: { lat: 18.4655, lng: -66.1057 },
    radius: 0.1 // degrees
  },
  'Bayamon': {
    center: { lat: 18.3989, lng: -66.1614 },
    radius: 0.08
  },
  'Carolina': {
    center: { lat: 18.3809, lng: -65.9528 },
    radius: 0.08
  },
  'Guaynabo': {
    center: { lat: 18.4178, lng: -66.1075 },
    radius: 0.06
  },
  'Caguas': {
    center: { lat: 18.2342, lng: -66.0356 },
    radius: 0.1
  },
  'Arecibo': {
    center: { lat: 18.4506, lng: -66.7320 },
    radius: 0.1
  },
  'Mayaguez': {
    center: { lat: 18.2013, lng: -67.1397 },
    radius: 0.1
  },
  'Ponce': {
    center: { lat: 18.0113, lng: -66.6140 },
    radius: 0.1
  },
  'Humacao': {
    center: { lat: 18.1494, lng: -65.8272 },
    radius: 0.08
  },
  'Aguadilla': {
    center: { lat: 18.4282, lng: -67.1541 },
    radius: 0.08
  }
};

interface SampleCustomerData {
  name: string;
  region: PuertoRicoRegion;
  address: string;
  businessType: string;
}

interface SampleTechnicianData {
  name: string;
  email: string;
  specialization: string;
  homeBase: PuertoRicoRegion;
}

interface CustomerCreatePayload {
  name: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressCountry: string;
  addressLatitude: number;
  addressLongitude: number;
  addressPlaceId: string;
}

interface UserCreatePayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
}

interface JobCreatePayload {
  jobName: string;
  description: string;
  customerId: string;
  serviceType: ServiceType;
  priority: JobPriority;
  assignedTo: string;
  scheduledDate: string;
  estimatedDuration: number;
}

interface SampleDataSummary {
  techniciansCreated: number;
  customersCreated: number;
  jobsCreated: number;
  regionsUsed: string[];
  targetDate: string;
}

interface InitializationResult {
  technicians: User[];
  customers: Customer[];
  jobs: Job[];
  summary: SampleDataSummary;
}

interface CustomerListResponse {
  customers?: Customer[];
  data?: Customer[];
}

const SAMPLE_CUSTOMERS: SampleCustomerData[] = [
  // San Juan Metro area
  { name: 'Plaza Las Americas', region: 'San Juan Metro', address: 'Plaza Las Americas, San Juan', businessType: 'Mall' },
  { name: 'Hospital San Jorge', region: 'San Juan Metro', address: 'Hospital San Jorge, Santurce', businessType: 'Hospital' },
  { name: 'Universidad de Puerto Rico', region: 'San Juan Metro', address: 'UPR Rio Piedras Campus', businessType: 'University' },
  
  // Bayamon area
  { name: 'Centro Comercial Western Plaza', region: 'Bayamon', address: 'Western Plaza, Bayamon', businessType: 'Mall' },
  { name: 'Hospital Hima San Pablo', region: 'Bayamon', address: 'Hima San Pablo Bayamon', businessType: 'Hospital' },
  { name: 'Walmart Bayamon', region: 'Bayamon', address: 'Walmart Supercenter Bayamon', businessType: 'Retail' },
  
  // Carolina area
  { name: 'Luis Munoz Marin Airport', region: 'Carolina', address: 'Aeropuerto Luis Munoz Marin, Carolina', businessType: 'Airport' },
  { name: 'Plaza Carolina', region: 'Carolina', address: 'Plaza Carolina Shopping Center', businessType: 'Mall' },
  { name: 'Hotel El San Juan', region: 'Carolina', address: 'El San Juan Hotel, Isla Verde', businessType: 'Hotel' },
  
  // Guaynabo area
  { name: 'San Patricio Plaza', region: 'Guaynabo', address: 'San Patricio Plaza, Guaynabo', businessType: 'Mall' },
  { name: 'Banco Popular Center', region: 'Guaynabo', address: 'Banco Popular Center, Guaynabo', businessType: 'Office' },
  { name: 'Metro Office Park', region: 'Guaynabo', address: 'Metro Office Park, Guaynabo', businessType: 'Office' },
  
  // Caguas area
  { name: 'Plaza del Carmen Mall', region: 'Caguas', address: 'Plaza del Carmen, Caguas', businessType: 'Mall' },
  { name: 'Hospital Hima Caguas', region: 'Caguas', address: 'Hima San Pablo Caguas', businessType: 'Hospital' },
  { name: 'Centro Gov. Luis A. Ferre', region: 'Caguas', address: 'Centro Gubernamental Caguas', businessType: 'Government' },
  
  // Arecibo area
  { name: 'Plaza del Atlantico', region: 'Arecibo', address: 'Plaza del Atlantico, Arecibo', businessType: 'Mall' },
  { name: 'Hospital Dr. Susoni', region: 'Arecibo', address: 'Hospital Dr. Susoni, Arecibo', businessType: 'Hospital' },
  { name: 'Observatorio de Arecibo', region: 'Arecibo', address: 'Observatorio de Arecibo', businessType: 'Research' },
  
  // Mayaguez area
  { name: 'Mayaguez Mall', region: 'Mayaguez', address: 'Mayaguez Mall', businessType: 'Mall' },
  { name: 'Hospital Bella Vista', region: 'Mayaguez', address: 'Hospital Bella Vista, Mayaguez', businessType: 'Hospital' },
  { name: 'Universidad de PR Mayaguez', region: 'Mayaguez', address: 'UPRM Campus, Mayaguez', businessType: 'University' },
  
  // Ponce area
  { name: 'Plaza del Caribe', region: 'Ponce', address: 'Plaza del Caribe, Ponce', businessType: 'Mall' },
  { name: 'Hospital San Lucas', region: 'Ponce', address: 'Hospital San Lucas, Ponce', businessType: 'Hospital' },
  { name: 'Museo de Arte de Ponce', region: 'Ponce', address: 'Museo de Arte de Ponce', businessType: 'Museum' },
  
  // Humacao area
  { name: 'Palmas del Mar', region: 'Humacao', address: 'Palmas del Mar Resort, Humacao', businessType: 'Resort' },
  { name: 'Plaza Humacao', region: 'Humacao', address: 'Plaza Humacao Shopping', businessType: 'Mall' },
  { name: 'Universidad del Este', region: 'Humacao', address: 'Universidad del Este, Humacao', businessType: 'University' },
  
  // Aguadilla area
  { name: 'Aguadilla Mall', region: 'Aguadilla', address: 'Aguadilla Mall', businessType: 'Mall' },
  { name: 'Rafael Hernandez Airport', region: 'Aguadilla', address: 'Aeropuerto Rafael Hernandez, Aguadilla', businessType: 'Airport' },
  { name: 'Ramey Base', region: 'Aguadilla', address: 'Former Ramey Air Force Base, Aguadilla', businessType: 'Industrial' }
];

const SAMPLE_TECHNICIANS: SampleTechnicianData[] = [
  { name: 'Carlos Rodriguez', email: 'carlos.rodriguez@swifttiger.com', specialization: 'San Juan Metro, Carolina', homeBase: 'San Juan Metro' },
  { name: 'Maria Santos', email: 'maria.santos@swifttiger.com', specialization: 'Bayamon, Guaynabo', homeBase: 'Bayamon' },
  { name: 'Jose Rivera', email: 'jose.rivera@swifttiger.com', specialization: 'Caguas, Humacao', homeBase: 'Caguas' },
  { name: 'Ana Morales', email: 'ana.morales@swifttiger.com', specialization: 'Arecibo, Aguadilla', homeBase: 'Arecibo' },
  { name: 'Luis Garcia', email: 'luis.garcia@swifttiger.com', specialization: 'Ponce, Mayaguez', homeBase: 'Ponce' },
  { name: 'Carmen Diaz', email: 'carmen.diaz@swifttiger.com', specialization: 'All Regions', homeBase: 'San Juan Metro' }
];

const SERVICE_TYPES: ServiceType[] = ['New Account', 'Replacement', 'Training', 'Maintenance'];
const PRIORITIES: JobPriority[] = ['Low', 'Medium', 'High'];

export const sampleDataService = {
  generateRandomCoordinate(region: PuertoRicoRegion): Coordinate {
    const regionData = PUERTO_RICO_REGIONS[region];
    if (!regionData) return { lat: 18.2208, lng: -66.5901 }; // Default to PR center
    
    const randomLat = regionData.center.lat + (Math.random() - 0.5) * regionData.radius;
    const randomLng = regionData.center.lng + (Math.random() - 0.5) * regionData.radius;
    
    return { lat: randomLat, lng: randomLng };
  },

  async createSampleTechnicians(): Promise<User[]> {
    console.log('Creating technicians...');
    const technicians: User[] = [];
    
    for (const techData of SAMPLE_TECHNICIANS) {
      try {
        console.log(`Creating technician: ${techData.name}`);
        const payload: UserCreatePayload = {
          name: techData.name,
          email: techData.email,
          password: 'technician123', // Default password
          role: 'technician',
          isActive: true
        };
        console.log('Payload:', payload);
        
        const response = await api.post<ApiResponse<User>>('/users', payload);
        console.log(`✅ Created technician ${techData.name}:`, response.data);
        
        technicians.push({
          ...response.data.data,
          // Add custom properties that aren't part of the base User type
          ...(techData as any)
        });
      } catch (error: any) {
        console.error(`❌ Error creating technician ${techData.name}:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        if (error.response?.status === 400 && error.response?.data?.message?.includes('email')) {
          console.log(`⚠️ Technician ${techData.name} already exists, skipping...`);
        }
      }
      
      // Add delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🔧 Finished creating technicians. Created: ${technicians.length}`);
    return technicians;
  },

  async createSampleCustomers(): Promise<Customer[]> {
    console.log('Creating customers...');
    const customers: Customer[] = [];
    
    for (const customerData of SAMPLE_CUSTOMERS) {
      const coordinates = this.generateRandomCoordinate(customerData.region);
      
      try {
        console.log(`Creating customer: ${customerData.name} in ${customerData.region}`);
        const payload: CustomerCreatePayload = {
          name: customerData.name,
          email: `${customerData.name.toLowerCase().replace(/\s+/g, '.')}@business.pr`,
          phone: `(787) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          addressStreet: customerData.address,
          addressCity: customerData.region,
          addressState: 'PR',
          addressZipCode: `00${Math.floor(Math.random() * 900) + 100}`,
          addressCountry: 'US',
          addressLatitude: coordinates.lat,
          addressLongitude: coordinates.lng,
          addressPlaceId: `place_${customerData.name.toLowerCase().replace(/\s+/g, '_')}`
        };
        console.log('Customer payload:', payload);
        
        const response = await api.post<ApiResponse<Customer>>('/customers', payload);
        console.log(`✅ Created customer ${customerData.name}:`, response.data);
        
        customers.push({
          ...response.data.data,
          region: customerData.region,
          businessType: customerData.businessType
        });
      } catch (error: any) {
        console.error(`❌ Error creating customer ${customerData.name}:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        if (error.response?.status === 400 && error.response?.data?.message?.includes('email')) {
          console.log(`⚠️ Customer ${customerData.name} already exists, skipping...`);
        }
      }
      
      // Add delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    console.log(`🏢 Finished creating customers. Created: ${customers.length}`);
    return customers;
  },

  async createSampleJobs(customers: Customer[], technicians: User[], targetDate: string): Promise<Job[]> {
    console.log('Creating jobs...');
    console.log(`Target customers: ${customers.length}, technicians: ${technicians.length}, date: ${targetDate}`);
    const jobs: Job[] = [];
    
    if (customers.length === 0) {
      console.error('❌ No customers available for job creation');
      return jobs;
    }
    
    if (technicians.length === 0) {
      console.error('❌ No technicians available for job creation');
      return jobs;
    }
    
    for (let i = 0; i < 30; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const technician = this.assignTechnicianToRegion(customer.region!, technicians);
      const serviceType = SERVICE_TYPES[Math.floor(Math.random() * SERVICE_TYPES.length)];
      const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
      
      // Generate job name based on service type and business
      const businessType = customer.businessType || 'General Business';
      const jobName = `${serviceType} - ${businessType} Service`;
      
      // Calculate estimated duration based on service type
      const baseDuration: Record<ServiceType, number> = {
        'New Account': 90,
        'Replacement': 45,
        'Training': 45,
        'Maintenance': 45
      };
      
      const estimatedDuration = baseDuration[serviceType] + Math.floor(Math.random() * 30) - 15; // ±15 min variation
      
      try {
        console.log(`Creating job ${i + 1}/30: ${jobName} for ${customer.name}`);
        const payload: JobCreatePayload = {
          jobName,
          description: `${serviceType} service for ${customer.name}. ${this.generateJobDescription(serviceType, customer.businessType!)}`,
          customerId: customer.id,
          serviceType,
          priority,
          assignedTo: technician.id,
          scheduledDate: targetDate,
          estimatedDuration
        };
        console.log('Job payload:', payload);
        
        const response = await api.post<ApiResponse<Job>>('/jobs', payload);
        console.log(`✅ Created job ${i + 1}: ${jobName}`, response.data);
        
        jobs.push({
          ...response.data.data,
          region: customer.region,
          Customer: customer,
          AssignedTechnician: technician
        });
      } catch (error: any) {
        console.error(`❌ Error creating job ${i + 1} for ${customer.name}:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
      }
      
      // Add delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`💼 Finished creating jobs. Created: ${jobs.length}`);
    return jobs;
  },

  assignTechnicianToRegion(region: string, technicians: User[]): User {
    // Find technician specialized in this region
    const specialist = technicians.find(tech => {
      const specialization = (tech as any).specialization;
      return specialization && specialization.includes(region);
    });
    
    if (specialist) return specialist;
    
    // Find technician with home base nearby
    const nearby = technicians.find(tech => {
      const homeBase = (tech as any).homeBase;
      return homeBase === region;
    });
    if (nearby) return nearby;
    
    // Assign to general technician (Carmen Diaz - All Regions)
    const general = technicians.find(tech => {
      const specialization = (tech as any).specialization;
      return specialization && specialization.includes('All Regions');
    });
    
    if (general) return general;
    
    // Fallback to random technician
    return technicians[Math.floor(Math.random() * technicians.length)];
  },

  generateJobDescription(serviceType: ServiceType, businessType: string): string {
    const descriptions: Record<ServiceType, Record<string, string>> = {
      'New Account': {
        'Mall': 'Install and configure new POS systems across multiple retail locations.',
        'Hospital': 'Set up medical equipment monitoring systems and staff training.',
        'University': 'Deploy campus-wide network infrastructure and student access systems.',
        'Office': 'Install business communication systems and employee training.',
        'Airport': 'Configure security and passenger information systems.',
        'Hotel': 'Set up guest services and property management systems.',
        'Retail': 'Install inventory management and customer service systems.',
        'Government': 'Deploy secure communication and document management systems.',
        'Research': 'Install specialized data collection and analysis equipment.',
        'Museum': 'Set up visitor information and security monitoring systems.',
        'Resort': 'Configure guest services and entertainment systems.',
        'Industrial': 'Install industrial monitoring and safety systems.'
      },
      'Replacement': {
        'Mall': 'Replace faulty POS terminals and update software.',
        'Hospital': 'Replace defective medical monitoring equipment.',
        'University': 'Replace network hardware and update access controls.',
        'Office': 'Replace communication equipment and update systems.',
        'Airport': 'Replace security cameras and information displays.',
        'Hotel': 'Replace guest room technology and update systems.',
        'Retail': 'Replace inventory scanners and update software.',
        'Government': 'Replace secure communication equipment.',
        'Research': 'Replace data collection sensors and equipment.',
        'Museum': 'Replace visitor information kiosks and security equipment.',
        'Resort': 'Replace entertainment systems and guest services technology.',
        'Industrial': 'Replace safety monitoring equipment and sensors.'
      },
      'Training': {
        'Mall': 'Provide staff training on new POS and security systems.',
        'Hospital': 'Train medical staff on equipment operation and troubleshooting.',
        'University': 'Train IT staff and provide user orientation sessions.',
        'Office': 'Train employees on new communication and workflow systems.',
        'Airport': 'Train security and operations staff on new systems.',
        'Hotel': 'Train front desk and maintenance staff on guest systems.',
        'Retail': 'Train store associates on inventory and customer service systems.',
        'Government': 'Provide security training and system operation guidance.',
        'Research': 'Train researchers on new equipment and data systems.',
        'Museum': 'Train staff on visitor systems and security protocols.',
        'Resort': 'Train hospitality staff on guest services technology.',
        'Industrial': 'Provide safety training and equipment operation guidance.'
      },
      'Maintenance': {
        'Mall': 'Perform routine maintenance on POS and security systems.',
        'Hospital': 'Conduct preventive maintenance on medical equipment.',
        'University': 'Perform network maintenance and system updates.',
        'Office': 'Routine maintenance of communication and business systems.',
        'Airport': 'Maintenance of security and passenger information systems.',
        'Hotel': 'Preventive maintenance of guest room and lobby systems.',
        'Retail': 'Regular maintenance of inventory and sales systems.',
        'Government': 'Scheduled maintenance of secure communication systems.',
        'Research': 'Calibration and maintenance of research equipment.',
        'Museum': 'Maintenance of visitor information and security systems.',
        'Resort': 'Routine maintenance of entertainment and guest systems.',
        'Industrial': 'Preventive maintenance of safety and monitoring systems.'
      }
    };
    
    return descriptions[serviceType]?.[businessType] || `${serviceType} service required.`;
  },

  async initializeAllSampleData(targetDate: string = new Date().toISOString().split('T')[0]): Promise<InitializationResult> {
    try {
      console.log('📋 Using existing data approach...');
      
      // Get existing technicians and customers
      console.log('🔍 Fetching existing technicians...');
      const techniciansResponse = await api.get<ApiResponse<User[]>>('/users?role=technician,admin,manager');
      const existingTechnicians = techniciansResponse.data.data.filter((user: any) => 
        ['technician', 'admin', 'manager'].includes(user.role)
      );
      console.log(`✅ Found ${existingTechnicians.length} existing technicians`);
      
      console.log('🔍 Fetching existing customers...');
      const customersResponse = await api.get<ApiResponse<CustomerListResponse>>('/customers?limit=50');
      const existingCustomers = customersResponse.data.data.customers || customersResponse.data.data || [];
      console.log(`✅ Found ${existingCustomers.length} existing customers`);
      
      if (existingTechnicians.length === 0) {
        console.log('⚠️ No technicians found, creating sample technicians...');
        const newTechnicians = await this.createSampleTechnicians();
        existingTechnicians.push(...newTechnicians);
      }
      
      if (existingCustomers.length === 0) {
        console.log('⚠️ No customers found, creating sample customers...');
        const newCustomers = await this.createSampleCustomers();
        existingCustomers.push(...newCustomers);
      }
      
      console.log('🎯 Creating jobs for existing data...');
      const jobs = await this.createSampleJobs(existingCustomers, existingTechnicians, targetDate);
      
      return {
        technicians: existingTechnicians,
        customers: existingCustomers,
        jobs,
        summary: {
          techniciansCreated: existingTechnicians.length,
          customersCreated: existingCustomers.length,
          jobsCreated: jobs.length,
          regionsUsed: Object.keys(PUERTO_RICO_REGIONS),
          targetDate
        }
      };
    } catch (error) {
      console.error('❌ Error initializing sample data:', error);
      throw error;
    }
  }
};