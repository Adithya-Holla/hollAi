import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';
import { FaBars, FaTimes } from 'react-icons/fa';

const LINKS = [
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Projects' },
  { to: '/certifications', label: 'Certifications' },
  { to: '/contact', label: 'Contact' },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Close the takeover when navigation actually happens, rather than on the
  // click that starts it.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Only re-render on threshold crossings, not on every scroll event.
    const onScroll = () => {
      const past = window.scrollY > 40;
      setScrolled((prev) => (prev === past ? prev : past));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className={`navbar-container ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="logo">
          <Link to="/">HOLLAI</Link>
        </div>

        <button
          className="burger-menu"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`menu-container ${isOpen ? 'active' : ''}`}>
          <ul className="nav-links">
            {LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className={location.pathname === to ? 'active' : ''}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}

export default Navbar;
