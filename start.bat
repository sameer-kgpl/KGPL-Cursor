@echo off
REM Recruitment Portal Startup Script for Windows
REM This script sets up and runs the recruitment portal

echo 🏢 Recruitment Portal - Windows Startup Script
echo ===============================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH. Please install Python 3.7 or higher.
    pause
    exit /b 1
)

echo ✅ Python detected

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/update dependencies
echo 📥 Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies. Please check the error messages above.
    pause
    exit /b 1
)

REM Set environment variables
set FLASK_APP=app.py
set FLASK_ENV=development

REM Create uploads directory if it doesn't exist
if not exist "uploads" mkdir uploads

echo.
echo 🚀 Starting Recruitment Portal...
echo 📍 URL: http://localhost:5000
echo 👤 Admin: admin@company.com / admin123
echo 🛑 Press Ctrl+C to stop the server
echo.

REM Start the application
python run.py

pause