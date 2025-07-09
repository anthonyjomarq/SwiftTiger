# SwiftTiger Deployment Guide

This guide covers deploying SwiftTiger Field Service Management System in production.

## Prerequisites

- Docker and Docker Compose installed
- Domain name (optional for local deployment)
- SSL certificates (for production)
- PostgreSQL database access
- Environment variables configured

## Quick Deployment

### Automated Deployment

Run the automated deployment script:

```bash
chmod +x deployment/deploy.sh
./deployment/deploy.sh
```

### Manual Deployment

1. **Environment Setup**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

2. **Build and Start Services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

3. **Create Admin User**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run create-admin
   ```

## Configuration

### Environment Variables

Key environment variables for production:

```env
NODE_ENV=production
DB_PASSWORD=your_secure_password
JWT_SECRET=your_64_character_secret
CORS_ORIGIN=https://yourdomain.com
GOOGLE_PLACES_API_KEY=your_api_key
```

### SSL Configuration

For production with HTTPS:

1. Place SSL certificates in `nginx/ssl/`
2. Update `nginx/nginx.conf` to enable HTTPS server block
3. Restart nginx service

### Database Configuration

The application uses PostgreSQL with automatic migrations:

- Database schema is created automatically
- Run migrations: `npm run migrate`
- Create admin user: `npm run create-admin`

## Production Architecture

```
Internet
    ↓
Nginx (Load Balancer/SSL Termination)
    ↓
Docker Network
    ├── Frontend (React/Nginx)
    ├── Backend (Node.js/Express)
    ├── PostgreSQL Database
    └── Redis (Optional)
```

## Monitoring and Logging

### Application Logs

- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`
- Database logs: `docker-compose logs postgres`

### Health Checks

- Application: `curl http://localhost/api/health`
- Database: Built-in Docker health checks
- All services: `docker-compose ps`

### Log Rotation

Production logging uses Winston with daily rotation:
- Error logs: `logs/error-YYYY-MM-DD.log`
- Combined logs: `logs/combined-YYYY-MM-DD.log`
- Retention: 30 days

## Security Considerations

### Production Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret (64+ characters)
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure firewall (only ports 80, 443)
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use non-root Docker containers
- [ ] Regular security updates

### Backup Strategy

1. **Database Backups**
   ```bash
   docker-compose exec postgres pg_dump -U postgres swifttiger > backup.sql
   ```

2. **File Uploads Backup**
   ```bash
   docker cp backend_uploads:/app/uploads ./uploads-backup
   ```

3. **Automated Backups**
   Set up cron job for regular backups:
   ```bash
   0 2 * * * /path/to/backup-script.sh
   ```

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use nginx or cloud load balancer
2. **Multiple Backend Instances**: Scale backend service
3. **Database Replication**: Master-slave PostgreSQL setup
4. **Redis Clustering**: For session management

### Performance Optimization

- Enable gzip compression (configured)
- Use CDN for static assets
- Database indexing optimization
- Redis caching for frequently accessed data

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using ports
   sudo lsof -i :80
   sudo lsof -i :443
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   docker-compose exec postgres psql -U postgres -c "SELECT 1"
   ```

3. **SSL Certificate Issues**
   ```bash
   # Test SSL certificate
   openssl x509 -in nginx/ssl/certificate.crt -text -noout
   ```

### Log Analysis

1. **Backend Errors**
   ```bash
   docker-compose logs backend | grep ERROR
   ```

2. **Nginx Access Logs**
   ```bash
   docker-compose logs nginx | grep "GET\|POST\|PUT\|DELETE"
   ```

3. **Database Performance**
   ```bash
   docker-compose exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity"
   ```

## Maintenance

### Regular Maintenance Tasks

1. **Update Dependencies**
   ```bash
   npm audit fix
   docker-compose pull
   ```

2. **Database Maintenance**
   ```bash
   # Vacuum database
   docker-compose exec postgres psql -U postgres -c "VACUUM ANALYZE"
   ```

3. **Log Cleanup**
   ```bash
   # Remove old logs
   find logs -name "*.log" -mtime +30 -delete
   ```

### Zero-Downtime Updates

1. **Blue-Green Deployment**
   - Deploy to parallel environment
   - Switch traffic with load balancer
   - Monitor for issues

2. **Rolling Updates**
   - Update one service at a time
   - Use health checks to verify
   - Rollback if issues detected

## Support

For deployment issues:

1. Check logs for error messages
2. Verify environment variables
3. Test database connectivity
4. Check firewall/network settings
5. Review SSL certificate configuration

## Security Updates

Keep the following updated regularly:

- Base Docker images
- Node.js dependencies
- System packages
- SSL certificates
- Database version