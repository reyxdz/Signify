import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import './DocumentViewer.css';

function DocumentViewer({ document, documentName, onDocumentUpload }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onDocumentUpload(file);
    } else if (file) {
      alert('Please select a PDF file');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (event) => {
    event.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      onDocumentUpload(file);
    } else if (file) {
      alert('Please drop a PDF file');
    }
  };

  return (
    <div className="document-viewer">
      {!document ? (
        <div className="upload-area" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <div className="upload-content">
            <div className="upload-icon">
              <Upload size={48} />
            </div>
            <h2>Upload Document</h2>
            <p>Drag and drop your PDF here, or click to select</p>
            <button
              className="upload-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      ) : (
        <div className="document-content">
          <div className="document-header">
            <div className="document-info">
              <h3>{documentName}</h3>
              <button
                className="change-document-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Document
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          </div>
          <div className="document-canvas">
            <div className="pdf-placeholder">
              <p>PDF Viewer Coming Soon</p>
              <p className="file-info">File: {documentName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentViewer;
