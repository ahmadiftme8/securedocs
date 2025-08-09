// server.js - Production-ready backend for file uploads
const express = require('express')
const multer = require('multer')
const cors = require('cors')
const path = require('path')
const fs = require('fs').promises
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// Rate limiting
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 uploads per windowMs
  message: 'Too many upload attempts from this IP, please try again later.'
})

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// File upload configuration
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/gif'
]

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_PATH)
  } catch {
    await fs.mkdir(UPLOAD_PATH, { recursive: true })
  }
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir()
    cb(null, UPLOAD_PATH)
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
    cb(null, uniqueSuffix + '-' + sanitizedName)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false)
    }
  }
})

// JWT middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// In-memory storage for demo (use database in production)
let documents = []
let uploadSessions = new Map()

// Generate file checksum
async function generateChecksum(filePath) {
  const fileBuffer = await fs.readFile(filePath)
  return crypto.createHash('sha256').update(fileBuffer).digest('hex')
}

// Routes

// Get upload configuration
app.get('/api/files/config', (req, res) => {
  res.json({
    maxFileSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_MIME_TYPES,
    maxFilesPerUpload: 10
  })
})

// Single file upload
app.post('/api/files/upload', uploadLimiter, authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {}
    const checksum = await generateChecksum(req.file.path)

    const document = {
      id: Date.now(),
      name: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      type: req.file.mimetype,
      uploadedBy: req.user.email || req.user.id,
      createdAt: new Date().toISOString(),
      checksum,
      metadata,
      url: `/api/files/${Date.now()}/download`
    }

    documents.push(document)

    res.json({
      id: document.id,
      url: document.url,
      checksum: document.checksum,
      metadata: document.metadata
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// Multiple file upload
app.post('/api/files/upload/multiple', uploadLimiter, authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {}
    const results = []

    for (const file of req.files) {
      const checksum = await generateChecksum(file.path)

      const document = {
        id: Date.now() + Math.random(),
        name: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        type: file.mimetype,
        uploadedBy: req.user.email || req.user.id,
        createdAt: new Date().toISOString(),
        checksum,
        metadata,
        url: `/api/files/${Date.now()}/download`
      }

      documents.push(document)
      results.push({
        id: document.id,
        url: document.url,
        checksum: document.checksum,
        metadata: document.metadata
      })
    }

    res.json({ files: results })
  } catch (error) {
    console.error('Multiple upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// Initialize chunked upload
app.post('/api/files/upload/init', authenticateToken, (req, res) => {
  const { fileName, fileSize, totalChunks, metadata } = req.body

  if (fileSize > MAX_FILE_SIZE) {
    return res.status(400).json({ error: 'File size exceeds limit' })
  }

  const uploadId = crypto.randomUUID()
  uploadSessions.set(uploadId, {
    fileName,
    fileSize,
    totalChunks,
    metadata,
    uploadedChunks: [],
    createdAt: new Date(),
    userId: req.user.email || req.user.id
  })

  res.json({ uploadId })
})

// Upload chunk
app.post('/api/files/upload/chunk', authenticateToken, upload.single('chunk'), (req, res) => {
  const { uploadId, chunkIndex } = req.body

  if (!uploadSessions.has(uploadId)) {
    return res.status(400).json({ error: 'Invalid upload session' })
  }

  const session = uploadSessions.get(uploadId)
  session.uploadedChunks[parseInt(chunkIndex)] = {
    path: req.file.path,
    size: req.file.size
  }

  res.json({ chunkIndex: parseInt(chunkIndex), uploaded: true })
})

// Complete chunked upload
app.post('/api/files/upload/complete', authenticateToken, async (req, res) => {
  const { uploadId } = req.body

  if (!uploadSessions.has(uploadId)) {
    return res.status(400).json({ error: 'Invalid upload session' })
  }

  try {
    const session = uploadSessions.get(uploadId)
    const finalFileName = Date.now() + '-' + session.fileName
    const finalPath = path.join(UPLOAD_PATH, finalFileName)

    // Combine chunks
    const writeStream = require('fs').createWriteStream(finalPath)

    for (let i = 0; i < session.totalChunks; i++) {
      const chunk = session.uploadedChunks[i]
      if (!chunk) {
        throw new Error(`Missing chunk ${i}`)
      }

      const chunkData = await fs.readFile(chunk.path)
      writeStream.write(chunkData)

      // Clean up chunk file
      await fs.unlink(chunk.path)
    }

    writeStream.end()

    // Generate checksum for final file
    const checksum = await generateChecksum(finalPath)

    const document = {
      id: Date.now(),
      name: session.fileName,
      filename: finalFileName,
      path: finalPath,
      size: session.fileSize,
      type: 'application/octet-stream', // Would need to detect from filename
      uploadedBy: session.userId,
      createdAt: new Date().toISOString(),
      checksum,
      metadata: session.metadata,
      url: `/api/files/${Date.now()}/download`
    }

    documents.push(document)
    uploadSessions.delete(uploadId)

    res.json({
      id: document.id,
      url: document.url,
      checksum: document.checksum,
      metadata: document.metadata
    })
  } catch (error) {
    console.error('Chunked upload completion error:', error)
    res.status(500).json({ error: 'Failed to complete upload' })
  }
})

// Cancel upload
app.post('/api/files/upload/:uploadId/cancel', authenticateToken, async (req, res) => {
  const { uploadId } = req.params

  if (uploadSessions.has(uploadId)) {
    const session = uploadSessions.get(uploadId)

    // Clean up uploaded chunks
    for (const chunk of session.uploadedChunks) {
      if (chunk && chunk.path) {
        try {
          await fs.unlink(chunk.path)
        } catch (error) {
          console.error('Error cleaning up chunk:', error)
        }
      }
    }

    uploadSessions.delete(uploadId)
  }

  res.json({ message: 'Upload cancelled' })
})

// Download file
app.get('/api/files/:id/download', authenticateToken, (req, res) => {
  const fileId = parseInt(req.params.id)
  const document = documents.find(doc => doc.id === fileId)

  if (!document) {
    return res.status(404).json({ error: 'File not found' })
  }

  res.download(document.path, document.name, (error) => {
    if (error) {
      console.error('Download error:', error)
      res.status(500).json({ error: 'Download failed' })
    }
  })
})

// Delete file
app.delete('/api/files/:id', authenticateToken, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id)
    const docIndex = documents.findIndex(doc => doc.id === fileId)

    if (docIndex === -1) {
      return res.status(404).json({ error: 'File not found' })
    }

    const document = documents[docIndex]

    // Check permissions (admin can delete any file, users can only delete their own)
    if (req.user.role !== 'admin' && document.uploadedBy !== (req.user.email || req.user.id)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Delete physical file
    try {
      await fs.unlink(document.path)
    } catch (error) {
      console.error('Error deleting physical file:', error)
    }

    // Remove from documents array
    documents.splice(docIndex, 1)

    res.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ error: 'Delete failed' })
  }
})

// Get file metadata
app.get('/api/files/:id/metadata', authenticateToken, (req, res) => {
  const fileId = parseInt(req.params.id)
  const document = documents.find(doc => doc.id === fileId)

  if (!document) {
    return res.status(404).json({ error: 'File not found' })
  }

  res.json({
    id: document.id,
    name: document.name,
    size: document.size,
    type: document.type,
    uploadedBy: document.uploadedBy,
    createdAt: document.createdAt,
    checksum: document.checksum,
    metadata: document.metadata
  })
})

// Search files
app.get('/api/files/search', authenticateToken, (req, res) => {
  const { query, type, size, dateRange } = req.query
  let results = documents

  // Filter by user permissions
  if (req.user.role !== 'admin') {
    results = results.filter(doc => doc.uploadedBy === (req.user.email || req.user.id))
  }

  // Apply search filters
  if (query) {
    const searchTerm = query.toLowerCase()
    results = results.filter(doc =>
      doc.name.toLowerCase().includes(searchTerm) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm)
    )
  }

  if (type) {
    results = results.filter(doc => doc.type === type)
  }

  if (size) {
    if (size.min) results = results.filter(doc => doc.size >= parseInt(size.min))
    if (size.max) results = results.filter(doc => doc.size <= parseInt(size.max))
  }

  if (dateRange) {
    if (dateRange.start) {
      results = results.filter(doc => new Date(doc.createdAt) >= new Date(dateRange.start))
    }
    if (dateRange.end) {
      results = results.filter(doc => new Date(doc.createdAt) <= new Date(dateRange.end))
    }
  }

  res.json({ files: results })
})

