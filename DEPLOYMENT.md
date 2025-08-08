# Deployment Guide - Recruitment Portal

This guide provides multiple deployment options for the Recruitment Portal, from simple local development to production-ready deployments.

## 🚀 Quick Start

### Option 1: Simple Local Deployment
```bash
# Install dependencies
npm install

# Start the application
npm start

# Access at http://localhost:3000
```

### Option 2: Using the Startup Script
```bash
# Make script executable (first time only)
chmod +x start.sh

# Install and setup
./start.sh install

# Start the application
./start.sh start
```

## 📦 Deployment Options

### 1. Local Development

**Prerequisites:**
- Node.js 14+ 
- npm or yarn

**Steps:**
```bash
# Clone/download the project
cd recruitment-portal

# Install dependencies
npm install

# Start development server
npm start
```

**Access:** http://localhost:3000

### 2. Docker Deployment

**Prerequisites:**
- Docker installed

**Steps:**
```bash
# Build and run with Docker
docker build -t recruitment-portal .
docker run -p 3000:3000 -d recruitment-portal

# Or use the startup script
./start.sh docker
```

**Access:** http://localhost:3000

### 3. Docker Compose Deployment

**Prerequisites:**
- Docker and Docker Compose installed

**Steps:**
```bash
# Start with Docker Compose
docker-compose up -d

# Or use the startup script
./start.sh compose
```

**Access:** http://localhost:3000

### 4. Production with PM2

**Prerequisites:**
- Node.js 14+
- PM2 installed globally

**Steps:**
```bash
# Install PM2 globally
npm install -g pm2

# Install dependencies
npm install

# Start with PM2
pm2 start server.js --name "recruitment-portal"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 5. Cloud Deployment

#### Heroku
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASS=your-app-password

# Deploy
git push heroku main
```

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Set environment variables
railway variables set JWT_SECRET=your-secret-key
railway variables set EMAIL_USER=your-email@gmail.com
railway variables set EMAIL_PASS=your-app-password

# Deploy
railway up
```

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Set environment variables in the dashboard
3. Deploy automatically

## 🔧 Configuration

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# Required
JWT_SECRET=your-secret-key-change-in-production
PORT=3000

# Optional (for email verification)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Email Configuration

For email verification to work, update the email configuration in `server.js`:

```javascript
const emailTransporter = nodemailer.createTransporter({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});
```

**Gmail Setup:**
1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password in EMAIL_PASS

**Other Email Services:**
- Outlook: `service: 'outlook'`
- Yahoo: `service: 'yahoo'`
- Custom SMTP: Use `host`, `port`, `secure` options

### Database Configuration

The application uses SQLite by default, which requires no additional setup. The database file (`recruitment.db`) is created automatically.

For production, consider:
- Regular backups of `recruitment.db`
- Using a more robust database (PostgreSQL, MySQL)
- Setting up database replication

## 🔒 Security Considerations

### Production Checklist

- [ ] Change default admin password
- [ ] Set a strong JWT_SECRET
- [ ] Configure proper email settings
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates

### Security Features Included

- **Helmet**: Security headers
- **CORS**: Cross-origin protection
- **Rate Limiting**: 100 requests per 15 minutes
- **Input Validation**: Express-validator
- **Password Hashing**: bcryptjs
- **JWT Authentication**: Secure tokens
- **File Upload Restrictions**: Type and size limits

## 📊 Monitoring and Logging

### PM2 Monitoring
```bash
# View logs
pm2 logs recruitment-portal

# Monitor processes
pm2 monit

# View status
pm2 status
```

### Docker Logs
```bash
# View container logs
docker logs recruitment-portal

# Follow logs
docker logs -f recruitment-portal
```

### Application Logs
The application logs to console. For production, consider:
- Using a logging service (Winston, Bunyan)
- Setting up log aggregation
- Monitoring application health

## 🔄 Backup and Recovery

### Database Backup
```bash
# Backup SQLite database
cp recruitment.db recruitment.db.backup

# Restore from backup
cp recruitment.db.backup recruitment.db
```

### File Uploads Backup
```bash
# Backup uploads directory
tar -czf uploads-backup.tar.gz uploads/

# Restore uploads
tar -xzf uploads-backup.tar.gz
```

### Automated Backups
Create a cron job for automated backups:

```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or change port
PORT=3001 npm start
```

#### 2. Email Verification Not Working
- Check email configuration in `server.js`
- Verify SMTP settings
- Check firewall/network settings
- Test with a simple email service first

#### 3. File Uploads Failing
```bash
# Check uploads directory permissions
ls -la uploads/

# Create directory if missing
mkdir -p uploads

# Set proper permissions
chmod 755 uploads/
```

#### 4. Database Errors
```bash
# Reset database (WARNING: deletes all data)
rm recruitment.db

# Check file permissions
ls -la recruitment.db

# Ensure SQLite is working
sqlite3 recruitment.db ".tables"
```

#### 5. Docker Issues
```bash
# Clean up Docker containers
docker system prune -a

# Rebuild image
docker build --no-cache -t recruitment-portal .

# Check container logs
docker logs recruitment-portal
```

### Performance Optimization

#### 1. Enable Compression
```javascript
const compression = require('compression');
app.use(compression());
```

#### 2. Use Redis for Sessions
```javascript
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
```

#### 3. Database Optimization
- Add indexes for frequently searched columns
- Implement database connection pooling
- Consider read replicas for high traffic

#### 4. File Storage
- Use cloud storage (AWS S3, Google Cloud Storage)
- Implement CDN for static files
- Optimize image uploads

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Implement session sharing (Redis)
- Use shared file storage
- Consider microservices architecture

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching strategies
- Use CDN for static assets

### Monitoring
- Set up application monitoring (New Relic, DataDog)
- Monitor database performance
- Track user metrics
- Set up alerting

## 🔧 Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Backup database weekly
- [ ] Monitor disk space
- [ ] Check application logs
- [ ] Review security updates
- [ ] Test email functionality
- [ ] Verify file uploads work

### Update Process
```bash
# Backup current version
cp -r . ../recruitment-portal-backup

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Test the application
npm test

# Restart the application
pm2 restart recruitment-portal
# or
docker-compose restart
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review application logs
3. Verify all prerequisites are met
4. Test with a fresh installation
5. Check GitHub issues for known problems

---

**Remember:** Always test deployments in a staging environment before going to production!