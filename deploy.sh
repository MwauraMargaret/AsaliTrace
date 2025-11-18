#!/bin/bash

# AsaliTrace Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 Starting AsaliTrace Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found. Copying from .env.example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${RED}❌ Please update backend/.env with your configuration!${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Build and start containers
echo "📦 Building Docker images..."
docker-compose build

echo "🚀 Starting containers..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
docker-compose exec -T backend python manage.py migrate

# Collect static files
echo "📁 Collecting static files..."
docker-compose exec -T backend python manage.py collectstatic --noinput

# Check if superuser exists
echo "👤 Checking for superuser..."
SUPERUSER_EXISTS=$(docker-compose exec -T backend python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
print(User.objects.filter(is_superuser=True).exists())
END
)

if [ "$SUPERUSER_EXISTS" = "False" ]; then
    echo -e "${YELLOW}⚠️  No superuser found. Creating one...${NC}"
    docker-compose exec backend python manage.py createsuperuser
else
    echo -e "${GREEN}✓ Superuser already exists${NC}"
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Services are running:"
echo "  - Frontend: http://localhost"
echo "  - Backend API: http://localhost:8000"
echo "  - Admin Panel: http://localhost:8000/admin"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart services: docker-compose restart"
echo "  - Access backend shell: docker-compose exec backend python manage.py shell"


