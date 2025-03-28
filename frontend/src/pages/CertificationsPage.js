import React, { useState, useEffect } from 'react';
import '../styles/CertificationsPage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaExternalLinkAlt, FaCheckCircle, FaMedal, FaCertificate, FaAward } from 'react-icons/fa';

function CertificationsPage({ isDarkMode, toggleTheme }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Add initial fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const certifications = [];

  return (
    <div className={`certifications-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar toggleTheme={toggleTheme} />
      <main className={`certifications-container ${isVisible ? 'fade-in' : ''}`}>
        <h1 className="certifications-title">My <span className="highlight">Certifications</span></h1>
        <p className="certifications-subtitle">Credentials validating my expertise in AI and machine learning</p>
        
        <div className="no-certifications">
          <p>No certifications available at the moment.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CertificationsPage; 