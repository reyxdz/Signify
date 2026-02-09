import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Save, Type, X } from 'lucide-react';
import FieldsSidebar from './FieldsSidebar';
import SignatureCanvas from './SignatureCanvas';
import './DocumentEditor.css';

const DocumentEditor = ({ document, onClose, onSave }) => {
  const containerRef = useRef(null);
  const [signatures, setSignatures] = useState([]);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState('view'); // 'view' or 'sign'
  const [pdfUrl, setPdfUrl] = useState(null);

  // Create a data URL from fileData
  useEffect(() => {
    if (document?.fileData) {
      try {
        // Create a blob from the base64 data
        const binaryString = atob(document.fileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        console.log('PDF URL created successfully');

        // Cleanup
        return () => {
          if (url) {
            URL.revokeObjectURL(url);
          }
        };
      } catch (error) {
        console.error('Error creating PDF URL:', error);
      }
    }
  }, [document?.fileData]);

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
        {/* Fields Sidebar */}
        <FieldsSidebar />

        {/* Document Canvas Area */}
        <div className="document-area">
          <div className="document-wrapper">
            {pdfUrl ? (
              <embed 
                src={pdfUrl} 
                type="application/pdf" 
                className="document-canvas"
                title="Document PDF"
              />
              />
            ) : (
              <div className="document-placeholder">
                <div className="placeholder-content">
                  <h3>{document?.name || 'Document'}</h3>
                  <p>Status: {document?.status || 'draft'}</p>
                  <p>Created: {new Date(document?.createdAt).toLocaleDateString()}</p>
                  <p className="text-muted">Loading document...</p>
                </div>
              </div>
            )}
            
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
