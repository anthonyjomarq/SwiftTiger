# Error Handling System Documentation

This directory contains a comprehensive error handling system for the SwiftTiger frontend application. The system provides centralized error handling, parsing, reporting, and user-friendly notifications.

## Overview

The error handling system consists of several key components:

1. **Error Handler Utilities** (`errorHandler.js`) - Core error parsing and handling logic
2. **Toast Notification System** (`toast.js`) - User-friendly notification system
3. **React Hooks** (`useErrorHandler.js`) - React-specific error handling hooks
4. **Error Boundary Component** - React error boundary with integrated reporting

## Quick Start

### Basic Usage

```jsx
import { useErrorHandler } from "../hooks/useErrorHandler";
import { toast } from "../utils/toast";

function MyComponent() {
  const { handleError, handleSubmit, isLoading } = useErrorHandler({
    context: { type: "my_component" },
  });

  const handleApiCall = async () => {
    try {
      const response = await fetch("/api/data");
      if (!response.ok) throw new Error("API call failed");
      return response.json();
    } catch (error) {
      handleError(error, { action: "fetch_data" });
    }
  };

  const handleFormSubmit = handleSubmit(
    async (formData) => {
      const response = await fetch("/api/submit", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Submission failed");
      return response.json();
    },
    {
      successMessage: "Form submitted successfully!",
      errorContext: { action: "submit_form" },
    }
  );

  return (
    <div>
      <button onClick={handleApiCall} disabled={isLoading}>
        {isLoading ? "Loading..." : "Fetch Data"}
      </button>
    </div>
  );
}
```

## Core Components

### 1. Error Handler Utilities (`errorHandler.js`)

#### Error Types

```javascript
import { ERROR_TYPES, ERROR_SEVERITY } from "../utils/errorHandler";

// Available error types
ERROR_TYPES.NETWORK; // Network connectivity issues
ERROR_TYPES.VALIDATION; // Input validation errors
ERROR_TYPES.AUTHENTICATION; // Authentication failures
ERROR_TYPES.AUTHORIZATION; // Permission/authorization errors
ERROR_TYPES.NOT_FOUND; // Resource not found
ERROR_TYPES.SERVER; // Server-side errors
ERROR_TYPES.CLIENT; // Client-side errors
ERROR_TYPES.UNKNOWN; // Unknown/unclassified errors

// Error severity levels
ERROR_SEVERITY.LOW; // Minor issues
ERROR_SEVERITY.MEDIUM; // Moderate issues
ERROR_SEVERITY.HIGH; // Significant issues
ERROR_SEVERITY.CRITICAL; // Critical issues
```

#### API Error Parsing

```javascript
import { parseApiError, getUserFriendlyMessage } from "../utils/errorHandler";

// Parse API errors
const parsedError = parseApiError(error);
// Returns: { type, severity, message, details, statusCode, originalError }

// Get user-friendly message
const userMessage = getUserFriendlyMessage(parsedError, "job");
```

#### Global Error Handler

```javascript
import { handleGlobalError } from "../utils/errorHandler";

const handledError = handleGlobalError(error, {
  action: "create_job",
  resource: "job",
  userId: "123",
});
```

#### Error Reporting Service

```javascript
import { errorReportingService } from "../utils/errorHandler";

// Report error to external service
await errorReportingService.reportError(error, {
  component: "JobForm",
  action: "submit",
});
```

### 2. Toast Notification System (`toast.js`)

#### Basic Usage

```javascript
import { toast } from "../utils/toast";

// Show different types of toasts
toast.success("Operation completed successfully!");
toast.error("Something went wrong");
toast.warning("Please check your input");
toast.info("New data available");

// Custom options
toast.show("Custom message", {
  type: "success",
  duration: 5000,
  title: "Success",
  action: {
    id: "retry",
    label: "Retry",
  },
});
```

#### Toast Configuration

```javascript
import { toast, TOAST_POSITIONS } from "../utils/toast";

// Update global configuration
toast.updateConfig({
  position: TOAST_POSITIONS.TOP_CENTER,
  maxToasts: 3,
  duration: 3000,
});
```

