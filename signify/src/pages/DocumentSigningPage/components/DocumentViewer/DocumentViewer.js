import React, { useRef, useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { Upload, ChevronUp, ChevronDown } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './DocumentViewer.css';

function DocumentViewer({ document, documentName, documentId, fileData, onDocumentUpload }) {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [droppedTools, setDroppedTools] = useState([]);
  const [draggedToolId, setDraggedToolId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPreview, setDragPreview] = useState(null);

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
            
            try {
              // Fetch the document with fileData from backend
              const response = await fetch(`http://localhost:5000/api/documents/${documentId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              if (response.ok) {
                const result = await response.json();
                console.log('Document fetched from backend:', result);
                
                // The fileData comes back as base64 string
                if (result.data && result.data.fileData) {
                  const base64Data = result.data.fileData;
                  console.log('Processing base64 fileData from API');
                  
                  // Convert base64 to ArrayBuffer
                  const binaryString = atob(base64Data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const buffer = bytes.buffer;
                  console.log('ArrayBuffer created from base64, size:', buffer.byteLength);
                  setPdfUrl(buffer);
                  setCurrentPage(1);
                } else {
                  console.error('No fileData found in document response');
                }
              } else {
                console.error('Failed to fetch document:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error details:', errorText);
              }
            } catch (error) {
              console.error('Error fetching document from backend:', error);
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
    
    // Show preview of where tool will be dropped
    const wrapper = wrapperRef.current;
    const canvas = event.currentTarget;
    if (wrapper) {
      const wrapperRect = wrapper.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      
      // Calculate position relative to wrapper, accounting for canvas scroll and positioning
      const x = event.clientX - wrapperRect.left;
      const y = event.clientY - canvasRect.top - (wrapperRect.top - canvasRect.top) + canvas.scrollTop;
      
      setDragPreview({ x, y });
    }
  };

  const handleDragLeave = (event) => {
    event.currentTarget.classList.remove('drag-over');
    setDragPreview(null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    setDragPreview(null);
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    
    const wrapperRect = wrapper.getBoundingClientRect();
    const canvasRect = event.currentTarget.getBoundingClientRect();
    const scrollTop = event.currentTarget.scrollTop;
    const scrollLeft = event.currentTarget.scrollLeft;
    
    // Calculate position relative to wrapper, accounting for canvas scroll and positioning
    const x = event.clientX - wrapperRect.left;
    const y = event.clientY - canvasRect.top - (wrapperRect.top - canvasRect.top) + scrollTop;
    
    // Check if it's a tool being dragged from dropped tools
    if (draggedToolId) {
      setDroppedTools(
        droppedTools.map((tool) =>
          tool.id === draggedToolId ? { ...tool, x, y } : tool
        )
      );
      setDraggedToolId(null);
      setDragOffset({ x: 0, y: 0 });
      return;
    }
    
    // Check if it's a PDF file drop
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      onDocumentUpload(file);
      return;
    }
    
    // Check if it's a tool being dropped from the left panel
    try {
      const toolData = event.dataTransfer.getData('application/json');
      if (toolData) {
        const tool = JSON.parse(toolData);
        
        setDroppedTools([
          ...droppedTools,
          {
            id: Date.now(),
            tool: tool,
            x: x,
            y: y,
          },
        ]);
      }
    } catch (error) {
      console.error('Error parsing dropped tool:', error);
      if (file) {
        alert('Please drop a PDF file');
      }
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
          <div 
            className="document-canvas"
            ref={canvasRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {loading ? (
              <div className="pdf-loading">Loading PDF...</div>
            ) : pdfUrl ? (
              <>
                <div className="pdf-viewer-wrapper" ref={wrapperRef}>
                  <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div>Loading PDF...</div>}>
                    <Page pageNumber={currentPage} scale={1.5} />
                  </Document>
                  {dragPreview && (
                    <div
                      className="drag-preview"
                      style={{
                        position: 'absolute',
                        left: `${dragPreview.x}px`,
                        top: `${dragPreview.y}px`,
                      }}
                    >
                      <div className="drag-preview-label">Drop here</div>
                    </div>
                  )}
                  {droppedTools.map((item) => (
                    <div
                      key={item.id}
                      className="dropped-tool"
                      draggable
                      onDragStart={(e) => {
                        setDraggedToolId(item.id);
                        const element = e.currentTarget;
                        const rect = element.getBoundingClientRect();
                        const canvasRect = canvasRef.current.getBoundingClientRect();
                        setDragOffset({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        });
                      }}
                      onDragEnd={() => {
                        setDraggedToolId(null);
                        setDragOffset({ x: 0, y: 0 });
                      }}
                      style={{
                        position: 'absolute',
                        left: `${item.x}px`,
                        top: `${item.y}px`,
                      }}
                      onClick={() => setDroppedTools(droppedTools.filter((t) => t.id !== item.id))}
                    >
                      <div className="dropped-tool-label">{item.tool.label}</div>
                    </div>
                  ))}
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
