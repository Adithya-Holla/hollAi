import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProjectsPage from './pages/ProjectsPage';
import CertificationsPage from './pages/CertificationsPage';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
        <Route path="/about" element={<AboutPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
        <Route path="/projects" element={<ProjectsPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
        <Route path="/certifications" element={<CertificationsPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
      </Routes>
    </Router>
  );
}

export default App;