### 3. React Hooks (`useErrorHandler.js`)

#### Main Hook

```javascript
import { useErrorHandler } from "../hooks/useErrorHandler";

function MyComponent() {
  const {
    error,
    isLoading,
    hasError,
    handleError,
    clearError,
    withErrorHandling,
    handleApiCall,
    handleSubmit,
    handleFileUpload,
    handleNavigation,
  } = useErrorHandler({
    showToast: true,
    autoHandle: true,
    context: { type: "my_component" },
    onError: (error, context) => {
      // Custom error handling
    },
  });

  // Use the utilities...
}
```

#### Specialized Hooks

```javascript
import {
  useAuthErrorHandler,
  useValidationErrorHandler,
  useNetworkErrorHandler,
} from "../hooks/useErrorHandler";

// Handle specific error types
const authHandler = useAuthErrorHandler();
const validationHandler = useValidationErrorHandler();
const networkHandler = useNetworkErrorHandler();
```

#### API Call with Retry

```javascript
const handleApiCall = handleApiCall(
  async () => {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error("API failed");
    return response.json();
  },
  {
    retries: 3,
    retryDelay: 1000,
    onSuccess: (data) => console.log("Success:", data),
    onRetry: (error, attempt, maxRetries) => {
      console.log(`Retry ${attempt}/${maxRetries}`);
    },
  }
);
```

#### Form Submission

```javascript
const handleFormSubmit = handleSubmit(
  async (formData) => {
    const response = await fetch("/api/submit", {
      method: "POST",
      body: JSON.stringify(formData),
    });
    if (!response.ok) throw new Error("Submission failed");
    return response.json();
  },
  {
    successMessage: "Form submitted successfully!",
    errorContext: { action: "submit_form" },
  }
);
```

#### File Upload

```javascript
const handleFileUpload = handleFileUpload(
  async (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Upload failed");
    return response.json();
  },
  {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png"],
    onSuccess: (result) => console.log("Uploaded:", result),
  }
);
```

### 4. Error Boundary Component

#### Global Error Boundary

```jsx
import { ErrorBoundary } from "../utils/errorHandler";

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

#### Component Error Boundary

```jsx
import ErrorBoundary from "../components/ErrorBoundary";

function MyPage() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Advanced Usage

### Custom Error Context

```javascript
import { buildErrorContext } from "../utils/errorHandler";

const context = buildErrorContext("create_job", "job", {
  userId: "123",
  jobType: "maintenance",
  priority: "high",
});
```

### Retry Operations

```javascript
import { retryOperation } from "../utils/errorHandler";

const result = await retryOperation(
  async () => {
    return await riskyOperation();
  },
  3, // max retries
  1000 // delay between retries
);
```

### Async Function Wrapper

```javascript
const safeAsyncFunction = withErrorHandling(
  async (param) => {
    // Your async logic here
    return await someAsyncOperation(param);
  },
  { action: "async_operation" }
);
```

### Error Type-Specific Handling

```javascript
const validationHandler = useValidationErrorHandler({
  onError: (error) => {
    // Handle validation errors specifically
    console.log("Validation error:", error.details);
  },
});
```

## Configuration

### Environment Variables

```bash
# Error reporting endpoint (optional)
VITE_ERROR_REPORTING_ENDPOINT=/api/errors

# Toast configuration
VITE_TOAST_POSITION=top-right
VITE_TOAST_DURATION=5000
```

### Toast Configuration

```javascript
import { toast, TOAST_POSITIONS } from "../utils/toast";

toast.updateConfig({
  position: TOAST_POSITIONS.TOP_CENTER,
  duration: 3000,
  maxToasts: 5,
  animationDuration: 300,
});
```

## Best Practices

### 1. Use Appropriate Error Types

```javascript
// Good
handleError(new Error("Network failed"), { type: "network" });

// Better
const networkHandler = useNetworkErrorHandler();
networkHandler.handleError(new Error("Network failed"));
```

