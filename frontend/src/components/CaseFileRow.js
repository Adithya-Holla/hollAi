import React, { useCallback } from 'react';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';
import { useInView } from '../hooks/useInView';
import { sceneState } from '../state/scene';

/**
 * A project presented as a case file rather than a card: a large index, the
 * title, and its metadata, with the image offset to one side.
 *
 * Hovering writes into the scene state so the 3D key light leans toward the
 * hovered row. That write is deliberately not React state — it is read inside
 * useFrame and must not re-render the list.
 */
function CaseFileRow({ project, index }) {
  const [ref, inView] = useInView({ threshold: 0.25 });
  const number = String(index + 1).padStart(2, '0');

  const handleEnter = useCallback(() => {
    sceneState.hoveredRow = index;
  }, [index]);

  const handleLeave = useCallback(() => {
    sceneState.hoveredRow = -1;
  }, []);

  return (
    <article
      ref={ref}
      className={`case-file ${inView ? 'is-in' : ''} ${project.featured ? 'case-file--featured' : ''}`}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
    >
      <div className="case-index t-mono">{number}</div>

      <div className="case-body">
        {project.featured && <span className="t-mono case-flag">Featured</span>}

        <h2 className="case-title">{project.title}</h2>
        <p className="t-body case-description">{project.description}</p>

        {project.technologies && project.technologies.length > 0 && (
          <ul className="case-tech">
            {project.technologies.map((tech) => (
              <li key={tech} className="t-mono">{tech}</li>
            ))}
          </ul>
        )}

        <div className="case-links">
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

      <div className="case-visual">
        {project.imageUrl ? (
          <img src={project.imageUrl} alt={project.title} loading="lazy" />
        ) : (
          /* A typographic plate rather than a generic icon placeholder. */
          <div className="case-plate t-mono" aria-hidden="true">
            {number} / HOLLAI
          </div>
        )}
      </div>
    </article>
  );
}

export default CaseFileRow;
