import React, { useState } from 'react';
import '../styles/ThemeToggle.css';
import { FaSun, FaMoon } from 'react-icons/fa';

function ThemeToggle({ toggleTheme }) {
  const [isDark, setIsDark] = useState(false);

  const handleToggle = () => {
    setIsDark(!isDark);
    if (toggleTheme && typeof toggleTheme === 'function') {
      toggleTheme();
    }
  };

  return (
    <button 
      className={`theme-toggle ${isDark ? 'dark' : 'light'}`} 
      onClick={handleToggle}
    >
      {isDark ? <FaMoon /> : <FaSun />}
    </button>
  );
}

export default ThemeToggle; 