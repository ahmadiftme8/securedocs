// backend/auth-server.js - Production Authentication Backend
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { body, validationResult } = require('express-validator')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: 'Too many authentication attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})

app.use(express.json({ limit: '10mb' }))
app.use(generalLimiter)

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

// Database setup
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'users.db')

// Initialize SQLite database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
  } else {
    console.log('Connected to the SQLite database.')
    initializeDatabase()
  }
})

// Create tables if they don't exist
function initializeDatabase() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME,
      is_active BOOLEAN DEFAULT 1,
      email_verified BOOLEAN DEFAULT 0,
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until DATETIME,
      password_reset_token TEXT,
      password_reset_expires DATETIME
    )
  `

  const createRefreshTokensTable = `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_revoked BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `

  db.run(createUsersTable, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message)
    } else {
      console.log('Users table ready')
    }
  })

  db.run(createRefreshTokensTable, (err) => {
    if (err) {
      console.error('Error creating refresh_tokens table:', err.message)
    } else {
      console.log('Refresh tokens table ready')
    }
  })
}

// Validation middleware
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('role')
    .isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user')
]

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
]

// Helper functions
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  )

  return { accessToken, refreshToken }
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// Middleware to authenticate requests
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = verifyToken(token)
    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' })
    }
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

// Routes

// Register new user
app.post('/api/auth/register', authLimiter, validateRegistration, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { email, password, name, role } = req.body

    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Insert new user
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (email, password_hash, name, role, email_verified) VALUES (?, ?, ?, ?, ?)',
        [email, passwordHash, name, role, true], // Set email_verified to true for demo
        function(err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        }
      )
    })

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(result.id)

    // Store refresh token
    const refreshTokenExpiry = new Date()
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7) // 7 days

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [result.id, refreshToken, refreshTokenExpiry.toISOString()],
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    // Get user data to return
    const userData = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
        [result.id],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })

    res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Login user
app.post('/api/auth/login', authLimiter, validateLogin, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { email, password } = req.body

    // Get user from database
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check if account is locked
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return res.status(423).json({
        error: 'Account temporarily locked due to too many failed attempts'
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      // Increment failed login attempts
      const failedAttempts = user.failed_login_attempts + 1
      let lockedUntil = null

      // Lock account after 5 failed attempts for 30 minutes
      if (failedAttempts >= 5) {
        lockedUntil = new Date()
        lockedUntil.setMinutes(lockedUntil.getMinutes() + 30)
      }

      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
          [failedAttempts, lockedUntil?.toISOString() || null, user.id],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Reset failed attempts and update last login
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id],
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id)

    // Store refresh token
    const refreshTokenExpiry = new Date()
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7)

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, refreshToken, refreshTokenExpiry.toISOString()],
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    // Return user data (without password hash)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
      lastLoginAt: new Date().toISOString()
    }

    res.json({
      message: 'Login successful',
      user: userData,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Refresh token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' })
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken)
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' })
    }

    // Check if refresh token exists and is not revoked
    const tokenRecord = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM refresh_tokens WHERE token = ? AND is_revoked = 0 AND expires_at > CURRENT_TIMESTAMP',
        [refreshToken],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })

    if (!tokenRecord) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    // Generate new access token
    const { accessToken: newAccessToken } = generateTokens(decoded.userId)

    res.json({
      accessToken: newAccessToken,
      expiresIn: JWT_EXPIRES_IN
    })

  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(401).json({ error: 'Invalid refresh token' })
  }
})

// Logout (revoke refresh token)
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (refreshToken) {
      // Revoke the refresh token
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE refresh_tokens SET is_revoked = 1 WHERE token = ?',
          [refreshToken],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })
    }

    res.json({ message: 'Logged out successfully' })

  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email, name, role, created_at, last_login_at FROM users WHERE id = ? AND is_active = 1',
        [req.userId],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })

  } catch (error) {
    console.error('Profile fetch error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user profile
app.put('/api/auth/profile', authenticateToken, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { name } = req.body

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, req.userId],
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    // Get updated user data
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email, name, role, created_at, last_login_at FROM users WHERE id = ?',
        [req.userId],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })

    res.json({
      message: 'Profile updated successfully',
      user
    })

  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...')
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message)
    } else {
      console.log('Database connection closed.')
    }
    process.exit(0)
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Authentication server running on port ${PORT}`)
  console.log(`Database: ${DB_PATH}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app
