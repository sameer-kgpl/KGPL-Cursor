const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
  // Users table (recruiters and candidates)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'candidate',
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
  db.run(`INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`, 
    ['admin@company.com', adminPassword, 'Admin User', 'recruiter']);
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
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
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

// Routes

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', 
    [email, hashedPassword, name, 'candidate'], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Registration failed' });
    }

    const token = jwt.sign(
      { id: this.lastID, email, role: 'candidate' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      token, 
      user: { id: this.lastID, email, name, role: 'candidate' } 
    });
  });
});

// Candidate profile routes
app.post('/api/candidate/profile', authenticateToken, upload.single('resume'), (req, res) => {
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

app.get('/api/candidate/profile', authenticateToken, (req, res) => {
  db.get('SELECT * FROM candidates WHERE user_id = ?', [req.user.id], (err, candidate) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(candidate || {});
  });
});

// Search candidates (recruiter only)
app.get('/api/candidates/search', authenticateToken, (req, res) => {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { keyword, location, experience, skills } = req.query;
  let query = `
    SELECT u.name, u.email, c.* 
    FROM users u 
    LEFT JOIN candidates c ON u.id = c.user_id 
    WHERE u.role = 'candidate'
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

// Bulk upload candidates (recruiter only)
app.post('/api/candidates/bulk-upload', authenticateToken, upload.single('csv'), (req, res) => {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'CSV file required' });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      let successCount = 0;
      let errorCount = 0;

      for (const row of results) {
        try {
          const hashedPassword = await bcrypt.hash('default123', 10);
          
          db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
            [row.email, hashedPassword, row.name, 'candidate'], function(err) {
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
    });
});

// Get candidate details (recruiter only)
app.get('/api/candidates/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Access denied' });
  }

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

// Download resume (recruiter only)
app.get('/api/candidates/:id/resume', authenticateToken, (req, res) => {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Access denied' });
  }

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
});