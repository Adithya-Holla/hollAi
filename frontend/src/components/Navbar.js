import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';
import ThemeToggle from './ThemeToggle';
import { FaBars, FaTimes } from 'react-icons/fa';

// RouterLink component for use within Router context
const RouterLink = ({ to, children, className, onClick }) => {
  return (
    <Link to={to} onClick={onClick} className={className}>
      {children}
    </Link>
  );
};

// RegularLink component for use outside Router context
const RegularLink = ({ to, children, className, onClick }) => {
  return (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  );
};

// This function checks if we're in a router context
const checkRouterContext = () => {
  try {
    // This will throw an error if we're not in a router context
    require('react-router-dom').useLocation();
    return true;
  } catch (error) {
    return false;
  }
};

function Navbar({ toggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Prevent scrolling when menu is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className="navbar-container">
        <div className="logo">
          <Link to="/" onClick={toggleMenu}>hollAi</Link>
        </div>
        
        <div className="controls">
          <div className="theme-toggle-container">
            <ThemeToggle toggleTheme={toggleTheme} />
          </div>
          
          <button className="burger-menu" onClick={toggleMenu} aria-label="Toggle menu">
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        
        <div className={`menu-container ${isOpen ? 'active' : ''}`}>
          <ul className="nav-links">
            <li><Link to="/" onClick={toggleMenu} className={location.pathname === '/' ? 'active' : ''}>Home</Link></li>
            <li><Link to="/about" onClick={toggleMenu} className={location.pathname === '/about' ? 'active' : ''}>About</Link></li>
            <li><Link to="/projects" onClick={toggleMenu} className={location.pathname === '/projects' ? 'active' : ''}>Projects</Link></li>
            <li><Link to="/certifications" onClick={toggleMenu} className={location.pathname === '/certifications' ? 'active' : ''}>Certifications</Link></li>
            <li><Link to="/contact" onClick={toggleMenu} className={location.pathname === '/contact' ? 'active' : ''}>Contact</Link></li>
          </ul>
        </div>
      </div>
      {isOpen && <div className="overlay" onClick={toggleMenu}></div>}
    </>
  );
}

export default Navbar; 