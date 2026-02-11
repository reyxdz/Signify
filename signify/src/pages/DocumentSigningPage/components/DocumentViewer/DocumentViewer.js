import React, { useRef, useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { Upload, ChevronUp, ChevronDown } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './DocumentViewer.css';

function DocumentViewer({ document, documentName, documentId, fileData, onDocumentUpload, droppedTools: parentDroppedTools, setDroppedTools: setParentDroppedTools }) {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [droppedTools, setDroppedTools] = useState(parentDroppedTools || []);
  const [draggedToolId, setDraggedToolId] = useState(null);
  const [resizingToolId, setResizingToolId] = useState(null);
  const [resizeStart, setResizeStart] = useState(null);
  const resizingRef = useRef(false);

  // Sync from parent when parent tools change (from database or preview back)
  useEffect(() => {
    if (parentDroppedTools && parentDroppedTools.length > 0) {
      console.log('DocumentViewer: Syncing parent tools:', parentDroppedTools);
      setDroppedTools(parentDroppedTools);
    }
  }, [parentDroppedTools]);

  // Helper function to update tools in both local and parent state
  const updateTools = (newTools) => {
    setDroppedTools(newTools);
    if (setParentDroppedTools) {
      setParentDroppedTools(newTools);
    }
  };

  // Handle mouse down on resize handle
  const handleResizeMouseDown = (e, toolId) => {
    e.stopPropagation();
    e.preventDefault();
    resizingRef.current = true;
    setResizingToolId(toolId);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialWidth: e.currentTarget.parentElement.offsetWidth,
      initialHeight: e.currentTarget.parentElement.offsetHeight,
    });
  };

  // Handle mouse move for resizing
  useEffect(() => {
    if (!resizingToolId || !resizeStart || typeof document === 'undefined') return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - resizeStart.mouseX;
      const deltaY = e.clientY - resizeStart.mouseY;
      const newWidth = Math.max(80, resizeStart.initialWidth + deltaX);
      const newHeight = Math.max(40, resizeStart.initialHeight + deltaY);

      setDroppedTools((prevTools) =>
        prevTools.map((tool) =>
          tool.id === resizingToolId
            ? { ...tool, width: newWidth, height: newHeight }
            : tool
        )
      );
    };

    const handleMouseUp = () => {
      setResizingToolId(null);
      setResizeStart(null);
      resizingRef.current = false;
    };

    if (document) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingToolId, resizeStart]);

  // Sync with parent when tools change (including resizing)
  useEffect(() => {
    if (setParentDroppedTools && !resizingToolId) {
      setParentDroppedTools(droppedTools);
    }
  }, [droppedTools, resizingToolId, setParentDroppedTools]);

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
  }, [documentId, document, fileData, pdfUrl]);

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
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    
    const wrapperRect = wrapper.getBoundingClientRect();
    
    // Calculate position relative to wrapper
    const x = event.clientX - wrapperRect.left;
    const y = event.clientY - wrapperRect.top;
    
    // Get the PDF page element to validate drop area
    const pdfPage = wrapper.querySelector('.react-pdf__Page');
    if (!pdfPage) {
      console.warn('PDF page element not found');
      return;
    }
    
    const pageRect = pdfPage.getBoundingClientRect();
    const pageLeft = pageRect.left - wrapperRect.left;
    const pageTop = pageRect.top - wrapperRect.top;
    const pageRight = pageLeft + pageRect.width;
    const pageBottom = pageTop + pageRect.height;
    
    // Account for tool dimensions (min-width: 120px, min-height: 40px + padding: 8px 12px on all sides)
    // Total: 120 + 24 (left+right padding) = 144px width, 40 + 16 (top+bottom padding) = 56px height
    const toolWidth = 144;
    const toolHeight = 56;
    
    // Check if drop + tool dimensions would be within page boundaries
    const isWithinPage = x >= pageLeft && (x + toolWidth) <= pageRight && y >= pageTop && (y + toolHeight) <= pageBottom;
    console.log('Drop position:', { x, y }, 'Tool size:', { toolWidth, toolHeight }, 'Page bounds:', { pageLeft, pageTop, pageRight, pageBottom }, 'Within page:', isWithinPage);
    
    if (!isWithinPage) {
      console.log('Drop outside page - ignoring');
      return; // Ignore drops outside the page
    }
    
    // Check if it's a tool being dragged from dropped tools
    if (draggedToolId) {
      const updatedTools = droppedTools.map((tool) =>
        tool.id === draggedToolId ? { ...tool, x, y } : tool
      );
      updateTools(updatedTools);
      setDraggedToolId(null);
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
        
        const newTools = [
          ...droppedTools,
          {
            id: Date.now(),
            tool: tool,
            x: x,
            y: y,
            page: currentPage,
          },
        ];
        updateTools(newTools);
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
                  {/* Only render tools after PDF has loaded successfully */}
                  {numPages && droppedTools.filter((item) => item.page === currentPage).map((item) => {
                    // Check if this is a signature/initial image (base64 data starts with 'data:image')
                    const isImage = typeof item.tool.value === 'string' && item.tool.value.startsWith('data:image');
                    
                    return (
                      <div
                        key={item.id}
                        className="dropped-tool"
                        draggable
                        onDragStart={(e) => {
                          if (resizingRef.current) {
                            e.preventDefault();
                            return;
                          }
                          setDraggedToolId(item.id);
                        }}
                        onDragEnd={() => {
                          setDraggedToolId(null);
                        }}
                        style={{
                          position: 'absolute',
                          left: `${item.x}px`,
                          top: `${item.y}px`,
                          width: item.width ? `${item.width}px` : '120px',
                          height: item.height ? `${item.height}px` : '40px',
                        }}
                      >
                        {isImage ? (
                          <img 
                            src={item.tool.value} 
                            alt={item.tool.label}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              pointerEvents: 'none',
                            }}
                          />
                        ) : (
                          <div className="dropped-tool-label">{item.tool.value || item.tool.label}</div>
                        )}
                        {/* Resize handle - bottom-right corner */}
                        <div
                          className="resize-handle"
                          onMouseDown={(e) => handleResizeMouseDown(e, item.id)}
                          title="Drag to resize"
                        />
                      </div>
                    );
                  })}
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
