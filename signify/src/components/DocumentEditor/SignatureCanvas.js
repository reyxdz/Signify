import React, { useRef, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import './SignatureCanvas.css';

const SignatureCanvas = ({ onAdd, onCancel }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1f2937';
    ctx.lineTo(x, y);
    ctx.stroke();

    setIsEmpty(false);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleAddSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    // Get canvas image data
    const imageData = canvas.toDataURL('image/png');

    // Add signature with position and size
    onAdd({
      type: 'drawn',
      imageData: imageData,
      x: 100, // Default position
      y: 300,
      width: 150,
      height: 60,
      initials: '',
    });

    clearCanvas();
  };

  return (
    <div className="signature-canvas-wrapper">
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="signature-canvas-input"
          width={240}
          height={120}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <div className="canvas-placeholder">
          {isEmpty && <span>Sign here</span>}
        </div>
      </div>

      <div className="canvas-actions">
        <button
          className="action-btn secondary"
          onClick={clearCanvas}
          title="Clear signature"
        >
          <RotateCcw size={14} />
          Clear
        </button>
        <button
          className="action-btn primary"
          onClick={handleAddSignature}
          disabled={isEmpty}
          title="Add signature to document"
        >
          <span>Add to Document</span>
        </button>
      </div>

      <button
        className="close-btn"
        onClick={onCancel}
        title="Cancel"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default SignatureCanvas;
