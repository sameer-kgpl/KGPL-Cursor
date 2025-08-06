#!/bin/bash

# Recruitment Portal Startup Script
# This script sets up and runs the recruitment portal

echo "🏢 Recruitment Portal - Startup Script"
echo "======================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.7"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo "✅ Python $PYTHON_VERSION detected"
else
    echo "❌ Python $PYTHON_VERSION is too old. Please install Python 3.7 or higher."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Please check the error messages above."
    exit 1
fi

# Set environment variables
export FLASK_APP=app.py
export FLASK_ENV=development

# Create uploads directory if it doesn't exist
mkdir -p uploads

echo "🚀 Starting Recruitment Portal..."
echo "📍 URL: http://localhost:5000"
echo "👤 Admin: admin@company.com / admin123"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Start the application
python run.py