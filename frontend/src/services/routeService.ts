import api from '../utils/api';
import { 
  Job, 
  JobCluster, 
  Coordinate, 
  TechnicianWorkload, 
  WorkloadAssignment, 
  AutoAssignmentResult, 
  RouteOptimization,
  JobPriority,
  User,
  ApiResponse,
  JobQueryParams,
} from '@/types';

interface JobsForDateResponse {
  jobs: Job[];
  total: number;
}

interface TravelData {
  distance: number;
  time: number;
}

interface SavedRoute extends RouteOptimization {
  savedAt: string;
  routeName: string;
  id: string;
}

interface TechnicianScore {
  technician: TechnicianWorkload;
  score: number;
  currentWorkload: number;
  travelDistance?: number;
}

export const routeService = {
  async getJobsForDate(date: string, technicianId: string | null = null): Promise<JobsForDateResponse> {
    try {
      console.log('📅 Fetching jobs for date:', date, 'technician:', technicianId);
      const params: JobQueryParams = { 
        scheduledDate: date,
        status: 'Pending,In Progress',
        limit: 50  // Increase limit to get all jobs
      };
      if (technicianId) {
        params.assignedTo = technicianId;
      }
      console.log('📋 Jobs API params:', params);
      
      const response = await api.get<ApiResponse<JobsForDateResponse>>('/jobs', { params });
      console.log('📋 Jobs API response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error fetching jobs:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Geographic clustering using k-means algorithm
  performGeographicClustering(jobs: Job[], numberOfClusters: number = 6): JobCluster[] {
    console.log('🎯 Starting geographic clustering...', {
      totalJobs: jobs?.length || 0,
      numberOfClusters
    });
    
    if (!jobs || jobs.length === 0) {
      console.log('❌ No jobs provided for clustering');
      return [];
    }
    
    // Filter jobs with valid coordinates
    const jobsWithCoords = jobs.filter(job => 
      job.Customer?.addressLatitude && job.Customer?.addressLongitude
    );
    
    console.log('📍 Jobs with coordinates:', {
      totalJobs: jobs.length,
      jobsWithCoords: jobsWithCoords.length,
      missingCoords: jobs.length - jobsWithCoords.length
    });
    
    if (jobsWithCoords.length === 0) {
      console.log('❌ No jobs with valid coordinates found');
      return [];
    }
    
    // Initialize centroids randomly
    let centroids = this.initializeCentroids(jobsWithCoords, numberOfClusters);
    let clusters: Job[][] = [];
    let maxIterations = 50;
    let iteration = 0;
    
    while (iteration < maxIterations) {
      // Assign jobs to nearest centroid
      clusters = this.assignJobsToClusters(jobsWithCoords, centroids);
      
      // Calculate new centroids
      const newCentroids = this.calculateNewCentroids(clusters);
      
      // Check for convergence
      if (this.centroidsConverged(centroids, newCentroids)) {
        break;
      }
      
      centroids = newCentroids;
      iteration++;
    }
    
    const result: JobCluster[] = clusters.map((cluster, index) => ({
      id: index,
      center: centroids[index],
      jobs: cluster,
      region: this.identifyRegion(centroids[index]),
      totalJobs: cluster.length,
      totalDuration: cluster.reduce((sum, job) => sum + (job.estimatedDuration || 60), 0),
      averagePriority: this.calculateAveragePriority(cluster)
    }));
    
    console.log('✅ Geographic clustering completed:', {
      clustersCreated: result.length,
      clustersSummary: result.map(cluster => ({
        region: cluster.region,
        jobs: cluster.totalJobs,
        duration: Math.round(cluster.totalDuration / 60) + 'h'
      }))
    });
    
    return result;
  },

  initializeCentroids(jobs: Job[], numberOfClusters: number): Coordinate[] {
    const centroids: Coordinate[] = [];
    
    // Use job coordinates as initial centroids (better than random)
    const shuffled = [...jobs].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(numberOfClusters, jobs.length); i++) {
      const job = shuffled[i];
      if (job.Customer?.addressLatitude && job.Customer?.addressLongitude) {
        centroids.push({
          lat: parseFloat(job.Customer.addressLatitude.toString()),
          lng: parseFloat(job.Customer.addressLongitude.toString())
        });
      }
    }
    
    return centroids;
  },

  assignJobsToClusters(jobs: Job[], centroids: Coordinate[]): Job[][] {
    const clusters: Job[][] = centroids.map(() => []);
    
    jobs.forEach(job => {
      if (!job.Customer?.addressLatitude || !job.Customer?.addressLongitude) return;
      
      const jobLat = parseFloat(job.Customer.addressLatitude.toString());
      const jobLng = parseFloat(job.Customer.addressLongitude.toString());
      
      let nearestCluster = 0;
      let minDistance = Infinity;
      
      centroids.forEach((centroid, index) => {
        const distance = this.calculateDistance(jobLat, jobLng, centroid.lat, centroid.lng);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCluster = index;
        }
      });
      
      clusters[nearestCluster].push(job);
    });
    
    return clusters;
  },

  calculateNewCentroids(clusters: Job[][]): Coordinate[] {
    return clusters.map(cluster => {
      if (cluster.length === 0) {
        return { lat: 18.2208, lng: -66.5901 }; // Default PR center
      }
      
      const avgLat = cluster.reduce((sum, job) => {
        const lat = job.Customer?.addressLatitude;
        return sum + (lat ? parseFloat(lat.toString()) : 0);
      }, 0) / cluster.length;
      
      const avgLng = cluster.reduce((sum, job) => {
        const lng = job.Customer?.addressLongitude;
        return sum + (lng ? parseFloat(lng.toString()) : 0);
      }, 0) / cluster.length;
      
      return { lat: avgLat, lng: avgLng };
    });
  },

  centroidsConverged(oldCentroids: Coordinate[], newCentroids: Coordinate[], threshold: number = 0.001): boolean {
    for (let i = 0; i < oldCentroids.length; i++) {
      const distance = this.calculateDistance(
        oldCentroids[i].lat, oldCentroids[i].lng,
        newCentroids[i].lat, newCentroids[i].lng
      );
      if (distance > threshold) return false;
    }
    return true;
  },

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  identifyRegion(coordinates: Coordinate): string {
    const regions: Record<string, Coordinate> = {
      'San Juan Metro': { lat: 18.4655, lng: -66.1057 },
      'Bayamon': { lat: 18.3989, lng: -66.1614 },
      'Carolina': { lat: 18.3809, lng: -65.9528 },
      'Guaynabo': { lat: 18.4178, lng: -66.1075 },
      'Caguas': { lat: 18.2342, lng: -66.0356 },
      'Arecibo': { lat: 18.4506, lng: -66.7320 },
      'Mayaguez': { lat: 18.2013, lng: -67.1397 },
      'Ponce': { lat: 18.0113, lng: -66.6140 },
      'Humacao': { lat: 18.1494, lng: -65.8272 },
      'Aguadilla': { lat: 18.4282, lng: -67.1541 }
    };
    
    let nearestRegion = 'Unknown';
    let minDistance = Infinity;
    
    Object.entries(regions).forEach(([region, coords]) => {
      const distance = this.calculateDistance(
        coordinates.lat, coordinates.lng, coords.lat, coords.lng
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestRegion = region;
      }
    });
    
    return nearestRegion;
  },

  calculateAveragePriority(jobs: Job[]): JobPriority {
    const priorityValues: Record<JobPriority, number> = { 'Low': 1, 'Medium': 2, 'High': 3 };
    const avg = jobs.reduce((sum, job) => sum + priorityValues[job.priority], 0) / jobs.length;
    
    if (avg >= 2.5) return 'High';
    if (avg >= 1.5) return 'Medium';
    return 'Low';
  },

  // Auto-assign jobs to technicians based on geographic clusters
  async autoAssignJobsToTechnicians(
    clusters: JobCluster[], 
    technicians: User[], 
    date: string, 
    excludedTechnicianIds: string[] = []
  ): Promise<AutoAssignmentResult> {
    console.log('🎯 Starting auto-assignment process...');
    
    // Filter out non-technicians and excluded technicians
    const availableTechnicians = technicians.filter(tech => 
      tech.role === 'technician' && 
      !excludedTechnicianIds.includes(tech.id) &&
      !tech.isMainAdmin
    );
    
    console.log('📊 Input data:', {
      clustersCount: clusters?.length || 0,
      totalTechnicians: technicians?.length || 0,
      availableTechnicians: availableTechnicians.length,
      excludedCount: excludedTechnicianIds.length,
      excludedTechnicians: technicians
        .filter(t => excludedTechnicianIds.includes(t.id))
        .map(t => t.name),
      date
    });

    // const assignments: WorkloadAssignment[] = [];
    let totalJobsToAssign = 0;
    
    // Calculate total work hours and target per technician
    const totalWorkHours = clusters.reduce((sum, cluster) => sum + cluster.totalDuration, 0);
    const averageWorkPerTech = totalWorkHours / availableTechnicians.length;
    console.log('📊 Work distribution target:', {
      totalHours: Math.round(totalWorkHours / 60),
      averagePerTech: Math.round(averageWorkPerTech / 60) + 'h',
      availableTechnicians: availableTechnicians.length
    });
    
    // Instead of assigning whole clusters, break them down and distribute jobs more evenly
    const allJobs = clusters.flatMap(cluster => 
      cluster.jobs.map(job => ({ ...job, clusterRegion: cluster.region, clusterId: cluster.id }))
    );
    
    // Sort jobs by priority and estimated duration for better distribution
    const sortedJobs = allJobs.sort((a, b) => {
      const priorityOrder: Record<JobPriority, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return (b.estimatedDuration || 60) - (a.estimatedDuration || 60);
    });
    
    console.log('📋 Jobs to distribute:', {
      totalJobs: sortedJobs.length,
      highPriority: sortedJobs.filter(j => j.priority === 'High').length,
      mediumPriority: sortedJobs.filter(j => j.priority === 'Medium').length,
      lowPriority: sortedJobs.filter(j => j.priority === 'Low').length
    });
    
    // Track technician workload (only available technicians)
    const technicianWorkload: TechnicianWorkload[] = availableTechnicians.map(tech => ({
      ...tech,
      assignedJobs: [],
      totalDuration: 0,
      assignedRegions: new Set(),
      jobCount: 0,
      jobs: [],
      specialization: (tech as any).specialization,
      homeBase: (tech as any).homeBase
    }));
    
    console.log('👥 Initial technician workload:', technicianWorkload.map(t => ({
      name: t.name,
      id: t.id,
      specialization: t.specialization,
      homeBase: t.homeBase
    })));
    
    // Distribute jobs one by one to achieve better balance
    for (const job of sortedJobs) {
      console.log(`\n🎯 Assigning job: ${job.jobName} (${(job as any).clusterRegion}, ${job.priority}, ${job.estimatedDuration}min)`);
      
      // Find best technician for this individual job
      let bestTechnician = this.findBestTechnicianForJob(job as any, technicianWorkload, averageWorkPerTech);
      
      if (bestTechnician) {
        console.log(`✅ Assigned job to ${bestTechnician.name} (current load: ${Math.round(bestTechnician.totalDuration/60)}h)`);
        
        // Assign job to technician
        bestTechnician.assignedJobs.push(job);
        bestTechnician.totalDuration += job.estimatedDuration || 60;
        bestTechnician.assignedRegions.add((job as any).clusterRegion);
        bestTechnician.jobCount++;
        totalJobsToAssign++;
        
        // Update job assignment in database
        try {
          await api.put(`/jobs/${job.id}`, {
            assignedTo: bestTechnician.id
          });
          console.log(`✅ Job ${job.id} successfully assigned to ${bestTechnician.name} in database`);
        } catch (error: any) {
          console.error(`❌ Failed to assign job ${job.id} to ${bestTechnician.name}:`, error);
          throw error;
        }
      } else {
        console.log(`⚠️ No suitable technician found for job ${job.jobName}`);
      }
    }
    
    // Create assignment summary grouped by technician and region
    const technicianAssignments = new Map<string, WorkloadAssignment>();
    for (const tech of technicianWorkload) {
      if (tech.assignedJobs.length > 0) {
        technicianAssignments.set(tech.id, {
          technician: tech,
          jobs: tech.assignedJobs,
          regions: Array.from(tech.assignedRegions)
        });
      }
    }
    
    console.log('\n📊 Final assignment summary:');
    console.log(`📝 Total jobs assigned: ${totalJobsToAssign}`);
    console.log(`👥 Technicians with assignments: ${technicianAssignments.size}`);
    
    const finalAssignments = Array.from(technicianAssignments.values());
    finalAssignments.forEach((assignment, index) => {
      console.log(`Assignment ${index + 1}: ${assignment.technician.name} - ${assignment.regions.join(', ')} (${assignment.jobs.length} jobs, ${Math.round(assignment.technician.totalDuration / 60)}h)`);
    });
    
    const balanceScore = this.calculateWorkloadBalance(technicianWorkload);
    console.log(`⚖️ Workload balance score: ${balanceScore.toFixed(1)}%`);
    
    return {
      assignments: finalAssignments,
      workloadDistribution: technicianWorkload,
      balanceScore
    };
  },

  findBestTechnicianForJob(
    job: Job & { clusterRegion: string; clusterId: number }, 
    technicianWorkload: TechnicianWorkload[], 
    averageWorkPerTech: number
  ): TechnicianWorkload | undefined {
    // Score technicians for individual job assignment focusing on workload balance
    const sanJuanCoords = { lat: 18.4655, lng: -66.1057 }; // Starting point
    
    const scores: TechnicianScore[] = technicianWorkload.map(tech => {
      let score = 0;
      
      // Primary factor: Workload balance (heavily weighted)
      const currentWorkload = tech.totalDuration;
      const targetWorkload = averageWorkPerTech;
      const workloadDifference = Math.abs(currentWorkload - targetWorkload);
      
      // Strong preference for technicians below average workload
      if (currentWorkload < targetWorkload) {
        score += 100; // High bonus for under-utilized technicians
        score += Math.max(0, (targetWorkload - currentWorkload) / targetWorkload * 50);
      } else {
        // Penalty for overloading technicians
        score -= workloadDifference / targetWorkload * 75;
      }
      
      // Regional preference (smaller weight now that we focus on balance)
      if (tech.specialization && tech.specialization.includes(job.clusterRegion)) {
        score += 20;
      }
      if (tech.specialization && tech.specialization.includes('All Regions')) {
        score += 10;
      }
      
      // Geographic proximity bonus (moderate weight)
      if (job.Customer?.addressLatitude && job.Customer?.addressLongitude) {
        const travelDistance = this.calculateDistance(
          sanJuanCoords.lat, sanJuanCoords.lng,
          parseFloat(job.Customer.addressLatitude.toString()),
          parseFloat(job.Customer.addressLongitude.toString())
        );
        score += Math.max(0, (100 - travelDistance * 1.5));
      }
      
      // Priority bonus - assign high priority jobs to less loaded technicians
      if (job.priority === 'High' && currentWorkload < targetWorkload) {
        score += 15;
      }
      
      // Regional continuity bonus - slight preference for technicians already working in this region
      if (tech.assignedRegions.has(job.clusterRegion)) {
        score += 5;
      }
      
      return { technician: tech, score, currentWorkload };
    });
    
    // Sort by score and log the decision
    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];
    
    console.log(`🏆 Best technician for ${job.clusterRegion} job:`, {
      selected: best.technician.name,
      score: Math.round(best.score),
      currentWorkload: Math.round(best.currentWorkload / 60 * 10) / 10 + 'h',
      targetWorkload: Math.round(averageWorkPerTech / 60 * 10) / 10 + 'h',
      alternatives: scores.slice(1, 3).map(s => ({
        name: s.technician.name,
        score: Math.round(s.score),
        workload: Math.round(s.currentWorkload / 60 * 10) / 10 + 'h'
      }))
    });
    
    return best?.technician;
  },

  findBestTechnician(cluster: JobCluster, technicianWorkload: TechnicianWorkload[]): TechnicianWorkload | undefined {
    // Score technicians based on workload, regional expertise, and travel from San Juan
    const sanJuanCoords = { lat: 18.4655, lng: -66.1057 }; // Starting point
    
    const scores: TechnicianScore[] = technicianWorkload.map(tech => {
      let score = 0;
      
      // Prefer lower workload (inverse relationship)
      const workloadHours = tech.totalDuration / 60;
      score += (8 - workloadHours) * 15; // Max 8 hour day, prefer less loaded
      
      // Calculate travel distance from San Juan to cluster center
      const travelDistance = this.calculateDistance(
        sanJuanCoords.lat, sanJuanCoords.lng,
        cluster.center.lat, cluster.center.lng
      );
      
      // Prefer closer regions (less travel time from San Juan)
      score += Math.max(0, (100 - travelDistance * 2)); // Closer = higher score
      
      // Balance workload - avoid overloading one technician
      if (workloadHours > 6) {
        score -= (workloadHours - 6) * 25; // Heavy penalty for overloading
      }
      
      // Small bonus for even distribution
      if (workloadHours < 2) {
        score += 10; // Encourage using underutilized technicians
      }
      
      // Prefer regional specialists (smaller bonus now since we start from San Juan)
      if (tech.specialization && tech.specialization.includes(cluster.region)) {
        score += 15;
      }
      
      // Prefer general technicians as fallback
      if (tech.specialization && tech.specialization.includes('All Regions')) {
        score += 8;
      }
      
      return { technician: tech, score, currentWorkload: workloadHours, travelDistance };
    });
    
    // Sort by score and log the decision
    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];
    
    console.log(`🏆 Best technician for ${cluster.region}:`, {
      selected: best.technician.name,
      score: Math.round(best.score),
      travelKm: Math.round(best.travelDistance!),
      currentWorkload: Math.round(best.technician.totalDuration / 60 * 10) / 10 + 'h',
      alternatives: scores.slice(1, 3).map(s => ({
        name: s.technician.name,
        score: Math.round(s.score),
        workload: Math.round(s.technician.totalDuration / 60 * 10) / 10 + 'h'
      }))
    });
    
    return best?.technician;
  },

  calculateWorkloadBalance(workload: TechnicianWorkload[]): number {
    const durations = workload.map(tech => tech.totalDuration / 60);
    const activeTechnicians = durations.filter(d => d > 0);
    
    if (activeTechnicians.length === 0) return 0;
    
    const average = activeTechnicians.reduce((sum, d) => sum + d, 0) / activeTechnicians.length;
    
    // Calculate standard deviation
    const variance = activeTechnicians.reduce((sum, d) => sum + Math.pow(d - average, 2), 0) / activeTechnicians.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Calculate coefficient of variation (CV) - lower is better
    const coefficientOfVariation = average > 0 ? standardDeviation / average : 0;
    
    // Convert to balance score (0-100, where 100 is perfect balance)
    // Good balance: CV < 0.2 (80-100%), Fair: 0.2-0.4 (60-80%), Poor: >0.4 (<60%)
    const balanceScore = Math.max(0, 100 - (coefficientOfVariation * 250));
    
    console.log('⚖️ Balance calculation:', {
      activeTechnicians: activeTechnicians.length,
      averageHours: Math.round(average * 10) / 10,
      stdDeviation: Math.round(standardDeviation * 10) / 10,
      coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
      balanceScore: Math.round(balanceScore)
    });
    
    return balanceScore;
  },

  async optimizeRoute(jobs: Job[], _startLocation: Coordinate | null = null): Promise<RouteOptimization> {
    if (!jobs || jobs.length === 0) {
      return { route: [], totalDistance: 0, totalTime: 0, estimatedCompletionTime: '', clusters: [] };
    }

    // Enhanced optimization with geographic clustering
    const optimizedJobs = [...jobs];
    
    // Sort by geographic proximity and priority
    optimizedJobs.sort((a, b) => {
      // If jobs have coordinates, sort by proximity
      if (a.Customer?.addressLatitude && b.Customer?.addressLatitude) {
        const aLat = parseFloat(a.Customer.addressLatitude.toString());
        const aLng = parseFloat(a.Customer.addressLongitude?.toString() || '0');
        const bLat = parseFloat(b.Customer.addressLatitude.toString());
        const bLng = parseFloat(b.Customer.addressLongitude?.toString() || '0');
        
        // Use centroid of all jobs as reference point
        const centerLat = jobs.reduce((sum, job) => 
          sum + parseFloat(job.Customer?.addressLatitude?.toString() || '18.2208'), 0
        ) / jobs.length;
        const centerLng = jobs.reduce((sum, job) => 
          sum + parseFloat(job.Customer?.addressLongitude?.toString() || '-66.5901'), 0
        ) / jobs.length;
        
        const distanceA = this.calculateDistance(aLat, aLng, centerLat, centerLng);
        const distanceB = this.calculateDistance(bLat, bLng, centerLat, centerLng);
        
        if (Math.abs(distanceA - distanceB) > 5) { // 5km threshold
          return distanceA - distanceB;
        }
      }
      
      // Then sort by priority
      const priorityOrder: Record<JobPriority, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      
      return 0;
    });

    // Calculate realistic travel times and distances
    let totalTime = 0;
    let totalDistance = 0;
    
    optimizedJobs.forEach((job, index) => {
      // Add job duration
      totalTime += job.estimatedDuration || 60;
      
      // Add travel time between jobs
      if (index > 0) {
        const prevJob = optimizedJobs[index - 1];
        const travelData = this.calculateTravelBetweenJobs(prevJob, job);
        totalTime += travelData.time;
        totalDistance += travelData.distance;
      }
    });

    return {
      route: optimizedJobs,
      totalDistance: Math.round(totalDistance),
      totalTime: Math.round(totalTime),
      estimatedCompletionTime: this.calculateCompletionTime(totalTime),
      clusters: jobs.length > 5 ? this.performGeographicClustering(jobs, 3) : []
    };
  },

  calculateTravelBetweenJobs(job1: Job, job2: Job): TravelData {
    if (job1.Customer?.addressLatitude && job2.Customer?.addressLatitude) {
      const distance = this.calculateDistance(
        parseFloat(job1.Customer.addressLatitude.toString()),
        parseFloat(job1.Customer.addressLongitude!.toString()),
        parseFloat(job2.Customer.addressLatitude.toString()),
        parseFloat(job2.Customer.addressLongitude!.toString())
      );
      
      // Estimate travel time: average 40 km/h in PR (traffic considered)
      const travelTime = (distance / 40) * 60; // minutes
      
      return {
        distance: distance,
        time: Math.max(10, travelTime) // Minimum 10 minutes between jobs
      };
    }
    
    // Default estimates if no coordinates
    return {
      distance: Math.random() * 20 + 5, // 5-25 km
      time: Math.random() * 20 + 15     // 15-35 minutes
    };
  },

  calculateCompletionTime(totalMinutes: number): string {
    const startTime = new Date();
    startTime.setHours(8, 0, 0, 0); // Assume work starts at 8 AM
    
    const endTime = new Date(startTime.getTime() + totalMinutes * 60000);
    return endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  async getTechniciansWorkload(date: string): Promise<TechnicianWorkload[]> {
    try {
      console.log('🔍 Fetching technician workload for date:', date);
      const response = await api.get<ApiResponse<User[]>>('/users', { 
        params: { role: 'technician,admin,manager' } 
      });
      console.log('👥 Users API response:', response.data);
      
      const technicians = response.data.data.filter((user: User) => 
        user.role === 'technician' && !user.isMainAdmin
      );
      console.log('🔧 Filtered technicians:', technicians);

      // Get jobs for each technician
      const workloadPromises = technicians.map(async (tech) => {
        console.log(`📋 Fetching jobs for technician ${(tech as any).name} (${(tech as any).id})`);
        const jobsResponse = await this.getJobsForDate(date, (tech as any).id);
        console.log(`📋 Jobs for ${(tech as any).name}:`, jobsResponse);
        const jobs = jobsResponse.jobs || [];
        
        const totalDuration = jobs.reduce((sum, job) => 
          sum + (job.estimatedDuration || 60), 0
        );

        return {
          ...tech,
          jobCount: jobs.length,
          totalDuration,
          jobs,
          assignedJobs: jobs,
          assignedRegions: new Set<string>(),
          specialization: (tech as any).specialization,
          homeBase: (tech as any).homeBase
        };
      });

      const workloadResults = await Promise.all(workloadPromises);
      console.log('📊 Final workload results:', workloadResults);
      return workloadResults;
    } catch (error: any) {
      console.error('❌ Error fetching technician workload:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      return [];
    }
  },

  // Mock function for Google Maps integration
  async calculateRouteWithGoogleMaps(_waypoints: Coordinate[]): Promise<{ distance: number; duration: number; polyline: string }> {
    // This would integrate with Google Maps Routes API
    // For now, return mock data
    return {
      distance: Math.floor(Math.random() * 50) + 20, // km
      duration: Math.floor(Math.random() * 120) + 60, // minutes
      polyline: 'mock_polyline_data'
    };
  },

  // Save optimized route to localStorage
  saveOptimizedRoute(routeData: RouteOptimization, routeName: string | null = null): SavedRoute {
    try {
      const timestamp = new Date().toISOString();
      const savedRoute: SavedRoute = {
        ...routeData,
        savedAt: timestamp,
        routeName: routeName || `Route ${new Date().toLocaleDateString()}`,
        id: `route_${timestamp.replace(/[:.]/g, '_')}`
      };

      // Get existing saved routes
      const existingRoutes = this.getSavedRoutes();
      existingRoutes.push(savedRoute);

      // Keep only last 10 saved routes
      const limitedRoutes = existingRoutes.slice(-10);

      localStorage.setItem('swiftTiger_savedRoutes', JSON.stringify(limitedRoutes));
      return savedRoute;
    } catch (error) {
      console.error('Error saving route:', error);
      throw new Error('Failed to save route');
    }
  },

  // Load saved routes from localStorage
  getSavedRoutes(): SavedRoute[] {
    try {
      const saved = localStorage.getItem('swiftTiger_savedRoutes');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved routes:', error);
      return [];
    }
  },

  // Delete a saved route
  deleteSavedRoute(routeId: string): boolean {
    try {
      const existingRoutes = this.getSavedRoutes();
      const filteredRoutes = existingRoutes.filter(route => route.id !== routeId);
      localStorage.setItem('swiftTiger_savedRoutes', JSON.stringify(filteredRoutes));
      return true;
    } catch (error) {
      console.error('Error deleting route:', error);
      return false;
    }
  },

  // Load a specific saved route
  loadSavedRoute(routeId: string): SavedRoute | null {
    try {
      const savedRoutes = this.getSavedRoutes();
      return savedRoutes.find(route => route.id === routeId) || null;
    } catch (error) {
      console.error('Error loading route:', error);
      return null;
    }
  }
};