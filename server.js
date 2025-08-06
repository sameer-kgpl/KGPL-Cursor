const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Email configuration (update with your SMTP settings)
const emailTransporter = nodemailer.createTransporter({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database setup
const db = new sqlite3.Database('./recruitment.db');

// Create tables
db.serialize(() => {
  // Users table (admins, recruiters and candidates)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'candidate',
    email_verified BOOLEAN DEFAULT 0,
    verification_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Candidates table
  db.run(`CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    phone TEXT,
    location TEXT,
    experience_years INTEGER,
    skills TEXT,
    education TEXT,
    resume_path TEXT,
    current_company TEXT,
    expected_salary INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Create default admin user
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (email, password, name, role, email_verified) VALUES (?, ?, ?, ?, ?)`, 
    ['admin@company.com', adminPassword, 'Admin User', 'admin', 1]);
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word, Excel, and CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Email verification function
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `http://localhost:${PORT}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: email,
    subject: 'Verify your email - Recruitment Portal',
    html: `
      <h2>Welcome to the Recruitment Portal!</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Verify Email
      </a>
      <p>If the button doesn't work, copy and paste this link: ${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
    `
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// Routes

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Email verification endpoint
app.get('/api/auth/verify-email', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ error: 'Verification token required' });
  }

  db.get('SELECT * FROM users WHERE verification_token = ?', [token], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    db.run('UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?', [user.id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Verification failed' });
      }
      res.json({ message: 'Email verified successfully' });
    });
  });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.email_verified && user.role === 'candidate') {
      return res.status(401).json({ error: 'Please verify your email before logging in' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });
});

app.post('/api/auth/register', validateRegistration, async (req, res) => {
  const { email, password, name } = req.body;
  const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run('INSERT INTO users (email, password, name, role, verification_token) VALUES (?, ?, ?, ?, ?)', 
    [email, hashedPassword, name, 'candidate', verificationToken], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Registration failed' });
    }

    // Send verification email
    sendVerificationEmail(email, verificationToken);

    res.status(201).json({ 
      message: 'Registration successful. Please check your email to verify your account.',
      user: { id: this.lastID, email, name, role: 'candidate' } 
    });
  });
});

// Create recruiter account (admin only)
app.post('/api/auth/create-recruiter', authenticateToken, requireRole(['admin']), validateRegistration, async (req, res) => {
  const { email, password, name } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run('INSERT INTO users (email, password, name, role, email_verified) VALUES (?, ?, ?, ?, ?)', 
    [email, hashedPassword, name, 'recruiter', 1], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Recruiter creation failed' });
    }

    res.status(201).json({ 
      message: 'Recruiter account created successfully',
      user: { id: this.lastID, email, name, role: 'recruiter' } 
    });
  });
});

// Candidate profile routes
app.post('/api/candidate/profile', authenticateToken, requireRole(['candidate']), upload.single('resume'), (req, res) => {
  const { phone, location, experience_years, skills, education, current_company, expected_salary } = req.body;
  const resume_path = req.file ? req.file.path : null;

  db.run(`INSERT OR REPLACE INTO candidates 
    (user_id, phone, location, experience_years, skills, education, resume_path, current_company, expected_salary) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, phone, location, experience_years, skills, education, resume_path, current_company, expected_salary],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Profile update failed' });
      }
      res.json({ message: 'Profile updated successfully' });
    });
});

app.get('/api/candidate/profile', authenticateToken, requireRole(['candidate']), (req, res) => {
  db.get('SELECT * FROM candidates WHERE user_id = ?', [req.user.id], (err, candidate) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(candidate || {});
  });
});

