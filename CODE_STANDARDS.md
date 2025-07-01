# SwiftTiger Code Standards

This document outlines the standardized coding conventions for the SwiftTiger project to ensure consistency, maintainability, and readability across the entire codebase.

## Table of Contents

1. [Database Conventions](#database-conventions)
2. [JavaScript/Node.js Conventions](#javascriptnodejs-conventions)
3. [React/JSX Conventions](#reactjsx-conventions)
4. [File Organization](#file-organization)
5. [Documentation Standards](#documentation-standards)
6. [Code Quality](#code-quality)

## Database Conventions

### Column Naming

- **Use snake_case for all database columns**
- Examples: `user_id`, `created_at`, `scheduled_date`, `estimated_duration`

### Table Naming

- **Use snake_case for table names**
- Examples: `job_updates`, `technician_locations`, `shared_routes`

### Index Naming

- **Use descriptive prefixes for indexes**
- Format: `idx_{table_name}_{column_name}`
- Examples: `idx_job_updates_job_id`, `idx_technician_locations_user_id`

## JavaScript/Node.js Conventions

### Variable and Function Naming

- **Use camelCase for variables and functions**
- Examples: `userName`, `getJobById`, `createCustomer`

### Class Naming

- **Use PascalCase for classes**
- Examples: `JobService`, `CustomerRepository`, `AuthMiddleware`

### Constants

- **Use UPPER_SNAKE_CASE for constants**
- Examples: `JWT_SECRET`, `DEFAULT_PORT`, `MAX_RETRY_ATTEMPTS`

### Import Organization

Organize imports in the following order:

1. **External libraries** (React, Express, etc.)
2. **Node.js built-ins** (fs, path, etc.)
3. **Database and middleware**
4. **Validators**
5. **Services**
6. **Utilities**
7. **Configuration**

```javascript
// External libraries
const express = require("express");
const cors = require("cors");

// Node.js built-ins
const path = require("path");

// Database and middleware
const { pool } = require("./database");
const { requirePermission } = require("./middleware/permissions");

// Services
const jobService = require("./services/jobService");

// Utilities
const { handleError } = require("./utils/errors");

// Configuration
const { JOB_STATUSES } = require("./config/constants");
```

## React/JSX Conventions

### Component Naming

- **Use PascalCase for React components**
- Examples: `JobList`, `CustomerDetail`, `LoadingSpinner`

### File Naming

- **Use PascalCase for component files**
- Examples: `JobList.jsx`, `CustomerDetail.jsx`

### Import Organization (React)

Organize React imports in the following order:

1. **React and routing**
2. **Contexts**
3. **Components**
4. **Hooks**
5. **Services**
6. **Utilities**

```javascript
// React and routing
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Contexts
import { useAuth } from "./contexts/AuthContext";

// Components
import LoadingSpinner from "./components/LoadingSpinner";

// Hooks
import { useJobs } from "./hooks/useJobs";

// Services
import { jobService } from "./services/jobService";

// Utilities
import { toast } from "./utils/toast";
```

## File Organization

### File Headers

Every file should begin with a descriptive header:

```javascript
/**
 * Job Service
 * Handles business logic for job management, including CRUD operations,
 * permissions, and real-time updates
 *
 * @author SwiftTiger Team
 * @version 1.0.0
 */
```

### Directory Structure

```
backend/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── migrations/      # Database migrations
├── repositories/    # Data access layer
├── services/        # Business logic
├── utils/           # Utility functions
└── validators/      # Input validation

frontend/
├── components/      # React components
├── contexts/        # React contexts
├── hooks/           # Custom React hooks
├── pages/           # Page components
├── services/        # API services
└── utils/           # Utility functions
```

## Documentation Standards

### JSDoc Comments

All functions should have comprehensive JSDoc comments:

```javascript
/**
 * Create a new job with validation and WebSocket emissions
 *
 * @param {Object} jobData - Job data object
 * @param {string} jobData.title - Job title
 * @param {string} jobData.description - Job description
 * @param {number} jobData.customer_id - Customer ID
 * @param {number} userId - ID of the user creating the job
 * @returns {Promise<Object>} Response object with created job data
 */
async function createJob(jobData, userId) {
  // Implementation
}
```

### Component Documentation

React components should include prop documentation:

```javascript
/**
 * JobList component for displaying jobs in a table format
 *
 * @param {Object} props - Component props
 * @param {Array} props.jobs - Array of job objects to display
 * @param {boolean} props.loading - Loading state indicator
 * @param {Function} props.onRowClick - Callback for row click events
 * @returns {JSX.Element} JobList component
 */
const JobList = ({ jobs, loading, onRowClick }) => {
  // Implementation
};
```

## Code Quality

### Indentation

- **Use 2 spaces for indentation** (no tabs)
- Apply consistently across all files

### Line Length

- **Maximum line length: 80-100 characters**
- Break long lines appropriately

### Commented Code

- **Remove all commented-out code**
- Use version control for code history
- If code is temporarily disabled, add a TODO comment with explanation

### Error Handling

- Always include proper error handling
- Use consistent error response formats
- Log errors appropriately

### Performance

- Use memoization where appropriate (`useMemo`, `useCallback`)
- Implement proper loading states
- Optimize database queries

## Migration Script

To apply these standards to the existing codebase:

```bash
# Run the standardization script
node backend/standardize-code.js
```

This script will:

1. Convert database columns to snake_case
2. Apply consistent naming conventions
3. Add JSDoc comments
4. Organize imports
5. Add file headers

## Linting and Formatting

### ESLint Configuration

Use the following ESLint rules to enforce standards:

```json
{
  "rules": {
    "camelcase": "error",
    "indent": ["error", 2],
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
    "no-unused-vars": "error",
    "no-console": "warn"
  }
}
```

### Prettier Configuration

Use Prettier for consistent formatting:

```json
{
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "printWidth": 80
}
```

## Review Checklist

Before committing code, ensure:

- [ ] All database columns use snake_case
- [ ] All JavaScript variables/functions use camelCase
- [ ] All React components use PascalCase
- [ ] All functions have JSDoc comments
- [ ] Imports are properly organized
- [ ] File headers are present
- [ ] Indentation uses 2 spaces
- [ ] No commented-out code remains
- [ ] Error handling is implemented
- [ ] Code follows performance best practices

## Contributing

When contributing to the project:

1. Follow these coding standards
2. Run the standardization script if making structural changes
3. Update documentation as needed
4. Ensure all tests pass
5. Review code with the checklist above

---

_This document should be updated as coding standards evolve._
