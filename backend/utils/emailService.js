const { Resend } = require('resend');
const Email = require('../models/Email');

/*
 * Delivery goes over Resend's HTTPS API rather than SMTP.
 *
 * The previous transport dialled smtp.gmail.com:465 directly, which fails
 * with ETIMEDOUT on Render's free tier — outbound SMTP ports are blocked
 * there, so the connection never establishes. An HTTPS API is unaffected.
 *
 * EMAIL_FROM must be an address on a domain verified in Resend. Until a
 * domain is verified, Resend only accepts onboarding@resend.dev as the
 * sender and only delivers to the account owner's own address, which is
 * exactly the contact-form case here.
 */
const FROM_FALLBACK = 'hollAi Contact <onboarding@resend.dev>';

let client = null;

/** Created lazily so a missing key surfaces as a send error, not a boot crash. */
function getClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
  }
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

/** Escapes user-supplied text before it goes into the HTML body. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(contactData) {
  const name = escapeHtml(contactData.from.name);
  const email = escapeHtml(contactData.from.email);
  const subject = escapeHtml(contactData.subject);
  // Preserve the sender's line breaks without letting their markup through.
  const message = escapeHtml(contactData.message).replace(/\n/g, '<br />');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Message from ${name}</h2>
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px;">
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="margin-top: 20px;">
          <strong>Message:</strong>
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin-top: 10px;">
            ${message}
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
  `;
}

/**
 * Sends the contact notification and records the outcome on the stored
 * message. Throws on failure so the caller can distinguish delivered from
 * merely saved.
 */
const sendContactEmail = async (contactData) => {
  const to = process.env.EMAIL_TO;
  if (!to) {
    throw new Error('EMAIL_TO is not set');
  }

  try {
    const { data, error } = await getClient().emails.send({
      from: process.env.EMAIL_FROM || FROM_FALLBACK,
      to: [to],
      // So replying in the mail client goes back to the sender, not to Resend.
      replyTo: contactData.from.email,
      subject: `${contactData.from.name} via hollAi: ${contactData.subject}`,
      html: buildHtml(contactData),
    });

    /*
     * Resend reports failures in the resolved value rather than by throwing,
     * so this branch is the one that actually catches a rejected send. Without
     * it a refused delivery would be recorded as a success.
     */
    if (error) {
      const err = new Error(error.message || 'Resend rejected the message');
      err.name = error.name || 'ResendError';
      throw err;
    }

    await Email.findByIdAndUpdate(contactData._id, {
      sent: true,
      sentAt: new Date(),
      status: 'sent',
    });

    console.log('Contact email sent:', { id: data && data.id, to });
    return data;
  } catch (error) {
    console.error('Failed to send contact email:', {
      name: error.name,
      message: error.message,
    });

    await Email.findByIdAndUpdate(contactData._id, {
      errorDetails: JSON.stringify({
        name: error.name,
        message: error.message,
      }),
      status: 'failed',
    });

    throw error;
  }
};

module.exports = {
  sendContactEmail,
};
