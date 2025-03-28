import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaChevronDown } from 'react-icons/fa';

function HomePage({ isDarkMode, toggleTheme }) {
  const projectsRef = useRef(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    // Start the hero animations after a short delay when component mounts
    const timer = setTimeout(() => {
      setHeroVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const scrollToProjects = () => {
    projectsRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`home-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar toggleTheme={toggleTheme} />
      <main>
        <section className="hero">
          <video className="hero-video" autoPlay loop muted>
            <source src="/hero-background.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <h1 className={`hero-text ${heroVisible ? 'animate-hero' : ''}`}>Explore<br /><span className="highlight">hollAi</span></h1>
          <p className={`tagline ${heroVisible ? 'animate-hero' : ''}`}>Where hardwork meets intelligence</p>
          <div className={`hero-buttons ${heroVisible ? 'animate-hero' : ''}`}>
            <Link to="/projects" className="hero-button first-button">My Projects</Link>
            <Link to="/contact" className="hero-button second-button">Contact Me</Link>
          </div>
          <button className={`scroll-down-button ${heroVisible ? 'animate-hero' : ''}`} onClick={scrollToProjects}>
            <FaChevronDown />
          </button>
        </section>
        <section className="projects-section" ref={projectsRef}>
          <h2 className="projects-title">My Recent Projects</h2>
          <div className="projects">
            <div className="project-card">
              <img src="/images/braintumor.png" alt="Brain Tumor Detection" className="project-image" />
              <h3>Brain Tumor Detection</h3>
              <p>An AI-powered system that can detect and classify brain tumors from MRI scans with high accuracy.</p>
              <a href="https://cruxtumor.netlify.app" target="_blank" rel="noopener noreferrer" className="project-link">Visit Project</a>
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