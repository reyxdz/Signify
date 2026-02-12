import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Document, Page } from 'react-pdf';
import { Upload, ChevronUp, ChevronDown } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './DocumentViewer.css';

function DocumentViewer({ document, documentName, documentId, fileData, onDocumentUpload, droppedTools: parentDroppedTools, setDroppedTools: setParentDroppedTools, selectedToolId, setSelectedToolId, isRecipientMode = false }) {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const resizeStartRef = useRef(null);
  const droppedToolsRef = useRef(parentDroppedTools || []);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [draggedToolId, setDraggedToolId] = useState(null);
  const [isResizing, setIsResizing] = useState(false);

  // Use parent tools directly instead of local state
  const droppedTools = useMemo(() => parentDroppedTools || [], [parentDroppedTools]);
  const updateTools = setParentDroppedTools;

  // Keep droppedTools in ref for use in event listeners
  useEffect(() => {
    droppedToolsRef.current = droppedTools;
  }, [droppedTools]);

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

  const handleResizeStart = (e, toolId, corner) => {
    e.preventDefault();
    e.stopPropagation();
    
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      corner: corner,
      toolId: toolId,
    };
    setIsResizing(true);
  };

  const handleResizeMove = useCallback((e) => {
    if (!resizeStartRef.current) return;

    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;
    const toolId = resizeStartRef.current.toolId;
    const corner = resizeStartRef.current.corner;

    const updatedTools = droppedToolsRef.current.map(tool => {
      if (tool.id === toolId) {
        let newWidth = tool.width || 100;
        let newHeight = tool.height || 60;
        let newX = tool.x;
        let newY = tool.y;

        // Adjust dimensions based on which corner is being dragged
        if (corner === 'se') {
          // Southeast - resize from bottom-right
          newWidth += deltaX;
          newHeight += deltaY;
        } else if (corner === 'sw') {
          // Southwest - resize from bottom-left
          newWidth -= deltaX;
          newHeight += deltaY;
          newX += deltaX;
        } else if (corner === 'ne') {
          // Northeast - resize from top-right
          newWidth += deltaX;
          newHeight -= deltaY;
          newY += deltaY;
        } else if (corner === 'nw') {
          // Northwest - resize from top-left
          newWidth -= deltaX;
          newHeight -= deltaY;
          newX += deltaX;
          newY += deltaY;
        }

        // Minimum dimensions to prevent too small resize
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(30, newHeight);

        return { ...tool, x: newX, y: newY, width: newWidth, height: newHeight };
      }
      return tool;
    });

    updateTools(updatedTools);
    
    // Update the start position for next move (makes it incremental)
    resizeStartRef.current.x = e.clientX;
    resizeStartRef.current.y = e.clientY;
  }, [updateTools]);

  const handleResizeEnd = useCallback(() => {
    resizeStartRef.current = null;
    setIsResizing(false);
  }, []);

  // Add mousemove and mouseup listeners for resizing
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

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
        
        // Check if this is a signature/initial image tool or recipient signature/initial
        const isSignatureImage = tool.label === 'My Signature' || tool.label === 'My Initial';
        const isRecipientSignature = tool.label === 'Recipient Signature' || tool.label === 'Recipient Initial';
        
        const initialWidth = isSignatureImage ? 120 : (isRecipientSignature ? 150 : undefined);
        const initialHeight = isSignatureImage ? 80 : (isRecipientSignature ? 60 : undefined);
        
        const newTools = [
          ...droppedTools,
          {
            id: Date.now(),
            tool: tool,
            x: x,
            y: y,
            page: currentPage,
            ...(initialWidth && { width: initialWidth }),
            ...(initialHeight && { height: initialHeight }),
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
            onDragOver={isRecipientMode ? undefined : handleDragOver}
            onDragLeave={isRecipientMode ? undefined : handleDragLeave}
            onDrop={isRecipientMode ? undefined : handleDrop}
            onClick={(e) => {
              if (isRecipientMode) return; // Disable selection in recipient mode
              // Deselect when clicking on empty canvas area (not on a tool)
              // Check if the click target is NOT a dropped-tool or its children
              if (!e.target.closest('.dropped-tool')) {
                setSelectedToolId(null);
              }
            }}
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
                  {numPages && (() => {
                    const toolsOnCurrentPage = droppedTools.filter((item) => item.page === currentPage);
                    console.log('Tools to render on page', currentPage, ':', toolsOnCurrentPage.length, 'out of', droppedTools.length);
                    return toolsOnCurrentPage.map((item) => {
                      // Check if this is a signature/initial image (base64 data starts with 'data:image')
                      const isImage = typeof item.tool.value === 'string' && item.tool.value.startsWith('data:image');
                      const isRecipientSignature = item.tool.label === 'Recipient Signature' || item.tool.label === 'Recipient Initial';
                      
                      if (item.tool.label === 'My Signature' || item.tool.label === 'My Initial') {
                        console.log('Rendering signature field:', { 
                          label: item.tool.label, 
                          isImage, 
                          hasValue: !!item.tool.value,
                          valueLength: typeof item.tool.value === 'string' ? item.tool.value.length : 0,
                          valueStart: typeof item.tool.value === 'string' ? item.tool.value.substring(0, 50) : 'N/A'
                        });
                      }
                      
                      return (
                        <div
                          key={item.id}
                          data-tool-id={item.id}
                          className={`dropped-tool ${isImage ? 'signature-image' : ''} ${isRecipientSignature ? 'recipient-signature-field' : ''} ${selectedToolId === item.id ? 'selected' : ''}`}
                          draggable={!isRecipientMode}
                          onDragStart={(e) => {
                            if (isRecipientMode) {
                              e.preventDefault();
                              return;
                            }
                            setDraggedToolId(item.id);
                          }}
                          onDragEnd={() => {
                            setDraggedToolId(null);
                          }}
                          onClick={() => {
                            console.log('Tool clicked:', item.id, item.tool.label);
                            setSelectedToolId(item.id);
                          }}
                          style={{
                            position: 'absolute',
                            left: `${item.x}px`,
                            top: `${item.y}px`,
                            width: (isImage || isRecipientSignature) && item.width ? `${item.width}px` : 'auto',
                            height: (isImage || isRecipientSignature) && item.height ? `${item.height}px` : 'auto',
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
                                width: '100%',
                                height: '100%'
                              }}
                            />
                          ) : isRecipientSignature ? (
                            <div className="recipient-signature-placeholder">
                              {item.tool.label}
                            </div>
                          ) : (
                            <div 
                              className="dropped-tool-label"
                              style={{
                                fontFamily: item.fontFamily || 'Arial',
                                fontSize: `${item.fontSize || 14}px`,
                                color: item.fontColor || '#3b82f6',
                                fontWeight: item.fontStyles?.bold ? 'bold' : 'normal',
                                fontStyle: item.fontStyles?.italic ? 'italic' : 'normal',
                                textDecoration: item.fontStyles?.underline ? 'underline' : 'none',
                              }}
                            >
                              {item.tool.value || item.tool.label}
                            </div>
                          )}
                          
                          {/* Resize handles - only for signature/initial images when selected */}
                          {isImage && selectedToolId === item.id && (
                            <>
                              <div
                                className="resize-handle resize-handle-nw"
                                onMouseDown={(e) => handleResizeStart(e, item.id, 'nw')}
                                title="Resize from top-left"
                              />
                              <div
                                className="resize-handle resize-handle-ne"
                                onMouseDown={(e) => handleResizeStart(e, item.id, 'ne')}
                                title="Resize from top-right"
                              />
                              <div
                                className="resize-handle resize-handle-sw"
                                onMouseDown={(e) => handleResizeStart(e, item.id, 'sw')}
                                title="Resize from bottom-left"
                              />
                              <div
                                className="resize-handle resize-handle-se"
                                onMouseDown={(e) => handleResizeStart(e, item.id, 'se')}
                                title="Resize from bottom-right"
                              />
                            </>
                          )}
                        </div>
                      );
                    });
                  })()}
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
