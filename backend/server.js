const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('FATAL: JWT_SECRET is missing or too short. Set a strong JWT_SECRET in backend/.env before starting the server.');
  process.exit(1);
}

// Create Express app
const app = express();

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://hollai.netlify.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch((err) => {
  console.error('MongoDB connection error details:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack
  });
});

// Database connection test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    // Check if connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        connected: false,
        readyState: mongoose.connection.readyState,
        message: 'Database not connected'
      });
    }

    // Get list of collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      connected: true,
      database: mongoose.connection.db.databaseName,
      collections: collections.map(c => c.name),
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      connected: false,
      error: error.message,
      message: 'Error testing database connection'
    });
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Hollai Portfolio API' });
});

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const emailsRoutes = require('./routes/emails');
const testRoutes = require('./routes/test');
const certificationRoutes = require('./routes/certifications');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/test-db', testRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Test the server at: http://localhost:' + PORT + '/test');
  console.log('Test database connection at: http://localhost:' + PORT + '/api/db-test');
}); 