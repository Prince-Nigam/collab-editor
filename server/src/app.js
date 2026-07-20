const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security headers — always use in production
app.use(helmet());

// CORS — allow requests from your Next.js frontend
// CLIENT_URL can be comma-separated for multiple origins
// e.g. CLIENT_URL=https://collab-editor.vercel.app,http://localhost:3000
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// HTTP request logger — only in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' })); // 10mb for document content
app.use(express.urlencoded({ extended: true }));

// Health check — useful for Render's health ping and quick sanity checks
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/import', require('./routes/importRoutes'));

// Global error handler — MUST be last
app.use(errorHandler);

module.exports = app;
