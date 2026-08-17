import React, { useRef, useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import '../styles/HomePage.css';
import { buildApiUrl } from '../config/api';
import RevealText from '../components/RevealText';
import { useInView } from '../hooks/useInView';
import { FaChevronDown, FaGithub, FaExternalLinkAlt, FaCode, FaFolder } from 'react-icons/fa';

function HomePage() {
  const projectsRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { introPlaying, introTearing } = useOutletContext() || {};
  // The gate opens the moment the screen starts tearing, so the hero reveal
  // lands with the tear rather than queueing behind it.
  const gateOpen = !introPlaying || introTearing;

  /*
   * The hero replays its entrance every time it comes back into view — on
   * arriving from another page, and on scrolling back up to it. Bumping the
   * cycle remounts the animated block, which restarts both the per-character
   * reveal and the CSS light sweep.
   *
   * It is held back while the opening cinematic is still covering the page,
   * so the reveal lands with the tear rather than finishing behind it.
   */
  const [heroRef, heroInView] = useInView({ threshold: 0.3, once: false });
  const [heroCycle, setHeroCycle] = useState(0);

  useEffect(() => {
    if (!gateOpen || !heroInView) return;
    setHeroCycle((c) => c + 1);
  }, [heroInView, gateOpen]);

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
      <section className="hero" ref={heroRef}>
        {/* Remounted on each cycle so every entrance replays from the top. */}
        <div className="hero-inner" key={heroCycle}>
          <span className="t-mono hero-eyebrow">Welcome to</span>
          <h1 className="hero-text">
            <span className="hero-solid">
              <RevealText text="HOLL" delay={320} active={heroCycle > 0} />
            </span>
            <span className="hero-ai">
              <RevealText text="AI" delay={408} active={heroCycle > 0} />
            </span>
          </h1>
          <p className="t-body tagline">Lets Explore My Workspace</p>
          <div className="hero-buttons">
            <Link to="/projects" className="hero-button">My Projects</Link>
            <Link to="/contact" className="hero-button">Contact Me</Link>
          </div>
        </div>
        <button
          className="scroll-down-button"
          onClick={scrollToProjects}
          aria-label="Scroll to recent projects"
        >
          <FaChevronDown aria-hidden="true" />
        </button>
      </section>

      <section className="projects-section tex-grid" ref={projectsRef}>
        <div className="section-head">
          <span className="t-mono">Selected work</span>
          <h2 className="section-title">Recent Projects</h2>
        </div>

        {loading ? (
          <div className="state-block t-mono">Loading projects…</div>
        ) : error ? (
          <div className="state-block state-block--error t-mono">
            Error loading projects: {error}
          </div>
        ) : projects.length === 0 ? (
          <div className="state-block t-mono">
            <FaFolder aria-hidden="true" /> No projects available at the moment.
          </div>
        ) : (
          <ol className="preview-list">
            {projects.map((project, index) => (
              <li key={project._id} className="preview-item">
                <span className="preview-index t-mono">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div className="preview-body">
                  <h3 className="preview-title">{project.title}</h3>
                  <p className="t-body preview-description">{project.description}</p>
                  {project.technologies && project.technologies.length > 0 && (
                    <ul className="preview-tech">
                      {project.technologies.map((tech) => (
                        <li key={tech} className="t-mono">{tech}</li>
                      ))}
                    </ul>
                  )}
                  <div className="preview-links">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="t-mono inline-link"
                      >
                        <FaGithub aria-hidden="true" /> Code
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="t-mono inline-link"
                      >
                        <FaExternalLinkAlt aria-hidden="true" /> Demo
                      </a>
                    )}
                  </div>
                </div>

                <div className="preview-visual">
                  {project.imageUrl ? (
                    <img src={project.imageUrl} alt={project.title} loading="lazy" />
                  ) : (
                    <div className="preview-plate t-mono tex-hatch" aria-hidden="true">
                      <FaCode />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="view-all-projects">
          <Link to="/projects" className="t-mono inline-link inline-link--lg">
            View All Projects
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;