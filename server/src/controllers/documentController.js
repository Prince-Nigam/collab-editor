const Document = require('../models/Document');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Helper: check if user has access to a document (owner OR shared)
const hasAccess = (doc, userId) => {
  const isOwner = doc.owner._id
    ? doc.owner._id.toString() === userId.toString()
    : doc.owner.toString() === userId.toString();
  const isShared = doc.sharedWith.some(
    (s) => s.user.toString() === userId.toString()
  );
  return isOwner || isShared;
};

// Helper: check if user is the owner
const isOwner = (doc, userId) => {
  const ownerId = doc.owner._id ? doc.owner._id : doc.owner;
  return ownerId.toString() === userId.toString();
};

// @desc    Get all documents owned by logged in user
// @route   GET /api/documents
// @access  Private
const getMyDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ owner: req.user._id })
    .select('title owner createdAt updatedAt')
    .sort({ updatedAt: -1 }); // Most recently updated first

  res.status(200).json({ success: true, count: documents.length, documents });
});

// @desc    Get documents shared with logged in user
// @route   GET /api/documents/shared
// @access  Private
const getSharedDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({
    'sharedWith.user': req.user._id,
  })
    .select('title owner sharedWith createdAt updatedAt')
    .populate('owner', 'name email') // Show owner's name/email
    .sort({ updatedAt: -1 });

  res.status(200).json({ success: true, count: documents.length, documents });
});

// @desc    Get a single document by ID
// @route   GET /api/documents/:id
// @access  Private (owner or shared)
const getDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('sharedWith.user', 'name email');

  if (!doc) {
    throw new ApiError('Document not found', 404);
  }

  // Authorization: must be owner or in sharedWith list
  if (!hasAccess(doc, req.user._id)) {
    throw new ApiError('Not authorized to access this document', 403);
  }

  res.status(200).json({ success: true, document: doc });
});

// @desc    Create a new document
// @route   POST /api/documents
// @access  Private
const createDocument = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  const document = await Document.create({
    title: title || 'Untitled Document',
    content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
    owner: req.user._id,
  });

  res.status(201).json({ success: true, document });
});

// @desc    Update document title and/or content
// @route   PUT /api/documents/:id
// @access  Private (owner or shared with edit permission)
const updateDocument = asyncHandler(async (req, res) => {
  let doc = await Document.findById(req.params.id);

  if (!doc) {
    throw new ApiError('Document not found', 404);
  }

  // Check ownership or edit permission
  const sharedEntry = doc.sharedWith.find(
    (s) => s.user.toString() === req.user._id.toString()
  );
  const canEdit = isOwner(doc, req.user._id) || sharedEntry?.permission === 'edit';

  if (!canEdit) {
    throw new ApiError('Not authorized to edit this document', 403);
  }

  const { title, content } = req.body;

  // Only update fields that were sent
  if (title !== undefined) doc.title = title;
  if (content !== undefined) doc.content = content;

  await doc.save();

  res.status(200).json({ success: true, document: doc });
});

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private (owner only)
const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);

  if (!doc) {
    throw new ApiError('Document not found', 404);
  }

  // Only the owner can delete — shared users cannot
  if (!isOwner(doc, req.user._id)) {
    throw new ApiError('Only the document owner can delete it', 403);
  }

  await doc.deleteOne();

  res.status(200).json({ success: true, message: 'Document deleted' });
});

// @desc    Share document with another user
// @route   POST /api/documents/:id/share
// @access  Private (owner only)
const shareDocument = asyncHandler(async (req, res) => {
  const { email, permission = 'edit' } = req.body;

  if (!email) {
    throw new ApiError('Email is required', 400);
  }

  const doc = await Document.findById(req.params.id);

  if (!doc) {
    throw new ApiError('Document not found', 404);
  }

  // Only owner can share
  if (!isOwner(doc, req.user._id)) {
    throw new ApiError('Only the document owner can share it', 403);
  }

  // Find the user to share with
  const userToShare = await User.findOne({ email: email.toLowerCase() });

  if (!userToShare) {
    throw new ApiError('No user found with that email', 404);
  }

  // Can't share with yourself
  if (userToShare._id.toString() === req.user._id.toString()) {
    throw new ApiError('You cannot share a document with yourself', 400);
  }

  // Check if already shared — update permission if so
  const existingShare = doc.sharedWith.find(
    (s) => s.user.toString() === userToShare._id.toString()
  );

  if (existingShare) {
    existingShare.permission = permission;
  } else {
    doc.sharedWith.push({ user: userToShare._id, permission });
  }

  await doc.save();

  res.status(200).json({
    success: true,
    message: `Document shared with ${userToShare.name}`,
    document: doc,
  });
});

// @desc    Remove share access for a user
// @route   DELETE /api/documents/:id/share
// @access  Private (owner only)
const removeShare = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const doc = await Document.findById(req.params.id);

  if (!doc) throw new ApiError('Document not found', 404);
  if (!isOwner(doc, req.user._id)) throw new ApiError('Only owner can revoke access', 403);

  const userToRemove = await User.findOne({ email: email.toLowerCase() });
  if (!userToRemove) throw new ApiError('User not found', 404);

  doc.sharedWith = doc.sharedWith.filter(
    (s) => s.user.toString() !== userToRemove._id.toString()
  );

  await doc.save();

  res.status(200).json({ success: true, message: 'Access revoked' });
});

module.exports = {
  getMyDocuments,
  getSharedDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  removeShare,
};
