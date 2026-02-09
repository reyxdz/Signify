import React from 'react';
import '../SignatureSetupModal.css';

const PreMadeSignatures = ({ user, onSelect, onNext, onBack }) => {
  const fullName = `${user?.firstName} ${user?.lastName}`;
  const initials = `${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}`.toUpperCase();

  const handleSelectSignature = () => {
    onSelect({
      type: 'premade',
      signature: fullName,
      initials: initials,
    });
    onNext();
  };

  return (
    <div className="signature-step">
      <div className="signature-header">
        <h1>Pre-made Signature</h1>
        <p>We've created a professional signature for you</p>
      </div>

      <div className="premade-signatures">
        <div className="signature-option selected">
          <div className="option-label">Your Signature</div>
          <div className="signature-display">
            <span className="signature-text">{fullName}</span>
          </div>
        </div>

        <div className="signature-option selected">
          <div className="option-label">Your Initials</div>
          <div className="initials-display">
            <span className="initials-text">{initials}</span>
          </div>
        </div>
      </div>

      <div className="signature-description">
        <p>
          These are generated based on your name. They can be used throughout your documents for signing.
        </p>
      </div>

      <div className="signature-actions">
        <button className="btn-back" onClick={onBack}>
          Back
        </button>
        <button className="btn-confirm" onClick={handleSelectSignature}>
          Use These Signatures
        </button>
      </div>
    </div>
  );
};

export default PreMadeSignatures;
