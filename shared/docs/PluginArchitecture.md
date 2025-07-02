# SwiftTiger Plugin Architecture

The SwiftTiger Plugin Architecture enables rapid development and deployment of new features as modular, self-contained plugins. Built on the Universal Foundation, it provides a complete ecosystem for extending functionality without modifying core code.

## Overview

The plugin system consists of:

- **PluginManager** - Core system for loading, managing, and executing plugins
- **PluginLoader** - Dynamic loading with dependency resolution
- **PluginProvider** - React context for accessing plugins throughout the app
- **Hook System** - Event-driven architecture for plugin communication
- **Component Registry** - Plugin-contributed React components
- **API Integration** - Plugin-provided API endpoints and middleware

## Architecture Principles

### 1. Modularity
Each plugin is completely self-contained with its own:
- Business logic
- API endpoints
- React components
- Dashboard widgets
- Database schemas (if needed)

### 2. Dependency Management
Plugins can declare dependencies on:
- Other plugins
- Core system components
- External libraries

### 3. Event-Driven Design
Plugins communicate through a robust hook system:
- Core system emits hooks at key lifecycle points
- Plugins register handlers for relevant hooks
- Plugins can emit custom hooks for other plugins

### 4. Role-Based Features
Plugin features are automatically filtered based on user roles:
- Dashboard widgets show only for authorized roles
- API endpoints enforce role-based permissions
- Components adapt to user capabilities

## Quick Start

### Creating a Simple Plugin

```javascript
import { createPlugin } from '../shared/plugins';

const MyPlugin = createPlugin({
  name: 'my-feature',
  version: '1.0.0',
  description: 'My awesome feature plugin',
  author: 'Developer Name',
  
  async initialize(pluginManager) {
    console.log('My plugin is starting up!');
    return true;
  },
  
  hooks: {
    'job:completed': async (context) => {
      const { job } = context;
      console.log(`Job ${job.id} was completed!`);
      return context;
    },
  },
  
  apiEndpoints: [
    {
      method: 'GET',
      path: '/api/my-feature/status',
      handler: async (req, res) => {
        res.json({ status: 'active', message: 'My feature is working!' });
      },
    },
  ],
  
  dashboardWidgets: {
    'my-widget': {
      name: 'My Widget',
      type: 'metric',
      roles: ['admin', 'manager'],
      fetchData: async () => ({ value: 42, label: 'My Metric' }),
    },
  },
});

export default MyPlugin;
```

### Loading the Plugin

```javascript
import { PluginManager } from '../shared/plugins';

// Load plugin
await PluginManager.loadPlugin('./plugins/MyPlugin.js');

// Execute hooks
await PluginManager.executeHook('job:completed', { job: { id: 123 } });
```

### Using in React

```jsx
import { PluginProvider, usePlugins } from '../shared/plugins';

function App() {
  return (
    <PluginProvider>
      <MyComponent />
    </PluginProvider>
  );
}

function MyComponent() {
  const { executeHook, getDashboardWidgets } = usePlugins();
  
  const handleJobComplete = async (job) => {
    await executeHook('job:completed', { job });
  };
  
  const widgets = getDashboardWidgets('admin');
  
  return <div>...</div>;
}
```

## Plugin Structure

### Basic Plugin Anatomy

```javascript
const Plugin = {
  // Required metadata
  name: 'plugin-name',
  version: '1.0.0',
  description: 'Plugin description',
  author: 'Author Name',
  
  // Optional configuration
  dependencies: ['auth', 'notification'],
  priority: 50, // Lower = higher priority
  
  // Lifecycle methods
  async initialize(pluginManager) {
    // Plugin startup logic
    return true;
  },
  
  async destroy() {
    // Plugin cleanup logic
    return true;
  },
  
  // Event handlers
  hooks: {
    'system:startup': async (context) => context,
    'user:login': async (context) => context,
    'job:created': async (context) => context,
  },
  
  // HTTP middleware
  middleware: [
    async (req, res, next) => {
      // Middleware logic
      next();
    },
  ],
  
  // API endpoints
  apiEndpoints: [
    {
      method: 'GET',
      path: '/api/plugin/data',
      handler: async (req, res) => {
        res.json({ data: 'plugin data' });
      },
      roles: ['admin'], // Optional role restriction
    },
  ],
  
  // React components
  components: {
    'PluginComponent': MyReactComponent,
    'PluginForm': MyFormComponent,
  },
  
  // Dashboard widgets
  dashboardWidgets: {
    'plugin-stats': {
      name: 'Plugin Statistics',
      type: 'stats',
      roles: ['admin', 'manager'],
      fetchData: async (context) => {
        return [
          { label: 'Items', value: 100, icon: '📊', color: 'primary' },
        ];
      },
    },
  },
};
```

