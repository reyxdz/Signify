import React, { useRef, useState } from 'react';
import { RotateCcw, Download, ChevronRight } from 'lucide-react';
import '../SignatureSetupModal.css';

const DrawSignature = ({ user, onComplete, onNext, onBack }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [step, setStep] = useState('signature'); // 'signature' or 'initials'
  const [signatureImage, setSignatureImage] = useState(null);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Scale factor for high DPI displays
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCanvasCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCanvasCoordinates(e);

    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    setIsEmpty(false);
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.closePath();
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
    }
  };

  const handleConfirm = () => {
    if (step === 'signature' && !isEmpty) {
      const canvas = canvasRef.current;
      setSignatureImage(canvas.toDataURL());
      setStep('initials');
      setIsEmpty(true);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    } else if (step === 'initials' && !isEmpty) {
      const canvas = canvasRef.current;
      
      // Complete with both images
      onComplete({
        type: 'drawn',
        signature: signatureImage,
        initials: canvas.toDataURL(),
      });
      onNext();
    }
  };

  return (
    <div className="signature-step">
      <div className="signature-header">
        <h1>Draw Your {step === 'signature' ? 'Signature' : 'Initials'}</h1>
        <p>Use your mouse or touchpad to draw {step === 'signature' ? 'your signature' : 'your initials'}</p>
      </div>

      <div className="draw-progress-indicator">
        <div className={`progress-step ${step === 'signature' ? 'active' : 'completed'}`}>
          Step 1: Signature
        </div>
        <div className="progress-arrow">
          <ChevronRight size={16} />
        </div>
        <div className={`progress-step ${step === 'initials' ? 'active' : ''}`}>
          Step 2: Initials
        </div>
      </div>

      <div className="draw-signature-container">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="signature-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <p className="canvas-hint">{isEmpty ? `Start drawing ${step} here...` : ''}</p>
      </div>

      <div className="draw-signature-instructions">
        <p>
          {step === 'signature' 
            ? 'Draw your full signature in the box above.' 
            : 'Draw your initials (first letters) in the box above.'}
          {' '}You can clear and try again as many times as you need.
        </p>
      </div>

      <div className="signature-actions">
        <button className="btn-secondary" onClick={clearCanvas} disabled={isEmpty}>
          <RotateCcw size={16} /> Clear
        </button>
        <div className="action-spacer" />
        <button className="btn-back" onClick={step === 'initials' ? () => setStep('signature') : onBack}>
          {step === 'initials' ? 'Back to Signature' : 'Back'}
        </button>
        <button className="btn-confirm" onClick={handleConfirm} disabled={isEmpty}>
          <Download size={16} /> {step === 'signature' ? 'Next: Draw Initials' : 'Complete'}
        </button>
      </div>
    </div>
  );
};

export default DrawSignature;
