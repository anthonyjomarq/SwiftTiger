# API Services Documentation

This directory contains a modular API service architecture that provides a clean, maintainable, and extensible way to interact with the backend API.

## Architecture Overview

The API services are built on a foundation of a `BaseApi` class that provides common functionality, with specialized service classes extending it for specific domains.

### Core Components

- **`BaseApi`** - Base class with common functionality (interceptors, retry logic, error handling, request cancellation)
- **`AuthService`** - Authentication and user management
- **`JobService`** - Job-related operations
- **`CustomerService`** - Customer management
- **`RouteService`** - Route planning and optimization
- **`NotificationService`** - Notification management
- **`ActivityService`** - Activity logging and tracking

## Features

### ✅ Implemented Features

1. **Modular Architecture** - Each service is self-contained and focused on a specific domain
2. **TypeScript-like JSDoc** - Comprehensive type documentation for better IDE support
3. **Request/Response Interceptors** - Automatic token refresh, global error handling, and request logging
4. **Request Cancellation** - All endpoints support cancellation via AbortController
5. **Retry Logic** - Exponential backoff for failed requests
6. **Request Deduplication** - Prevents duplicate requests
7. **Error Handling** - Standardized error format across all services
8. **Development Logging** - Request/response logging in development mode

### 🔧 Key Features

#### Automatic Token Refresh

```javascript
// Automatically handled by interceptors
// No manual intervention required
```

#### Request Cancellation

```javascript
// All requests can be cancelled
const controller = new AbortController();
const response = await jobService.getAll({}, { signal: controller.signal });

// Cancel the request
controller.abort();
```

#### Retry Logic

```javascript
// Automatic retry with exponential backoff
// Configurable retry conditions and delays
```

## Usage Examples

### Basic Usage (Backward Compatible)

```javascript
import apiService from "./services/api.js";

// Use the main service (backward compatible)
const jobs = await apiService.jobs.getAll();
const customers = await apiService.customers.getAll();
```

### Individual Services

```javascript
import { jobService, customerService, authService } from "./services/index.js";

// Use individual services
const jobs = await jobService.getAll();
const customers = await customerService.getAll();
const user = await authService.getCurrentUser();
```

### React Hook Usage

```javascript
import { useApi } from "./services/index.js";

function MyComponent() {
  const { loading, error, callApi } = useApi();

  const handleFetchJobs = async () => {
    try {
      const jobs = await callApi(() => jobService.getAll());
      // Handle success
    } catch (error) {
      // Error is automatically handled and set in state
    }
  };

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      <button onClick={handleFetchJobs}>Fetch Jobs</button>
    </div>
  );
}
```

### Advanced Usage with Request Cancellation

```javascript
import { jobService } from "./services/index.js";

class JobManager {
  constructor() {
    this.currentRequest = null;
  }

  async fetchJobs(params) {
    // Cancel previous request if it exists
    if (this.currentRequest) {
      this.currentRequest.abort();
    }

    // Create new AbortController
    this.currentRequest = new AbortController();

    try {
      const response = await jobService.request({
        method: "GET",
        url: "/jobs",
        params,
        signal: this.currentRequest.signal,
      });
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was cancelled");
        return;
      }
      throw error;
    }
  }

  cancelCurrentRequest() {
    if (this.currentRequest) {
      this.currentRequest.abort();
      this.currentRequest = null;
    }
  }
}
```

## Service-Specific Examples

### Authentication Service

```javascript
import { authService } from "./services/index.js";

// Login
const authResponse = await authService.login({
  email: "user@example.com",
  password: "password123",
});

// Check authentication status
const isAuthenticated = authService.isAuthenticated();

// Get current user
const user = await authService.getCurrentUser();
```

### Job Service

