import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Save, Type, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import FieldsSidebar from './FieldsSidebar';
import SignatureCanvas from './SignatureCanvas';
import './DocumentEditor.css';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

const DocumentEditor = ({ document, onClose, onSave }) => {
  const canvasRef = useRef(null);
  const [signatures, setSignatures] = useState([]);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState('view'); // 'view' or 'sign'
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(125);

  // Load and render PDF
  useEffect(() => {
    if (!document?.fileData) return;

    const loadPDF = async () => {
      try {
        // Convert base64 to Uint8Array
        const binaryString = atob(document.fileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Load PDF
        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPDF();
  }, [document?.fileData]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const scale = zoom / 100;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;
      } catch (error) {
        console.error('Error rendering page:', error);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, zoom]);

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

          {/* Page Navigation Controls */}
          <div className="page-controls">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="page-button"
              title="Previous page"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="page-info">
              <span>Page {currentPage} of {totalPages}</span>
            </div>
            
            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="page-button"
              title="Next page"
            >
              <ChevronRight size={20} />
            </button>

            <div className="zoom-controls">
              <button 
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="zoom-button"
                title="Zoom out"
              >
                <ZoomOut size={18} />
              </button>
              
              <span className="zoom-display">{zoom}%</span>
              
              <button 
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="zoom-button"
                title="Zoom in"
              >
                <ZoomIn size={18} />
              </button>
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
