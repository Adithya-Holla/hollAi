const express = require('express');
const router = express.Router();
const Certification = require('../models/Certification');
const auth = require('../middleware/auth');
const { validateCertification } = require('../utils/validation');

// Get all certifications
router.get('/', async (req, res) => {
  try {
    const certifications = await Certification.find().sort({ issueDate: -1 });
    res.json(certifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching certifications', error: error.message });
  }
});

// Get featured certifications
router.get('/featured', async (req, res) => {
  try {
    const featuredCertifications = await Certification.find({ featured: true }).sort({ issueDate: -1 });
    res.json(featuredCertifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching featured certifications', error: error.message });
  }
});

// Get single certification by ID
router.get('/:id', async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id);
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }
    res.json(certification);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching certification', error: error.message });
  }
});

// Create new certification
router.post('/', auth, async (req, res) => {
  const { valid, errors } = validateCertification(req.body);
  if (!valid) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  try {
    const certification = new Certification(req.body);
    await certification.save();
    res.status(201).json(certification);
  } catch (error) {
    res.status(500).json({ message: 'Error creating certification', error: error.message });
  }
});

// Update certification
router.put('/:id', auth, async (req, res) => {
  const { valid, errors } = validateCertification({ ...req.body });
  if (!valid) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  try {
    const certification = await Certification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }
    res.json(certification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating certification', error: error.message });
  }
});

// Delete certification
router.delete('/:id', auth, async (req, res) => {
  try {
    const certification = await Certification.findByIdAndDelete(req.params.id);
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }
    res.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting certification', error: error.message });
  }
});

module.exports = router;
