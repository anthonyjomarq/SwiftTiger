// Fuel Cost Tracking Service
// Automatically tracks and calculates fuel costs based on route data

const pool = require('./database');

class FuelTracker {
  constructor() {
    this.defaultCostPerMile = parseFloat(process.env.FUEL_COST_PER_MILE) || 0.56; // IRS standard rate
  }

  // Record fuel costs for a completed job
  async recordJobFuelCost(jobId, technicianId, distance, customCostPerMile = null) {
    try {
      const costPerMile = customCostPerMile || this.defaultCostPerMile;
      const fuelCost = distance * costPerMile;
      const date = new Date().toISOString().split('T')[0];

      const result = await pool.query(`
        INSERT INTO fuel_costs (
          technician_id, job_id, date, distance_miles, 
          fuel_cost, cost_per_mile
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [technicianId, jobId, date, distance, fuelCost, costPerMile]);

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('Record fuel cost error:', error);
      throw error;
    }
  }

  // Calculate fuel costs from route assignments
  async calculateRoutesFuelCosts(date) {
    try {
      const query = `
        SELECT 
          ra.technician_id,
          ra.job_id,
          ra.estimated_travel_distance,
          ra.actual_travel_distance,
          j.title as job_title,
          u.name as technician_name
        FROM route_assignments ra
        JOIN jobs j ON ra.job_id = j.id
        JOIN users u ON ra.technician_id = u.id
        WHERE ra.date = $1
        ORDER BY ra.technician_id, ra.sequence_order
      `;

      const result = await pool.query(query, [date]);
      const assignments = result.rows;

      const fuelCosts = [];

      for (const assignment of assignments) {
        const distance = assignment.actual_travel_distance || assignment.estimated_travel_distance;
        
        if (distance && distance > 0) {
          const fuelCost = await this.recordJobFuelCost(
            assignment.job_id,
            assignment.technician_id,
            distance
          );
          
          fuelCosts.push({
            ...fuelCost.data,
            job_title: assignment.job_title,
            technician_name: assignment.technician_name
          });
        }
      }

      return {
        success: true,
        data: fuelCosts,
        summary: this.calculateFuelSummary(fuelCosts)
      };
    } catch (error) {
      console.error('Calculate routes fuel costs error:', error);
      throw error;
    }
  }

  // Get fuel cost reports with various filters
  async getFuelCostReport(filters = {}) {
    try {
      const { 
        startDate, 
        endDate, 
        technicianId, 
        jobId,
        groupBy = 'technician' // 'technician', 'date', 'job'
      } = filters;

      let query = `
        SELECT 
          fc.*,
          u.name as technician_name,
          u.employee_id,
          j.title as job_title,
          j.address as job_address,
          c.name as customer_name
        FROM fuel_costs fc
        LEFT JOIN users u ON fc.technician_id = u.id
        LEFT JOIN jobs j ON fc.job_id = j.id
        LEFT JOIN users c ON j.customer_id = c.id
        WHERE 1=1
      `;
      const params = [];

      if (startDate) {
        params.push(startDate);
        query += ` AND fc.date >= $${params.length}`;
      }

      if (endDate) {
        params.push(endDate);
        query += ` AND fc.date <= $${params.length}`;
      }

      if (technicianId) {
        params.push(technicianId);
        query += ` AND fc.technician_id = $${params.length}`;
      }

      if (jobId) {
        params.push(jobId);
        query += ` AND fc.job_id = $${params.length}`;
      }

      query += ` ORDER BY fc.date DESC, fc.recorded_at DESC`;

      const result = await pool.query(query, params);
      const fuelCosts = result.rows;

      return {
        success: true,
        data: fuelCosts,
        summary: this.calculateFuelSummary(fuelCosts),
        groupedData: this.groupFuelData(fuelCosts, groupBy)
      };
    } catch (error) {
      console.error('Get fuel cost report error:', error);
      throw error;
    }
  }

  // Calculate summary statistics for fuel costs
  calculateFuelSummary(fuelCosts) {
    if (!fuelCosts || fuelCosts.length === 0) {
      return {
        totalCost: 0,
        totalDistance: 0,
        averageCostPerMile: 0,
        totalJobs: 0,
        averageCostPerJob: 0
      };
    }

    const totalCost = fuelCosts.reduce((sum, cost) => sum + parseFloat(cost.fuel_cost || 0), 0);
    const totalDistance = fuelCosts.reduce((sum, cost) => sum + parseFloat(cost.distance_miles || 0), 0);
    const totalJobs = fuelCosts.length;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      totalDistance: Math.round(totalDistance * 100) / 100,
      averageCostPerMile: totalDistance > 0 ? Math.round((totalCost / totalDistance) * 100) / 100 : 0,
      totalJobs,
      averageCostPerJob: totalJobs > 0 ? Math.round((totalCost / totalJobs) * 100) / 100 : 0
    };
  }

  // Group fuel data by different criteria
  groupFuelData(fuelCosts, groupBy) {
    const grouped = {};

    fuelCosts.forEach(cost => {
      let key;
      
      switch (groupBy) {
        case 'technician':
          key = `${cost.technician_name} (${cost.employee_id || cost.technician_id})`;
          break;
        case 'date':
          key = cost.date;
          break;
        case 'job':
          key = `${cost.job_title} - ${cost.customer_name}`;
          break;
        default:
          key = cost.technician_name;
      }

      if (!grouped[key]) {
        grouped[key] = {
          items: [],
          summary: {
            totalCost: 0,
            totalDistance: 0,
            totalJobs: 0
          }
        };
      }

      grouped[key].items.push(cost);
      grouped[key].summary.totalCost += parseFloat(cost.fuel_cost || 0);
      grouped[key].summary.totalDistance += parseFloat(cost.distance_miles || 0);
      grouped[key].summary.totalJobs += 1;
    });

    // Calculate averages for each group
    Object.keys(grouped).forEach(key => {
      const group = grouped[key];
      group.summary.totalCost = Math.round(group.summary.totalCost * 100) / 100;
      group.summary.totalDistance = Math.round(group.summary.totalDistance * 100) / 100;
      group.summary.averageCostPerMile = group.summary.totalDistance > 0 
        ? Math.round((group.summary.totalCost / group.summary.totalDistance) * 100) / 100 
        : 0;
      group.summary.averageCostPerJob = group.summary.totalJobs > 0 
        ? Math.round((group.summary.totalCost / group.summary.totalJobs) * 100) / 100 
        : 0;
    });

    return grouped;
  }

  // Get fuel efficiency trends
  async getFuelEfficiencyTrends(filters = {}) {
    try {
      const { startDate, endDate, technicianId } = filters;

      let query = `
        SELECT 
          DATE(fc.date) as date,
          fc.technician_id,
          u.name as technician_name,
          SUM(fc.distance_miles) as total_distance,
          SUM(fc.fuel_cost) as total_cost,
          AVG(fc.cost_per_mile) as avg_cost_per_mile,
          COUNT(*) as job_count
        FROM fuel_costs fc
        LEFT JOIN users u ON fc.technician_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (startDate) {
        params.push(startDate);
        query += ` AND fc.date >= $${params.length}`;
      }

      if (endDate) {
        params.push(endDate);
        query += ` AND fc.date <= $${params.length}`;
      }

      if (technicianId) {
        params.push(technicianId);
        query += ` AND fc.technician_id = $${params.length}`;
      }

      query += ` 
        GROUP BY DATE(fc.date), fc.technician_id, u.name
        ORDER BY date DESC, technician_name
      `;

      const result = await pool.query(query, params);

      return {
        success: true,
        data: result.rows,
        trends: this.calculateTrends(result.rows)
      };
    } catch (error) {
      console.error('Get fuel efficiency trends error:', error);
      throw error;
    }
  }

  // Calculate trends from time-series data
  calculateTrends(data) {
    if (!data || data.length < 2) {
      return {
        costTrend: 'stable',
        efficiencyTrend: 'stable',
        averageChange: 0
      };
    }

    // Sort by date
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate trend for cost per mile
    const costs = sortedData.map(d => parseFloat(d.avg_cost_per_mile));
    const costChange = ((costs[costs.length - 1] - costs[0]) / costs[0]) * 100;

    let costTrend = 'stable';
    if (costChange > 5) costTrend = 'increasing';
    else if (costChange < -5) costTrend = 'decreasing';

    return {
      costTrend,
      efficiencyTrend: costTrend === 'increasing' ? 'declining' : costTrend === 'decreasing' ? 'improving' : 'stable',
      averageChange: Math.round(costChange * 100) / 100,
      totalPeriodCost: sortedData.reduce((sum, d) => sum + parseFloat(d.total_cost), 0),
      totalPeriodDistance: sortedData.reduce((sum, d) => sum + parseFloat(d.total_distance), 0)
    };
  }

  // Update cost per mile rates
  async updateFuelRates(newCostPerMile, effectiveDate = null) {
    try {
      const date = effectiveDate || new Date().toISOString().split('T')[0];
      
      // Store historical rate change
      await pool.query(`
        INSERT INTO fuel_rate_history (
          cost_per_mile, effective_date, created_at
        ) VALUES ($1, $2, CURRENT_TIMESTAMP)
      `, [newCostPerMile, date]);

      // Update default rate
      this.defaultCostPerMile = newCostPerMile;

      return {
        success: true,
        message: `Fuel rate updated to $${newCostPerMile} per mile, effective ${date}`
      };
    } catch (error) {
      console.error('Update fuel rates error:', error);
      throw error;
    }
  }

  // Estimate fuel costs for proposed routes
  async estimateRouteFuelCosts(routes, costPerMile = null) {
    const rate = costPerMile || this.defaultCostPerMile;
    const estimates = {};

    Object.entries(routes).forEach(([techId, route]) => {
      const totalDistance = route.totalDistance || 0;
      const totalCost = totalDistance * rate;

      estimates[techId] = {
        technicianId: techId,
        technicianName: route.technician?.name,
        estimatedDistance: totalDistance,
        estimatedFuelCost: Math.round(totalCost * 100) / 100,
        costPerMile: rate,
        jobCount: route.jobs?.length || 0
      };
    });

    const summary = {
      totalEstimatedDistance: Object.values(estimates).reduce((sum, est) => sum + est.estimatedDistance, 0),
      totalEstimatedCost: Object.values(estimates).reduce((sum, est) => sum + est.estimatedFuelCost, 0),
      averageCostPerTechnician: Object.keys(estimates).length > 0 
        ? Object.values(estimates).reduce((sum, est) => sum + est.estimatedFuelCost, 0) / Object.keys(estimates).length 
        : 0
    };

    return {
      success: true,
      estimates,
      summary: {
        ...summary,
        totalEstimatedDistance: Math.round(summary.totalEstimatedDistance * 100) / 100,
        totalEstimatedCost: Math.round(summary.totalEstimatedCost * 100) / 100,
        averageCostPerTechnician: Math.round(summary.averageCostPerTechnician * 100) / 100
      }
    };
  }
}

module.exports = FuelTracker;