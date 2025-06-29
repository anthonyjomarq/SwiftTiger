# SwiftTiger Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher)

   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **PostgreSQL** (v12 or higher)
   - Download from: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

## Quick Setup

### 1. Database Setup

1. Start PostgreSQL
2. Create a new database:
   ```sql
   CREATE DATABASE swifttiger;
   ```

### 2. Environment Configuration

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Copy the environment template:

   ```bash
   cp env.example .env
   ```

3. Edit `.env` with your PostgreSQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=swifttiger
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your-secret-key-change-in-production
   PORT=5000
   NODE_ENV=development
   ```

### 3. Install Dependencies

From the root directory:

```bash
npm run install:all
```

### 4. Start the Application

```bash
npm run dev
```

This will start:

- Backend server on: http://localhost:5000
- Frontend application on: http://localhost:3000

### 5. First Time Setup

1. Open http://localhost:3000 in your browser
2. Click "Sign up" to create your first account
3. Log in and start using the application!

## Features Available

- ✅ User authentication (login/register)
- ✅ Customer management (add, view customers)
- ✅ Job management (create, update job status)
- ✅ Dashboard with statistics
- ✅ PostgreSQL database
- ✅ Responsive UI with Tailwind CSS

## Development

- Frontend code: `frontend/src/`
- Backend code: `backend/`
- Database schema: `backend/database.js`

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check credentials in `.env` file
- Ensure database `swifttiger` exists

### Port Already in Use

- Change ports in `.env` (backend) and `vite.config.js` (frontend)
- Or kill processes using those ports

### Module Not Found Errors

- Run `npm run install:all` again
- Delete `node_modules` folders and reinstall

## Next Steps

- Advanced filtering and search
- File uploads
- Real-time notifications
- More detailed reporting
- User roles and permissions
- API rate limiting
- Unit tests
