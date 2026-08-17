import React, { useState, useEffect, useMemo } from 'react';
import '../styles/ProjectsPage.css';
import { buildApiUrl } from '../config/api';
import ProjectMap from '../components/ProjectMap';
import { FaFolder } from 'react-icons/fa';

function ProjectsPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Add initial fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch projects from the backend
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl('/projects'));

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        setProjects(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // `featured` still drives emphasis and ordering, but the two groups run as
  // one continuously numbered sequence rather than two separate sections.
  const ordered = useMemo(
    () => [
      ...projects.filter((project) => project.featured),
      ...projects.filter((project) => !project.featured),
    ],
    [projects]
  );

  return (
    <div className="projects-page">
      <div className={`projects-container ${isVisible ? 'fade-in' : ''}`}>
        <header className="page-head">
          <span className="t-mono">Field map · {projects.length || '—'} sites</span>
          <h1 className="page-title">Projects</h1>
          <p className="t-body page-subtitle">
            Showcasing my work in technology and innovation
          </p>
        </header>

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
          <ProjectMap projects={ordered} />
        )}
      </div>
    </div>
  );
}

export default ProjectsPage;
