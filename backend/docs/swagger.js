const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SwiftTiger Field Service Management API',
      version: '1.0.0',
      description: 'A comprehensive field service management system API with role-based access control, job management, customer management, and audit logging.',
      contact: {
        name: 'Anthony Colon',
        email: 'admin@swifttiger.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://api.swifttiger.com' : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier'
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              minLength: 6,
              maxLength: 255,
              description: 'User password (hashed when stored)'
            },
            role: {
              type: 'string',
              enum: ['admin', 'technician', 'manager', 'dispatcher'],
              description: 'User role for access control'
            },
            isMainAdmin: {
              type: 'boolean',
              description: 'Whether user has main admin privileges'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether user account is active'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Customer: {
          type: 'object',
          required: ['name', 'email', 'phone', 'addressStreet', 'addressCity', 'addressState', 'addressZipCode'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100
            },
            email: {
              type: 'string',
              format: 'email'
            },
            phone: {
              type: 'string',
              pattern: '^[\\+]?[1-9][\\d]{0,15}$'
            },
            addressStreet: {
              type: 'string',
              minLength: 5,
              maxLength: 200
            },
            addressCity: {
              type: 'string',
              minLength: 2,
              maxLength: 100
            },
            addressState: {
              type: 'string',
              minLength: 2,
              maxLength: 50
            },
            addressZipCode: {
              type: 'string',
              pattern: '^[0-9]{5}(-[0-9]{4})?$'
            },
            addressCountry: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              default: 'USA'
            },
            addressLatitude: {
              type: 'number',
              minimum: -90,
              maximum: 90
            },
            addressLongitude: {
              type: 'number',
              minimum: -180,
              maximum: 180
            },
            addressPlaceId: {
              type: 'string',
              description: 'Google Places API place ID'
            },
            isActive: {
              type: 'boolean',
              default: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Job: {
          type: 'object',
          required: ['jobName', 'description', 'customerId', 'serviceType'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            jobName: {
              type: 'string',
              minLength: 3,
              maxLength: 200
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 1000
            },
            customerId: {
              type: 'string',
              format: 'uuid'
            },
            serviceType: {
              type: 'string',
              minLength: 2,
              maxLength: 100
            },
            priority: {
              type: 'string',
              enum: ['Low', 'Medium', 'High', 'Critical'],
              default: 'Medium'
            },
            status: {
              type: 'string',
              enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
              default: 'Pending'
            },
            assignedTo: {
              type: 'string',
              format: 'uuid',
              description: 'Technician assigned to this job'
            },
            scheduledDate: {
              type: 'string',
              format: 'date-time'
            },
            completedDate: {
              type: 'string',
              format: 'date-time'
            },
            estimatedDuration: {
              type: 'integer',
              minimum: 1,
              maximum: 480,
              description: 'Estimated duration in minutes'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        JobLog: {
          type: 'object',
          required: ['jobId', 'technicianId', 'notes'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            jobId: {
              type: 'string',
              format: 'uuid'
            },
            technicianId: {
              type: 'string',
              format: 'uuid'
            },
            notes: {
              type: 'string',
              minLength: 5,
              maxLength: 2000
            },
            photos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  originalName: { type: 'string' },
                  mimetype: { type: 'string' },
                  size: { type: 'integer' },
                  path: { type: 'string' }
                }
              }
            },
            workStartTime: {
              type: 'string',
              format: 'date-time'
            },
            workEndTime: {
              type: 'string',
              format: 'date-time'
            },
            statusUpdate: {
              type: 'string',
              enum: ['Pending', 'In Progress', 'Completed', 'Cancelled']
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            action: {
              type: 'string',
              description: 'The action performed'
            },
            resource: {
              type: 'string',
              description: 'The resource affected'
            },
            resourceId: {
              type: 'string',
              format: 'uuid',
              description: 'The ID of the affected resource'
            },
            details: {
              type: 'object',
              description: 'Additional details about the action'
            },
            ipAddress: {
              type: 'string',
              description: 'IP address of the user'
            },
            userAgent: {
              type: 'string',
              description: 'User agent string'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email'
            },
            password: {
              type: 'string'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT access token'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                  value: { type: 'string' }
                }
              },
              description: 'Validation errors'
            }
          }
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Number of items per page'
            },
            total: {
              type: 'integer',
              description: 'Total number of items'
            },
            pages: {
              type: 'integer',
              description: 'Total number of pages'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJSDoc(options);

module.exports = specs;