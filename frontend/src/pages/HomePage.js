import React from 'react';
import '../styles/HomePage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';

function HomePage() {
  return (
    <div className="home-page">
      <Navbar />
      <ThemeToggle />
      <main>
        <section className="hero">
          <video className="hero-video" autoPlay loop muted>
            <source src="https://cdn.pixabay.com/video/2024/03/29/206132.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <h1 className="hero-text">Explore<br /><span className="highlight">hollAi</span></h1>
          <p className="tagline">Where hardwork meets intelligence</p>
          <div className="hero-buttons">
            <button className="hero-button">My Projects</button>
            <button className="hero-button">Contact Me</button>
          </div>
        </section>
        <section className="projects-section">
          <h2 className="projects-title">My Recent Projects</h2>
          <div className="projects">
            <div className="project-card">
              <img src="/path/to/image1.jpg" alt="Project 1" className="project-image" />
              <h3>Project 1</h3>
              <p>Description of project 1.</p>
              <a href="https://project1.com" target="_blank" rel="noopener noreferrer" className="project-link">Visit Project</a>
            </div>
            <div className="project-card">
              <img src="/path/to/image2.jpg" alt="Project 2" className="project-image" />
              <h3>Project 2</h3>
              <p>Description of project 2.</p>
              <a href="https://project2.com" target="_blank" rel="noopener noreferrer" className="project-link">Visit Project</a>
            </div>
            <div className="project-card">
              <img src="/path/to/image3.jpg" alt="Project 3" className="project-image" />
              <h3>Project 3</h3>
              <p>Description of project 3.</p>
              <a href="https://project3.com" target="_blank" rel="noopener noreferrer" className="project-link">Visit Project</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage; 