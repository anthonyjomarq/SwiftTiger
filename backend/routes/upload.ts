import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const subDir = req.params.type || 'general';
    const fullPath = path.join(uploadDir, subDir);
    
    // Create subdirectory if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images and documents
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files at once
  },
  fileFilter: fileFilter
});

// Upload multiple files
router.post('/', authenticate, upload.array('files', 10), async (req: any, res: any) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const files = (req.files as Express.Multer.File[]).map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/api/uploads/${file.filename}`
    }));

    logger.info(`User ${req.user.id} uploaded ${files.length} files`);

    res.json({
      message: 'Files uploaded successfully',
      files
    });
  } catch (error: any) {
    logger.error('File upload error:', error);
    res.status(500).json({ 
      message: 'Upload failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Upload files to specific subdirectory
router.post('/:type', authenticate, upload.array('files', 10), async (req: any, res: any) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const files = (req.files as Express.Multer.File[]).map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/api/uploads/${req.params.type}/${file.filename}`
    }));

    logger.info(`User ${req.user.id} uploaded ${files.length} files to ${req.params.type}`);

    res.json({
      message: 'Files uploaded successfully',
      files
    });
  } catch (error: any) {
    logger.error('File upload error:', error);
    res.status(500).json({ 
      message: 'Upload failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Delete uploaded file
router.delete('/:filename', authenticate, async (req: any, res: any) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete file
    fs.unlinkSync(filePath);
    
    logger.info(`User ${req.user.id} deleted file: ${filename}`);

    res.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    logger.error('File deletion error:', error);
    res.status(500).json({ 
      message: 'File deletion failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Delete file from subdirectory
router.delete('/:type/:filename', authenticate, async (req: any, res: any) => {
  try {
    const { type, filename } = req.params;
    const filePath = path.join(uploadDir, type, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete file
    fs.unlinkSync(filePath);
    
    logger.info(`User ${req.user.id} deleted file: ${type}/${filename}`);

    res.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    logger.error('File deletion error:', error);
    res.status(500).json({ 
      message: 'File deletion failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Get file info
router.get('/info/:filename', authenticate, async (req: any, res: any) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const stats = fs.statSync(filePath);
    const ext = path.extname(filename);

    res.json({
      filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: ext,
      url: `/api/uploads/${filename}`
    });
  } catch (error: any) {
    logger.error('File info error:', error);
    res.status(500).json({ 
      message: 'Failed to get file info', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Handle multer errors
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ message: 'Too many files. Maximum is 10 files.' });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ message: 'Unexpected field name.' });
      default:
        return res.status(400).json({ message: 'Upload error: ' + error.message });
    }
  }
  
  if (error.message.includes('File type')) {
    return res.status(400).json({ message: error.message });
  }
  
  return res.status(500).json({ message: 'Internal server error' });
});

export default router;