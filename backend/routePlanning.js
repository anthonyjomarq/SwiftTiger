// Route Planning Service
// Optimizes technician routes based on travel time, fuel costs, and skill matching

const pool = require('./database');

class RouteOptimizer {
  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.fuelCostPerMile = parseFloat(process.env.FUEL_COST_PER_MILE) || 0.56; // IRS standard rate
  }

  // Main route optimization function
  async optimizeRoutes(date, options = {}) {
    try {
      // Get all pending jobs for the date
      const jobs = await this.getPendingJobs(date);
      
      // Get available technicians with their skills and locations
      const technicians = await this.getAvailableTechnicians(date);
      
      // Calculate job-technician skill matches
      const skillMatches = await this.calculateSkillMatches(jobs, technicians);
      
      // Generate optimal routes for each technician
      const optimizedRoutes = await this.generateOptimalRoutes(jobs, technicians, skillMatches, options);
      
      // Calculate fuel costs and time estimates
      const routesWithCosts = await this.calculateRouteCosts(optimizedRoutes);
      
      return {
        success: true,
        date,
        routes: routesWithCosts,
        summary: this.generateRouteSummary(routesWithCosts)
      };
    } catch (error) {
      console.error('Route optimization error:', error);
      throw error;
    }
  }

  // Get pending jobs for a specific date
  async getPendingJobs(date) {
    const query = `
      SELECT 
        j.id,
        j.title,
        j.description,
        j.address,
        j.latitude,
        j.longitude,
        j.priority,
        j.estimated_duration,
        j.scheduled_time,
        j.customer_id,
        c.name as customer_name,
        c.phone as customer_phone,
        j.required_skills,
        j.service_type
      FROM jobs j
      LEFT JOIN users c ON j.customer_id = c.id
      WHERE j.scheduled_date = $1 
        AND j.status IN ('pending', 'scheduled')
        AND j.assigned_technician IS NULL
      ORDER BY j.priority DESC, j.scheduled_time ASC
    `;
    
    const result = await pool.query(query, [date]);
    return result.rows.map(job => ({
      ...job,
      required_skills: job.required_skills ? JSON.parse(job.required_skills) : [],
      coordinates: job.latitude && job.longitude ? {
        lat: parseFloat(job.latitude),
        lng: parseFloat(job.longitude)
      } : null
    }));
  }

  // Get available technicians with their skills and current/home locations
  async getAvailableTechnicians(date) {
    const query = `
      SELECT 
        t.id,
        t.name,
        t.email,
        t.phone,
        t.skills,
        t.service_area,
        t.home_location_lat,
        t.home_location_lng,
        t.vehicle_type,
        t.max_daily_jobs,
        COALESCE(tl.latitude, t.home_location_lat) as current_lat,
        COALESCE(tl.longitude, t.home_location_lng) as current_lng,
        tl.updated_at as last_location_update
      FROM users t
      LEFT JOIN technician_locations tl ON t.id = tl.technician_id 
        AND tl.id = (
          SELECT id FROM technician_locations 
          WHERE technician_id = t.id 
          ORDER BY updated_at DESC 
          LIMIT 1
        )
      WHERE t.role = 'technician' 
        AND t.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM technician_schedule ts 
          WHERE ts.technician_id = t.id 
            AND ts.date = $1 
            AND ts.status = 'unavailable'
        )
    `;
    
    const result = await pool.query(query, [date]);
    return result.rows.map(tech => ({
      ...tech,
      skills: tech.skills ? JSON.parse(tech.skills) : [],
      service_area: tech.service_area ? JSON.parse(tech.service_area) : null,
      currentLocation: tech.current_lat && tech.current_lng ? {
        lat: parseFloat(tech.current_lat),
        lng: parseFloat(tech.current_lng)
      } : null,
      homeLocation: tech.home_location_lat && tech.home_location_lng ? {
        lat: parseFloat(tech.home_location_lat),
        lng: parseFloat(tech.home_location_lng)
      } : null
    }));
  }

  // Calculate skill match scores between jobs and technicians
  calculateSkillMatches(jobs, technicians) {
    const matches = {};
    
    jobs.forEach(job => {
      matches[job.id] = {};
      
      technicians.forEach(tech => {
        let score = 0;
        let maxScore = 0;
        
        if (job.required_skills && job.required_skills.length > 0) {
          job.required_skills.forEach(requiredSkill => {
            maxScore += 1;
            if (tech.skills.includes(requiredSkill)) {
              score += 1;
            }
          });
          
          // Perfect match bonus
          if (score === maxScore && maxScore > 0) {
            score += 0.5;
          }
        } else {
          // If no specific skills required, all techs are equally qualified
          score = 1;
          maxScore = 1;
        }
        
        // Service area bonus
        if (this.isJobInServiceArea(job, tech)) {
          score += 0.3;
        }
        
        matches[job.id][tech.id] = {
          score: maxScore > 0 ? score / maxScore : 1,
          hasRequiredSkills: maxScore === 0 || score >= maxScore,
          inServiceArea: this.isJobInServiceArea(job, tech)
        };
      });
    });
    
    return matches;
  }

  // Check if job is within technician's service area
  isJobInServiceArea(job, technician) {
    if (!job.coordinates || !technician.service_area) {
      return true; // No restrictions if no coordinates or service area
    }
    
    // Simple radius check (can be enhanced with polygon service areas)
    if (technician.service_area.type === 'radius') {
      const distance = this.calculateDistance(
        job.coordinates,
        technician.service_area.center
      );
      return distance <= technician.service_area.radius;
    }
    
    return true;
  }

  // Generate optimal routes using skill matching and distance optimization
  async generateOptimalRoutes(jobs, technicians, skillMatches, options) {
    const routes = {};
    const assignedJobs = new Set();
    
    // Initialize routes for each technician
    technicians.forEach(tech => {
      routes[tech.id] = {
        technician: tech,
        jobs: [],
        totalDistance: 0,
        totalTime: 0,
        totalFuelCost: 0,
        startLocation: tech.currentLocation || tech.homeLocation,
        waypoints: []
      };
    });

    // Sort jobs by priority and time constraints
    const sortedJobs = [...jobs].sort((a, b) => {
      // Priority first (higher priority = lower number, so reverse sort)
      if (a.priority !== b.priority) {
        return this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
      }
      // Then by scheduled time
      if (a.scheduled_time && b.scheduled_time) {
        return new Date(`1970-01-01T${a.scheduled_time}`) - new Date(`1970-01-01T${b.scheduled_time}`);
      }
      return 0;
    });

    // Assign jobs using skill matching and optimization
    for (const job of sortedJobs) {
      if (assignedJobs.has(job.id)) continue;
      
      const bestAssignment = await this.findBestAssignment(job, technicians, routes, skillMatches);
      
      if (bestAssignment) {
        routes[bestAssignment.technicianId].jobs.push({
          ...job,
          assignmentScore: bestAssignment.score,
          travelDistance: bestAssignment.travelDistance,
          travelTime: bestAssignment.travelTime
        });
        assignedJobs.add(job.id);
      }
    }

    // Optimize the order of jobs within each route
    for (const techId in routes) {
      if (routes[techId].jobs.length > 1) {
        routes[techId] = await this.optimizeJobOrder(routes[techId]);
      }
    }

    return routes;
  }

  // Find the best technician assignment for a job
  async findBestAssignment(job, technicians, currentRoutes, skillMatches) {
    let bestAssignment = null;
    let bestScore = -1;

    for (const tech of technicians) {
      const route = currentRoutes[tech.id];
      
      // Skip if technician is at max capacity
      if (route.jobs.length >= (tech.max_daily_jobs || 8)) {
        continue;
      }

      // Get skill match score
      const skillMatch = skillMatches[job.id][tech.id];
      
      // Skip if technician doesn't have required skills
      if (!skillMatch.hasRequiredSkills) {
        continue;
      }

      // Calculate travel cost if this job is added
      const travelCost = await this.calculateTravelCost(job, route);
      
      // Calculate composite score
      const score = this.calculateAssignmentScore(skillMatch, travelCost, job, tech);
      
      if (score > bestScore) {
        bestScore = score;
        bestAssignment = {
          technicianId: tech.id,
          score,
          travelDistance: travelCost.distance,
          travelTime: travelCost.time,
          skillMatch: skillMatch.score
        };
      }
    }

    return bestAssignment;
  }

  // Calculate assignment score considering skills, travel, and other factors
  calculateAssignmentScore(skillMatch, travelCost, job, technician) {
    // Skill match weight (40%)
    const skillScore = skillMatch.score * 0.4;
    
    // Travel efficiency weight (40%) - lower travel cost = higher score
    const maxTravelCost = 100; // Normalize against max expected travel cost
    const travelScore = Math.max(0, (maxTravelCost - travelCost.cost) / maxTravelCost) * 0.4;
    
    // Priority weight (20%)
    const priorityScore = this.getPriorityWeight(job.priority) / 5 * 0.2;
    
    return skillScore + travelScore + priorityScore;
  }

  // Get numerical weight for priority levels
  getPriorityWeight(priority) {
    const weights = {
      'emergency': 5,
      'urgent': 4,
      'high': 3,
      'normal': 2,
      'low': 1
    };
    return weights[priority] || 2;
  }

  // Calculate travel cost for adding a job to a route
  async calculateTravelCost(job, route) {
    if (!job.coordinates) {
      return { distance: 0, time: 0, cost: 0 };
    }

    let fromLocation = route.startLocation;
    
    // If route has jobs, calculate from the last job location
    if (route.jobs.length > 0) {
      const lastJob = route.jobs[route.jobs.length - 1];
      fromLocation = lastJob.coordinates;
    }

    if (!fromLocation) {
      return { distance: 0, time: 0, cost: 0 };
    }

    const distance = this.calculateDistance(fromLocation, job.coordinates);
    const time = this.estimateTravelTime(distance);
    const cost = distance * this.fuelCostPerMile;

    return { distance, time, cost };
  }

  // Optimize the order of jobs within a route using nearest neighbor algorithm
  async optimizeJobOrder(route) {
    if (route.jobs.length <= 1) {
      return route;
    }

    const optimized = { ...route };
    const unvisited = [...route.jobs];
    const orderedJobs = [];
    let currentLocation = route.startLocation;

    // Find nearest job iteratively
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let shortestDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const job = unvisited[i];
        if (job.coordinates && currentLocation) {
          const distance = this.calculateDistance(currentLocation, job.coordinates);
          
          // Consider both distance and scheduled time
          let adjustedDistance = distance;
          if (job.scheduled_time) {
            const timeWeight = this.getTimeWeight(job.scheduled_time);
            adjustedDistance *= timeWeight;
          }
          
          if (adjustedDistance < shortestDistance) {
            shortestDistance = adjustedDistance;
            nearestIndex = i;
          }
        }
      }

      const nextJob = unvisited.splice(nearestIndex, 1)[0];
      orderedJobs.push(nextJob);
      currentLocation = nextJob.coordinates;
    }

    optimized.jobs = orderedJobs;
    return optimized;
  }

  // Get time weight to prioritize jobs with specific scheduled times
  getTimeWeight(scheduledTime) {
    if (!scheduledTime) return 1;
    
    const now = new Date();
    const scheduled = new Date(`${now.toDateString()} ${scheduledTime}`);
    const hoursDiff = Math.abs(scheduled - now) / (1000 * 60 * 60);
    
    // Prefer jobs scheduled sooner
    return Math.max(0.5, 2 - hoursDiff / 4);
  }

  // Calculate route costs including fuel and time
  async calculateRouteCosts(routes) {
    const costCalculatedRoutes = {};

    for (const [techId, route] of Object.entries(routes)) {
      const routeWithCosts = { ...route };
      let totalDistance = 0;
      let totalTime = 0;
      let currentLocation = route.startLocation;

      const waypoints = [];

      for (let i = 0; i < route.jobs.length; i++) {
        const job = route.jobs[i];
        
        if (job.coordinates && currentLocation) {
          const distance = this.calculateDistance(currentLocation, job.coordinates);
          const travelTime = this.estimateTravelTime(distance);
          
          totalDistance += distance;
          totalTime += travelTime + (job.estimated_duration || 60); // Add job duration
          
          waypoints.push({
            jobId: job.id,
            location: job.coordinates,
            address: job.address,
            travelDistance: distance,
            travelTime: travelTime,
            arrivalTime: this.calculateArrivalTime(route.technician, totalTime)
          });
          
          currentLocation = job.coordinates;
        }
      }

      routeWithCosts.totalDistance = totalDistance;
      routeWithCosts.totalTime = totalTime;
      routeWithCosts.totalFuelCost = totalDistance * this.fuelCostPerMile;
      routeWithCosts.waypoints = waypoints;
      routeWithCosts.estimatedCompletionTime = this.calculateEstimatedCompletion(route.technician, totalTime);

      costCalculatedRoutes[techId] = routeWithCosts;
    }

    return costCalculatedRoutes;
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(from, to) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(to.lat - from.lat);
    const dLon = this.toRadians(to.lng - from.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(from.lat)) * Math.cos(this.toRadians(to.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Estimate travel time based on distance (can be enhanced with real traffic data)
  estimateTravelTime(distanceInMiles) {
    const avgSpeedMph = 35; // Average urban driving speed
    return Math.round(distanceInMiles / avgSpeedMph * 60); // Return minutes
  }

  // Calculate arrival time for a job
  calculateArrivalTime(technician, cumulativeMinutes) {
    const startTime = new Date();
    startTime.setHours(8, 0, 0, 0); // Assume 8 AM start
    
    const arrivalTime = new Date(startTime.getTime() + cumulativeMinutes * 60000);
    return arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Calculate estimated completion time for the entire route
  calculateEstimatedCompletion(technician, totalMinutes) {
    const startTime = new Date();
    startTime.setHours(8, 0, 0, 0); // Assume 8 AM start
    
    const completionTime = new Date(startTime.getTime() + totalMinutes * 60000);
    return completionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Generate summary statistics for all routes
  generateRouteSummary(routes) {
    const summary = {
      totalTechnicians: Object.keys(routes).length,
      totalJobs: 0,
      totalDistance: 0,
      totalFuelCost: 0,
      totalTime: 0,
      averageJobsPerTechnician: 0,
      averageDistancePerTechnician: 0,
      estimatedSavings: 0
    };

    Object.values(routes).forEach(route => {
      summary.totalJobs += route.jobs.length;
      summary.totalDistance += route.totalDistance || 0;
      summary.totalFuelCost += route.totalFuelCost || 0;
      summary.totalTime += route.totalTime || 0;
    });

    if (summary.totalTechnicians > 0) {
      summary.averageJobsPerTechnician = summary.totalJobs / summary.totalTechnicians;
      summary.averageDistancePerTechnician = summary.totalDistance / summary.totalTechnicians;
    }

    // Estimate savings compared to unoptimized routing (rough estimate)
    summary.estimatedSavings = summary.totalFuelCost * 0.25; // Assume 25% savings

    return summary;
  }

  // Save optimized routes to database
  async saveOptimizedRoutes(routes, date) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clear existing route assignments for the date
      await client.query(
        'DELETE FROM route_assignments WHERE date = $1',
        [date]
      );

      // Save new route assignments
      for (const [technicianId, route] of Object.entries(routes)) {
        for (let i = 0; i < route.jobs.length; i++) {
          const job = route.jobs[i];
          
          await client.query(`
            INSERT INTO route_assignments (
              date, technician_id, job_id, sequence_order, 
              estimated_travel_distance, estimated_travel_time,
              estimated_arrival_time, fuel_cost_estimate
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            date,
            technicianId,
            job.id,
            i + 1,
            route.waypoints[i]?.travelDistance || 0,
            route.waypoints[i]?.travelTime || 0,
            route.waypoints[i]?.arrivalTime,
            (route.waypoints[i]?.travelDistance || 0) * this.fuelCostPerMile
          ]);

          // Update job assignment
          await client.query(
            'UPDATE jobs SET assigned_technician = $1, status = $2 WHERE id = $3',
            [technicianId, 'assigned', job.id]
          );
        }
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = RouteOptimizer;