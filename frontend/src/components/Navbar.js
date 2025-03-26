import React from 'react';
import '../styles/Navbar.css';
import ThemeToggle from './ThemeToggle';

function Navbar({ toggleTheme }) {
  return (
    <header className="navbar text-white p-4 shadow-lg">
      <nav className="container mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold flex-1 text-left">
          <a href="#home" className=".text-2xl">hollAi</a>
        </div>
        <ul className="flex space-x-6 justify-center flex-1">
          <li><a href="#home" className="hover:underline">Home</a></li>
          <li><a href="#about" className="hover:underline">About</a></li>
          <li><a href="#projects" className="hover:underline">Projects</a></li>
          <li><a href="#certifications" className="hover:underline">Certifications</a></li>
          <li><a href="#contact" className="hover:underline">Contact</a></li>
        </ul>
        <div className="flex-1 text-right">
          <ThemeToggle toggleTheme={toggleTheme} />
        </div>
      </nav>
    </header>
  );
}

export default Navbar; 