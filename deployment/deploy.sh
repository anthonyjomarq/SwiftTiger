#!/bin/bash

# SwiftTiger Production Deployment Script
set -e

echo "🚀 Starting SwiftTiger deployment..."

# Configuration
DOMAIN=${DOMAIN:-"yourdomain.com"}
DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 32)}
JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 64)}
REDIS_PASSWORD=${REDIS_PASSWORD:-$(openssl rand -base64 32)}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if ports are available
    if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null ; then
        log_warn "Port 80 is already in use"
    fi
    
    if lsof -Pi :443 -sTCP:LISTEN -t >/dev/null ; then
        log_warn "Port 443 is already in use"
    fi
    
    log_info "✅ System requirements check passed"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment configuration..."
    
    # Create .env file for production
    cat > .env.prod << EOF
# Database Configuration
DB_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
REDIS_PASSWORD=${REDIS_PASSWORD}

# Application Configuration
CORS_ORIGIN=https://${DOMAIN}
API_URL=https://${DOMAIN}/api

# Google Maps API (set your own keys)
GOOGLE_PLACES_API_KEY=${GOOGLE_PLACES_API_KEY:-""}
GOOGLE_ROUTES_API_KEY=${GOOGLE_ROUTES_API_KEY:-""}
EOF
    
    log_info "✅ Environment configuration created"
}

# Generate SSL certificates (self-signed for development)
setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    mkdir -p nginx/ssl
    
    if [ ! -f "nginx/ssl/certificate.crt" ]; then
        log_info "Generating self-signed SSL certificate..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/private.key \
            -out nginx/ssl/certificate.crt \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}"
        
        log_warn "⚠️  Using self-signed certificate. Replace with proper SSL certificate for production."
    fi
    
    log_info "✅ SSL certificates ready"
}

# Build and deploy
deploy() {
    log_info "Building and deploying application..."
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml --env-file .env.prod pull
    
    # Build application
    docker-compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache
    
    # Start services
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    
    log_info "✅ Application deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    for i in {1..30}; do
        if curl -f http://localhost/api/health &>/dev/null; then
            log_info "✅ Backend is healthy"
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_error "Backend health check failed"
            exit 1
        fi
        
        sleep 2
    done
    
    # Check frontend
    if curl -f http://localhost/ &>/dev/null; then
        log_info "✅ Frontend is healthy"
    else
        log_error "Frontend health check failed"
        exit 1
    fi
    
    log_info "✅ All health checks passed"
}

# Cleanup old containers and images
cleanup() {
    log_info "Cleaning up old containers and images..."
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    log_info "✅ Cleanup completed"
}

# Show deployment info
show_info() {
    log_info "🎉 Deployment completed successfully!"
    echo ""
    echo "Application is now running at:"
    echo "  Frontend: http://localhost (or https://${DOMAIN})"
    echo "  Backend API: http://localhost/api (or https://${DOMAIN}/api)"
    echo "  API Documentation: http://localhost/api/docs (or https://${DOMAIN}/api/docs)"
    echo ""
    echo "Default admin credentials:"
    echo "  Email: admin@swifttiger.com"
    echo "  Password: Admin123!"
    echo ""
    echo "To view logs:"
    echo "  docker-compose -f docker-compose.prod.yml logs -f"
    echo ""
    echo "To stop the application:"
    echo "  docker-compose -f docker-compose.prod.yml down"
    echo ""
    log_warn "⚠️  Remember to:"
    log_warn "   1. Change default admin password"
    log_warn "   2. Set up proper SSL certificates"
    log_warn "   3. Configure backup strategy"
    log_warn "   4. Set up monitoring and logging"
}

# Main deployment flow
main() {
    echo "🚀 SwiftTiger Production Deployment"
    echo "===================================="
    
    check_requirements
    setup_environment
    setup_ssl
    deploy
    health_check
    cleanup
    show_info
}

# Handle script arguments
case "$1" in
    "check")
        check_requirements
        ;;
    "env")
        setup_environment
        ;;
    "ssl")
        setup_ssl
        ;;
    "deploy")
        deploy
        ;;
    "health")
        health_check
        ;;
    "cleanup")
        cleanup
        ;;
    "")
        main
        ;;
    *)
        echo "Usage: $0 [check|env|ssl|deploy|health|cleanup]"
        exit 1
        ;;
esac