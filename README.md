# Recruitment Portal

A comprehensive internal recruitment portal similar to naukri.com, built with Node.js, Express, and vanilla JavaScript. Features role-based access control, email verification, bulk candidate upload, and advanced search capabilities.

## Features

### 🔐 Authentication & Authorization
- **Multi-role system**: Admin, Recruiter, and Candidate roles
- **Email verification**: Required for candidate accounts
- **JWT-based authentication**: Secure token-based sessions
- **Role-based access control**: Different features for different roles

### 👥 Candidate Features
- **Self-registration**: Candidates can create accounts
- **Profile management**: Update personal and professional information
- **Resume upload**: Support for PDF and Word documents
- **Email verification**: Required before accessing the portal

### 🔍 Recruiter Features
- **Advanced search**: Search candidates by keywords, location, experience, and skills
- **Candidate profiles**: View detailed candidate information
- **Resume download**: Download candidate resumes
- **Bulk upload**: Import candidates from Excel or CSV files

### 👨‍💼 Admin Features
- **User management**: View all users and their verification status
- **Recruiter creation**: Create new recruiter accounts
- **System overview**: Monitor portal usage and user statistics

### 📊 Bulk Upload
- **Multiple formats**: Support for Excel (.xlsx, .xls) and CSV files
- **Automatic verification**: Sends verification emails to uploaded candidates
- **Error handling**: Detailed success/failure reporting
- **Default passwords**: Automatically assigns default passwords

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (file-based, no installation required)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: JWT, bcryptjs
- **File Upload**: Multer
- **Email**: Nodemailer
- **Excel Processing**: xlsx library
- **Security**: Helmet, CORS, Rate limiting

## Installation

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Quick Start

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd recruitment-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure email settings** (optional for email verification)
   Edit `server.js` and update the email configuration:
   ```javascript
   const emailTransporter = nodemailer.createTransporter({
     service: 'gmail', // or your email service
     auth: {
       user: 'your-email@gmail.com',
       pass: 'your-app-password'
     }
   });
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Access the portal**
   Open your browser and go to `http://localhost:3000`

### Default Admin Account
- **Email**: admin@company.com
- **Password**: admin123

## File Structure

```
recruitment-portal/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── recruitment.db         # SQLite database (created automatically)
├── uploads/              # File uploads directory (created automatically)
├── public/               # Frontend files
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styles
│   └── script.js         # Frontend JavaScript
└── README.md             # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Candidate registration
- `POST /api/auth/create-recruiter` - Create recruiter (admin only)
- `GET /api/auth/verify-email` - Email verification

### Candidate Profile
- `GET /api/candidate/profile` - Get candidate profile
- `POST /api/candidate/profile` - Update candidate profile

### Search & Management
- `GET /api/candidates/search` - Search candidates
- `GET /api/candidates/:id` - Get candidate details
- `GET /api/candidates/:id/resume` - Download resume
- `POST /api/candidates/bulk-upload` - Bulk upload candidates

### Admin
- `GET /api/users` - Get all users (admin only)

## Bulk Upload Format

### Required Columns (Excel/CSV)
- `name` - Full name
- `email` - Email address
- `phone` - Phone number
- `location` - Location/City
- `experience_years` - Years of experience
- `skills` - Skills (comma-separated)
- `education` - Education details
- `current_company` - Current company
- `expected_salary` - Expected salary

### Example CSV Format
```csv
name,email,phone,location,experience_years,skills,education,current_company,expected_salary
John Doe,john@example.com,+1234567890,New York,5,JavaScript,React,Node.js,BS Computer Science,Tech Corp,80000
Jane Smith,jane@example.com,+1234567891,San Francisco,3,Python,Django,MS Data Science,Startup Inc,90000
```

## Deployment Options

### 1. Local Development
```bash
npm install
npm start
```

### 2. Production with PM2
```bash
npm install -g pm2
npm install
pm2 start server.js --name "recruitment-portal"
pm2 save
pm2 startup
```

### 3. Docker Deployment
```bash
# Build Docker image
docker build -t recruitment-portal .

# Run container
docker run -p 3000:3000 -d recruitment-portal
```

### 4. Cloud Deployment (Heroku, Railway, etc.)
```bash
# Set environment variables
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Deploy
git push heroku main
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `JWT_SECRET` | JWT secret key | 'your-secret-key-change-in-production' |
| `EMAIL_USER` | Email username | 'your-email@gmail.com' |
| `EMAIL_PASS` | Email password | 'your-app-password' |

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate limiting**: 100 requests per 15 minutes
- **Input validation**: Express-validator
- **Password hashing**: bcryptjs
- **JWT tokens**: Secure authentication
- **File upload restrictions**: Type and size limits

## Customization

### Adding New Roles
1. Update the `requireRole` middleware in `server.js`
2. Add role-specific routes
3. Update frontend navigation in `script.js`

### Customizing Email Templates
Edit the `sendVerificationEmail` function in `server.js` to customize email content and styling.

### Database Schema Changes
Modify the table creation queries in `server.js` to add new fields or tables.

## Troubleshooting

### Common Issues

1. **Email verification not working**
   - Check email configuration in `server.js`
   - Verify SMTP settings
   - Check firewall/network settings

2. **File uploads failing**
   - Ensure `uploads/` directory exists
   - Check file size limits (10MB)
   - Verify file types (PDF, DOC, DOCX, XLSX, XLS, CSV)

3. **Database errors**
   - Delete `recruitment.db` to reset database
   - Check file permissions
   - Ensure SQLite is working

4. **Port already in use**
   - Change PORT environment variable
   - Kill existing process: `lsof -ti:3000 | xargs kill -9`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check browser console for errors
4. Verify all dependencies are installed

---

**Note**: This is a production-ready application with security features, but remember to:
- Change default admin credentials
- Update JWT secret in production
- Configure proper email settings
- Set up SSL/TLS for production use
- Regular database backups
- Monitor application logs