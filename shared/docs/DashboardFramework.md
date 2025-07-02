# Unified Dashboard Framework

The SwiftTiger Universal Dashboard Framework provides a complete, responsive dashboard solution that works across all user types and interfaces. Built on the Universal Foundation, it automatically adapts to Admin, Technician, Customer, and Mobile interfaces.

## Overview

The dashboard framework consists of:

- **DashboardProvider** - Context provider for dashboard state and configuration
- **DashboardLayout** - Responsive layout system that adapts to all screen sizes
- **DashboardWidget** - Universal widget component supporting 10+ widget types
- **Dashboard Templates** - Pre-built dashboards for each user role
- **Data Hooks** - Unified data fetching and management

## Quick Start

### Basic Implementation

```jsx
import { Dashboard } from '../shared/components/Dashboard';
import { USER_ROLES, INTERFACE_TYPES } from '../shared/types';

function MyDashboard({ user }) {
  return (
    <Dashboard
      userRole={USER_ROLES.ADMIN}
      interfaceType={INTERFACE_TYPES.ADMIN}
      customConfig={{
        title: 'Custom Dashboard',
        refreshInterval: 30000,
      }}
    />
  );
}
```

### Using Pre-built Templates

```jsx
import { AdminDashboard } from '../shared/templates';

function AdminPage({ user, apiRequest, onNavigate }) {
  return (
    <AdminDashboard
      user={user}
      apiRequest={apiRequest}
      onNavigate={onNavigate}
    />
  );
}
```

## Widget Types

The framework supports 10+ built-in widget types:

### Stats Widget
Displays key metrics in a grid layout.

```jsx
{
  id: 'stats-overview',
  type: 'stats',
  title: 'Overview',
  data: [
    { label: 'Active Jobs', value: 12, icon: '🔧', color: 'info' },
    { label: 'Revenue', value: 15750, icon: '💰', color: 'primary', format: 'currency' },
  ]
}
```

### Chart Widget
Container for data visualizations.

```jsx
{
  id: 'revenue-chart',
  type: 'chart',
  title: 'Revenue Trends',
  size: 'large',
  data: { chartType: 'line', data: [...] }
}
```

### List Widget
Simple list display with actions.

```jsx
{
  id: 'quick-actions',
  type: 'list',
  title: 'Quick Actions',
  data: [
    { label: 'New Job', value: 'Create', action: () => navigate('/jobs/new') },
    { label: 'Reports', value: 'View', action: () => navigate('/reports') },
  ]
}
```

### Progress Widget
Progress bars and completion indicators.

```jsx
{
  id: 'completion-rates',
  type: 'progress',
  title: 'Completion Rates',
  data: [
    { label: 'Jobs Completed', value: 85, color: 'success' },
    { label: 'Customer Satisfaction', value: 92, color: 'primary' },
  ]
}
```

### Activity Widget
Activity feed and timeline.

```jsx
{
  id: 'recent-activity',
  type: 'activity',
  title: 'Recent Activity',
  data: [
    { message: 'Job #1234 completed', timestamp: '2 minutes ago', type: 'success' },
    { message: 'New customer registered', timestamp: '5 minutes ago', type: 'info' },
  ]
}
```

### Table Widget
Data tables with headers and rows.

```jsx
{
  id: 'top-performers',
  type: 'table',
  title: 'Top Performers',
  data: {
    headers: ['Name', 'Jobs', 'Rating'],
    rows: [
      ['John Doe', '45', '4.9'],
      ['Sarah Smith', '42', '4.8'],
    ]
  }
}
```

### System Widget
System health and performance metrics.

```jsx
{
  id: 'system-health',
  type: 'system',
  title: 'System Health',
  data: {
    uptime: '99.9%',
    cpu: 45,
    memory: 62,
  }
}
```

### Metric Widget
Single large metric display.

```jsx
{
  id: 'active-jobs',
  type: 'metric',
  title: 'Active Jobs',
  data: {
    value: 42,
    label: 'Current Active',
    color: 'primary',
    change: 12, // percentage change
  }
}
```

### Map Widget
Placeholder for map integrations.

```jsx
{
  id: 'job-locations',
  type: 'map',
  title: 'Job Locations',
  size: 'large',
}
```

### Calendar Widget
Calendar and scheduling display.

```jsx
{
  id: 'upcoming-jobs',
  type: 'calendar',
  title: 'Upcoming Jobs',
  data: {
    appointments: [...],
  }
}
```

## Layouts

The framework supports three layout modes:

### Grid Layout (Default)
Responsive grid that adapts to screen size.

```jsx
<Dashboard layout="grid" />
```

### Stack Layout
Vertical stacking, ideal for mobile.

```jsx
<Dashboard layout="stack" />
```

### Masonry Layout
Pinterest-style masonry layout.

```jsx
<Dashboard layout="masonry" />
```

## Responsive Behavior

The dashboard automatically adapts based on device type:

### Desktop (Admin Interface)
- 4-column grid layout
- Full customization toolbar
- All widget types available
- 30-second refresh interval

### Tablet
- 2-3 column grid layout
- Simplified toolbar
- Touch-optimized widgets
- 30-second refresh interval

### Mobile (Technician Interface)
- Single column stack layout
- Bottom navigation
- Touch-optimized widgets
- Mobile-specific widgets (Camera, GPS, etc.)
- 30-second refresh interval

### Customer Portal
- 2-column grid on desktop
- Single column on mobile
- Simplified widgets
- 5-minute refresh interval

## User Role Configurations

