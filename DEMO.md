# SwiftTiger - Field Service Management System Demo

## Project Overview

SwiftTiger is a comprehensive Field Service Management System built for Puerto Rico, featuring job scheduling, route optimization, customer management, and real-time technician coordination.

## Demo Features

### Working Features (No API Required)
- Dashboard with analytics and metrics
- Job management (create, edit, schedule jobs)
- Customer management with demo addresses
- User management with role-based access control
- Route optimization with interactive demo map
- Audit logging
- Responsive design
- Dark mode theme switching
- Accessibility features

### Demo Mode Features
- Interactive Puerto Rico map
- Route visualization between job locations
- Address autocomplete with demo data
- Color-coded job priority markers
- Toggle between demo and live modes

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling  
- React Query for state management
- React Router for navigation
- Vite for build tooling
- Custom Map Component for demo mode

### Backend
- Node.js with Express
- PostgreSQL database
- JWT Authentication
- WebSocket real-time updates
- RESTful API design
- Swagger documentation

### Infrastructure
- Render for full-stack deployment
- GitHub Pages for demo deployment
- GitHub Actions CI/CD pipeline
- ESLint code quality
- Vitest testing framework

## Live Demo

**GitHub Pages Demo**:

- Pure frontend experience
- No backend required
- Demo data and interactive maps
- Works completely offline
- Perfect for portfolio showcase

## Key Features Implemented

### Dashboard
- Job statistics
- Revenue tracking charts
- Technician workload visualization
- Performance metrics

### Route Optimization
- Geographic job clustering
- Distance calculations using Haversine formula
- Puerto Rico-focused routing
- Interactive map visualization
- Demo mode with custom map

### Job Management
- CRUD operations
- Priority-based scheduling
- Service type categorization
- Duration estimation
- Status tracking

### Customer Management
- Address autocomplete
- Geographic coordinate storage
- Customer history tracking
- Contact information management

### User Management
- Role-based permissions (Admin, Manager, Dispatcher, Technician)
- JWT-based authentication
- User activity tracking
- Profile management

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Development Setup
```bash
git clone https://github.com/anthonyjomarq/SwiftTiger.git
cd SwiftTiger

cd frontend
npm install
npm run dev
```

### Build for GitHub Pages
```bash
cd frontend
NODE_ENV=production npm run build
```

The built files will be in `frontend/dist/` ready for GitHub Pages deployment.

## Technical Implementation

- Works completely offline in demo mode
- Custom-built Puerto Rico map with job locations
- Pre-loaded with sample data
- Role-based user interfaces
- Responsive design for all devices
- Clean, modern interface

## Portfolio Value

This project demonstrates:
- Full-stack development with modern technologies
- Geographic applications and mapping
- Enterprise software with role-based systems
- Modern React patterns and best practices
- TypeScript implementation
- Responsive design
- Demo-ready presentation

## Technical Decisions

### Demo Mode Benefits
- No API keys needed for demonstration
- Free GitHub Pages hosting
- No external API dependencies
- Always available for demos

### Puerto Rico Focus
- Underserved market for field service management
- Island geography suitable for route optimization
- Bilingual potential
- Clear business opportunity

## License

MIT License