import React, { useState, useEffect, useRef } from 'react';
import '../styles/AboutPage.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function AboutPage({ isDarkMode, toggleTheme }) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('whoIAm');
  const [isFlipped, setIsFlipped] = useState(false);
  const [visibleElements, setVisibleElements] = useState({
    title: false,
    profile: false,
    accordion: false
  });
  
  const titleRef = useRef(null);
  const profileRef = useRef(null);
  const accordionRef = useRef(null);

  // Check if an element is in viewport
  const isInViewport = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    return (
      rect.top <= windowHeight * 0.8 && // More lenient top check
      rect.bottom >= 0 &&
      rect.left >= 0 &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  // Handle scroll to check which elements are visible
  const handleScroll = () => {
    if (titleRef.current && !visibleElements.title && isInViewport(titleRef.current)) {
      setVisibleElements(prev => ({ ...prev, title: true }));
    }
    
    if (profileRef.current && !visibleElements.profile && isInViewport(profileRef.current)) {
      setVisibleElements(prev => ({ ...prev, profile: true }));
    }
    
    if (accordionRef.current && !visibleElements.accordion && isInViewport(accordionRef.current)) {
      setVisibleElements(prev => ({ ...prev, accordion: true }));
    }
  };

  useEffect(() => {
    // Add initial fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Set accordion visible immediately on mobile
      if (window.innerWidth <= 768) {
        setVisibleElements(prev => ({ ...prev, accordion: true }));
      }
    }, 50);
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    // Initial check for elements in viewport
    handleScroll();
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleSection = (section) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className={`about-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar toggleTheme={toggleTheme} />
      <main className={`about-container ${isVisible ? 'fade-in' : ''}`}>
        <section className="about-section">
          <h1 
            ref={titleRef} 
            className={`about-title ${visibleElements.title ? 'element-visible' : ''}`}
          >
            About <span className="highlight">hollAi</span>
          </h1>
          <div className="about-content">
            <div 
              ref={profileRef} 
              className={`about-image-container ${visibleElements.profile ? 'element-visible' : ''}`}
            >
              <div 
                className={`flip-card ${isFlipped ? 'flipped' : ''}`} 
                onClick={toggleFlip}
                onKeyDown={(e) => e.key === 'Enter' && toggleFlip()}
                tabIndex={0}
                role="button"
                aria-label="Flip profile card"
              >
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                    <img src="/images/profile-image.png" alt="Profile" className="about-image" />
                  </div>
                  <div className="flip-card-back">
                    <h3>Adithya Holla</h3>
                    <p>AI Developer & Enthusiast</p>
                    <p>Click to flip</p>
                  </div>
                </div>
              </div>
            </div>
            <div 
              ref={accordionRef} 
              className={`about-text ${visibleElements.accordion ? 'element-visible' : ''}`}
            >
              <div className="accordion">
                <div className="accordion-item">
                  <div 
                    className={`accordion-header ${activeSection === 'whoIAm' ? 'active' : ''}`} 
                    onClick={() => toggleSection('whoIAm')}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSection('whoIAm')}
                    tabIndex={0}
                    role="button"
                    aria-expanded={activeSection === 'whoIAm'}
                    aria-controls="content-whoIAm"
                  >
                    <h2>Who I Am</h2>
                    <span className="accordion-icon">{activeSection === 'whoIAm' ? '−' : '+'}</span>
                  </div>
                  <div 
                    className={`accordion-content ${activeSection === 'whoIAm' ? 'active' : ''}`}
                    id="content-whoIAm"
                  >
                    <p>
                      Hello! I'm a passionate developer with expertise in artificial intelligence and machine learning.
                      My journey in technology began with a curiosity about how computers could be taught to learn and
                      make decisions like humans.
                    </p>
                  </div>
                </div>
                
                <div className="accordion-item">
                  <div 
                    className={`accordion-header ${activeSection === 'expertise' ? 'active' : ''}`} 
                    onClick={() => toggleSection('expertise')}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSection('expertise')}
                    tabIndex={0}
                    role="button"
                    aria-expanded={activeSection === 'expertise'}
                    aria-controls="content-expertise"
                  >
                    <h2>My Expertise</h2>
                    <span className="accordion-icon">{activeSection === 'expertise' ? '−' : '+'}</span>
                  </div>
                  <div 
                    className={`accordion-content ${activeSection === 'expertise' ? 'active' : ''}`}
                    id="content-expertise"
                  >
                    <p>
                      I specialize in developing AI solutions that solve real-world problems. My technical skills include
                      Python, TensorFlow, PyTorch, Natural Language Processing, and Computer Vision. I'm constantly
                      learning and exploring new technologies to stay at the cutting edge of AI development.
                    </p>
                  </div>
                </div>
                
                <div className="accordion-item">
                  <div 
                    className={`accordion-header ${activeSection === 'approach' ? 'active' : ''}`} 
                    onClick={() => toggleSection('approach')}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSection('approach')}
                    tabIndex={0}
                    role="button"
                    aria-expanded={activeSection === 'approach'}
                    aria-controls="content-approach"
                  >
                    <h2>My Approach</h2>
                    <span className="accordion-icon">{activeSection === 'approach' ? '−' : '+'}</span>
                  </div>
                  <div 
                    className={`accordion-content ${activeSection === 'approach' ? 'active' : ''}`}
                    id="content-approach"
                  >
                    <p>
                      I believe in the responsible and ethical development of AI. My approach combines technical
                      expertise with a deep understanding of the social implications of the technologies I build.
                      I'm committed to creating AI systems that are transparent, fair, and beneficial to society.
                    </p>
                  </div>
                </div>
                
                <div className="accordion-item">
                  <div 
                    className={`accordion-header ${activeSection === 'connect' ? 'active' : ''}`} 
                    onClick={() => toggleSection('connect')}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSection('connect')}
                    tabIndex={0}
                    role="button"
                    aria-expanded={activeSection === 'connect'}
                    aria-controls="content-connect"
                  >
                    <h2>Let's Connect</h2>
                    <span className="accordion-icon">{activeSection === 'connect' ? '−' : '+'}</span>
                  </div>
                  <div 
                    className={`accordion-content ${activeSection === 'connect' ? 'active' : ''}`}
                    id="content-connect"
                  >
                    <p>
                      I'm always interested in new challenges and opportunities to collaborate. Whether you have
                      a project in mind or just want to chat about AI, feel free to reach out through the contact section.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default AboutPage; 