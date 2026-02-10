import React, { useRef, useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { Upload, ChevronUp, ChevronDown } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './DocumentViewer.css';

// Set up PDF worker
import { pdfjs } from 'react-pdf';
// Use a compatible version from CDN or bundled
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

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
    if (documentId && !document && !pdfUrl) {
      setLoading(true);
      const loadPDF = async () => {
        try {
          // If we have fileData, use it
          if (fileData) {
            console.log('Processing fileData:', typeof fileData);
            if (typeof fileData === 'string') {
              console.log('Converting base64 to ArrayBuffer');
              const binaryString = atob(fileData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const buffer = bytes.buffer;
              console.log('ArrayBuffer created, size:', buffer.byteLength);
              setPdfUrl(buffer);
              setCurrentPage(1);
            } else if (fileData instanceof ArrayBuffer) {
              console.log('FileData is already ArrayBuffer');
              setPdfUrl(fileData);
              setCurrentPage(1);
            }
          } else {
            // Fetch PDF from backend
            console.log('Fetching PDF from backend for documentId:', documentId);
            const token = localStorage.getItem('token');
            
            // Try to fetch the file content from backend
            const response = await fetch(`http://localhost:5000/api/documents/${documentId}/file`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
              console.log('File endpoint not available, trying download endpoint');
              // Fallback to download endpoint
              const downloadResponse = await fetch(`http://localhost:5000/api/documents/${documentId}/download`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              if (downloadResponse.ok) {
                const arrayBuffer = await downloadResponse.arrayBuffer();
                console.log('PDF fetched from backend, size:', arrayBuffer.byteLength);
                setPdfUrl(arrayBuffer);
                setCurrentPage(1);
              } else {
                console.error('Failed to fetch PDF:', downloadResponse.status);
              }
            } else {
              const arrayBuffer = await response.arrayBuffer();
              console.log('PDF fetched from backend, size:', arrayBuffer.byteLength);
              setPdfUrl(arrayBuffer);
              setCurrentPage(1);
            }
          }
        } catch (error) {
          console.error('Error loading PDF:', error);
        } finally {
          setLoading(false);
        }
      };
      loadPDF();
    }
  }, [documentId, document, fileData]);

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
