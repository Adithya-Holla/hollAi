const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  from: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }
  },
  to: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  sent: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['new', 'sent', 'failed'],
    default: 'new'
  },
  errorDetails: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Email = mongoose.model('Email', emailSchema);

module.exports = Email; 