## Hook System

### Core Hooks

The system provides hooks at key lifecycle points:

#### System Hooks
- `system:startup` - System initialization
- `system:shutdown` - System shutdown
- `system:error` - System errors
- `system:alert` - System alerts
- `system:daily_check` - Daily maintenance

#### User Hooks
- `user:login` - User authentication
- `user:logout` - User logout
- `user:register` - User registration
- `user:update` - User profile updates

#### Job Hooks
- `job:created` - New job creation
- `job:updated` - Job modifications
- `job:assigned` - Job assignment
- `job:status_changed` - Status changes
- `job:completed` - Job completion
- `job:deleted` - Job deletion

#### API Hooks
- `api:request` - Before API requests
- `api:response` - After API responses
- `api:error` - API errors

#### Authorization Hooks
- `auth:required` - Authentication required
- `auth:failed` - Authentication failure
- `operation:authorize` - Permission checks

### Custom Hooks

Plugins can emit custom hooks:

```javascript
// In your plugin
await pluginManager.executeHook('my-plugin:custom-event', {
  data: 'custom data',
  timestamp: new Date(),
});

// Other plugins can listen
hooks: {
  'my-plugin:custom-event': async (context) => {
    console.log('Received custom event:', context.data);
    return context;
  },
}
```

### Hook Context

Hooks receive and can modify context objects:

```javascript
hooks: {
  'job:status_changed': async (context) => {
    const { job, oldStatus, newStatus, user } = context;
    
    // Add custom data
    context.customField = 'custom value';
    
    // Modify existing data
    context.processedAt = new Date();
    
    // Return modified context
    return context;
  },
}
```

## API Integration

### Plugin Endpoints

Plugins can register API endpoints:

```javascript
apiEndpoints: [
  {
    method: 'GET',
    path: '/api/inventory/parts',
    handler: async (req, res) => {
      const parts = await getInventoryParts();
      res.json({ success: true, data: parts });
    },
    roles: ['admin', 'manager'], // Role-based access
  },
  
  {
    method: 'POST',
    path: '/api/inventory/request',
    handler: async (req, res) => {
      const request = await createPartRequest(req.body);
      res.json({ success: true, data: request });
    },
    middleware: [validateRequestMiddleware], // Custom middleware
  },
]
```

### Middleware

Plugins can provide middleware for request processing:

```javascript
middleware: [
  // Rate limiting
  async (req, res, next) => {
    const allowed = await checkRateLimit(req.ip);
    if (!allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    next();
  },
  
  // Request logging
  async (req, res, next) => {
    console.log(`${req.method} ${req.path} from ${req.ip}`);
    next();
  },
]
```

## Dashboard Integration

### Widget Types

Plugins can contribute various widget types:

#### Stats Widget
```javascript
'inventory-stats': {
  name: 'Inventory Statistics',
  type: 'stats',
  roles: ['admin', 'manager'],
  fetchData: async () => [
    { label: 'Total Parts', value: 1250, icon: '📦', color: 'primary' },
    { label: 'Low Stock', value: 15, icon: '⚠️', color: 'warning' },
  ],
}
```

#### Chart Widget
```javascript
'sales-chart': {
  name: 'Sales Trends',
  type: 'chart',
  roles: ['admin', 'manager'],
  fetchData: async () => ({
    type: 'line',
    data: [/* chart data */],
  }),
}
```

#### List Widget
```javascript
'recent-orders': {
  name: 'Recent Orders',
  type: 'list',
  roles: ['admin'],
  fetchData: async () => [
    { label: 'Order #1234', value: '$299.99', action: '/orders/1234' },
    { label: 'Order #1235', value: '$150.00', action: '/orders/1235' },
  ],
}
```

