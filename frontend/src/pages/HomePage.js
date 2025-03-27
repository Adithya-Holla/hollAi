import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaChevronDown } from 'react-icons/fa';

function HomePage({ isDarkMode, toggleTheme }) {
  const projectsRef = useRef(null);

  const scrollToProjects = () => {
    projectsRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`home-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar toggleTheme={toggleTheme} />
      <main>
        <section className="hero">
          <video className="hero-video" autoPlay loop muted>
            <source src="https://cdn.pixabay.com/video/2024/03/29/206132.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <h1 className="hero-text">Explore<br /><span className="highlight">hollAi</span></h1>
          <p className="tagline">Where hardwork meets intelligence</p>
          <div className="hero-buttons">
            <Link to="/projects" className="hero-button">My Projects</Link>
            <Link to="/contact" className="hero-button">Contact Me</Link>
          </div>
          <button className="scroll-down-button" onClick={scrollToProjects}>
            <FaChevronDown />
          </button>
        </section>
        <section className="projects-section" ref={projectsRef}>
          <h2 className="projects-title">My Recent Projects</h2>
          <div className="projects">
            <div className="project-card">
              <img src="/images/braintumor.png" alt="Project 1" className="project-image" />
              <h3 className="proj-title">TumorDetect</h3>
              <p className='proj-desc'>Detecting and classifying brain tumor using Ai</p>
              <a href="https://cruxtumor.netlify.app" target="_blank" rel="noopener noreferrer" className="project-link">Visit Project</a>
            </div>
            <div className="project-card">
              <img src="/images/braintumor.png" alt="Project 2" className="project-image" />
              <h3 className='proj-title'>Project 2</h3>
              <p className='proj-desc'>Description of project 2.</p>
              <a href="https://project2.com" target="_blank" rel="noopener noreferrer" className="project-link">Visit Project</a>
            </div>
            <div className="project-card">
              <img src="/images/braintumor.png" alt="Project 3" className="project-image" />
              <h3 className='proj-title'>Project 3</h3>
              <p className='proj-desc'>Description of project 3.</p>
              <a href="https://project3.com" target="_blank" rel="noopener noreferrer" className="project-link">Visit Project</a>
            </div>
          </div>
          <div className="view-all-projects">
            <Link to="/projects" className="view-all-button">View All Projects</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage; 