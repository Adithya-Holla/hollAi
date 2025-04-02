const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  organization: {
    type: String,
    required: true,
    trim: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date
  },
  credentialID: {
    type: String,
    trim: true
  },
  credentialURL: {
    type: String,
    trim: true
  },
  description: {
    type: String
  },
  skills: [{
    type: String,
    trim: true
  }],
  imageUrl: {
    type: String
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Certification = mongoose.model('Certification', certificationSchema);

module.exports = Certification; 