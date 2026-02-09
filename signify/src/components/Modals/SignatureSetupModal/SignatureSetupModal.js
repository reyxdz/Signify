import React, { useState } from 'react';
import axios from 'axios';
import { CheckCircle, Pen } from 'lucide-react';
import PreMadeSignatures from './components/PreMadeSignatures';
import DrawSignature from './components/DrawSignature';
import './SignatureSetupModal.css';

const SignatureSetupModal = ({ user, onComplete }) => {
  const [step, setStep] = useState('choose'); // 'choose', 'premade', 'draw'
  const [selectedSignature, setSelectedSignature] = useState(null);

  const handleUsePremade = () => {
    setStep('premade');
  };

  const handleDrawSignature = () => {
    setStep('draw');
  };

  const handlePremadeSelect = (signatureData) => {
    setSelectedSignature(signatureData);
  };

  const handleDrawComplete = (canvasImage) => {
    setSelectedSignature(canvasImage);
  };

  const handleConfirm = () => {
    if (selectedSignature) {
      // Save signature to backend
      const token = localStorage.getItem('token');
      axios.post(
        'http://localhost:5000/api/users/signature',
        { signature: selectedSignature },
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(() => {
        // Update localStorage with signature
        localStorage.setItem('userSignature', JSON.stringify(selectedSignature));
        onComplete(selectedSignature);
      }).catch((error) => {
        console.error('Error saving signature:', error);
        // Still complete even if backend save fails
        onComplete(selectedSignature);
      });
    }
  };

  const handleSkip = () => {
    // Create default signature and save to backend
    const defaultSignature = {
      type: 'premade',
      signature: `${user?.firstName} ${user?.lastName}`,
      initials: `${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}`,
    };
    
    const token = localStorage.getItem('token');
    axios.post(
      'http://localhost:5000/api/users/signature',
      { signature: defaultSignature },
      { headers: { Authorization: `Bearer ${token}` } }
    ).then(() => {
      localStorage.setItem('userSignature', JSON.stringify(defaultSignature));
      onComplete(defaultSignature);
    }).catch((error) => {
      console.error('Error saving signature:', error);
      // Still complete even if backend save fails
      onComplete(defaultSignature);
    });
  };

  return (
    <div className="signature-setup-overlay">
      <div className="signature-setup-modal">
        {step === 'choose' && (
          <div className="signature-step">
            <div className="signature-header">
              <h1>Welcome to Signify!</h1>
              <p>Set up your digital signature to get started</p>
            </div>

            <div className="signature-intro">
              <p>Your signature will be used to sign documents securely. You can create a signature now or skip to set it up later.</p>
            </div>

            <div className="signature-options">
              <button className="option-card" onClick={handleUsePremade}>
                <CheckCircle size={32} className="option-icon" />
                <div className="option-title">Use Pre-made Signature</div>
                <div className="option-description">
                  We'll create a professional signature using your name
                </div>
              </button>

              <button className="option-card" onClick={handleDrawSignature}>
                <Pen size={32} className="option-icon" />
                <div className="option-title">Draw Your Signature</div>
                <div className="option-description">
                  Create a personalized signature by drawing
                </div>
              </button>
            </div>

            <button className="btn-skip" onClick={handleSkip}>
              Skip for now
            </button>
          </div>
        )}

        {step === 'premade' && (
          <PreMadeSignatures
            user={user}
            onSelect={handlePremadeSelect}
            onNext={() => setStep('review')}
            onBack={() => setStep('choose')}
          />
        )}

        {step === 'draw' && (
          <DrawSignature
            user={user}
            onComplete={handleDrawComplete}
            onNext={() => setStep('review')}
            onBack={() => setStep('choose')}
          />
        )}

        {step === 'review' && selectedSignature && (
          <div className="signature-step">
            <div className="signature-header">
              <h1>Review Your Signature</h1>
              <p>Make sure your signature looks good</p>
            </div>

            <div className="signature-preview-box">
              {selectedSignature.type === 'premade' ? (
                <>
                  <div className="preview-item">
                    <div className="preview-label">Signature</div>
                    <div className="preview-signature">
                      {selectedSignature.signature}
                    </div>
                  </div>
                  <div className="preview-item">
                    <div className="preview-label">Initials</div>
                    <div className="preview-initials">
                      {selectedSignature.initials}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="preview-item">
                    <div className="preview-label">Your Signature</div>
                    <img src={selectedSignature.signature} alt="Signature" className="preview-image" />
                  </div>
                  <div className="preview-item">
                    <div className="preview-label">Your Initials</div>
                    <img src={selectedSignature.initials} alt="Initials" className="preview-image" />
                  </div>
                </>
              )}
            </div>

            <div className="signature-actions">
              <button className="btn-back" onClick={() => setStep(selectedSignature.type === 'premade' ? 'premade' : 'draw')}>
                Back
              </button>
              <button className="btn-confirm" onClick={handleConfirm}>
                Confirm & Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignatureSetupModal;
