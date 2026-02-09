import React from 'react';
import './Features.css';

function Features() {
  const features = [
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#dbeafe" />
          <path d="M12 20C12 24.418 15.582 28 20 28C24.418 28 28 24.418 28 20C28 15.582 24.418 12 20 12C15.582 12 12 15.582 12 20Z" stroke="#2563eb" strokeWidth="1.5" fill="none" />
          <path d="M20 16V20L23 22" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      title: 'Secure & Private',
      description: 'Your documents are encrypted and stored securely. Only you and authorized signers can access them.'
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#fef3c7" />
          <path d="M12 20L18 26L28 14" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Lightning Fast',
      description: 'Send, sign, and complete agreements in minutes, not days. Accelerate your business workflows.'
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#cffafe" />
          <rect x="10" y="14" width="20" height="16" rx="2" stroke="#06b6d4" strokeWidth="1.5" fill="none" />
          <line x1="14" y1="14" x2="14" y2="12" stroke="#06b6d4" strokeWidth="1.5" />
          <line x1="26" y1="14" x2="26" y2="12" stroke="#06b6d4" strokeWidth="1.5" />
        </svg>
      ),
      title: 'Mobile Friendly',
      description: 'Sign documents from anywhere, on any device. Full functionality on mobile and desktop.'
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#dcfce7" />
          <circle cx="20" cy="20" r="8" stroke="#16a34a" strokeWidth="1.5" fill="none" />
          <path d="M17 20L19 22L23 18" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Complete Documentation',
      description: 'Keep a complete audit trail of all document signatures with timestamps and signer information for your records.'
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#ede9fe" />
          <path d="M12 22L18 16L24 22L28 18" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="28" cy="18" r="1" fill="#7c3aed" />
        </svg>
      ),
      title: 'API Integration',
      description: 'Seamlessly integrate with your existing tools and systems using our robust API.'
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#fce7f3" />
          <rect x="10" y="12" width="6" height="16" rx="1" fill="#ec4899" />
          <rect x="18" y="16" width="6" height="12" rx="1" fill="#ec4899" />
          <rect x="26" y="14" width="6" height="14" rx="1" fill="#ec4899" />
        </svg>
      ),
      title: 'Real-time Analytics',
      description: 'Track document status and get insights into your signature workflow with detailed reports.'
    }
  ];

  return (
    <section id="features" className="features">
      <div className="container">
        <div className="features-header">
          <h2>Powerful Features Built for You</h2>
          <p>Everything you need to streamline your document signing process</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon-wrapper">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
