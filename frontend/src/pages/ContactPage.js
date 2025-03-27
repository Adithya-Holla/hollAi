import React, { useState } from 'react';
import '../styles/ContactPage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaGithub, FaLinkedin } from 'react-icons/fa';

function ContactPage({ isDarkMode, toggleTheme }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields.');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('https://hollai-backend.vercel.app/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`contact-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar toggleTheme={toggleTheme} />
      <main className="contact-container">
        <h1 className="contact-title">Get in <span className="highlight">Touch</span></h1>
        <p className="contact-subtitle">Have a question or want to work together? Drop me a message!</p>
        
        <div className="contact-content">
          <div className="contact-info">
            <div className="info-card">
              <div className="info-icon">
                <FaEnvelope />
              </div>
              <div className="info-content">
                <h3>Email</h3>
                <p><a href="mailto:adithyavholla23@gmail.com">adithyavholla23@gmail.com</a></p>
              </div>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <FaPhoneAlt />
              </div>
              <div className="info-content">
                <h3>Phone</h3>
                <p><a href="tel:+1234567890">+91 9404110669</a></p>
              </div>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <FaMapMarkerAlt />
              </div>
              <div className="info-content">
                <h3>Location</h3>
                <p>Bengalru, Karnataka</p>
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
          
          <div className="contact-form-container">
            <h2>Send a Message</h2>
            
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name <span className="required">*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email <span className="required">*</span></label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Subject"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Message <span className="required">*</span></label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your message"
                  rows="5"
                  required
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
            
            {error && (
              <div className="form-message error">
                {error}
              </div>
            )}
            
            {success && (
              <div className="form-message success">
                Thanks for your message! I'll get back to you soon.
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ContactPage; 