const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// @desc    Parse uploaded .txt or .md file and return as TipTap-compatible content
// @route   POST /api/documents/import
// @access  Private

const importFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError('No file uploaded', 400);
  }

  const { originalname, buffer, mimetype } = req.file;
  const ext = originalname.split('.').pop().toLowerCase();

  if (!['txt', 'md'].includes(ext)) {
    throw new ApiError('Only .txt and .md files are supported', 400);
  }

  const text = buffer.toString('utf-8');

  // Convert plain text into TipTap JSON format
  // Each non-empty line becomes a paragraph node
  // Empty lines become empty paragraphs (visual line breaks)
  const lines = text.split('\n');

  const content = lines.map((line) => {
    const trimmed = line.trimEnd();

    if (trimmed === '') {
      // Empty paragraph for blank lines
      return { type: 'paragraph' };
    }

    return {
      type: 'paragraph',
      content: [{ type: 'text', text: trimmed }],
    };
  });

  // Remove trailing empty paragraphs
  while (content.length > 0 && !content[content.length - 1].content) {
    content.pop();
  }

  const tiptapDoc = {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  };

  // Return the filename (without extension) as suggested title
  const suggestedTitle = originalname.replace(/\.(txt|md)$/i, '');

  res.status(200).json({
    success: true,
    title: suggestedTitle,
    content: tiptapDoc,
  });
});

module.exports = { importFile };
