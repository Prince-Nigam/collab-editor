const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: 'Untitled Document',
    },
    // TipTap stores content as JSON (ProseMirror format)
    // Storing as Object is better than String — no need to parse/stringify
    content: {
      type: Object,
      default: {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Array of users this document is shared with + their permission level
    sharedWith: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        permission: {
          type: String,
          enum: ['view', 'edit'],
          default: 'edit',
        },
      },
    ],
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Index for fast lookup of documents by owner
documentSchema.index({ owner: 1 });
// Index for finding documents shared with a user
documentSchema.index({ 'sharedWith.user': 1 });

module.exports = mongoose.model('Document', documentSchema);