// Get all files (with pagination)
app.get('/api/files', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 50
  const offset = (page - 1) * limit

  let results = documents

  // Filter by user permissions
  if (req.user.role !== 'admin') {
    results = results.filter(doc => doc.uploadedBy === (req.user.email || req.user.id))
  }

  // Sort by creation date (newest first)
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const paginatedResults = results.slice(offset, offset + limit)

  res.json({
    files: paginatedResults,
    pagination: {
      page,
      limit,
      total: results.length,
      pages: Math.ceil(results.length / limit)
    }
  })
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error)

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field' })
    }
  }

  if (error.message.includes('File type') && error.message.includes('not allowed')) {
    return res.status(400).json({ error: error.message })
  }

  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Cleanup old upload sessions (run every hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  for (const [uploadId, session] of uploadSessions.entries()) {
    if (session.createdAt < oneHourAgo) {
      // Clean up chunks
      session.uploadedChunks.forEach(chunk => {
        if (chunk && chunk.path) {
          fs.unlink(chunk.path).catch(console.error)
        }
      })
      uploadSessions.delete(uploadId)
    }
  }
}, 60 * 60 * 1000) // 1 hour

// Start server
app.listen(PORT, () => {
  console.log(`File upload server running on port ${PORT}`)
  console.log(`Upload directory: ${UPLOAD_PATH}`)
  console.log(`Max file size: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  ensureUploadDir()
})
