# Validation Schemas

This directory contains express-validator schemas for validating API requests in the SwiftTiger backend.

## Overview

The validation system uses `express-validator` to provide comprehensive input validation for all API endpoints. Each validator is designed to:

- Validate required fields
- Check data types and formats
- Enforce business rules
- Sanitize input data
- Provide clear error messages

## Validators

### Job Validators (`jobValidator.js`)

#### `validateCreateJob`

Validates job creation requests with the following rules:

- **title**: Required, 1-255 characters
- **description**: Optional, max 1000 characters
- **customer_id**: Optional, positive integer
- **assigned_to**: Optional, positive integer
- **status**: Optional, must be one of: pending, in_progress, completed, cancelled, on_hold
- **scheduled_date**: Optional, ISO 8601 date format
- **scheduled_time**: Optional, HH:MM format
- **estimated_duration**: Optional, 1-1440 minutes

#### `validateUpdateJob`

Validates job update requests with the same rules as create, plus:

- **id**: Required, positive integer (from URL parameter)

#### `validateJobStatus`

Validates job status updates:

- **id**: Required, positive integer (from URL parameter)
- **status**: Required, must be one of the valid statuses

#### `validateJobUpdate`

Validates job update/comment creation:

- **id**: Required, positive integer (from URL parameter)
- **content**: Required, 1-2000 characters
- **update_type**: Optional, must be one of: comment, status_update, location_update, photo, document

#### `validateRouteOptimization`

Validates route optimization requests:

- **job_ids**: Required array with at least 2 positive integers
- **start_location**: Optional object with latitude/longitude
- **end_location**: Optional object with latitude/longitude

#### `validateEtaCalculation`

Validates ETA calculation requests:

- **origin**: Required object with latitude/longitude
- **destination**: Required object with latitude/longitude
- **departure_time**: Optional ISO 8601 date

### Customer Validators (`customerValidator.js`)

#### `validateCreateCustomer`

Validates customer creation requests:

- **name**: Required, 1-255 characters
- **email**: Optional, valid email format
- **phone**: Optional, international phone number format
- **address**: Optional, max 1000 characters

#### `validateUpdateCustomer`

Validates customer update requests with the same rules as create, plus:

- **id**: Required, positive integer (from URL parameter)

#### `validateCustomerId`

Validates customer ID parameter:

- **id**: Required, positive integer (from URL parameter)

#### `validateCustomerGeocoding`

Validates customer geocoding requests:

- **id**: Required, positive integer (from URL parameter)

## Usage

### In Routes

```javascript
const {
  validateCreateJob,
  validateUpdateJob,
} = require("./validators/jobValidator");
const {
  handleValidationErrors,
  sanitizeRequest,
} = require("./middleware/validation");

// Apply validators to routes
app.post(
  "/api/jobs",
  authenticateToken,
  requirePermission("jobs.create"),
  sanitizeRequest,
  validateCreateJob,
  handleValidationErrors,
  async (req, res) => {
    // Route handler logic
  }
);
```

### Middleware Order

1. **Authentication** (`authenticateToken`)
2. **Authorization** (`requirePermission`)
3. **Sanitization** (`sanitizeRequest`)
4. **Validation** (validator schemas)
5. **Error Handling** (`handleValidationErrors`)
6. **Route Handler**

### Error Response Format

When validation fails, the API returns a 400 status with the following format:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Job title is required",
      "value": ""
    }
  ],
  "statusCode": 400
}
```

## Custom Validation

To add custom validation logic, extend the `validateBusinessRules` middleware in `middleware/validation.js`:

```javascript
const validateBusinessRules = (req, res, next) => {
  // Add custom business logic validation here
  // For example, checking if a customer exists before creating a job

  if (req.body.customer_id) {
    // Check if customer exists
    // If not, return error
  }

  next();
};
```

## Best Practices

1. **Always sanitize input** using `sanitizeRequest` middleware
2. **Use specific validators** for each endpoint type
3. **Handle validation errors** consistently with `handleValidationErrors`
4. **Keep validators focused** on a single responsibility
5. **Test validators** with various input scenarios
6. **Document validation rules** clearly in the validator files
