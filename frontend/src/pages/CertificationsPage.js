import React, { useState, useEffect, useMemo } from 'react';
import { FaGraduationCap } from 'react-icons/fa';
import '../styles/CertificationsPage.css';
import { buildApiUrl } from '../config/api';
import { useInView } from '../hooks/useInView';

function Record({ cert, index, formatDate }) {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <li
      ref={ref}
      className={`record ${cert.featured ? 'record--featured' : ''} ${inView ? 'is-in' : ''}`}
    >
      <span className="record-index t-mono">{String(index + 1).padStart(2, '0')}</span>

      <div className="record-body">
        <h2 className="record-title">{cert.title}</h2>
        <p className="t-mono record-org">{cert.organization}</p>
        {cert.description && <p className="t-body record-desc">{cert.description}</p>}

        {cert.skills && cert.skills.length > 0 && (
          <ul className="record-skills">
            {cert.skills.map((skill) => (
              <li key={skill} className="t-mono">{skill}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="record-meta">
        <time className="t-mono record-date" dateTime={cert.issueDate}>
          {formatDate(cert.issueDate)}
        </time>
        {cert.credentialURL && (
          <a
            href={cert.credentialURL}
            target="_blank"
            rel="noopener noreferrer"
            className="t-mono inline-link"
          >
            View Credential
          </a>
        )}
      </div>
    </li>
  );
}

function CertificationsPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch certifications from the backend
    const fetchCertifications = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl('/certifications'));

        if (!response.ok) {
          throw new Error('Failed to fetch certifications');
        }

        const data = await response.json();
        setCertifications(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching certifications:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCertifications();
  }, []);

  // `featured` drives emphasis and ordering; the records run as one
  // continuously numbered list rather than two separate sections.
  const ordered = useMemo(
    () => [
      ...certifications.filter((cert) => cert.featured),
      ...certifications.filter((cert) => !cert.featured),
    ],
    [certifications]
  );

  return (
    <div className="certifications-page">
      <div className={`certifications-container tex-grid ${isVisible ? 'fade-in' : ''}`}>
        <header className="page-head">
          <span className="t-mono">Credentials on record</span>
          <h1 className="page-title">Certifications</h1>
          <p className="t-body page-subtitle">
            Credentials validating my expertise in AI and machine learning
          </p>
        </header>

        {loading ? (
          <div className="state-block t-mono">Loading certifications…</div>
        ) : error ? (
          <div className="state-block state-block--error t-mono">
            Error loading certifications: {error}
          </div>
        ) : certifications.length === 0 ? (
          <div className="state-block t-mono">
            <FaGraduationCap aria-hidden="true" /> No certifications available at the moment.
          </div>
        ) : (
          <ol className="records">
            {ordered.map((cert, index) => (
              <Record key={cert._id} cert={cert} index={index} formatDate={formatDate} />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export default CertificationsPage;
