import React, { useState, useEffect } from 'react';
import '../styles/AboutPage.css';
import { useInView } from '../hooks/useInView';

/**
 * Section copy is unchanged from the original page — only its presentation
 * has been redesigned. Do not rewrite these strings.
 */
const SECTIONS = [
  {
    id: 'whoIAm',
    title: 'Who I Am',
    body: (
      <p className="t-body">
        Hello! I'm Adithya V Holla, a passionate developer with expertise in artificial intelligence and machine learning.
        My journey in technology began with a curiosity about how computers could be taught to learn and
        make decisions like humans.
      </p>
    ),
  },
  {
    id: 'expertise',
    title: 'My Expertise',
    body: (
      <p className="t-body">
        I specialize in developing AI solutions that solve real-world problems. My technical skills include
        Python, TensorFlow, PyTorch, Natural Language Processing, and Computer Vision. I'm constantly
        learning and exploring new technologies to stay at the cutting edge of AI development.
      </p>
    ),
  },
  {
    id: 'approach',
    title: 'My Approach',
    body: (
      <p className="t-body">
        I believe in the responsible and ethical development of AI. My approach combines technical
        expertise with a deep understanding of the social implications of the technologies I build.
        I'm committed to creating AI systems that are transparent, fair, and beneficial to society.
      </p>
    ),
  },
  {
    id: 'education',
    title: 'My Education',
    body: (
      <p className="t-body">
        Currently persuing Btech degree from PES University, RR campur, Banglore, Karnataka, India.
        <br /><br />
        Excelled in Creative PU College, with an amazing 98% in boards and 201 rank in KCET.
        <br /><br />
        Qualified SSLC from The Rosary High School, Bambolim, Goa with an astonishing 90.8%.
      </p>
    ),
  },
  {
    id: 'connect',
    title: "Let's Connect",
    body: (
      <p className="t-body">
        I'm always interested in new challenges and opportunities to collaborate. Whether you have
        a project in mind or just want to chat about AI, feel free to reach out through the contact section.
      </p>
    ),
  },
];

function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('whoIAm');

  const [titleRef, titleIn] = useInView({ threshold: 0.3 });
  const [profileRef, profileIn] = useInView({ threshold: 0.25 });
  const [dossierRef, dossierIn] = useInView({ threshold: 0.1 });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const toggleSection = (section) => {
    setActiveSection((current) => (current === section ? null : section));
  };

  return (
    <div className="about-page">
      <div className={`about-container ${isVisible ? 'fade-in' : ''}`}>
        <header
          ref={titleRef}
          className={`page-head about-head ${titleIn ? 'element-visible' : ''}`}
        >
          <span className="t-mono">Dossier</span>
          <h1 className="page-title">
            About <span className="about-mark">hollAi</span>
          </h1>
        </header>

        <div className="about-content">
          <div
            ref={profileRef}
            className={`about-image-container ${profileIn ? 'element-visible' : ''}`}
          >
            <figure className="portrait">
              <div className="portrait-frame">
                <img src="/profile-imag.jpeg" alt="Adithya V Holla" className="about-image" loading="lazy" />
              </div>
              {/* The name and role that used to live on the back of the flip
                  card now sit permanently under the portrait. */}
              <figcaption className="portrait-caption">
                <h3>Adithya V Holla</h3>
                <p className="t-mono">AI Developer &amp; Enthusiast</p>
              </figcaption>
            </figure>

            <dl className="about-facts">
              <div>
                <dt className="t-mono">Based in</dt>
                <dd className="t-mono">Bengaluru, IN</dd>
              </div>
              <div>
                <dt className="t-mono">Focus</dt>
                <dd className="t-mono">AI / ML</dd>
              </div>
            </dl>
          </div>

          <div
            ref={dossierRef}
            className={`about-text ${dossierIn ? 'element-visible' : ''}`}
          >
            <div className="accordion">
              {SECTIONS.map((section, index) => {
                const isOpen = activeSection === section.id;
                return (
                  <div key={section.id} className={`accordion-item ${isOpen ? 'is-open' : ''}`}>
                    <div
                      className={`accordion-header ${isOpen ? 'active' : ''}`}
                      onClick={() => toggleSection(section.id)}
                      onKeyDown={(e) => e.key === 'Enter' && toggleSection(section.id)}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isOpen}
                      aria-controls={`content-${section.id}`}
                    >
                      <span className="t-mono accordion-index">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h2>{section.title}</h2>
                      <span className="accordion-icon" aria-hidden="true">
                        {isOpen ? '−' : '+'}
                      </span>
                    </div>
                    <div
                      className={`accordion-content ${isOpen ? 'active' : ''}`}
                      id={`content-${section.id}`}
                    >
                      {/* The clipping wrapper. Padding must live on the text
                          inside it, not on the element being clipped. */}
                      <div className="accordion-inner">{section.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
