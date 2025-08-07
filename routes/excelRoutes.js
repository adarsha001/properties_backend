const express = require('express');
const multer = require('multer');
const ExcelFile = require('../models/ExcelFile');
const User = require('../models/User');
const { authenticate, authorize ,auth} = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
      return cb(new Error('Please upload an Excel file'));
    }
    cb(null, true);
  }
});

// Upload Excel file route
router.post('/upload', auth(['admin', 'manager', 'agent']), authorize(['admin', 'manager', 'agent']), upload.single('excelFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ error: 'No file uploaded' });
      }

      const excelFile = new ExcelFile({
        filename: req.file.filename || req.file.originalname,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        data: req.file.buffer,
        uploadedBy: req.user.userId
      });

      await excelFile.save();

      res.status(201).send({
        message: 'File uploaded successfully',
        file: {
          id: excelFile._id,
          name: excelFile.originalName,
          size: excelFile.size,
          uploadedAt: excelFile.createdAt
        }
      });
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// Get all uploaded files (for the current user)
router.get('/my-files', authorize, async (req, res) => {
  try {
    const files = await ExcelFile.find({ uploadedBy: req.user.userId })
      .select('-data') // Exclude the actual file data from the listing
      .sort('-createdAt');

    res.send(files);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching files' });
  }
});

// Download a specific file
router.get('/download/:id', authorize, async (req, res) => {
  try {
    const file = await ExcelFile.findOne({
      _id: req.params.id,
      uploadedBy: req.user.userId
    });

    if (!file) {
      return res.status(404).send({ error: 'File not found' });
    }

    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
      'Content-Length': file.size
    });

    res.send(file.data);
  } catch (error) {
    res.status(500).send({ error: 'Error downloading file' });
  }
});

module.exports = router;