### Administrator Dashboard
- **Widgets**: System health, user analytics, recent activity, revenue metrics
- **Layout**: 4-column grid
- **Features**: Full customization, export capabilities, system monitoring
- **Refresh**: 30 seconds

### Manager Dashboard
- **Widgets**: Team performance, revenue charts, job analytics, KPIs
- **Layout**: 3-column grid
- **Features**: Performance metrics, team oversight, business intelligence
- **Refresh**: 1 minute

### Dispatcher Dashboard
- **Widgets**: Job queue, technician status, map view, urgent jobs
- **Layout**: 3-column grid
- **Features**: Real-time updates, scheduling tools, resource management
- **Refresh**: 15 seconds (most frequent)

### Technician Dashboard
- **Widgets**: Assigned jobs, schedule, time tracking, quick actions
- **Layout**: Stack on mobile, 2-column on desktop
- **Features**: Mobile-optimized, location services, camera integration
- **Refresh**: 30 seconds

### Customer Dashboard
- **Widgets**: Active requests, service history, account status, quick actions
- **Layout**: 2-column grid, stack on mobile
- **Features**: Simplified interface, service-focused, billing integration
- **Refresh**: 5 minutes

## Customization

### Widget Customization
Users can customize their dashboard by:

- Adding/removing widgets
- Resizing widgets (small, medium, large)
- Reordering widgets
- Changing layout mode

### Persistent Settings
Dashboard customizations are saved to localStorage and persist across sessions.

```jsx
const { customization, updateCustomization } = useDashboardCustomization(userRole);
```

### Data Integration

The framework integrates with your API through the `apiRequest` function:

```jsx
// Custom data fetching
const { data, loading, refresh } = useWidgetData('stats', config, apiRequest);

// Dashboard-wide data management
const dashboardData = useDashboardData(userRole, apiRequest);
```

## Performance Optimizations

### Automatic Optimization
The framework automatically optimizes based on device capabilities:

- **Low-end devices**: Reduced animations, simpler widgets
- **Slow networks**: Longer refresh intervals, cached data
- **Battery optimization**: Reduced background updates
- **High DPI displays**: Crisp graphics and text

### Efficient Updates
- Only visible widgets are refreshed
- Stale-while-revalidate caching strategy
- Debounced user interactions
- Lazy loading for non-critical widgets

## Integration Examples

### Frontend Integration

```jsx
// React Router integration
import { AdminDashboard } from '../shared/templates';
import { useAuth } from '../contexts/AuthContext';

function AdminRoute() {
  const { user, apiRequest } = useAuth();
  const navigate = useNavigate();

  return (
    <AdminDashboard
      user={user}
      apiRequest={apiRequest}
      onNavigate={(path) => navigate(path)}
    />
  );
}
```

### Custom Widget Creation

```jsx
// Create custom widget type
const CustomWidget = ({ data }) => (
  <div className="custom-widget">
    <h3>{data.title}</h3>
    <p>{data.content}</p>
  </div>
);

// Register in DashboardWidget.jsx
case 'custom':
  return <CustomWidget data={data} />;
```

### API Integration

```jsx
// Backend endpoints for dashboard data
app.get('/api/dashboard/stats', async (req, res) => {
  const stats = await getDashboardStats(req.user.role);
  res.json({ data: stats });
});

app.get('/api/admin/system-health', async (req, res) => {
  const health = await getSystemHealth();
  res.json({ data: health });
});
```

## Security Considerations

### Role-based Access
- Widgets are filtered based on user permissions
- Sensitive data is only shown to authorized roles
- API endpoints require proper authentication

### Data Sanitization
- All user input is sanitized
- XSS prevention in widget content
- CSRF protection for dashboard actions

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Migration Guide

### From Existing Dashboards

1. **Identify Current Widgets**: Map existing dashboard elements to framework widget types
2. **Update Data Structure**: Adapt API responses to framework data format
3. **Implement Templates**: Use pre-built templates or create custom ones
4. **Test Responsive Behavior**: Verify on all target devices
5. **Migrate User Preferences**: Transfer existing customizations

### Breaking Changes from v1.0

- Widget data structure updated for consistency
- Layout prop renamed from `mode` to `layout`
- Some widget types consolidated for simplicity

## Best Practices

### Performance
- Use appropriate refresh intervals for each user role
- Implement proper loading states
- Cache data when possible
- Use React.memo for expensive widgets

### UX
- Keep widgets focused on single tasks
- Use consistent color schemes across widgets
- Provide clear loading and error states
- Make touch targets large enough for mobile

### Accessibility
- Use semantic HTML in custom widgets
- Provide alt text for charts and graphs
- Ensure proper keyboard navigation
- Test with screen readers

## Troubleshooting

### Common Issues

**Dashboard not loading**
- Check user role and interface type props
- Verify API endpoints are accessible
- Check browser console for errors

**Widgets not refreshing**
- Verify refresh interval configuration
- Check network connectivity
- Ensure API responses are properly formatted

**Layout issues on mobile**
- Test with responsive provider
- Check CSS custom properties
- Verify touch target sizes

**Performance issues**
- Reduce refresh frequency
- Implement widget virtualization
- Check for memory leaks in custom widgets

## Future Enhancements

- Real-time WebSocket integration
- Advanced chart library integration
- Drag-and-drop widget positioning
- Dashboard sharing and collaboration
- Advanced filtering and search
- Custom widget marketplace

## Support

For framework support and questions:
- Documentation: `/shared/docs/`
- Examples: `/shared/examples/`
- Issues: Project issue tracker
- Community: Developer forum