```javascript
import { jobService } from "./services/index.js";

// Get all jobs with filters
const jobs = await jobService.getAll({
  status: "pending",
  priority: "high",
  page: 1,
  limit: 20,
});

// Create a new job
const newJob = await jobService.create({
  title: "New Job",
  description: "Job description",
  customerId: "customer123",
  status: "pending",
  priority: "medium",
  scheduledDate: new Date(),
});

// Update job status
await jobService.updateStatus("job123", {
  status: "in_progress",
  notes: "Started working on the job",
});
```

### Customer Service

```javascript
import { customerService } from "./services/index.js";

// Search customers
const customers = await customerService.search("john", {
  city: "New York",
  limit: 10,
});

// Get customers by location
const nyCustomers = await customerService.getByLocation("New York", "NY");

// Validate email
const emailValidation = await customerService.validateEmail("user@example.com");
```

### Route Service

```javascript
import { routeService } from "./services/index.js";

// Optimize route
const optimizedRoute = await routeService.optimize({
  jobs: jobList,
  startLocation: { lat: 40.7128, lng: -74.006 },
  options: {
    algorithm: "nearest_neighbor",
    avoidTolls: true,
    travelMode: "driving",
  },
});

// Calculate ETAs
const etas = await routeService.calculateETA({
  route: optimizedRoute.optimizedRoute,
  startLocation: { lat: 40.7128, lng: -74.006 },
  startTime: new Date(),
  options: {
    includeTraffic: true,
    jobDuration: 30,
  },
});
```

## Error Handling

All services use standardized error handling:

```javascript
try {
  const result = await jobService.getAll();
} catch (error) {
  // Error object has standardized format:
  // {
  //   type: 'validation' | 'auth' | 'permission' | 'network' | 'server' | 'unknown',
  //   message: 'Error message',
  //   details: {} // Additional error details
  // }

  switch (error.type) {
    case "auth":
      // Handle authentication errors
      break;
    case "validation":
      // Handle validation errors
      break;
    case "network":
      // Handle network errors
      break;
    default:
    // Handle other errors
  }
}
```

## Configuration

### Environment Variables

```bash
# API base URL
VITE_API_URL=http://localhost:5000/api

# Development mode (enables request/response logging)
NODE_ENV=development
```

### Custom Configuration

```javascript
import { BaseApi } from "./services/index.js";

// Create custom service with specific configuration
class CustomService extends BaseApi {
  constructor() {
    super({
      baseURL: "https://custom-api.com",
      timeout: 60000,
      headers: {
        "X-Custom-Header": "value",
      },
    });
  }
}
```

## Migration Guide

### From Old API Service

**Before:**

```javascript
import apiService from "./services/api.js";

const jobs = await apiService.jobs.getAll();
```

**After:**

```javascript
// Option 1: Use new main service (backward compatible)
import apiService from "./services/api.js";
const jobs = await apiService.jobs.getAll();

// Option 2: Use individual service (recommended)
import { jobService } from "./services/index.js";
const jobs = await jobService.getAll();
```

## Best Practices

1. **Use Individual Services** - Import specific services rather than the main service for better tree-shaking
2. **Handle Errors** - Always wrap API calls in try-catch blocks
3. **Cancel Requests** - Cancel requests when components unmount or when making new requests
4. **Use React Hook** - Use the `useApi` hook for components that need loading states
5. **Type Safety** - Leverage JSDoc comments for better IDE support and type checking

## Contributing

When adding new services:

1. Extend the `BaseApi` class
2. Add comprehensive JSDoc documentation
3. Include proper error handling
4. Add the service to the main `ApiService` class
5. Export it from the index file
6. Update this documentation

## Troubleshooting

### Common Issues

1. **Token Refresh Issues** - Check that refresh tokens are properly stored
2. **Request Cancellation** - Ensure AbortController is properly configured
3. **CORS Issues** - Verify API base URL configuration
4. **Network Errors** - Check retry configuration and network connectivity

### Debug Mode

Enable debug logging by setting `NODE_ENV=development`:

```bash
# Request/response logging will be enabled
NODE_ENV=development npm run dev
```
