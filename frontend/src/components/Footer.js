import React from 'react';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="footer bg-gray-800 text-white py-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold">
          <a href="#home" className="footer-link-name">hollAi</a>
        </div>
        <div className="footer-links">
          <a href="https://www.linkedin.com/in/adithya-holla-05b185291/" target="_blank" rel="noopener noreferrer" className="footer-link">LinkedIn</a>
          <a href="mailto:adithyavholla23@gmail.com" className="footer-link">Email</a>
        </div>
        <p>&copy; 2025 hollAi. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer; 