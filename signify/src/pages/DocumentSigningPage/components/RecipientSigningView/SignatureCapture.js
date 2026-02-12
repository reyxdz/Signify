import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import './SignatureCapture.css';

function SignatureCapture({ fieldName, onCapture, onCancel, existingSignature }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMode, setSignatureMode] = useState('saved'); // 'saved', 'draw' or 'upload'
  const [uploadedImage, setUploadedImage] = useState(existingSignature || null);
  const [savedSignature, setSavedSignature] = useState(null);

  // Load user's saved signature
  useEffect(() => {
    const loadSavedSignature = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/users/signature', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.signature) {
            setSavedSignature(data.data.signature);
            setSignatureMode('saved'); // Set 'saved' as default if available
          }
        }
      } catch (error) {
        console.error('Error loading saved signature:', error);
        setSignatureMode('draw'); // Fall back to draw mode
      }
    };

    loadSavedSignature();
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw border
      context.strokeStyle = '#e5e7eb';
      context.lineWidth = 1;
      context.strokeRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.lineTo(x, y);
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    context.strokeStyle = '#e5e7eb';
    context.lineWidth = 1;
    context.strokeRect(0, 0, canvas.width, canvas.height);
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setSignatureMode('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    let signatureData;
    
    if (signatureMode === 'saved') {
      signatureData = savedSignature;
    } else if (signatureMode === 'draw') {
      const canvas = canvasRef.current;
      signatureData = canvas.toDataURL('image/png');
    } else if (signatureMode === 'upload') {
      signatureData = uploadedImage;
    }

    if (signatureData) {
      onCapture(signatureData);
    } else {
      alert('Please select or draw a signature first');
    }
  };

  return (
    <div className="signature-capture-modal">
      <div className="signature-capture-overlay" onClick={onCancel}></div>
      <div className="signature-capture-content">
        <div className="signature-header">
          <h2>Sign: {fieldName}</h2>
          <button className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="signature-modes">
          {savedSignature && (
            <button
              className={`mode-btn ${signatureMode === 'saved' ? 'active' : ''}`}
              onClick={() => setSignatureMode('saved')}
              title="Use your pre-saved signature"
            >
              ✓ My Signature
            </button>
          )}
          <button
            className={`mode-btn ${signatureMode === 'draw' ? 'active' : ''}`}
            onClick={() => setSignatureMode('draw')}
          >
            ✎ Draw Signature
          </button>
          <button
            className={`mode-btn ${signatureMode === 'upload' ? 'active' : ''}`}
            onClick={() => setSignatureMode('upload')}
          >
            ↑ Upload Image
          </button>
        </div>

        {signatureMode === 'saved' && savedSignature ? (
          <div className="saved-mode">
            <p className="instruction">Your saved signature:</p>
            <div className="saved-signature-preview">
              <img src={savedSignature} alt="Your saved signature" />
            </div>
            <p className="mode-note">This is your pre-saved signature from your profile settings.</p>
          </div>
        ) : signatureMode === 'draw' ? (
          <div className="draw-mode">
            <p className="instruction">Draw your signature in the box below:</p>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              className="signature-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            ></canvas>
            <button className="clear-btn" onClick={clearCanvas}>
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        ) : signatureMode === 'upload' ? (
          <div className="upload-mode">
            <div className="upload-area">
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="file-input"
                id="signature-upload"
              />
              <label htmlFor="signature-upload" className="upload-label">
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Uploaded signature" className="preview-image" />
                ) : (
                  <>
                    <span className="upload-icon">📁</span>
                    <span className="upload-text">Click to upload or drag image here</span>
                  </>
                )}
              </label>
            </div>
          </div>
        ) : null}

        <div className="signature-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="submit-btn" onClick={handleSubmit}>
            Use This Signature
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignatureCapture;
