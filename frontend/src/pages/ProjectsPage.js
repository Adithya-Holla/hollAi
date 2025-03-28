import React, { useState, useEffect } from 'react';
import '../styles/ProjectsPage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

function ProjectsPage({ isDarkMode, toggleTheme }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Add initial fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const projects = [
    {
      id: 1,
      title: 'Brain Tumor Detection',
      description: 'An AI-powered system that can detect and classify brain tumors from MRI scans with high accuracy.',
      image: '/images/braintumor.png',
      technologies: ['Python', 'YoloV7'],
      github: 'https://github.com/Sharma-Aditya7/HealthHack3.0',
      demo: 'https://cruxtumor.netlify.app'
    }
  ];

  return (
    <div className={`projects-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar toggleTheme={toggleTheme} />
      <main className={`projects-container ${isVisible ? 'fade-in' : ''}`}>
      <h1 className="certifications-title">My <span className="highlight">Projects</span></h1>
      <p className="certifications-subtitle">Discove my cool projects</p>
        
        
        <div className="projects-grid">
          {projects.map((project, index) => (
            <div 
              key={project.id} 
              className="project-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="project-image-container">
                <img src={project.image} alt={project.title} className="project-image" />
              </div>
              <div className="project-content">
                <h2 className="project-title">{project.title}</h2>
                <p className="project-description">{project.description}</p>
                <div className="project-links">
                  <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">
                    <FaGithub /> Code
                  </a>
                  <a href={project.demo} target="_blank" rel="noopener noreferrer" className="project-link">
                    <FaExternalLinkAlt /> Demo
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ProjectsPage; 