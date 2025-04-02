import React, { useState, useEffect } from 'react';
import '../styles/ProjectsPage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaGithub, FaExternalLinkAlt, FaCode, FaFolder } from 'react-icons/fa';

function ProjectsPage({ isDarkMode, toggleTheme }) {
  const [isVisible, setIsVisible] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Add initial fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch projects from the backend
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/projects');
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const data = await response.json();
        setProjects(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter featured projects
  const featuredProjects = projects.filter(project => project.featured);
  
  // Filter other projects
  const otherProjects = projects.filter(project => !project.featured);

  return (
    <div className={`projects-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      <main className={`projects-container ${isVisible ? 'fade-in' : ''}`}>
        {/* Title and subtitle section with enhanced styling */}
        <div className="title-section">
          <h1 className="projects-title">My <span className="highlight">Projects</span></h1>
          <p className="projects-subtitle">Showcasing my work in technology and innovation</p>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading projects...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>Error loading projects: {error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="no-projects">
            <FaFolder className="no-projects-icon" />
            <p>No projects available at the moment.</p>
          </div>
        ) : (
          <>
            {/* Featured Projects */}
            {featuredProjects.length > 0 && (
              <section className="featured-projects">
                <h2 className="section-title">Featured Projects</h2>
                <div className="featured-projects-grid">
                  {featuredProjects.map((project, index) => (
                    <div 
                      key={project._id} 
                      className="featured-project-card"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="project-image-container">
                        {project.imageUrl ? (
                          <img src={project.imageUrl} alt={project.title} className="project-image" />
                        ) : (
                          <div className="project-placeholder">
                            <FaCode className="project-placeholder-icon" />
                          </div>
                        )}
                      </div>
                      <div className="project-content">
                        <h2 className="project-title">{project.title}</h2>
                        <p className="project-description">{project.description}</p>
                        <div className="project-technologies">
                          {project.technologies && project.technologies.map((tech, idx) => (
                            <span key={idx} className="technology-tag">{tech}</span>
                          ))}
                        </div>
                        <div className="project-links">
                          {project.githubUrl && (
                            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                              <FaGithub /> Code
                            </a>
                          )}
                          {project.liveUrl && (
                            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                              <FaExternalLinkAlt /> Demo
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Other Projects */}
            {otherProjects.length > 0 && (
              <section className="all-projects">
                <h2 className="section-title">All Projects</h2>
                <div className="projects-grid">
                  {otherProjects.map((project, index) => (
                    <div 
                      key={project._id} 
                      className="project-card"
                      style={{ animationDelay: `${(featuredProjects.length + index) * 0.1}s` }}
                    >
                      <div className="project-image-container">
                        {project.imageUrl ? (
                          <img src={project.imageUrl} alt={project.title} className="project-image" />
                        ) : (
                          <div className="project-placeholder">
                            <FaCode className="project-placeholder-icon" />
                          </div>
                        )}
                      </div>
                      <div className="project-content">
                        <h3 className="project-title">{project.title}</h3>
                        <p className="project-description">{project.description}</p>
                        <div className="project-technologies">
                          {project.technologies && project.technologies.map((tech, idx) => (
                            <span key={idx} className="technology-tag">{tech}</span>
                          ))}
                        </div>
                        <div className="project-links">
                          {project.githubUrl && (
                            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                              <FaGithub /> Code
                            </a>
                          )}
                          {project.liveUrl && (
                            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                              <FaExternalLinkAlt /> Demo
                            </a>
                          )}
                        </div>
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

export default ProjectsPage; 