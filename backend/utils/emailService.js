const nodemailer = require('nodemailer');
const Email = require('../models/Email');

// Create reusable transporter object
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true,
  logger: true
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP Connection Error:', {
      code: error.code,
      command: error.command,
      message: error.message,
      stack: error.stack
    });
  } else {
    console.log('SMTP Server is ready to send messages');
    console.log('SMTP Configuration:', {
      host: transporter.options.host,
      port: transporter.options.port,
      secure: transporter.options.secure,
      user: transporter.options.auth.user
    });
  }
});

const sendContactEmail = async (contactData) => {
  console.log('Email Configuration Check:', {
    env: {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_TO: process.env.EMAIL_TO,
      EMAIL_PASS: process.env.EMAIL_PASS ? 'Password is set' : 'Password is missing'
    },
    contact: {
      name: contactData.from.name,
      email: contactData.from.email,
      subject: contactData.subject,
      messageLength: contactData.message.length
    }
  });

  const mailOptions = {
    from: `"hollAi Contact Form" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    replyTo: contactData.from.email,
    subject: `${contactData.from.name} via hollAi: ${contactData.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Message from ${contactData.from.name}</h2>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px;">
          <p><strong>From:</strong> ${contactData.from.name} &lt;${contactData.from.email}&gt;</p>
          <p><strong>Subject:</strong> ${contactData.subject}</p>
          <div style="margin-top: 20px;">
            <strong>Message:</strong>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin-top: 10px;">
              ${contactData.message}
            </div>
          </div>
          <p style="margin-top: 20px; color: #666; font-size: 0.9em;">
            <strong>Received:</strong> ${new Date(contactData.createdAt).toLocaleString()}
          </p>
        </div>
        <p style="margin-top: 20px; color: #666; font-size: 0.8em;">
          This message was sent through the hollAi website's contact form.
        </p>
      </div>
    `
  };

  try {
    console.log('Attempting to send email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      replyTo: mailOptions.replyTo
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      envelope: info.envelope
    });

    // Update email record with sent status
    await Email.findByIdAndUpdate(contactData._id, {
      sent: true,
      sentAt: new Date(),
      status: 'sent'
    });
    console.log('Email record updated with sent status');

    return info;
  } catch (error) {
    console.error('Detailed Email Error:', {
      name: error.name,
      code: error.code,
      command: error.command,
      message: error.message,
      stack: error.stack,
      response: error.response,
      responseCode: error.responseCode,
      responseMessage: error.responseMessage
    });

    // Update email record with error details
    await Email.findByIdAndUpdate(contactData._id, {
      errorDetails: JSON.stringify({
        name: error.name,
        code: error.code,
        message: error.message,
        response: error.response
      }),
      status: 'failed'
    });
    console.log('Email record updated with error details');

    throw error;
  }
};

module.exports = {
  sendContactEmail
}; 