import React from 'react';
import '../styles/AboutPage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function AboutPage({ isDarkMode, toggleTheme }) {
  return (
    <div className={`about-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar toggleTheme={toggleTheme} />
      <main className="about-container">
        <section className="about-section">
          <h1 className="about-title">About <span className="highlight">hollAi</span></h1>
          <div className="about-content">
            <div className="about-image-container">
              <img src="/images/profile-image.png" alt="Profile" className="about-image" />
            </div>
            <div className="about-text">
              <h2>Who I Am</h2>
              <p>
                Hello! I'm a passionate developer with expertise in artificial intelligence and machine learning.
                My journey in technology began with a curiosity about how computers could be taught to learn and
                make decisions like humans.
              </p>
              
              <h2>My Expertise</h2>
              <p>
                I specialize in developing AI solutions that solve real-world problems. My technical skills include
                Python, TensorFlow, PyTorch, Natural Language Processing, and Computer Vision. I'm constantly
                learning and exploring new technologies to stay at the cutting edge of AI development.
              </p>
              
              <h2>My Approach</h2>
              <p>
                I believe in the responsible and ethical development of AI. My approach combines technical
                expertise with a deep understanding of the social implications of the technologies I build.
                I'm committed to creating AI systems that are transparent, fair, and beneficial to society.
              </p>
              
              <h2>Let's Connect</h2>
              <p>
                I'm always interested in new challenges and opportunities to collaborate. Whether you have
                a project in mind or just want to chat about AI, feel free to reach out through the contact section.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default AboutPage; 