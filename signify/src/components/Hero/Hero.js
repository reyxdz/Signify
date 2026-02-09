import React from 'react';
import './Hero.css';

function Hero({ onStartSigningClick }) {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Sign Documents Digitally</h1>
            <p className="hero-subtitle">
              Secure, fast, and legally binding digital signatures. Simplify your document workflow and close deals faster.
            </p>
            <div className="hero-buttons">
              <button className="btn-hero-primary" onClick={onStartSigningClick}>Start Signing Now</button>
            </div>
          </div>
          <div className="hero-image">
            <div className="image-placeholder">
              <svg viewBox="0 0 400 300" fill="none">
                <rect width="400" height="300" fill="#f3f4f6" />
                <rect x="40" y="40" width="320" height="220" rx="8" fill="#ffffff" stroke="#e5e7eb" strokeWidth="2" />
                <line x1="60" y1="80" x2="340" y2="80" stroke="#e5e7eb" strokeWidth="2" />
                <line x1="60" y1="100" x2="340" y2="100" stroke="#e5e7eb" strokeWidth="2" />
                <line x1="60" y1="120" x2="260" y2="120" stroke="#e5e7eb" strokeWidth="2" />
                <circle cx="300" cy="150" r="20" fill="#2563eb" opacity="0.2" />
                <path d="M290 150 L295 155 L310 140" stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
