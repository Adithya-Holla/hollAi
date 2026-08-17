import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';
import { sceneState } from '../state/scene';
import '../styles/ProjectMap.css';

/**
 * Horizontal position of each pin, as a fraction of the map width.
 * Both sit inside the central gutter so the string never crosses a card.
 */
const PIN_X = [0.4, 0.6];

/**
 * Builds a smooth path through the measured pin centres.
 *
 * Cubic segments with vertical control handles: the string leaves a pin
 * heading down and arrives at the next heading down, so the curve reads as
 * routed cord rather than a polyline. A small extra drop on the handles gives
 * it slack.
 */
function buildPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const dy = b.y - a.y;
    const handle = Math.max(dy * 0.45, 40);
    d += ` C ${a.x} ${a.y + handle}, ${b.x} ${b.y - handle}, ${b.x} ${b.y}`;
  }
  return d;
}

function ProjectMap({ projects }) {
  const mapRef = useRef(null);
  const pathRef = useRef(null);
  const pinRefs = useRef([]);
  const rowRefs = useRef([]);

  const [geometry, setGeometry] = useState({ d: '', width: 0, height: 0 });

  const setPinRef = useCallback((i) => (el) => { pinRefs.current[i] = el; }, []);
  const setRowRef = useCallback((i) => (el) => { rowRefs.current[i] = el; }, []);

  /** Re-measure pin centres and regenerate the string. */
  const measure = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const base = map.getBoundingClientRect();
    const points = pinRefs.current
      .filter(Boolean)
      .map((pin) => {
        // Measure the pin head, not the pin group: the group also contains
        // the number label, so its centre sits off to one side of the dot.
        const head = pin.querySelector('.opmap-pin-head') || pin;
        const r = head.getBoundingClientRect();
        return {
          x: r.left - base.left + r.width / 2,
          y: r.top - base.top + r.height / 2,
        };
      });

    setGeometry({ d: buildPath(points), width: base.width, height: base.height });
  }, []);

  useLayoutEffect(() => {
    measure();
    const map = mapRef.current;
    if (!map || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    // Rows change height as text wraps at different widths, so observe the
    // map itself rather than only listening for viewport resizes.
    const observer = new ResizeObserver(measure);
    observer.observe(map);
    return () => observer.disconnect();
  }, [measure, projects]);

  /*
   * Scroll drives the string's draw and the pin states directly through the
   * DOM. Routing this through React state would re-render every card on
   * every frame.
   */
  useEffect(() => {
    const path = pathRef.current;
    const map = mapRef.current;
    if (!path || !map) return undefined;

    let length = 0;
    try {
      length = path.getTotalLength();
    } catch {
      length = 0;
    }

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      // Show the whole route at once and mark every pin reached; nothing is
      // gated behind scrolling.
      path.style.strokeDasharray = 'none';
      path.style.strokeDashoffset = '0';
      pinRefs.current.forEach((pin, i) => {
        if (pin) pin.classList.add('is-reached');
        if (rowRefs.current[i]) rowRefs.current[i].classList.add('is-reached');
      });
      return undefined;
    }

    if (length > 0) {
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = map.getBoundingClientRect();
      const marker = window.innerHeight * 0.55;
      const travelled = marker - rect.top;
      const progress = Math.min(1, Math.max(0, travelled / Math.max(rect.height, 1)));

      if (length > 0) {
        path.style.strokeDashoffset = `${length * (1 - progress)}`;
      }

      let reached = -1;
      pinRefs.current.forEach((pin, i) => {
        if (!pin) return;
        const pinTop = pin.getBoundingClientRect().top;
        const isReached = pinTop <= marker;
        pin.classList.toggle('is-reached', isReached);
        if (rowRefs.current[i]) {
          rowRefs.current[i].classList.toggle('is-reached', isReached);
        }
        if (isReached) reached = i;
      });

      // Lets the 3D key light follow the leg of the route being read.
      sceneState.hoveredRow = reached;
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      sceneState.hoveredRow = -1;
    };
  }, [geometry.d]);

  return (
    <div className="opmap" ref={mapRef}>
      <svg
        className="opmap-string"
        width={geometry.width || undefined}
        height={geometry.height || undefined}
        viewBox={geometry.width ? `0 0 ${geometry.width} ${geometry.height}` : undefined}
        aria-hidden="true"
        focusable="false"
      >
        {/* The unwalked route, barely there. */}
        <path className="opmap-track" d={geometry.d} />
        {/* The walked route, drawn by scroll. */}
        <path className="opmap-thread" d={geometry.d} ref={pathRef} />
      </svg>

      <ol className="opmap-rows">
        {projects.map((project, index) => {
          const number = String(index + 1).padStart(2, '0');
          const side = index % 2 === 0 ? 'left' : 'right';

          return (
            <li
              key={project._id}
              className="opmap-row"
              data-side={side}
              ref={setRowRef(index)}
              /*
               * --pin-x is declared on the ROW and inherited by the pin. An
               * inline declaration on the pin itself would outrank any
               * stylesheet rule, so the single-column layout could not move
               * the pin without !important.
               */
              style={{ '--pin-x': `${PIN_X[index % 2] * 100}%` }}
            >
              <span className="opmap-pin" ref={setPinRef(index)}>
                <span className="opmap-pin-head" />
                <span className="opmap-pin-no t-mono">{number}</span>
              </span>

              <article className="opmap-card">
                <header className="opmap-card-head">
                  <span className="t-mono opmap-tag">
                    {project.featured ? 'Priority target' : `Site ${number}`}
                  </span>
                  <h2 className="opmap-title">{project.title}</h2>
                </header>

                <div className="opmap-frame">
                  {project.imageUrl ? (
                    <img src={project.imageUrl} alt={project.title} loading="lazy" />
                  ) : (
                    <div className="opmap-plate t-mono tex-hatch" aria-hidden="true">
                      {number} / HOLLAI
                    </div>
                  )}
                </div>

                <p className="t-body opmap-desc">{project.description}</p>

                {project.technologies && project.technologies.length > 0 && (
                  <ul className="opmap-tech">
                    {project.technologies.map((tech) => (
                      <li key={tech} className="t-mono">{tech}</li>
                    ))}
                  </ul>
                )}

                <div className="opmap-links">
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
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default ProjectMap;
