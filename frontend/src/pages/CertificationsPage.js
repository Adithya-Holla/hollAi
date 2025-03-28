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

  const certifications = [
    {
      id: 1,
      title: "Deep Learning Specialization",
      issuer: "DeepLearning.AI",
      date: "May 2023",
      description: "Comprehensive 5-course specialization covering neural networks, CNN, RNN, and more.",
      skills: ["Neural Networks", "Deep Learning", "TensorFlow", "Python", "Computer Vision"],
      icon: <FaCertificate />,
      credentialUrl: "https://www.coursera.org/account/accomplishments/specialization/123456",
      featured: true
    },
    {
      id: 2,
      title: "Machine Learning Engineer",
      issuer: "Udacity",
      date: "January 2023",
      description: "Advanced nanodegree program focusing on ML deployment, MLOps, and model serving.",
      skills: ["MLOps", "Model Deployment", "AWS", "Docker", "Kubernetes"],
      icon: <FaAward />,
      credentialUrl: "https://confirm.udacity.com/ABCDEF123456",
      featured: true
    },
    {
      id: 3,
      title: "TensorFlow Developer Certificate",
      issuer: "Google",
      date: "November 2022",
      description: "Industry-recognized certification validating TensorFlow skills and expertise.",
      skills: ["TensorFlow", "Keras", "Computer Vision", "NLP", "Model Deployment"],
      icon: <FaCertificate />,
      credentialUrl: "https://www.tensorflow.org/certificate/ABCDEF123456",
      featured: true
    },
    {
      id: 4,
      title: "AWS Certified Machine Learning - Specialty",
      issuer: "Amazon Web Services",
      date: "August 2022",
      description: "Certification focusing on ML services and solutions in the AWS ecosystem.",
      skills: ["AWS SageMaker", "AWS Lambda", "S3", "Cloud ML", "Data Processing"],
      icon: <FaAward />,
      credentialUrl: "https://www.youracclaim.com/badges/ABCDEF123456",
      featured: false
    },
    {
      id: 5,
      title: "Natural Language Processing Specialization",
      issuer: "DeepLearning.AI",
      date: "June 2022",
      description: "Four-course specialization covering NLP techniques, from basics to transformers.",
      skills: ["NLP", "BERT", "Transformers", "Sentiment Analysis", "Text Classification"],
      icon: <FaCertificate />,
      credentialUrl: "https://www.coursera.org/account/accomplishments/specialization/654321",
      featured: false
    },
    {
      id: 6,
      title: "Professional Data Scientist",
      issuer: "DataCamp",
      date: "March 2022",
      description: "End-to-end certification covering data analysis, ML modeling, and deployment.",
      skills: ["Python", "SQL", "Data Visualization", "Statistics", "ML Algorithms"],
      icon: <FaAward />,
      credentialUrl: "https://www.datacamp.com/certificate/ABCDEF123456",
      featured: false
    }
  ];

  // Group certifications by year
  const certByYear = certifications.reduce((acc, cert) => {
    const year = cert.date.split(' ')[1]; // Extract year from "Month Year"
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(cert);
    return acc;
  }, {});

  // Sort years in descending order (most recent first)
  const sortedYears = Object.keys(certByYear).sort((a, b) => b - a);

  return (
    <div className={`certifications-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar toggleTheme={toggleTheme} />
      <main className={`certifications-container ${isVisible ? 'fade-in' : ''}`}>
        <h1 className="certifications-title">My <span className="highlight">Certifications</span></h1>
        <p className="certifications-subtitle">Credentials validating my expertise in AI and machine learning</p>
        
        <div className="featured-certifications">
          <h2 className="section-title">Featured Credentials</h2>
          <div className="featured-grid">
            {certifications
              .filter(cert => cert.featured)
              .map((cert, index) => (
                <div 
                  key={cert.id} 
                  className="featured-card"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="cert-icon-container">
                    <div className="cert-icon">
                      {cert.icon}
                    </div>
                    <div className="cert-badge">
                      <FaMedal />
                    </div>
                  </div>
                  <div className="cert-content">
                    <h3 className="cert-title">{cert.title}</h3>
                    <p className="cert-issuer">{cert.issuer} • {cert.date}</p>
                    <p className="cert-description">{cert.description}</p>
                    <div className="cert-skills">
                      {cert.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                    <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="cert-link">
                      <span>View Credential</span> <FaExternalLinkAlt />
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="all-certifications">
          <h2 className="section-title">All Certifications</h2>
          
          {sortedYears.map(year => (
            <div key={year} className="year-section">
              <h3 className="year-title">{year}</h3>
              <div className="cert-timeline">
                {certByYear[year].map((cert, index) => (
                  <div 
                    key={cert.id} 
                    className="timeline-card"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <div className="timeline-marker">
                      <FaCheckCircle />
                    </div>
                    <div className="timeline-content">
                      <h4 className="timeline-title">{cert.title}</h4>
                      <p className="timeline-issuer">{cert.issuer} • {cert.date}</p>
                      <div className="timeline-skills">
                        {cert.skills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="skill-mini-tag">{skill}</span>
                        ))}
                        {cert.skills.length > 3 && (
                          <span className="skill-more">+{cert.skills.length - 3} more</span>
                        )}
                      </div>
                      <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="timeline-link">
                        <span>Verify</span> <FaExternalLinkAlt />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CertificationsPage; 