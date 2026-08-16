import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';
import { buildApiUrl } from '../config/api';
import { FaChevronDown, FaGithub, FaExternalLinkAlt, FaCode, FaFolder } from 'react-icons/fa';

function HomePage() {
  const projectsRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the first 3 projects from MongoDB
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl('/projects'));

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const data = await response.json();
        // Get only the first 3 projects
        setProjects(data.slice(0, 3));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const scrollToProjects = () => {
    const startPosition = window.pageYOffset;
    const targetPosition = projectsRef.current.offsetTop;
    const distance = targetPosition - startPosition;
    const duration = 1000; // 1 second duration
    let start = null;

    const animation = (currentTime) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);
      
      // Using cubic-bezier easing function for smooth acceleration and deceleration
      const ease = t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;
      const easedProgress = ease(progress);
      
      window.scrollTo(0, startPosition + (distance * easedProgress));
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  return (
    <div className="home-page">
      <>
        <section className="hero">
          <h1 className="hero-text">Welcome To<br /><span className="highlight">hollAi</span></h1>
          <p className="tagline">Lets Explore My Workspace</p>
          <div className="hero-buttons">
            <Link to="/projects" className="hero-button first-button">My Projects</Link>
            <Link to="/contact" className="hero-button second-button">Contact Me</Link>
          </div>
          <button className="scroll-down-button" onClick={scrollToProjects} aria-label="Scroll to projects">
            <FaChevronDown />
          </button>
        </section>
        <section className="projects-section" ref={projectsRef}>
          <h2 className="projects-title">My Recent Projects</h2>
          <div className="projects">
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
                {projects.map((project, index) => (
                  <div 
                    key={project._id} 
                    className="project-card"
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
              </>
            )}
          </div>
          <div className="view-all-projects">
            <Link to="/projects" className="view-all-button">View All Projects</Link>
          </div>
        </section>
      </>
    </div>
  );
}

export default HomePage;