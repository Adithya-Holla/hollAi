import React, { useState, useEffect } from 'react';
import { FaGraduationCap, FaCertificate, FaExternalLinkAlt, FaCalendarAlt } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/CertificationsPage.css';

function CertificationsPage({ isDarkMode, toggleTheme }) {
  const [isVisible, setIsVisible] = useState(false);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    // Add initial fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch certifications from the backend
    const fetchCertifications = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://hollai-backend-b31l.onrender.com/api/certifications');
        
        if (!response.ok) {
          throw new Error('Failed to fetch certifications');
        }
        
        const data = await response.json();
        setCertifications(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching certifications:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCertifications();
  }, []);

  // Filter featured certifications
  const featuredCertifications = certifications.filter(cert => cert.featured);
  
  // Filter non-featured certifications
  const otherCertifications = certifications.filter(cert => !cert.featured);

  return (
    <div className={`certifications-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      <main className={`certifications-container ${isVisible ? 'fade-in' : ''}`}>
        <h1 className="certifications-title">My <span className="highlight">Certifications</span></h1>
        <p className="certifications-subtitle">Credentials validating my expertise in AI and machine learning</p>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading certifications...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>Error loading certifications: {error}</p>
          </div>
        ) : certifications.length === 0 ? (
          <div className="no-certifications">
            <FaGraduationCap className="no-certifications-icon" />
            <p>No certifications available at the moment.</p>
          </div>
        ) : (
          <>
            {/* Featured Certifications */}
            {featuredCertifications.length > 0 && (
              <section className="featured-certifications">
                <h2 className="section-title">Featured Certifications</h2>
                <div className="featured-grid">
                  {featuredCertifications.map((cert, index) => (
                    <div 
                      className="featured-card" 
                      key={cert._id}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {cert.imageUrl ? (
                        <div className="cert-image-container">
                          <img src={cert.imageUrl} alt={cert.title} className="cert-image"  loading="lazy"/>
                        </div>
                      ) : (
                        <div className="cert-icon-container">
                          <FaCertificate className="cert-icon" />
                        </div>
                      )}
                      <div className="cert-content">
                        <h3 className="cert-title">{cert.title}</h3>
                        <p className="cert-issuer">
                          <strong>{cert.organization}</strong> • Issued {formatDate(cert.issueDate)}
                        </p>
                        <p className="cert-description">{cert.description}</p>
                        
                        {cert.skills && cert.skills.length > 0 && (
                          <div className="cert-skills">
                            {cert.skills.map((skill, idx) => (
                              <span key={idx} className="skill-tag">{skill}</span>
                            ))}
                          </div>
                        )}
                        
                        {cert.credentialURL && (
                          <a 
                            href={cert.credentialURL} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="cert-link"
                          >
                            View Credential <FaExternalLinkAlt />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* All Certifications */}
            {otherCertifications.length > 0 && (
              <section className="all-certifications">
                <h2 className="section-title">All Certifications</h2>
                <div className="cert-timeline">
                  {otherCertifications.map((cert, index) => (
                    <div 
                      className="timeline-card" 
                      key={cert._id}
                      style={{ animationDelay: `${(featuredCertifications.length + index) * 0.1}s` }}
                    >
                      <div className="timeline-marker">
                        <FaCalendarAlt />
                      </div>
                      <div className="timeline-content">
                        <h3 className="timeline-title">{cert.title}</h3>
                        <p className="timeline-issuer">
                          <strong>{cert.organization}</strong> • Issued {formatDate(cert.issueDate)}
                        </p>
                        
                        {cert.skills && cert.skills.length > 0 && (
                          <div className="timeline-skills">
                            {cert.skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="skill-mini-tag">{skill}</span>
                            ))}
                            {cert.skills.length > 3 && (
                              <span className="skill-more">+{cert.skills.length - 3}</span>
                            )}
                          </div>
                        )}
                        
                        {cert.credentialURL && (
                          <a 
                            href={cert.credentialURL} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="timeline-link"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default CertificationsPage; 
