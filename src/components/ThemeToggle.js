import React, { useRef } from 'react';
import '../styles/ThemeToggle.css';
import { FaSun, FaMoon } from 'react-icons/fa';

function ThemeToggle({ toggleTheme, isDarkMode }) {
  const buttonRef = useRef(null);

  const handleToggle = () => {
    // Trigger animation by resetting and adding the animation class
    if (buttonRef.current) {
      // Reset animation by removing and adding class
      buttonRef.current.classList.remove('animate');
      // Force reflow to restart animation
      void buttonRef.current.offsetWidth;
      buttonRef.current.classList.add('animate');
    }
    
    // Call the parent's toggleTheme function
    if (toggleTheme && typeof toggleTheme === 'function') {
      toggleTheme();
    }
  };

  return (
    <button 
      ref={buttonRef}
      className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`} 
      onClick={handleToggle}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? <FaMoon /> : <FaSun />}
    </button>
  );
}

export default ThemeToggle; 