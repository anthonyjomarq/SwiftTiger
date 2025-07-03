# SwiftTiger Deployment Guide

## 🚀 Production Deployment

This guide covers deploying SwiftTiger to production environments using Docker, manual deployment, or cloud platforms.

### Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** 12+
- **Docker & Docker Compose** (for containerized deployment)
- **Nginx** (for reverse proxy)
- **SSL Certificate** (for HTTPS)

## 📋 Deployment Methods

### Method 1: Docker Deployment (Recommended)

#### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd SwiftTiger

# Create environment file
cp backend/.env.example .env
# Edit .env with your production values

# Start with Docker Compose
docker-compose up -d
```

#### Detailed Docker Deployment

1. **Environment Configuration**
   ```bash
   # Create production environment file
   cp backend/.env.production .env
   
   # Edit the following critical variables:
   DB_PASSWORD=your_secure_database_password
   JWT_SECRET=your_64_character_jwt_secret
   JWT_REFRESH_SECRET=your_64_character_refresh_secret
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   EMAIL_HOST=your_smtp_host
   EMAIL_USER=your_email_user
   EMAIL_PASSWORD=your_email_password
   ```

2. **Build and Deploy**
   ```bash
   # Build the containers
   docker-compose build

   # Start all services
   docker-compose up -d

   # Check status
   docker-compose ps
   ```

3. **Database Setup**
   ```bash
   # Run database migrations
   docker-compose exec backend npm run migrate

   # Create admin user (optional)
   docker-compose exec backend node -e "
   const { pool } = require('./database');
   const bcrypt = require('bcryptjs');
   (async () => {
     const hashedPassword = await bcrypt.hash('admin123', 12);
     await pool.query(
       'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
       ['admin@swifttiger.com', hashedPassword, 'System Admin', 'admin']
     );
     console.log('Admin user created');
     process.exit(0);
   })();
   "
   ```

### Method 2: Manual Deployment

#### Server Setup
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install PM2 for process management
npm install -g pm2

# Install Nginx
sudo apt-get install nginx
```

#### Application Deployment
```bash
# Clone and setup
git clone <repository-url>
cd SwiftTiger

# Install dependencies and build
npm install
npm run build

# Setup environment
cp backend/.env.production backend/.env
# Edit backend/.env with production values

# Setup database
sudo -u postgres createdb swifttiger
sudo -u postgres createuser swifttiger_user
cd backend && npm run migrate

# Start with PM2
pm2 start backend/server.js --name "swifttiger-backend"
pm2 startup
pm2 save
```

#### Nginx Configuration
```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/swifttiger
sudo ln -s /etc/nginx/sites-available/swifttiger /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Method 3: Cloud Platform Deployment

#### AWS Deployment
1. **ECS with Fargate**
   - Build and push Docker image to ECR
   - Create ECS task definition
   - Deploy to Fargate cluster

2. **Elastic Beanstalk**
   - Create application zip file
   - Upload to Elastic Beanstalk
   - Configure environment variables

#### Digital Ocean App Platform
```yaml
# .do/app.yaml
name: swifttiger
services:
- name: backend
  source_dir: /
  dockerfile_path: Dockerfile
  github:
    repo: your-repo
    branch: main
  run_command: node backend/server.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NODE_ENV
    value: production
  - key: DB_HOST
    value: ${db.HOSTNAME}
  - key: DB_PASSWORD
    value: ${db.PASSWORD}

databases:
- name: db
  engine: PG
  version: "13"
```

#### Heroku Deployment
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create swifttiger-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret

# Deploy
git push heroku main
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | No | Server port | `5000` |
| `DB_HOST` | Yes | Database host | `localhost` |
| `DB_USER` | Yes | Database user | `swifttiger_user` |
| `DB_PASSWORD` | Yes | Database password | `secure_password` |
| `DB_NAME` | Yes | Database name | `swifttiger` |
| `JWT_SECRET` | Yes | JWT signing secret | `64_char_secret` |
| `GOOGLE_MAPS_API_KEY` | Yes | Google Maps API key | `AIza...` |
| `EMAIL_HOST` | Yes | SMTP host | `smtp.gmail.com` |
| `EMAIL_USER` | Yes | SMTP username | `noreply@company.com` |
| `EMAIL_PASSWORD` | Yes | SMTP password | `app_password` |

### Security Configuration

#### SSL/TLS Setup
```bash
# Install Let's Encrypt Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Firewall Configuration
```bash
# UFW setup
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Application health
curl http://localhost:5000/api/health

# Database health
docker-compose exec database pg_isready

# Service status
docker-compose ps
pm2 status
```

### Logging
```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f nginx

# PM2 logs
pm2 logs swifttiger-backend

# System logs
sudo journalctl -u nginx -f
```

### Backups

#### Database Backup
```bash
# Manual backup
docker-compose exec database pg_dump -U swifttiger_user swifttiger > backup.sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec database pg_dump -U swifttiger_user swifttiger > "$BACKUP_DIR/swifttiger_$DATE.sql"
find $BACKUP_DIR -name "swifttiger_*.sql" -mtime +7 -delete
```

#### File Backup
```bash
# Backup uploads and logs
tar -czf swifttiger_files_$(date +%Y%m%d).tar.gz uploads/ logs/
```

### Updates and Maintenance
```bash
# Update application
git pull origin main
docker-compose build
docker-compose up -d

# Database migration
docker-compose exec backend npm run migrate

# Update dependencies
npm update
docker-compose build --no-cache
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database status
docker-compose ps database

# Check database logs
docker-compose logs database

# Verify connection string
docker-compose exec backend node -e "
const { pool } = require('./database');
pool.query('SELECT 1').then(() => console.log('DB OK')).catch(console.error);
"
```

#### 2. Frontend Not Loading
```bash
# Check nginx configuration
sudo nginx -t

# Check static files
ls -la frontend/dist/

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### 3. JWT Token Issues
```bash
# Verify JWT secret
echo $JWT_SECRET | wc -c  # Should be > 32

# Check token generation
docker-compose exec backend node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({test: true}, process.env.JWT_SECRET);
console.log('Token generated:', !!token);
"
```

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_technician ON jobs(assigned_technician);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

#### Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 2048;

# Enable compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Cache static files
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Application Optimization
```javascript
// PM2 ecosystem file (ecosystem.config.js)
module.exports = {
  apps: [{
    name: 'swifttiger-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

## 📱 Mobile App Deployment

### PWA Deployment
The technician mobile app is a Progressive Web App (PWA) that can be accessed via web browser and installed on mobile devices.

1. **Service Worker Setup**
   - Built-in service worker for offline functionality
   - Auto-update capability
   - Push notification support

2. **App Store Deployment** (Optional)
   - Use Capacitor or Cordova to create native apps
   - Submit to Google Play Store and Apple App Store

## 🚨 Production Checklist

- [ ] Environment variables configured
- [ ] Database migrated and secured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backup system setup
- [ ] Monitoring configured
- [ ] Error tracking setup (Sentry)
- [ ] Performance monitoring
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Documentation updated

## 📞 Support

For deployment issues or questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review application logs
- Verify configuration settings

---

**SwiftTiger** - Service Management Platform
Version 1.0.0 | Production Ready