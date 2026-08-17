import React from 'react';
import { FaGithub, FaExternalLinkAlt, FaCode } from 'react-icons/fa';
import { useInView } from '../hooks/useInView';

/**
 * One entry in Home's recent-projects list.
 *
 * Reveals as it scrolls into view: the index counts in from the left, the
 * body rises, and the image wipes open. The staggered parts are what make it
 * read as an entrance rather than a fade.
 */
function PreviewItem({ project, index }) {
  const [ref, inView] = useInView({ threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
  const number = String(index + 1).padStart(2, '0');

  return (
    <li
      ref={ref}
      className={`preview-item ${inView ? 'is-in' : ''}`}
      style={{ '--stagger': `${index * 90}ms` }}
    >
      <span className="preview-index t-mono">{number}</span>

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
  );
}

export default PreviewItem;
