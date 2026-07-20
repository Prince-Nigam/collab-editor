const express = require('express');
const { body } = require('express-validator');
const protect = require('../middleware/protect');
const validate = require('../middleware/validate');
const {
  getMyDocuments,
  getSharedDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  removeShare,
} = require('../controllers/documentController');

const router = express.Router();

// All document routes are protected — must be logged in
router.use(protect);

// IMPORTANT: /shared must be defined BEFORE /:id
// Otherwise Express matches "shared" as an :id param
router.get('/shared', getSharedDocuments);

router.route('/')
  .get(getMyDocuments)
  .post(
    [body('title').optional().trim().isLength({ max: 200 }).withMessage('Title too long')],
    validate,
    createDocument
  );

router.route('/:id')
  .get(getDocument)
  .put(updateDocument)
  .delete(deleteDocument);

router.route('/:id/share')
  .post(
    [body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail()],
    validate,
    shareDocument
  )
  .delete(removeShare);

module.exports = router;
