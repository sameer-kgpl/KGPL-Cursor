# 🏢 Recruitment Portal

A comprehensive internal recruitment portal similar to naukri.com, built with Flask and Bootstrap. This portal allows recruiters to manage candidates and enables candidates to register and manage their profiles.

## ✨ Features

### For Recruiters
- **Dashboard**: Overview of candidate statistics and recent additions
- **Advanced Search**: Search candidates by keywords, location, experience, skills
- **Bulk Upload**: Import candidate data via Excel/CSV files
- **Candidate Profiles**: Detailed candidate information with contact details
- **Export Functionality**: Download candidate profiles and templates

### For Candidates
- **Self Registration**: Create and manage personal profiles
- **Profile Management**: Complete profile with skills, experience, education
- **Profile Completeness**: Track and improve profile completion percentage
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technology Stack

- **Backend**: Python Flask
- **Database**: SQLite (easily switchable to PostgreSQL/MySQL)
- **Frontend**: Bootstrap 5, HTML5, CSS3, JavaScript
- **Authentication**: Flask-Login with secure password hashing
- **File Processing**: Pandas for Excel/CSV handling
- **UI Icons**: Font Awesome

## 📋 Requirements

- Python 3.7 or higher
- pip (Python package installer)

## 🚀 Quick Start

### 1. Clone or Download the Project

```bash
# If you have git
git clone <repository-url>
cd recruitment-portal

# Or download and extract the ZIP file
```

### 2. Install Dependencies

```bash
# Install required Python packages
pip install -r requirements.txt
```

### 3. Run the Application

```bash
# Simple start
python run.py

# Or directly with app.py
python app.py
```

### 4. Access the Portal

Open your web browser and navigate to:
- **URL**: http://localhost:5000
- **Admin Login**: admin@company.com / admin123

## 🔧 Installation Guide

### Method 1: Virtual Environment (Recommended)

```bash
# Create virtual environment
python -m venv recruitment_portal_env

# Activate virtual environment
# On Windows:
recruitment_portal_env\Scripts\activate
# On macOS/Linux:
source recruitment_portal_env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python run.py
```

### Method 2: System-wide Installation

```bash
# Install dependencies globally
pip install -r requirements.txt

# Run the application
python run.py
```

### Method 3: Docker (Advanced)

```bash
# Build Docker image
docker build -t recruitment-portal .

# Run container
docker run -p 5000:5000 recruitment-portal
```

## 📊 Default Accounts

The system comes with a pre-configured admin account:

- **Email**: admin@company.com
- **Password**: admin123
- **Type**: Recruiter

**⚠️ Important**: Change the default password after first login!

## 📁 Project Structure

```
recruitment-portal/
├── app.py                 # Main Flask application
├── run.py                 # Application runner script
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/            # HTML templates
│   ├── base.html
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── recruiter_dashboard.html
│   ├── search_candidates.html
│   ├── bulk_upload.html
│   ├── candidate_detail.html
│   ├── candidate_profile.html
│   └── edit_candidate_profile.html
├── static/               # Static files
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
└── uploads/              # File upload directory
```

## 📝 Usage Guide

### For Recruiters

1. **Login** with recruiter credentials
2. **Dashboard**: View candidate statistics and recent additions
3. **Search Candidates**: Use filters to find specific candidates
4. **Bulk Upload**: 
   - Download the template file
   - Fill with candidate data
   - Upload Excel/CSV file
5. **View Profiles**: Click on candidates to see detailed information

### For Candidates

1. **Register** as a candidate
2. **Complete Profile**: Fill all sections for better visibility
3. **Update Skills**: Add relevant skills (comma-separated)
4. **Professional Summary**: Write a compelling summary
5. **Keep Updated**: Regularly update your information

## 🔧 Configuration

### Environment Variables

```bash
# Optional environment variables
export PORT=5000              # Server port (default: 5000)
export DEBUG=True             # Debug mode (default: True)
export SECRET_KEY=your-secret-key  # Flask secret key
```

### Database Configuration

By default, the application uses SQLite. To use PostgreSQL or MySQL:

1. Install appropriate database driver:
```bash
# For PostgreSQL
pip install psycopg2-binary

# For MySQL
pip install PyMySQL
```

2. Update `app.py`:
```python
# PostgreSQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@localhost/recruitment_portal'

# MySQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://user:password@localhost/recruitment_portal'
```

## 📤 Bulk Upload Format

The bulk upload feature accepts Excel (.xlsx) and CSV files with these columns:

| Column | Description | Required |
|--------|-------------|----------|
| name | Full name | Yes |
| email | Email address | Yes |
| phone | Phone number | No |
| location | City, State | No |
| experience_years | Years of experience | No |
| current_role | Job title | No |
| current_company | Company name | No |
| skills | Comma-separated skills | No |
| education | Education background | No |
| expected_salary | Salary expectations | No |
| notice_period | Notice period | No |
| summary | Professional summary | No |

## 🚀 Deployment

### Local Development
```bash
python run.py
```

### Production Deployment

#### Using Gunicorn (Linux/macOS)
```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### Using Waitress (Windows/Cross-platform)
```bash
# Install Waitress
pip install waitress

# Run with Waitress
waitress-serve --host=0.0.0.0 --port=5000 app:app
```

#### Using Apache/Nginx
Configure your web server to proxy requests to the Flask application.

### Cloud Deployment

#### Heroku
1. Create `Procfile`:
```
web: gunicorn app:app
```

2. Deploy:
```bash
heroku create your-app-name
git push heroku main
```

#### AWS/DigitalOcean
1. Set up a server with Python
2. Install dependencies
3. Configure reverse proxy (Nginx)
4. Use process manager (systemd/supervisor)

## 🔒 Security Considerations

1. **Change Default Password**: Update admin password immediately
2. **Secret Key**: Use a strong, unique secret key in production
3. **Database**: Use PostgreSQL/MySQL in production instead of SQLite
4. **HTTPS**: Enable SSL/TLS in production
5. **File Uploads**: Validate and sanitize uploaded files
6. **Access Control**: Implement proper user permissions

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Use different port
   export PORT=8000
   python run.py
   ```

2. **Database errors**:
   ```bash
   # Delete database and recreate
   rm recruitment_portal.db
   python run.py
   ```

3. **Permission errors**:
   ```bash
   # Check file permissions
   chmod +x run.py
   ```

4. **Module not found**:
   ```bash
   # Ensure all dependencies are installed
   pip install -r requirements.txt
   ```

## 📞 Support

If you encounter any issues:

1. Check the console output for error messages
2. Verify all dependencies are installed correctly
3. Ensure Python version compatibility (3.7+)
4. Check file permissions and directory structure

## 📄 License

This project is provided as-is for internal use. Modify and distribute according to your organization's policies.

## 🤝 Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**🎉 Congratulations!** Your recruitment portal is now ready to use. Start by logging in with the admin credentials and exploring the features.

For any questions or support, please refer to the troubleshooting section or contact your system administrator.