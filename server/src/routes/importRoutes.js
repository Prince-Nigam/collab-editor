const express = require('express');
const multer = require('multer');
const protect = require('../middleware/protect');
const { importFile } = require('../controllers/importController');

const router = express.Router();

// Store file in memory (buffer) — no disk writes needed
// We only parse the text content and return it, not store the file
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['text/plain', 'text/markdown', 'text/x-markdown'];
    // Also allow by extension since MIME types can vary by OS
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowed.includes(file.mimetype) || ['txt', 'md'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt and .md files are allowed'), false);
    }
  },
});

router.post('/', protect, upload.single('file'), importFile);

module.exports = router;
