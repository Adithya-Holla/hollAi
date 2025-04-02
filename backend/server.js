const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection with detailed logging
console.log('Attempting to connect to MongoDB with URI:', 
  process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'undefined');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
  // List all collections to verify connection
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.error('Error listing collections:', err);
    } else {
      console.log('Available collections:');
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
  });
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
  console.log('Test endpoint hit');
  res.json({ 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      EMAIL_USER: process.env.EMAIL_USER ? 'Email user is set' : 'Email user is not set',
      EMAIL_TO: process.env.EMAIL_TO ? 'Email to is set' : 'Email to is not set'
    }
  });
});

// Basic route
app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.json({ message: 'Welcome to Hollai Portfolio API' });
});

// Import routes
const projectRoutes = require('./routes/projects');
const emailsRoutes = require('./routes/emails');
const testRoutes = require('./routes/test');
const certificationRoutes = require('./routes/certifications');

app.use('/api/projects', projectRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/test-db', testRoutes);
app.use('/api/certifications', certificationRoutes);

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