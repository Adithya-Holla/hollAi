const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Create a simple test model
const TestSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Test = mongoose.model('Test', TestSchema);

// Create test data
router.post('/', async (req, res) => {
  try {
    console.log('Creating test data in database');
    
    const testData = new Test({
      message: req.body.message || 'Test data ' + new Date().toISOString()
    });
    
    const savedData = await testData.save();
    console.log('Test data saved to database:', {
      id: savedData._id,
      message: savedData.message,
      timestamp: savedData.timestamp
    });
    
    res.status(201).json({
      success: true,
      data: savedData,
      message: 'Test data created successfully'
    });
  } catch (error) {
    console.error('Error saving test data:', {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      }
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error creating test data'
    });
  }
});

// Get all test data
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all test data');
    
    const testData = await Test.find().sort({ timestamp: -1 });
    console.log(`Found ${testData.length} test data entries`);
    
    res.json({
      success: true,
      count: testData.length,
      data: testData
    });
  } catch (error) {
    console.error('Error fetching test data:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error fetching test data'
    });
  }
});

// Test endpoint to check and create certifications collection
router.get('/create-certifications', async (req, res) => {
  try {
    console.log('Checking for certifications collection');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('Current collections:', collectionNames);
    
    if (collectionNames.includes('certifications')) {
      console.log('Certifications collection already exists');
    } else {
      console.log('Creating certifications collection');
      await db.createCollection('certifications');
      console.log('Certifications collection created');
    }
    
    // Get updated list of collections
    const updatedCollections = await db.listCollections().toArray();
    const updatedNames = updatedCollections.map(c => c.name);
    
    res.json({
      success: true,
      message: 'Certifications collection check completed',
      initialCollections: collectionNames,
      currentCollections: updatedNames,
      certificationExists: updatedNames.includes('certifications')
    });
  } catch (error) {
    console.error('Error checking/creating certifications collection:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error checking/creating certifications collection'
    });
  }
});

module.exports = router; 