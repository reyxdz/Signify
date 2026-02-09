import React, { useState } from 'react';
import './Header.css';
import signifyLogo from '../../assets/images/signify_logo.png';

function Header({ onSignInClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <img src={signifyLogo} alt="Signify Logo" className="logo-image" />
            <span>Signify</span>
          </div>

          <div className="header-actions">
            <button className="btn-primary" onClick={onSignInClick}>Sign In</button>
          </div>

          <button className="menu-toggle" onClick={toggleMobileMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
