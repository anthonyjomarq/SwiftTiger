# SwiftTiger - Field Service Management System

> **[VIEW LIVE DEMO](https://anthonyjomarq.github.io/login)** - Click here to try it now!

A comprehensive field service management application built with **React + TypeScript** for businesses that need to schedule jobs, dispatch technicians, and track work orders efficiently.

![Dashboard Screenshot]()

## What it does

SwiftTiger helps service companies manage their daily operations:
- Schedule and assign jobs to technicians
- Track customer information and service history  
- Monitor job progress in real-time
- Generate reports and analytics
- Manage user permissions and audit logs

## Demo Credentials

**Try the live demo with these accounts** (password for all: `demo123`):

| Role | Email | Description |
|------|-------|-------------|
| **Admin** | `admin@demo.com` | Full system access & user management |
| **Manager** | `manager@demo.com` | Job oversight & team management |
| **Dispatcher** | `dispatcher@demo.com` | Job assignment & scheduling |
| **Technician** | `tech@demo.com` | Field work & job updates |

> **Note:** All demo data is stored in browser localStorage and persists between sessions. You can reset data anytime in the demo settings.

## Screenshots

### Job Management
![Jobs](https://github.com/user-attachments/assets/7d912ec0-6277-4510-868e-dbc9974256a6)

### Customer Directory
![Customers](https://github.com/user-attachments/assets/089a9a43-76c7-42cf-ab5f-8aa0a3382f56)

### Dashboard Analytics
![Dashboard](https://github.com/user-attachments/assets/ad7de798-a7ec-4911-b9a1-74f719cab866)

### Route Optimization
![Routes](https://github.com/user-attachments/assets/b6d7ead4-a980-42d3-be66-90090feced1b)

## Tech Stack

**Frontend:**
- React with TypeScript
- Tailwind CSS for styling
- Vite for fast development

**Backend:**
- Node.js with Express
- PostgreSQL database
- JWT authentication
- Sequelize ORM

**Features:**
- Responsive design works on mobile and desktop
- Role-based access control
- Real-time updates
- Google Maps integration
- Comprehensive test coverage
- Dark mode support

## Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd SwiftTiger
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Set up environment**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your database settings
```

4. **Set up database**
```bash
createdb swifttiger
cd backend && npm run migrate
npm run seed-demo  # Loads sample data
```

5. **Start the application**
```bash
npm run dev
```

Visit http://localhost:3000 for the frontend and http://localhost:5000 for the API.

## Project Structure

```
SwiftTiger/
├── frontend/          # React application
├── backend/           # Node.js API
├── .github/workflows/ # CI/CD pipeline
└── docs/             # Documentation
```

## Testing

Run tests with:
```bash
npm run test          # All tests
npm run test:coverage # With coverage report
```

The project includes both frontend and backend tests with good coverage of core functionality.

## Deployment

The application is set up for deployment on platforms like Render.com with:
- Automated CI/CD pipeline
- Environment-specific configurations
- Production optimizations

## Key Features

- **Customer Management**: Add, edit, and track customer information
- **Job Scheduling**: Create and assign jobs with priorities and due dates  
- **Technician Dispatch**: Assign work to available technicians
- **Real-time Dashboard**: See job status and key metrics at a glance
- **Audit Logging**: Track all user actions for accountability
- **Mobile Responsive**: Works well on phones and tablets
- **Google Maps**: Integrated mapping for job locations
- **Role-based Security**: Different access levels for different user types

## Contact

Built by Anthony Colon - Full Stack Developer

---

*This project demonstrates modern web development practices including TypeScript, comprehensive testing, CI/CD pipelines, and production-ready deployment configurations.*