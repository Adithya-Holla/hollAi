import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { clearIntroSeen } from '../state/introGate';

function Footer() {
  const replayIntro = () => {
    clearIntroSeen(window.sessionStorage);
    // A full load rather than a route change: the intro decides whether to
    // mount when the shell first mounts.
    window.location.assign('/?intro');
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-mark">
          <Link to="/">HOLLAI</Link>
        </div>

        <div className="footer-social">
          <a
            href="https://github.com/Adithya-Holla"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-icon"
            aria-label="GitHub"
          >
            <FaGithub />
          </a>
          <a
            href="https://www.linkedin.com/in/adiholla/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-icon"
            aria-label="LinkedIn"
          >
            <FaLinkedin />
          </a>
        </div>

        <div className="footer-meta">
          <button type="button" className="t-mono footer-replay" onClick={replayIntro}>
            Replay intro
          </button>
          <p className="t-mono footer-copy">&copy; 2025 hollAi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