// Search candidates (recruiter and admin only)
app.get('/api/candidates/search', authenticateToken, requireRole(['recruiter', 'admin']), (req, res) => {
  const { keyword, location, experience, skills } = req.query;
  let query = `
    SELECT u.name, u.email, c.* 
    FROM users u 
    LEFT JOIN candidates c ON u.id = c.user_id 
    WHERE u.role = 'candidate' AND u.email_verified = 1
  `;
  let params = [];

  if (keyword) {
    query += ` AND (u.name LIKE ? OR c.skills LIKE ? OR c.education LIKE ? OR c.current_company LIKE ?)`;
    const keywordParam = `%${keyword}%`;
    params.push(keywordParam, keywordParam, keywordParam, keywordParam);
  }

  if (location) {
    query += ` AND c.location LIKE ?`;
    params.push(`%${location}%`);
  }

  if (experience) {
    query += ` AND c.experience_years >= ?`;
    params.push(parseInt(experience));
  }

  if (skills) {
    query += ` AND c.skills LIKE ?`;
    params.push(`%${skills}%`);
  }

  query += ` ORDER BY c.created_at DESC`;

  db.all(query, params, (err, candidates) => {
    if (err) {
      return res.status(500).json({ error: 'Search failed' });
    }
    res.json(candidates);
  });
});

// Bulk upload candidates (recruiter and admin only)
app.post('/api/candidates/bulk-upload', authenticateToken, requireRole(['recruiter', 'admin']), upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File required' });
  }

  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  let results = [];

  if (fileExtension === '.csv') {
    // Handle CSV
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => processBulkUpload(results, req, res));
  } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
    // Handle Excel
    try {
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      results = XLSX.utils.sheet_to_json(worksheet);
      processBulkUpload(results, req, res);
    } catch (error) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid Excel file format' });
    }
  } else {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Unsupported file format' });
  }
});

// Process bulk upload data
const processBulkUpload = async (results, req, res) => {
  let successCount = 0;
  let errorCount = 0;

  for (const row of results) {
    try {
      const hashedPassword = await bcrypt.hash('default123', 10);
      const verificationToken = jwt.sign({ email: row.email }, JWT_SECRET, { expiresIn: '24h' });
      
      db.run('INSERT INTO users (email, password, name, role, verification_token) VALUES (?, ?, ?, ?, ?)',
        [row.email, hashedPassword, row.name, 'candidate', verificationToken], function(err) {
        if (err) {
          errorCount++;
          return;
        }

        const userId = this.lastID;
        db.run(`INSERT INTO candidates 
          (user_id, phone, location, experience_years, skills, education, current_company, expected_salary) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, row.phone, row.location, row.experience_years, row.skills, row.education, row.current_company, row.expected_salary],
          function(err) {
            if (err) {
              errorCount++;
            } else {
              successCount++;
              // Send verification email
              sendVerificationEmail(row.email, verificationToken);
            }
          });
      });
    } catch (error) {
      errorCount++;
    }
  }

  // Clean up uploaded file
  fs.unlinkSync(req.file.path);

  res.json({ 
    message: 'Bulk upload completed', 
    successCount, 
    errorCount 
  });
};

// Get candidate details (recruiter and admin only)
app.get('/api/candidates/:id', authenticateToken, requireRole(['recruiter', 'admin']), (req, res) => {
  db.get(`SELECT u.name, u.email, c.* 
    FROM users u 
    LEFT JOIN candidates c ON u.id = c.user_id 
    WHERE u.id = ? AND u.role = 'candidate'`, [req.params.id], (err, candidate) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    res.json(candidate);
  });
});

// Download resume (recruiter and admin only)
app.get('/api/candidates/:id/resume', authenticateToken, requireRole(['recruiter', 'admin']), (req, res) => {
  db.get('SELECT resume_path FROM candidates WHERE user_id = ?', [req.params.id], (err, candidate) => {
    if (err || !candidate || !candidate.resume_path) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (!fs.existsSync(candidate.resume_path)) {
      return res.status(404).json({ error: 'Resume file not found' });
    }

    res.download(candidate.resume_path);
  });
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, requireRole(['admin']), (req, res) => {
  db.all('SELECT id, email, name, role, email_verified, created_at FROM users ORDER BY created_at DESC', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Recruitment Portal running on http://localhost:${PORT}`);
  console.log('Default admin credentials: admin@company.com / admin123');
  console.log('Note: Update email configuration in server.js for email verification to work');
});