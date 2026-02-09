import React from 'react';
import './Footer.css';
import signifyLogo from '../../assets/images/signify_logo.png';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">
            <img src={signifyLogo} alt="Signify Logo" className="footer-logo-image" />
            <span>Signify</span>
          </div>
          <p className="footer-copyright">&copy; {currentYear} Signify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
