import React, { useRef, useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { Upload, ChevronUp, ChevronDown } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './DocumentViewer.css';

// Set up PDF worker - use local worker file
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

function DocumentViewer({ document, documentName, documentId, fileData, onDocumentUpload }) {
  const fileInputRef = useRef(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load PDF from file upload
  useEffect(() => {
    if (document) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfUrl(e.target.result);
        setCurrentPage(1);
      };
      reader.readAsArrayBuffer(document);
    }
  }, [document]);

  // Load PDF from documentId or fileData
  useEffect(() => {
    if (fileData && !document && !pdfUrl) {
      try {
        // If fileData is base64 string, convert to ArrayBuffer
        if (typeof fileData === 'string') {
          const binaryString = atob(fileData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          setPdfUrl(bytes.buffer);
          setCurrentPage(1);
          setLoading(false);
        } else if (fileData instanceof ArrayBuffer) {
          setPdfUrl(fileData);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error processing file data:', error);
        setLoading(false);
      }
    }
  }, [fileData, document, pdfUrl]);

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

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < numPages ? prev + 1 : prev));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };

  // Show document if either a file is uploaded or documentId exists
  const hasDocument = document || documentId;

  return (
    <div className="document-viewer">
      {!hasDocument ? (
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
              <div className="button-group">
                <button
                  className="change-document-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Document
                </button>
              </div>
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
            {loading ? (
              <div className="pdf-loading">Loading PDF...</div>
            ) : pdfUrl ? (
              <>
                <div className="pdf-viewer-wrapper">
                  <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div>Loading PDF...</div>}>
                    <Page pageNumber={currentPage} />
                  </Document>
                </div>

                {numPages && numPages > 1 && (
                  <div className="pdf-navigation">
                    <button
                      className="nav-btn"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      title="Previous page"
                    >
                      <ChevronUp size={20} />
                    </button>
                    <div className="page-info">
                      Page {currentPage} of {numPages}
                    </div>
                    <button
                      className="nav-btn"
                      onClick={handleNextPage}
                      disabled={currentPage === numPages}
                      title="Next page"
                    >
                      <ChevronDown size={20} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="pdf-placeholder">
                <p>PDF Viewer Coming Soon</p>
                <p className="file-info">File: {documentName}</p>
                {documentId && <p className="document-id">ID: {documentId}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentViewer;