#### Activity Widget
```javascript
'system-activity': {
  name: 'System Activity',
  type: 'activity',
  roles: ['admin'],
  fetchData: async () => [
    { message: 'User login: admin@example.com', timestamp: '2 min ago', type: 'info' },
    { message: 'Backup completed successfully', timestamp: '1 hour ago', type: 'success' },
  ],
}
```

### Role-Based Widgets

Widgets are automatically filtered based on user roles:

```javascript
// Widget only shown to admins and managers
dashboardWidgets: {
  'admin-widget': {
    name: 'Admin Only Widget',
    type: 'metric',
    roles: ['admin', 'manager'], // Role restriction
    fetchData: async (context) => {
      // Context includes user information
      const { user } = context;
      return { value: getUserSpecificData(user) };
    },
  },
}
```

## Component System

### Plugin Components

Plugins can contribute React components:

```javascript
import React from 'react';

const InventoryList = ({ items }) => (
  <div className="inventory-list">
    {items.map(item => (
      <div key={item.id} className="inventory-item">
        <h3>{item.name}</h3>
        <p>Quantity: {item.quantity}</p>
      </div>
    ))}
  </div>
);

// Register component
components: {
  'InventoryList': InventoryList,
  'PartRequestForm': PartRequestForm,
}
```

### Using Plugin Components

```jsx
import { usePluginComponent } from '../shared/plugins';

function MyPage() {
  const InventoryList = usePluginComponent('InventoryList');
  
  if (!InventoryList) {
    return <div>Inventory plugin not available</div>;
  }
  
  return <InventoryList items={items} />;
}
```

## Development Workflow

### 1. Plugin Development

```bash
# Create plugin directory
mkdir plugins/my-feature

# Create plugin files
touch plugins/my-feature/index.js
touch plugins/my-feature/components.jsx
touch plugins/my-feature/api.js
```

### 2. Plugin Structure

```
plugins/my-feature/
├── index.js          # Main plugin definition
├── components.jsx    # React components
├── api.js           # API endpoints
├── hooks.js         # Hook handlers
├── widgets.jsx      # Dashboard widgets
├── package.json     # Plugin metadata
└── README.md        # Plugin documentation
```

### 3. Testing Plugins

```javascript
// Plugin test
import { PluginManager } from '../shared/plugins';
import MyPlugin from './MyPlugin.js';

describe('MyPlugin', () => {
  beforeEach(async () => {
    await PluginManager.initialize();
    PluginManager.registerPlugin(MyPlugin);
  });
  
  test('should register successfully', () => {
    const plugin = PluginManager.getPlugin('my-feature');
    expect(plugin).toBeDefined();
    expect(plugin.status).toBe('registered');
  });
  
  test('should handle hooks', async () => {
    const context = { job: { id: 123 } };
    const result = await PluginManager.executeHook('job:completed', context);
    expect(result).toBeDefined();
  });
});
```

### 4. Plugin Deployment

```javascript
// Development deployment
await PluginManager.loadPlugin('./plugins/my-feature/index.js');

// Production deployment
await PluginLoader.installPlugin('/path/to/plugin-package.zip');
```

## Core Plugins

### Authentication Plugin

Handles user authentication and authorization:

```javascript
import { AuthPlugin } from '../shared/plugins';

// Provides hooks:
// - 'api:request' - Authentication validation
// - 'user:login' - Session management
// - 'auth:failed' - Security monitoring

// Provides widgets:
// - 'auth-status' - Authentication statistics
```

### Notification Plugin

Manages multi-channel notifications:

```javascript
import { NotificationPlugin } from '../shared/plugins';

// Provides hooks:
// - 'job:status_changed' - Job notifications
// - 'job:assigned' - Assignment notifications
// - 'system:alert' - System notifications

// Provides API:
// - POST /api/notifications/test - Test notifications
```

### Analytics Plugin

Provides system analytics and monitoring:

