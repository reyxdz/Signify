import React, { useState, useRef, useEffect } from 'react';
import './DocumentViewer.css';

const DocumentViewer = () => {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const handleFileChange = (e) => {
    setError(null);
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are supported at the moment.');
      return;
    }

    setFile(f);
    const url = URL.createObjectURL(f);
    setFileUrl(url);
  };

  const openFilePicker = () => fileInputRef.current && fileInputRef.current.click();

  const openSampleDoc = () => {
    // Helpful for testing without uploading. Uses a small local sample if available.
    // If no sample is bundled, fallback to leaving empty — user can upload.
    // TODO: replace with an actual sample asset if desired.
    setError(null);
    setFile(null);
    setFileUrl('/sample/sample.pdf');
  };

  return (
    <div className="document-viewer-root">
      <div className="viewer-controls">
        <div className="left-controls">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button className="btn btn-primary" onClick={openFilePicker}>Upload PDF</button>
          <button className="btn btn-ghost" onClick={openSampleDoc}>Open Sample</button>
        </div>

        <div className="right-controls">
          {file && <div className="file-meta">{file.name}</div>}
        </div>
      </div>

      <div className="viewer-area">
        {error && <div className="error">{error}</div>}

        {!fileUrl && (
          <div className="empty-state">
            <p className="large">No document selected</p>
            <p className="muted">Upload a PDF to start placing signatures and fields.</p>
            <button className="btn btn-outline" onClick={openFilePicker}>Choose PDF</button>
          </div>
        )}

        {fileUrl && (
          <iframe
            title="PDF Document"
            src={fileUrl}
            className="pdf-frame"
          />
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
