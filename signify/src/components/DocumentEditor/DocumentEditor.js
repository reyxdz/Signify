import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Save, Type } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';
import './DocumentEditor.css';

const DocumentEditor = ({ document, onClose, onSave }) => {
  const canvasRef = useRef(null);
  const [signatures, setSignatures] = useState([]);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState('view'); // 'view' or 'sign'
  const [zoom, setZoom] = useState(100);

  // Load document image/PDF
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !document) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // For now, we'll create a placeholder document view
    // In production, you would load actual PDF using pdf.js or similar
    canvas.width = 800;
    canvas.height = 1000;

    // Draw white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw placeholder document content
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText(document?.name || 'Document', 40, 60);

    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`Status: ${document?.status || 'draft'}`, 40, 100);
    ctx.fillText(`Created: ${new Date(document?.createdAt).toLocaleDateString()}`, 40, 130);

    // Draw placeholder content lines
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(40, 160 + i * 30);
      ctx.lineTo(760, 160 + i * 30);
      ctx.stroke();
    }
  }, [document, zoom]);

  const handleAddSignature = (sig) => {
    setSignatures([...signatures, { ...sig, id: Date.now() }]);
    setMode('view');
  };

  const handleRemoveSignature = (id) => {
    setSignatures(signatures.filter(sig => sig.id !== id));
  };

  const handleSaveDocument = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in first');
        setIsSaving(false);
        return;
      }

      // Call the sign endpoint with signatures
      const response = await fetch(`http://localhost:5000/api/documents/${document._id}/sign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signatures: signatures,
        }),
      });

      if (response.ok) {
        alert('Document signed successfully!');
        if (onSave) {
          await onSave({
            documentId: document._id,
            signatures: signatures,
            status: 'signed'
          });
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!document) {
    return null;
  }

  return (
    <div className="document-editor">
      {/* Header */}
      <div className="editor-header">
        <button className="back-button" onClick={onClose} title="Go back">
          <ArrowLeft size={20} />
        </button>
        <div className="editor-title">
          <h1>{document.name}</h1>
          <p className="doc-status">{document.status}</p>
        </div>
        <div className="header-spacer"></div>
        <button 
          className="save-button"
          onClick={handleSaveDocument}
          disabled={isSaving || signatures.length === 0}
          title="Save document with signatures"
        >
          <Save size={18} />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      {/* Main Editor Area */}
      <div className="editor-container">
        {/* Document Canvas Area */}
        <div className="document-area">
          <div className="document-wrapper" style={{ zoom: `${zoom}%` }}>
            <canvas ref={canvasRef} className="document-canvas" />
            
            {/* Signature Overlay Layer */}
            <div className="signatures-layer">
              {signatures.map((sig) => (
                <div
                  key={sig.id}
                  className={`signature-item ${selectedSignature?.id === sig.id ? 'selected' : ''}`}
                  style={{
                    left: `${sig.x}px`,
                    top: `${sig.y}px`,
                    width: `${sig.width}px`,
                    height: `${sig.height}px`,
                  }}
                  onClick={() => setSelectedSignature(sig)}
                >
                  {sig.type === 'drawn' ? (
                    <canvas
                      className="signature-canvas"
                      width={sig.width}
                      height={sig.height}
                    />
                  ) : (
                    <div className="signature-placeholder">
                      <span>{sig.initials || 'SIG'}</span>
                    </div>
                  )}
                  
                  {selectedSignature?.id === sig.id && (
                    <button
                      className="remove-signature"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSignature(sig.id);
                        setSelectedSignature(null);
                      }}
                      title="Remove signature"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button 
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              title="Zoom out"
            >
              −
            </button>
            <span className="zoom-display">{zoom}%</span>
            <button 
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              title="Zoom in"
            >
              +
            </button>
            <button 
              onClick={() => setZoom(100)}
              title="Reset zoom"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="editor-sidebar">
          <div className="sidebar-content">
            <h3 className="sidebar-title">Add Signature</h3>
            
            {mode === 'view' && (
              <div className="signature-options">
                <button
                  className="option-button primary"
                  onClick={() => setMode('sign')}
                >
                  <Type size={16} />
                  <span>Draw Signature</span>
                </button>
              </div>
            )}

            {mode === 'sign' && (
              <SignatureCanvas 
                onAdd={handleAddSignature}
                onCancel={() => setMode('view')}
              />
            )}

            {/* Signatures List */}
            {signatures.length > 0 && (
              <div className="signatures-list">
                <h4>Added Signatures ({signatures.length})</h4>
                <div className="list-items">
                  {signatures.map((sig) => (
                    <div
                      key={sig.id}
                      className={`list-item ${selectedSignature?.id === sig.id ? 'active' : ''}`}
                      onClick={() => setSelectedSignature(sig)}
                    >
                      <span>Signature #{signatures.indexOf(sig) + 1}</span>
                      <small>
                        Position: {Math.round(sig.x)}px, {Math.round(sig.y)}px
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Info */}
            <div className="document-info-box">
              <h4>Document Info</h4>
              <div className="info-item">
                <span>Status:</span>
                <strong>{document.status}</strong>
              </div>
              <div className="info-item">
                <span>Created:</span>
                <small>{new Date(document.createdAt).toLocaleDateString()}</small>
              </div>
              <div className="info-item">
                <span>Size:</span>
                <small>{document.size ? `${(document.size / 1024).toFixed(2)} KB` : 'N/A'}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
