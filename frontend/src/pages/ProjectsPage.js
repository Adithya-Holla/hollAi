import React from 'react';
import '../styles/ProjectsPage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

function ProjectsPage({ isDarkMode, toggleTheme }) {
  const projects = [
    {
      id: 1,
      title: 'Brain Tumor Detection',
      description: 'An AI-powered system that can detect and classify brain tumors from MRI scans with high accuracy.',
      image: '/images/braintumor.png',
      technologies: ['Python', 'TensorFlow', 'Keras', 'OpenCV'],
      github: 'https://github.com/yourusername/brain-tumor-detection',
      demo: 'https://brain-tumor-detection-demo.com'
    },
    {
      id: 2,
      title: 'Sentiment Analysis Tool',
      description: 'A natural language processing tool that analyzes text data to determine sentiment and emotional tone.',
      image: '/images/project2.jpg',
      technologies: ['Python', 'NLTK', 'Scikit-learn', 'Flask'],
      github: 'https://github.com/yourusername/sentiment-analysis',
      demo: 'https://sentiment-analysis-demo.com'
    },
    {
      id: 3,
      title: 'Smart Home Automation',
      description: 'An IoT system that allows users to control and automate their home devices through a mobile app.',
      image: '/images/project3.jpg',
      technologies: ['JavaScript', 'React Native', 'Node.js', 'MongoDB'],
      github: 'https://github.com/yourusername/smart-home',
      demo: 'https://smart-home-demo.com'
    },
    {
      id: 4,
      title: 'Recommendation Engine',
      description: 'A machine learning-based recommendation system that suggests products or content based on user preferences and behavior.',
      image: '/images/project1.jpg',
      technologies: ['Python', 'Pandas', 'Scikit-learn', 'Django'],
      github: 'https://github.com/yourusername/recommendation-engine',
      demo: 'https://recommendation-engine-demo.com'
    },
    {
      id: 5,
      title: 'Facial Recognition System',
      description: 'A computer vision application that can detect and recognize faces in images and videos.',
      image: '/images/project2.jpg',
      technologies: ['Python', 'TensorFlow', 'OpenCV', 'Flask'],
      github: 'https://github.com/yourusername/facial-recognition',
      demo: 'https://facial-recognition-demo.com'
    },
    {
      id: 6,
      title: 'Autonomous Drone Navigation',
      description: 'A system that enables drones to navigate autonomously in complex environments using computer vision and reinforcement learning algorithms.',
      image: '/images/project3.jpg',
      technologies: ['Python', 'PyTorch', 'ROS', 'OpenCV'],
      github: 'https://github.com/yourusername/autonomous-drone',
      demo: 'https://autonomous-drone-demo.com'
    }
  ];

  return (
    <div className={`projects-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar toggleTheme={toggleTheme} />
      <main className="projects-container">
        <h1 className="projects-title">My <span className="highlight">Projects</span></h1>
        <p className="projects-subtitle">Discover some of my recent work in WebDev, AI and machine learning</p>
        
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
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