### 2. Provide Rich Context

```javascript
handleError(error, {
  action: "create_job",
  resource: "job",
  userId: user.id,
  jobData: { title, customer_id },
});
```

### 3. Use Toast for User Feedback

```javascript
const { handleSubmit } = useErrorHandler({ showToast: true });

const submitForm = handleSubmit(
  async (data) => {
    // API call
  },
  {
    successMessage: "Job created successfully!",
    errorContext: { action: "create_job" },
  }
);
```

### 4. Handle Different Error Types Appropriately

```javascript
// Don't retry authentication errors
if (parsedError.type === ERROR_TYPES.AUTHENTICATION) {
  // Redirect to login
  navigate("/login");
  return;
}

// Retry network errors
if (parsedError.type === ERROR_TYPES.NETWORK) {
  // Retry logic
}
```

### 5. Use Error Boundaries Strategically

```jsx
// Global boundary for critical errors
<GlobalErrorBoundary>
  {/* App content */}
</GlobalErrorBoundary>

// Component boundaries for isolated errors
<ErrorBoundary>
  <RiskyComponent />
</ErrorBoundary>
```

## Error Reporting

The system automatically reports errors in production mode. Error reports include:

- Error message and stack trace
- Error type and severity
- User context (ID, session)
- Component and action context
- Browser and environment information
- Timestamp and URL

### Custom Error Reporting

```javascript
import { errorReportingService } from "../utils/errorHandler";

// Report custom error
await errorReportingService.reportError(
  {
    message: "Custom error",
    type: "business_logic",
    severity: "high",
  },
  {
    component: "PaymentProcessor",
    action: "process_payment",
    paymentId: "pay_123",
  }
);
```

## Testing

### Testing Error Handling

```javascript
import { render, screen, fireEvent } from "@testing-library/react";
import { useErrorHandler } from "../hooks/useErrorHandler";

// Mock the error handler
jest.mock("../hooks/useErrorHandler");

test("handles API errors correctly", () => {
  const mockHandleError = jest.fn();
  useErrorHandler.mockReturnValue({
    handleError: mockHandleError,
    isLoading: false,
  });

  // Test your component
  render(<MyComponent />);

  // Trigger error
  fireEvent.click(screen.getByText("Submit"));

  expect(mockHandleError).toHaveBeenCalled();
});
```

### Testing Toast Notifications

```javascript
import { toast } from "../utils/toast";

// Mock toast
jest.mock("../utils/toast");

test("shows success toast on successful submission", () => {
  toast.success.mockClear();

  // Test your component
  render(<MyComponent />);

  // Trigger success
  fireEvent.click(screen.getByText("Submit"));

  expect(toast.success).toHaveBeenCalledWith("Form submitted successfully!");
});
```

## Troubleshooting

### Common Issues

1. **Toasts not showing**: Check if toast container is mounted
2. **Error reporting not working**: Verify environment variables
3. **Retry logic not working**: Check error type classification
4. **Error boundary not catching errors**: Ensure proper component hierarchy

### Debug Mode

```javascript
// Enable debug logging
if (process.env.NODE_ENV === "development") {
  console.log("Error handling debug:", {
    error,
    context,
    parsedError,
  });
}
```

## Migration Guide

### From Manual Error Handling

```javascript
// Before
try {
  const response = await fetch("/api/data");
  if (!response.ok) throw new Error("API failed");
  setData(response.json());
} catch (error) {
  console.error(error);
  setError(error.message);
}

// After
const { handleApiCall } = useErrorHandler();

const fetchData = handleApiCall(
  async () => {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error("API failed");
    return response.json();
  },
  {
    onSuccess: (data) => setData(data),
  }
);
```

### From Custom Toast System

```javascript
// Before
import { showToast } from "./customToast";

showToast("Success!", "success");

// After
import { toast } from "../utils/toast";

toast.success("Success!");
```

This error handling system provides a robust, scalable solution for managing errors throughout your React application while maintaining a great user experience.
