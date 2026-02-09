import React from 'react';
import './CTA.css';

function CTA({ onStartSigningClick }) {
  return (
    <section className="cta">
      <div className="container">
        <div className="cta-content">
          <h2>Create Your Own E-Signature Now!</h2>
          <p>Join growing individuals on using Signify to streamline their document workflows.</p>
          <div className="cta-buttons">
            <button className="btn-cta-primary" onClick={onStartSigningClick}>Start Signing Now</button>
          </div>
          <p className="cta-footer">Completely free • No credit card needed • Access all features</p>
        </div>
      </div>
    </section>
  );
}

export default CTA;
