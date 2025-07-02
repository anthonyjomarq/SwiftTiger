/**
 * Inventory Management Plugin
 * Adds inventory tracking and parts management functionality
 */

import { USER_ROLES } from '../../types/index.js';

const InventoryPlugin = {
  name: 'inventory',
  version: '1.0.0',
  description: 'Inventory and parts management system',
  author: 'SwiftTiger',
  dependencies: ['auth', 'notification'],
  priority: 50,

  // Plugin initialization
  async initialize(pluginManager) {
    console.log('Initializing Inventory Plugin...');
    
    // Initialize inventory state
    this.inventory = new Map();
    this.partRequests = new Map();
    this.suppliers = new Map();
    this.lowStockThreshold = 10;
    
    // Setup sample data
    this.setupSampleInventory();
    
    return true;
  },

  // Plugin hooks
  hooks: {
    // After job completion, check parts usage
    'job:completed': async (context) => {
      const { job } = context;
      
      if (job.parts_used && job.parts_used.length > 0) {
        await InventoryPlugin.updateInventoryFromJob(job);
      }
      
      return context;
    },

    // Before job assignment, check parts availability
    'job:assign': async (context) => {
      const { job } = context;
      
      if (job.required_parts) {
        const availability = await InventoryPlugin.checkPartsAvailability(job.required_parts);
        context.partsAvailability = availability;
        
        if (!availability.allAvailable) {
          context.warnings = context.warnings || [];
          context.warnings.push('Some required parts may not be in stock');
        }
      }
      
      return context;
    },

    // Daily inventory check
    'system:daily_check': async (context) => {
      await InventoryPlugin.performDailyInventoryCheck();
      return context;
    },
  },

  // Setup sample inventory data
  setupSampleInventory() {
    const sampleParts = [
      { id: 'hvac-filter-001', name: 'HVAC Filter Standard', category: 'HVAC', quantity: 25, unitCost: 15.99, supplier: 'HVAC Supply Co' },
      { id: 'elec-wire-12g', name: '12 AWG Electrical Wire', category: 'Electrical', quantity: 5, unitCost: 89.99, supplier: 'Electric Depot' },
      { id: 'plumb-pipe-1in', name: '1" PVC Pipe', category: 'Plumbing', quantity: 15, unitCost: 12.50, supplier: 'Plumbing World' },
      { id: 'hvac-thermostat', name: 'Digital Thermostat', category: 'HVAC', quantity: 8, unitCost: 125.00, supplier: 'HVAC Supply Co' },
      { id: 'elec-outlet', name: 'GFCI Outlet', category: 'Electrical', quantity: 30, unitCost: 18.99, supplier: 'Electric Depot' },
      { id: 'plumb-valve', name: 'Ball Valve 1/2"', category: 'Plumbing', quantity: 12, unitCost: 25.99, supplier: 'Plumbing World' },
      { id: 'hvac-coil', name: 'Evaporator Coil', category: 'HVAC', quantity: 3, unitCost: 450.00, supplier: 'HVAC Supply Co' },
      { id: 'elec-breaker', name: '20A Circuit Breaker', category: 'Electrical', quantity: 2, unitCost: 35.99, supplier: 'Electric Depot' },
    ];

    sampleParts.forEach(part => {
      this.inventory.set(part.id, {
        ...part,
        lastUpdated: new Date(),
        reorderPoint: this.lowStockThreshold,
        maxStock: part.quantity * 3,
      });
    });

    console.log(`Initialized inventory with ${sampleParts.length} parts`);
  },

  // Update inventory after job completion
  async updateInventoryFromJob(job) {
    const updates = [];
    
    for (const partUsage of job.parts_used) {
      const part = this.inventory.get(partUsage.partId);
      if (part) {
        const newQuantity = Math.max(0, part.quantity - partUsage.quantity);
        part.quantity = newQuantity;
        part.lastUpdated = new Date();
        
        updates.push({
          partId: partUsage.partId,
          oldQuantity: part.quantity + partUsage.quantity,
          newQuantity,
          usedQuantity: partUsage.quantity,
        });
        
        // Check for low stock
        if (newQuantity <= part.reorderPoint) {
          await this.triggerLowStockAlert(part);
        }
      }
    }
    
    console.log('Inventory updated from job completion:', updates);
    return updates;
  },

  // Check parts availability
  async checkPartsAvailability(requiredParts) {
    const availability = {
      allAvailable: true,
      parts: [],
      warnings: [],
    };
    
    for (const requirement of requiredParts) {
      const part = this.inventory.get(requirement.partId);
      if (!part) {
        availability.allAvailable = false;
        availability.warnings.push(`Part ${requirement.partId} not found in inventory`);
        continue;
      }
      
      const available = part.quantity >= requirement.quantity;
      availability.parts.push({
        partId: requirement.partId,
        name: part.name,
        required: requirement.quantity,
        available: part.quantity,
        sufficient: available,
      });
      
      if (!available) {
        availability.allAvailable = false;
        availability.warnings.push(`Insufficient stock for ${part.name}`);
      }
    }
    
    return availability;
  },

  // Trigger low stock alert
  async triggerLowStockAlert(part) {
    const pluginManager = await import('../PluginManager.js').then(m => m.default);
    
    await pluginManager.executeHook('system:alert', {
      level: 'warning',
      message: `Low stock alert: ${part.name} (${part.quantity} remaining)`,
      data: {
        type: 'low_stock',
        partId: part.id,
        partName: part.name,
        currentQuantity: part.quantity,
        reorderPoint: part.reorderPoint,
      },
    });
  },

  // Perform daily inventory check
  async performDailyInventoryCheck() {
    const lowStockParts = Array.from(this.inventory.values())
      .filter(part => part.quantity <= part.reorderPoint);
    
    if (lowStockParts.length > 0) {
      for (const part of lowStockParts) {
        await this.triggerLowStockAlert(part);
      }
    }
    
    console.log(`Daily inventory check completed. ${lowStockParts.length} low stock alerts generated.`);
  },

  // Create parts request
  async createPartRequest(userId, parts, priority = 'normal') {
    const requestId = `REQ-${Date.now()}`;
    const request = {
      id: requestId,
      userId,
      parts,
      priority,
      status: 'pending',
      createdAt: new Date(),
      totalCost: parts.reduce((sum, p) => {
        const part = this.inventory.get(p.partId);
        return sum + (part ? part.unitCost * p.quantity : 0);
      }, 0),
    };
    
    this.partRequests.set(requestId, request);
    
    // Notify managers about new request
    const pluginManager = await import('../PluginManager.js').then(m => m.default);
    await pluginManager.executeHook('notification:send', {
      type: 'part_request',
      recipient: 'role:manager',
      title: 'New Parts Request',
      message: `Parts request ${requestId} created by user ${userId}`,
      data: request,
    });
    
    return request;
  },

  // API endpoints
  apiEndpoints: [
    {
      method: 'GET',
      path: '/api/inventory',
      handler: async (req, res) => {
        const inventory = Array.from(InventoryPlugin.inventory.values());
        
        // Filter by category if specified
        let filteredInventory = inventory;
        if (req.query.category) {
          filteredInventory = inventory.filter(part => 
            part.category.toLowerCase() === req.query.category.toLowerCase()
          );
        }
        
        // Filter by low stock if specified
        if (req.query.lowStock === 'true') {
          filteredInventory = filteredInventory.filter(part => 
            part.quantity <= part.reorderPoint
          );
        }
        
        res.json({
          success: true,
          data: filteredInventory,
          meta: {
            total: filteredInventory.length,
            lowStock: inventory.filter(p => p.quantity <= p.reorderPoint).length,
          },
        });
      },
    },
    
    {
      method: 'GET',
      path: '/api/inventory/:partId',
      handler: async (req, res) => {
        const part = InventoryPlugin.inventory.get(req.params.partId);
        if (!part) {
          return res.status(404).json({ error: 'Part not found' });
        }
        
        res.json({
          success: true,
          data: part,
        });
      },
    },
    
    {
      method: 'PUT',
      path: '/api/inventory/:partId',
      handler: async (req, res) => {
        // Check permissions
        if (![USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(req.user.role)) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        const part = InventoryPlugin.inventory.get(req.params.partId);
        if (!part) {
          return res.status(404).json({ error: 'Part not found' });
        }
        
        // Update part
        const updates = req.body;
        Object.assign(part, updates, { lastUpdated: new Date() });
        
        res.json({
          success: true,
          data: part,
        });
      },
    },
    
    {
      method: 'POST',
      path: '/api/inventory/requests',
      handler: async (req, res) => {
        const { parts, priority } = req.body;
        
        if (!parts || !Array.isArray(parts) || parts.length === 0) {
          return res.status(400).json({ error: 'Parts list is required' });
        }
        
        try {
          const request = await InventoryPlugin.createPartRequest(
            req.user.id,
            parts,
            priority
          );
          
          res.json({
            success: true,
            data: request,
          });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      },
    },
    
    {
      method: 'GET',
      path: '/api/inventory/requests',
      handler: async (req, res) => {
        let requests = Array.from(InventoryPlugin.partRequests.values());
        
        // Filter by user for non-managers
        if (![USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(req.user.role)) {
          requests = requests.filter(request => request.userId === req.user.id);
        }
        
        res.json({
          success: true,
          data: requests,
        });
      },
    },
    
    {
      method: 'GET',
      path: '/api/inventory/analytics',
      handler: async (req, res) => {
        // Only managers and admins can view analytics
        if (![USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(req.user.role)) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        const inventory = Array.from(InventoryPlugin.inventory.values());
        const requests = Array.from(InventoryPlugin.partRequests.values());
        
        const analytics = {
          totalParts: inventory.length,
          totalValue: inventory.reduce((sum, part) => sum + (part.quantity * part.unitCost), 0),
          lowStockCount: inventory.filter(part => part.quantity <= part.reorderPoint).length,
          categories: {},
          recentRequests: requests.filter(req => 
            Date.now() - req.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
          ).length,
        };
        
        // Group by category
        for (const part of inventory) {
          if (!analytics.categories[part.category]) {
            analytics.categories[part.category] = {
              count: 0,
              value: 0,
              lowStock: 0,
            };
          }
          
          analytics.categories[part.category].count++;
          analytics.categories[part.category].value += part.quantity * part.unitCost;
          if (part.quantity <= part.reorderPoint) {
            analytics.categories[part.category].lowStock++;
          }
        }
        
        res.json({
          success: true,
          data: analytics,
        });
      },
    },
  ],

  // Dashboard widgets
  dashboardWidgets: {
    'inventory-overview': {
      name: 'Inventory Overview',
      type: 'stats',
      roles: ['admin', 'manager', 'dispatcher'],
      fetchData: async (context) => {
        const inventory = Array.from(InventoryPlugin.inventory.values());
        const lowStockCount = inventory.filter(part => part.quantity <= part.reorderPoint).length;
        const totalValue = inventory.reduce((sum, part) => sum + (part.quantity * part.unitCost), 0);
        
        return [
          { label: 'Total Parts', value: inventory.length, icon: '📦', color: 'primary' },
          { label: 'Low Stock Items', value: lowStockCount, icon: '⚠️', color: 'warning' },
          { label: 'Inventory Value', value: totalValue, icon: '💰', color: 'success', format: 'currency' },
          { label: 'Categories', value: new Set(inventory.map(p => p.category)).size, icon: '📂', color: 'info' },
        ];
      },
    },
    
    'low-stock-alerts': {
      name: 'Low Stock Alerts',
      type: 'list',
      roles: ['admin', 'manager'],
      fetchData: async (context) => {
        const lowStockParts = Array.from(InventoryPlugin.inventory.values())
          .filter(part => part.quantity <= part.reorderPoint)
          .sort((a, b) => a.quantity - b.quantity)
          .slice(0, 5);
        
        return lowStockParts.map(part => ({
          label: part.name,
          value: `${part.quantity} remaining`,
          status: part.quantity === 0 ? 'critical' : 'warning',
          action: `/inventory/${part.id}`,
        }));
      },
    },
    
    'parts-requests': {
      name: 'Recent Parts Requests',
      type: 'activity',
      roles: ['admin', 'manager'],
      fetchData: async (context) => {
        const recentRequests = Array.from(InventoryPlugin.partRequests.values())
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5);
        
        return recentRequests.map(request => ({
          message: `Parts request ${request.id} for ${request.parts.length} items`,
          timestamp: InventoryPlugin.formatTimeAgo(request.createdAt),
          type: request.priority === 'urgent' ? 'warning' : 'info',
        }));
      },
    },
  },

  // Utility function to format time ago
  formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Less than an hour ago';
  },

  // Components for inventory management
  components: {
    'InventoryList': () => {
      // This would be a React component for displaying inventory
      return null; // Placeholder
    },
    'PartRequestForm': () => {
      // This would be a React component for creating part requests
      return null; // Placeholder
    },
  },
};

export default InventoryPlugin;