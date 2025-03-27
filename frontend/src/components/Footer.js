import React from 'react';
import '../styles/Footer.css';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

function Footer() {
  return (
    <footer className="footer bg-gray-800 text-white py-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold">
          <a href="/" className="footer-link-name">hollAi</a>
        </div>
        <div className="social-media">
          <div className="social-icons_footer">
            <a href="https://github.com/Adithya-Holla" target="_blank" rel="noopener noreferrer" className="social-icon_footer">
              <FaGithub />
            </a>
            <a href="https://www.linkedin.com/in/adiholla/" target="_blank" rel="noopener noreferrer" className="social-icon_footer">
              <FaLinkedin />
            </a>
          </div>
        </div>
        <p>&copy; 2025 hollAi. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer; 