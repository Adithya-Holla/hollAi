import React, { useState } from 'react';
import '../styles/ContactPage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaGithub, FaLinkedin, FaCopy, FaCheck } from 'react-icons/fa';

function ContactPage({ isDarkMode, toggleTheme }) {
  const [copiedStates, setCopiedStates] = useState({
    email: false,
    phone: false
  });

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [type]: false }));
    }, 2000);
  };

  return (
    <div className={`contact-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar toggleTheme={toggleTheme} />
      <main className="contact-container">
        <h1 className="contact-title">Get in <span className="highlight">Touch</span></h1>
        <p className="contact-subtitle">Have a question or want to work together? Let's connect!</p>
        
        <div className="contact-content">
          <div className="contact-info">
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
                <a href="https://github.com/Adithya-Holla" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <FaLinkedin />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ContactPage; 