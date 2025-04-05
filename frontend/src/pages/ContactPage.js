import React, { useState } from 'react';
import '../styles/ContactPage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaGithub, FaLinkedin, FaCopy, FaCheck, FaPaperPlane } from 'react-icons/fa';

function ContactPage({ isDarkMode, toggleTheme }) {
  const [copiedStates, setCopiedStates] = useState({
    email: false,
    phone: false
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [formStatus, setFormStatus] = useState({
    submitted: false,
    error: false,
    message: ''
  });

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [type]: false }));
    }, 2000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ submitted: true, error: false, message: 'Sending message...' });
    
    try {
      const response = await fetch('https://hollai-backend-b31l.onrender.com/api/emails/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      setFormStatus({
        submitted: true,
        error: false,
        message: 'Message sent successfully!'
      });
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });

      // Reset form status after 3 seconds
      setTimeout(() => {
        setFormStatus({
          submitted: false,
          error: false,
          message: ''
        });
      }, 3000);

    } catch (error) {
      console.error('Error sending message:', error);
      setFormStatus({
        submitted: false,
        error: true,
        message: 'Failed to send message. Please try again.'
      });
    }
  };

  return (
    <div className={`contact-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      <main className="contact-container">
        <h1 className="contact-title">Get in <span className="highlight">Touch</span></h1>
        <p className="contact-subtitle">Have a question or want to work together? Let's connect!</p>
        
        <div className="contact-content">
          <div className="contact-info-left">
            <div className="info-card" onClick={() => copyToClipboard('adithyavholla23@gmail.com', 'email')}>
              <div className="info-icon">
                <FaEnvelope />
              </div>
              <div className="info-content">
                <h3>Email</h3>
                <p className="copyable">
                  <a href="mailto:adithyavholla23@gmail.com">adithyavholla23@gmail.com</a>
                  <span className={`copy-icon ${copiedStates.email ? 'copied' : ''}`}>
                    {copiedStates.email ? <FaCheck /> : <FaCopy />}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="info-card" onClick={() => copyToClipboard('+91 9404110669', 'phone')}>
              <div className="info-icon">
                <FaPhoneAlt />
              </div>
              <div className="info-content">
                <h3>Phone</h3>
                <p className="copyable">
                  <a href="tel:+919404110669">+91 9404110669</a>
                  <span className={`copy-icon ${copiedStates.phone ? 'copied' : ''}`}>
                    {copiedStates.phone ? <FaCheck /> : <FaCopy />}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <FaMapMarkerAlt />
              </div>
              <div className="info-content">
                <h3>Location</h3>
                <p>Bengaluru, Karnataka, India</p>
              </div>
            </div>

            <div className="social-media">
              <h3>Connect with Me</h3>
              <div className="social-icons">
                <a href="https://github.com/Adithya-Holla" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <FaGithub />
                </a>
                <a href="https://www.linkedin.com/in/adiholla/" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <FaLinkedin />
                </a>
              </div>
            </div>
          </div>

          <div className="contact-info-right">
            <div className="feedback-form-container">
              <h3>Send Me a Message</h3>
              <form onSubmit={handleSubmit} className="feedback-form">
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your Email"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Subject"
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Your Message"
                    required
                    rows="4"
                  />
                </div>
                <button type="submit" className="submit-button" disabled={formStatus.submitted}>
                  <FaPaperPlane className="submit-icon" />
                  Send Message
                </button>
                {formStatus.message && (
                  <div className={`form-status ${formStatus.error ? 'error' : 'success'}`}>
                    {formStatus.message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ContactPage; 