```javascript
import { AnalyticsPlugin } from '../shared/plugins';

// Provides hooks:
// - 'user:login' - Usage tracking
// - 'api:request' - API analytics
// - 'job:completed' - Performance metrics

// Provides widgets:
// - 'analytics-overview' - System metrics
// - 'usage-stats' - Usage statistics
```

## Feature Plugins

### Inventory Plugin

Complete inventory management system:

```javascript
import { InventoryPlugin } from '../shared/plugins';

// Features:
// - Parts tracking and management
// - Low stock alerts
// - Parts request system
// - Supplier management

// API endpoints:
// - GET /api/inventory - List parts
// - POST /api/inventory/requests - Create request
// - GET /api/inventory/analytics - Analytics

// Dashboard widgets:
// - 'inventory-overview' - Inventory statistics
// - 'low-stock-alerts' - Stock alerts
// - 'parts-requests' - Recent requests
```

### Billing Plugin

Billing and payment processing:

```javascript
// Features:
// - Invoice generation
// - Payment processing
// - Subscription management
// - Financial reporting

// Hooks:
// - 'job:completed' - Auto-invoicing
// - 'payment:received' - Payment processing

// Components:
// - 'InvoiceGenerator'
// - 'PaymentForm'
// - 'SubscriptionManager'
```

### Reporting Plugin

Advanced reporting and analytics:

```javascript
// Features:
// - Custom report builder
// - Scheduled reports
// - Data export
// - Visualization tools

// Widgets:
// - 'report-builder' - Report creation
// - 'scheduled-reports' - Report management
// - 'data-visualization' - Charts and graphs
```

## Configuration Management

### Plugin Configuration

```javascript
// Global plugin configuration
const pluginConfig = {
  autoLoad: true,
  corePlugins: ['auth', 'notification'],
  featurePlugins: {
    inventory: { 
      enabled: true, 
      config: { lowStockThreshold: 10 } 
    },
    billing: { 
      enabled: false 
    },
  },
  loadingOptions: {
    maxRetries: 3,
    failSafe: true,
  },
};

// Load with configuration
await PluginManager.initialize(pluginConfig);
```

### Environment-Based Loading

```javascript
// Different plugins for different environments
const config = {
  development: {
    featurePlugins: {
      inventory: { enabled: true },
      billing: { enabled: false },
      debugging: { enabled: true },
    },
  },
  production: {
    featurePlugins: {
      inventory: { enabled: true },
      billing: { enabled: true },
      debugging: { enabled: false },
    },
  },
};
```

## Security Considerations

### Plugin Isolation

- Plugins run in isolated contexts
- API endpoints require authentication
- Database access is controlled
- File system access is restricted

### Permission System

```javascript
// Role-based plugin access
hooks: {
  'operation:authorize': async (context) => {
    const { user, operation, resource } = context;
    
    // Check plugin-specific permissions
    if (!hasPluginPermission(user, 'inventory', operation)) {
      throw new Error('Insufficient permissions');
    }
    
    return context;
  },
}
```

### Input Validation

```javascript
apiEndpoints: [
  {
    method: 'POST',
    path: '/api/inventory/parts',
    handler: async (req, res) => {
      // Validate input
      const validation = validatePartData(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      
      // Process request
      const part = await createPart(req.body);
      res.json({ success: true, data: part });
    },
  },
]
```

## Performance Optimization

### Lazy Loading

```javascript
// Load plugins on demand
const loadInventoryPlugin = async () => {
  if (!PluginManager.getPlugin('inventory')) {
    await PluginManager.loadPlugin('./plugins/inventory/index.js');
  }
  return PluginManager.getPlugin('inventory');
};
```

### Caching

```javascript
// Cache plugin data
dashboardWidgets: {
  'cached-widget': {
    name: 'Cached Widget',
    type: 'stats',
    fetchData: async (context) => {
      const cacheKey = `widget-data-${context.user.id}`;
      
      let data = cache.get(cacheKey);
      if (!data) {
        data = await expensiveDataFetch();
        cache.set(cacheKey, data, 300); // 5 minute cache
      }
      
      return data;
    },
  },
}
```

### Background Processing

```javascript
// Process hooks asynchronously
hooks: {
  'job:completed': async (context) => {
    // Queue background processing
    await backgroundQueue.add('process-job-completion', context);
    
    // Return immediately
    return context;
  },
}
```

