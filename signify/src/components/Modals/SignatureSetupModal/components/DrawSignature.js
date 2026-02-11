import React, { useRef, useState } from 'react';
import { RotateCcw, Download, ChevronRight } from 'lucide-react';
import '../SignatureSetupModal.css';

const DrawSignature = ({ user, onComplete, onNext, onBack }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [step, setStep] = useState('signature'); // 'signature' or 'initials'
  const [signatureImage, setSignatureImage] = useState(null);

  // Helper function to crop canvas to only include drawn content
  const cropCanvasToContent = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    // Find the bounding box of non-transparent pixels
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 128) { // Only consider pixels with significant opacity
        const pixelIndex = i / 4;
        const x = pixelIndex % canvas.width;
        const y = Math.floor(pixelIndex / canvas.width);

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    // Add some padding around the signature for better appearance
    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);

    // If no content found, return original canvas as data URL
    if (minX >= maxX || minY >= maxY) {
      return canvas.toDataURL();
    }

    const width = maxX - minX;
    const height = maxY - minY;

    // Create a new canvas with the cropped dimensions
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = width;
    croppedCanvas.height = height;

    const croppedCtx = croppedCanvas.getContext('2d');
    // Fill with transparent background
    croppedCtx.clearRect(0, 0, width, height);
    // Copy only the drawn content
    croppedCtx.drawImage(
      canvas,
      minX, minY, width, height,
      0, 0, width, height
    );

    return croppedCanvas.toDataURL();
  };

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
      // Crop the canvas to remove empty space and store only the signature
      setSignatureImage(cropCanvasToContent(canvas));
      setStep('initials');
      setIsEmpty(true);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    } else if (step === 'initials' && !isEmpty) {
      const canvas = canvasRef.current;
      
      // Complete with both images (both cropped)
      onComplete({
        type: 'drawn',
        signature: signatureImage,
        initials: cropCanvasToContent(canvas),
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
