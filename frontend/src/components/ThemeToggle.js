import React, { useState, useEffect } from 'react';
import '../styles/ThemeToggle.css';
import { FaSun, FaMoon } from 'react-icons/fa';

function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`} onClick={toggleTheme}>
      {isDarkMode ? <FaMoon /> : <FaSun />}
    </button>
  );
}

export default ThemeToggle; 