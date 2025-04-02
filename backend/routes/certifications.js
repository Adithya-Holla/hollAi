const express = require('express');
const router = express.Router();
const Certification = require('../models/Certification');

// Get all certifications
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all certifications');
    const certifications = await Certification.find().sort({ issueDate: -1 });
    console.log(`Found ${certifications.length} certifications`);
    res.json(certifications);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ message: 'Error fetching certifications', error: error.message });
  }
});

// Get featured certifications
router.get('/featured', async (req, res) => {
  try {
    console.log('Fetching featured certifications');
    const featuredCertifications = await Certification.find({ featured: true }).sort({ issueDate: -1 });
    console.log(`Found ${featuredCertifications.length} featured certifications`);
    res.json(featuredCertifications);
  } catch (error) {
    console.error('Error fetching featured certifications:', error);
    res.status(500).json({ message: 'Error fetching featured certifications', error: error.message });
  }
});

// Get single certification by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching certification by ID:', req.params.id);
    const certification = await Certification.findById(req.params.id);
    
    if (!certification) {
      console.log('Certification not found:', req.params.id);
      return res.status(404).json({ message: 'Certification not found' });
    }
    
    console.log('Certification found:', certification._id);
    res.json(certification);
  } catch (error) {
    console.error('Error fetching certification:', error);
    res.status(500).json({ message: 'Error fetching certification', error: error.message });
  }
});

// Create new certification
router.post('/', async (req, res) => {
  try {
    console.log('Creating new certification:', req.body);
    const certification = new Certification(req.body);
    await certification.save();
    console.log('Certification created successfully:', certification._id);
    res.status(201).json(certification);
  } catch (error) {
    console.error('Error creating certification:', error);
    res.status(500).json({ message: 'Error creating certification', error: error.message });
  }
});

// Update certification
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating certification:', req.params.id);
    const certification = await Certification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!certification) {
      console.log('Certification not found for update:', req.params.id);
      return res.status(404).json({ message: 'Certification not found' });
    }
    
    console.log('Certification updated successfully:', certification._id);
    res.json(certification);
  } catch (error) {
    console.error('Error updating certification:', error);
    res.status(500).json({ message: 'Error updating certification', error: error.message });
  }
});

// Delete certification
router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting certification:', req.params.id);
    const certification = await Certification.findByIdAndDelete(req.params.id);
    
    if (!certification) {
      console.log('Certification not found for deletion:', req.params.id);
      return res.status(404).json({ message: 'Certification not found' });
    }
    
    console.log('Certification deleted successfully:', req.params.id);
    res.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    console.error('Error deleting certification:', error);
    res.status(500).json({ message: 'Error deleting certification', error: error.message });
  }
});

module.exports = router; 