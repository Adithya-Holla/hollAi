const express = require('express');
const router = express.Router();
const Email = require('../models/Email');
const { sendContactEmail } = require('../utils/emailService');

// Submit new contact message
router.post('/contact', async (req, res) => {
  console.log('Received contact form submission:', {
    body: req.body,
    headers: req.headers,
    ip: req.ip
  });

  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.log('Validation failed - missing fields:', {
        name: !!name,
        email: !!email,
        subject: !!subject,
        message: !!message
      });
      return res.status(400).json({ 
        message: 'All fields are required',
        missingFields: {
          name: !name,
          email: !email,
          subject: !subject,
          message: !message
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed - invalid email format:', email);
      return res.status(400).json({ message: 'Invalid email format' });
    }

    console.log('Creating new email document');
    const emailDoc = new Email({
      from: {
        name,
        email
      },
      to: process.env.EMAIL_TO,
      subject,
      message
    });

    // Save to MongoDB
    const savedEmail = await emailDoc.save();
    console.log('Email saved to database:', {
      id: savedEmail._id,
      createdAt: savedEmail.createdAt
    });

    // Send email notification
    try {
      console.log('Attempting to send email');
      const emailInfo = await sendContactEmail(savedEmail);
      console.log('Email sent successfully:', {
        messageId: emailInfo.messageId,
        response: emailInfo.response
      });

      res.status(201).json({
        message: 'Message sent successfully',
        email: {
          id: savedEmail._id,
          name: savedEmail.from.name,
          email: savedEmail.from.email,
          subject: savedEmail.subject,
          createdAt: savedEmail.createdAt
        }
      });
    } catch (emailError) {
      console.error('Failed to send email:', {
        error: emailError.message,
        stack: emailError.stack,
        code: emailError.code
      });
      
      // Still return success to user but log the email error
      res.status(201).json({
        message: 'Message received but email notification failed',
        email: {
          id: savedEmail._id,
          name: savedEmail.from.name,
          email: savedEmail.from.email,
          subject: savedEmail.subject,
          createdAt: savedEmail.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Error in contact form submission:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      request: {
        body: req.body,
        headers: req.headers,
        ip: req.ip
      }
    });
    res.status(500).json({ 
      message: 'Error processing your message', 
      error: error.message 
    });
  }
});

// Get all emails
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all emails');
    const emails = await Email.find().sort({ createdAt: -1 });
    console.log(`Found ${emails.length} email records`);
    res.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
    res.status(500).json({ message: 'Error fetching emails', error: error.message });
  }
});

// Get email by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching email by ID:', req.params.id);
    const email = await Email.findById(req.params.id);
    
    if (!email) {
      console.log('Email not found:', req.params.id);
      return res.status(404).json({ message: 'Email not found' });
    }
    
    console.log('Email found:', email._id);
    res.json(email);
  } catch (error) {
    console.error('Error fetching email by ID:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      emailId: req.params.id
    });
    res.status(500).json({ message: 'Error fetching email', error: error.message });
  }
});

// Get emails by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    console.log('Fetching emails by status:', status);
    
    let query = {};
    if (status === 'sent') {
      query = { status: 'sent' };
    } else if (status === 'failed') {
      query = { status: 'failed' };
    } else if (status === 'new') {
      query = { status: 'new' };
    }
    
    const emails = await Email.find(query).sort({ createdAt: -1 });
    console.log(`Found ${emails.length} emails with status: ${status}`);
    res.json(emails);
  } catch (error) {
    console.error('Error fetching emails by status:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      status: req.params.status
    });
    res.status(500).json({ message: 'Error fetching emails by status', error: error.message });
  }
});

module.exports = router; 