import React, { useState, useEffect } from 'react';
import '../styles/Navbar.css';
import ThemeToggle from './ThemeToggle';
import { FaBars, FaTimes } from 'react-icons/fa';

function Navbar({ toggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);

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
          <a href="#home">hollAi</a>
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
            <li><a href="#home" onClick={toggleMenu}>Home</a></li>
            <li><a href="#about" onClick={toggleMenu}>About</a></li>
            <li><a href="#projects" onClick={toggleMenu}>Projects</a></li>
            <li><a href="#certifications" onClick={toggleMenu}>Certifications</a></li>
            <li><a href="#contact" onClick={toggleMenu}>Contact</a></li>
          </ul>
        </div>
      </div>
      {isOpen && <div className="overlay" onClick={toggleMenu}></div>}
    </>
  );
}

export default Navbar; 