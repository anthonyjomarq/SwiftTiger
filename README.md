# SwiftTiger - Field Service Management System

A comprehensive field service management application built with Node.js, Express, PostgreSQL
, React, and modern web technologies.

## Features

### ✅ Completed Features

#### Authentication & Authorization
- JWT-based authentication system
- Role-based access control (Admin, Manager, Dispatcher, Technician)
- Main admin account with special privileges
- Password hashing with bcryptjs
- Protected routes and API endpoints

#### Dashboard
- Key metrics and statistics display
- Recent jobs overview
- Priority distribution charts
- Quick action buttons

#### Customer Management
- Full CRUD operations for customers
- Google Places API integration for address selection
- Advanced search and filtering
- Customer contact information management
- Address geocoding support

#### Job Management
- Complete job lifecycle management
- Job assignment to technicians
- Priority and status tracking
- Service type categorization
- Scheduled date management
- Estimated duration tracking

#### User Management
- Admin-only user creation and management
- Role assignment and permissions
- User activity tracking
- Main admin protection

### 🚧 In Development

#### Job Logs & Documentation
- Technician job notes and reporting
- Photo upload capability
- Work time tracking
- Status updates from field

#### Route Optimization
- Google Maps Routes API integration
- Multi-technician route planning
- Travel time optimization
- Workload balancing

#### Audit Logging
- Complete user action tracking
- Login/logout events
- CRUD operation logging
- Security event monitoring

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Sequelize** - ORM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Helmet** - Security headers
- **CORS** - Cross-origin requests
- **Morgan** - Logging

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **React Query** - Data fetching
- **React Hook Form** - Form handling
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## Project Structure

```
SwiftTiger/
├── backend/
│   ├── middleware/          # Auth, audit, validation
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── scripts/            # Utility scripts
│   ├── uploads/            # File storage
│   └── server.js           # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── contexts/       # React contexts
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SwiftTiger
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Setup environment variables**
   
   Create `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=swifttiger
   DB_USER=postgres
   DB_PASSWORD=password
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   GOOGLE_PLACES_API_KEY=your-google-places-api-key
   GOOGLE_ROUTES_API_KEY=your-google-routes-api-key
   CORS_ORIGIN=http://localhost:3000
   ```

5. **Start PostgreSQL**
   ```bash
   # On macOS with Homebrew
   brew services start postgresql
   
   # On Ubuntu/Debian
   sudo systemctl start postgresql
   
   # Create database
   createdb swifttiger
   ```

6. **Create main admin user**
   ```bash
   cd backend
   node scripts/createMainAdmin.js
   ```

7. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

8. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

9. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Default Login Credentials
- **Email**: admin@swifttiger.com
- **Password**: Admin123!

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/:id/logs` - Get job logs
- `POST /api/jobs/:id/logs` - Create job log

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Audit
- `GET /api/audit` - Get audit logs
- `GET /api/audit/stats` - Get audit statistics

## Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Role-based access control
- Input validation and sanitization
- Rate limiting
- Security headers with Helmet
- CORS protection
- Audit logging for all operations

## Database Schema

### User
- Name, email, password (hashed)
- Role (admin, manager, dispatcher, technician)
- Main admin flag
- Activity status
- Login tracking

### Customer
- Name, email, phone
- Complete address with geocoding
- Google Places integration
- Activity status

### Job
- Job name and description
- Customer association
- Service type and priority
- Assignment and scheduling
- Status tracking
- Duration estimation

### Job Log
- Job association
- Technician notes
- Photo attachments
- Work time tracking
- Status updates

### Audit Log
- User action tracking
- Timestamp and IP logging
- Resource and action details
- Security event monitoring

## Deployment

The application is designed for production deployment with:
- Docker containerization support
- Environment-based configuration
- Production security settings
- Database optimization
- Static file serving

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.

---

**Note**: This is a professional portfolio project demonstrating modern full-stack development practices and clean, maintainable code architecture.