## Monitoring and Debugging

### Plugin Health Checks

```javascript
// Monitor plugin health
const healthCheck = async () => {
  const status = PluginManager.getStatus();
  
  return {
    healthy: status.errorPlugins === 0,
    totalPlugins: status.totalPlugins,
    activePlugins: status.activePlugins,
    errors: status.errorPlugins,
  };
};
```

### Debug Mode

```javascript
// Enable debug logging
const debugConfig = {
  debug: true,
  verboseLogging: true,
  hookTracing: true,
};

await PluginManager.initialize(debugConfig);
```

### Error Handling

```javascript
// Global error handling
hooks: {
  'system:error': async (context) => {
    const { error, plugin, operation } = context;
    
    console.error(`Plugin ${plugin} error in ${operation}:`, error);
    
    // Send to monitoring service
    await monitoringService.logError({
      plugin,
      operation,
      error: error.message,
      stack: error.stack,
      timestamp: new Date(),
    });
    
    return context;
  },
}
```

## Migration and Updates

### Plugin Versioning

```javascript
// Handle version compatibility
const checkCompatibility = (plugin) => {
  const systemVersion = '1.0.0';
  const pluginRequires = plugin.requiresSystem || '1.0.0';
  
  return semver.satisfies(systemVersion, pluginRequires);
};
```

### Data Migration

```javascript
// Plugin data migration
hooks: {
  'plugin:migrate': async (context) => {
    const { fromVersion, toVersion, data } = context;
    
    if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
      // Migrate data structure
      context.data = migrateData(data);
    }
    
    return context;
  },
}
```

## Best Practices

### Plugin Design

1. **Single Responsibility** - Each plugin should have a focused purpose
2. **Loose Coupling** - Minimize dependencies between plugins
3. **Event-Driven** - Use hooks for communication
4. **Error Handling** - Gracefully handle failures
5. **Performance** - Cache data and use background processing

### Code Organization

```
plugins/
├── core/                 # Core system plugins
│   ├── auth/
│   ├── notification/
│   └── analytics/
├── features/            # Business feature plugins
│   ├── inventory/
│   ├── billing/
│   └── reporting/
├── integrations/        # Third-party integrations
│   ├── stripe/
│   ├── salesforce/
│   └── quickbooks/
└── themes/             # UI themes and customizations
    ├── dark-mode/
    └── mobile-theme/
```

### Testing Strategy

```javascript
// Test plugin isolation
describe('Plugin Isolation', () => {
  test('plugins cannot access each other directly', () => {
    const plugin1 = PluginManager.getPlugin('plugin1');
    const plugin2 = PluginManager.getPlugin('plugin2');
    
    expect(plugin1.canAccess(plugin2)).toBe(false);
  });
});

// Test hook integration
describe('Hook Integration', () => {
  test('hooks execute in correct order', async () => {
    const results = [];
    
    PluginManager.registerPlugin({
      name: 'test1',
      hooks: {
        'test:hook': async (ctx) => {
          results.push('plugin1');
          return ctx;
        },
      },
    });
    
    await PluginManager.executeHook('test:hook', {});
    expect(results).toEqual(['plugin1']);
  });
});
```

## Troubleshooting

### Common Issues

**Plugin fails to load**
- Check plugin syntax and structure
- Verify dependencies are available
- Check for naming conflicts

**Hooks not executing**
- Verify hook names match exactly
- Check plugin initialization status
- Ensure plugins are loaded in correct order

**API endpoints not working**
- Check route conflicts
- Verify authentication requirements
- Test middleware configuration

**Dashboard widgets not appearing**
- Check user role permissions
- Verify widget registration
- Test data fetching functions

### Debug Tools

```javascript
// Plugin system debug
console.log(PluginManager.getStatus());
console.log(PluginLoader.getLoadingStats());

// Hook execution tracing
PluginManager.enableHookTracing();
await PluginManager.executeHook('test:hook', {});
```

The SwiftTiger Plugin Architecture provides a complete foundation for building scalable, modular applications. With its comprehensive hook system, component registry, and development tools, it enables rapid feature development while maintaining code quality and system stability.