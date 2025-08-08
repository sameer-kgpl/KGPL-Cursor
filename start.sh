#!/bin/bash

# Recruitment Portal Startup Script
# This script helps you deploy and manage the recruitment portal

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js version 14 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 14 ]; then
        print_error "Node.js version 14 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js version $(node -v) is installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p uploads
    print_success "Directories created successfully"
}

# Configure email settings
configure_email() {
    print_warning "Email configuration is required for email verification to work."
    echo "Please update the email configuration in server.js:"
    echo "1. Open server.js"
    echo "2. Find the emailTransporter configuration"
    echo "3. Update with your email credentials"
    echo ""
    echo "Example:"
    echo "const emailTransporter = nodemailer.createTransporter({"
    echo "  service: 'gmail',"
    echo "  auth: {"
    echo "    user: 'your-email@gmail.com',"
    echo "    pass: 'your-app-password'"
    echo "  }"
    echo "});"
    echo ""
}

# Start the application
start_application() {
    print_status "Starting Recruitment Portal..."
    print_status "The application will be available at: http://localhost:3000"
    print_status "Default admin credentials: admin@company.com / admin123"
    echo ""
    npm start
}

# Docker deployment
deploy_docker() {
    print_status "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    print_status "Building Docker image..."
    docker build -t recruitment-portal .
    
    print_status "Starting container..."
    docker run -d \
        --name recruitment-portal \
        -p 3000:3000 \
        -v $(pwd)/uploads:/app/uploads \
        -v $(pwd)/recruitment.db:/app/recruitment.db \
        -e JWT_SECRET=your-secret-key-change-in-production \
        recruitment-portal
    
    print_success "Docker container started successfully"
    print_status "The application is available at: http://localhost:3000"
}

# Docker Compose deployment
deploy_docker_compose() {
    print_status "Deploying with Docker Compose..."
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Starting services..."
    docker-compose up -d
    
    print_success "Docker Compose deployment completed"
    print_status "The application is available at: http://localhost:3000"
}

# Stop Docker deployment
stop_docker() {
    print_status "Stopping Docker container..."
    docker stop recruitment-portal 2>/dev/null || true
    docker rm recruitment-portal 2>/dev/null || true
    print_success "Docker container stopped"
}

# Stop Docker Compose deployment
stop_docker_compose() {
    print_status "Stopping Docker Compose services..."
    docker-compose down
    print_success "Docker Compose services stopped"
}

# Show logs
show_logs() {
    if docker ps | grep -q recruitment-portal; then
        print_status "Showing Docker container logs..."
        docker logs -f recruitment-portal
    elif docker-compose ps | grep -q recruitment-portal; then
        print_status "Showing Docker Compose logs..."
        docker-compose logs -f
    else
        print_error "No running containers found"
    fi
}

# Reset database
reset_database() {
    print_warning "This will delete all data in the database. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Resetting database..."
        rm -f recruitment.db
        print_success "Database reset successfully"
    else
        print_status "Database reset cancelled"
    fi
}

# Show help
show_help() {
    echo "Recruitment Portal Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  install     - Install dependencies and setup the application"
    echo "  start       - Start the application locally"
    echo "  docker      - Deploy using Docker"
    echo "  compose     - Deploy using Docker Compose"
    echo "  stop        - Stop Docker deployment"
    echo "  logs        - Show application logs"
    echo "  reset       - Reset the database"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 install    # First time setup"
    echo "  $0 start      # Start locally"
    echo "  $0 docker     # Deploy with Docker"
    echo "  $0 compose    # Deploy with Docker Compose"
}

# Main script logic
case "${1:-help}" in
    install)
        print_status "Setting up Recruitment Portal..."
        check_nodejs
        install_dependencies
        create_directories
        configure_email
        print_success "Setup completed successfully!"
        echo ""
        print_status "Next steps:"
        echo "1. Configure email settings in server.js (optional)"
        echo "2. Run: $0 start"
        ;;
    start)
        check_nodejs
        if [ ! -d "node_modules" ]; then
            print_warning "Dependencies not installed. Installing now..."
            install_dependencies
        fi
        create_directories
        start_application
        ;;
    docker)
        deploy_docker
        ;;
    compose)
        deploy_docker_compose
        ;;
    stop)
        stop_docker
        stop_docker_compose
        ;;
    logs)
        show_logs
        ;;
    reset)
        reset_database
        ;;
    help|*)
        show_help
        ;;
esac