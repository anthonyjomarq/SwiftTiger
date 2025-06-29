# SwiftTiger - Job Management App

A comprehensive web application for managing jobs and customers with role-based access control.

## Features

- **User Authentication**: Role-based login system (Admin/User)
- **Customer Management**: Add, edit, delete, and view customer information
- **Job Management**: Create and track job assignments
- **Role-Based Access**: Admin users can edit/delete, regular users can view and create
- **Dashboard Analytics**: Real-time statistics and overview
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, PostgreSQL
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: PostgreSQL with proper relationships and constraints

## Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)

## Quick Start

### 1. Database Setup

1. Install PostgreSQL on your system
2. Create a new database:
   ```sql
   CREATE DATABASE swifttiger;
   ```
3. Copy the environment file:
   ```bash
   cd backend
   cp env.example .env
   ```
4. Update the `.env` file with your PostgreSQL credentials

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Start the Application

```bash
npm run dev
```

This will start both the frontend (port 3000) and backend (port 5000) servers.

## Project Structure

```
swift-tiger/
├── frontend/          # React application
├── backend/           # Node.js API server
├── package.json       # Root package file
└── README.md         # This file
```

## Development

- Frontend runs on: `http://localhost:3000`
- Backend API runs on: `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user (first user becomes admin)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Customers

- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer (Admin only)
- `DELETE /api/customers/:id` - Delete customer (Admin only)

### Jobs

- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job status
- `DELETE /api/jobs/:id` - Delete job (Admin only)

### Dashboard

- `GET /api/dashboard` - Get dashboard statistics

## Role-Based Access Control

- **Admin Users**: Can create, read, update, and delete all records
- **Regular Users**: Can create and read records, update job statuses
- **First registered user** automatically becomes an admin

## Key Features

- **Full-Stack Development**: React frontend with Node.js/Express backend
- **Database Design**: PostgreSQL with proper relationships
- **Authentication & Authorization**: JWT-based with role-based access
- **RESTful API**: Well-structured API endpoints
- **Responsive UI**: Modern design with Tailwind CSS
- **Error Handling**: Comprehensive error handling and validation
- **Real-time Updates**: Dynamic data updates without page refresh

## Author

**Anthony Colon** - Full Stack Developer

This project demonstrates proficiency in modern web development technologies and best practices.
