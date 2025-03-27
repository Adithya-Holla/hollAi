import React from 'react';
import '../styles/ProjectsPage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaGithub, FaExternalLinkAlt, FaBrain, FaComment, FaHome, FaChartBar, FaUserCircle, FaDrone } from 'react-icons/fa';

function ProjectsPage({ isDarkMode, toggleTheme }) {
  const projects = [
    {
      id: 1,
      title: 'Brain Tumor Detection',
      description: 'An AI-powered system that can detect and classify brain tumors from MRI scans with high accuracy. Built using deep learning techniques and convolutional neural networks.',
      icon: <FaBrain />,
      technologies: ['Python', 'TensorFlow', 'Keras', 'OpenCV'],
      github: 'https://github.com/yourusername/brain-tumor-detection',
      demo: 'https://brain-tumor-detection-demo.com'
    },
    {
      id: 2,
      title: 'Sentiment Analysis Tool',
      description: 'A natural language processing tool that analyzes text data to determine sentiment and emotional tone. Useful for analyzing customer feedback and social media mentions.',
      icon: <FaComment />,
      technologies: ['Python', 'NLTK', 'Scikit-learn', 'Flask'],
      github: 'https://github.com/yourusername/sentiment-analysis',
      demo: 'https://sentiment-analysis-demo.com'
    },
    {
      id: 3,
      title: 'Smart Home Automation',
      description: 'An IoT system that allows users to control and automate their home devices through a mobile app. Features include voice control, scheduling, and energy usage monitoring.',
      icon: <FaHome />,
      technologies: ['JavaScript', 'React Native', 'Node.js', 'MongoDB'],
      github: 'https://github.com/yourusername/smart-home',
      demo: 'https://smart-home-demo.com'
    },
    {
      id: 4,
      title: 'Recommendation Engine',
      description: 'A machine learning-based recommendation system that suggests products or content based on user preferences and behavior. Implemented collaborative filtering algorithms.',
      icon: <FaChartBar />,
      technologies: ['Python', 'Pandas', 'Scikit-learn', 'Django'],
      github: 'https://github.com/yourusername/recommendation-engine',
      demo: 'https://recommendation-engine-demo.com'
    },
    {
      id: 5,
      title: 'Facial Recognition System',
      description: 'A computer vision application that can detect and recognize faces in images and videos. Uses deep learning models to achieve high accuracy in various lighting conditions.',
      icon: <FaUserCircle />,
      technologies: ['Python', 'TensorFlow', 'OpenCV', 'Flask'],
      github: 'https://github.com/yourusername/facial-recognition',
      demo: 'https://facial-recognition-demo.com'
    },
    {
      id: 6,
      title: 'Autonomous Drone Navigation',
      description: 'A system that enables drones to navigate autonomously in complex environments using computer vision and reinforcement learning algorithms.',
      icon: <FaDrone />,
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
              <div className="project-icon-container">
                <div className="project-icon">
                  {project.icon}
                </div>
              </div>
              <div className="project-content">
                <h2 className="project-title">{project.title}</h2>
                <p className="project-description">{project.description}</p>
                <div className="project-tech">
                  {project.technologies.map((tech, index) => (
                    <span key={index} className="tech-tag">{tech}</span>
                  ))}
                </div>
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