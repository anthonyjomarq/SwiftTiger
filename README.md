# SwiftTiger - Field Service Management System

VIEW LIVE DEMO: https://anthonyjomarq.github.io/SwiftTiger/

A comprehensive field service management application built with **React + TypeScript** for businesses that need to schedule jobs, dispatch technicians, and track work orders efficiently.

<img width="2506" height="1268" alt="image" src="https://github.com/user-attachments/assets/8c72f761-270d-49e4-93c8-86c69f4dd639" />


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
<img width="2506" height="1231" alt="image" src="https://github.com/user-attachments/assets/2ad81420-89c8-485d-b033-833b5799cb4e" />


### Customer Directory
<img width="2504" height="1260" alt="image" src="https://github.com/user-attachments/assets/b08dc8b7-aa2f-40cc-a8d8-38d21fb37e74" />

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
