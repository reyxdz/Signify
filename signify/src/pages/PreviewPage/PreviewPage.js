import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document, Page } from 'react-pdf';
import { ChevronUp, ChevronDown, ArrowLeft, PenTool, FileText, Mail, User } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './PreviewPage.css';

// Icon mapping for reconstructing tools from route state
const ICON_MAP = {
  'My Signature': PenTool,
  'My Initial': FileText,
  'My Email': Mail,
  'My Full Name': User,
};

function PreviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentId, setDocumentId] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [droppedTools, setDroppedTools] = useState([]);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Get document and tools from location state
  useEffect(() => {
    if (location.state) {
      const { document, documentName, documentId, fileData, droppedTools } = location.state;
      setDocument(document);
      setDocumentName(documentName);
      setDocumentId(documentId);
      setFileData(fileData);
      
      // Reconstruct tools with icons
      if (droppedTools && droppedTools.length > 0) {
        const reconstructedTools = droppedTools.map(item => ({
          ...item,
          tool: {
            ...item.tool,
            // Add icon back based on label
            icon: ICON_MAP[item.tool.label],
          }
        }));
        setDroppedTools(reconstructedTools);
      }
    } else {
      navigate('/');
    }
  }, [location.state, navigate]);

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
      const loadPDF = async () => {
        try {
          // If we have fileData, use it directly
          if (fileData) {
            console.log('PreviewPage: Processing fileData:', typeof fileData);
            if (typeof fileData === 'string') {
              console.log('PreviewPage: Converting base64 to ArrayBuffer');
              const binaryString = atob(fileData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const buffer = bytes.buffer;
              console.log('PreviewPage: ArrayBuffer created, size:', buffer.byteLength);
              setPdfUrl(buffer);
              setCurrentPage(1);
            } else if (fileData instanceof ArrayBuffer) {
              setPdfUrl(fileData);
              setCurrentPage(1);
            }
          } else {
            // Fetch from backend if no fileData provided
            console.log('PreviewPage: Fetching PDF from backend for documentId:', documentId);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/documents/${documentId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              throw new Error(`Failed to fetch document: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('PreviewPage: Document fetched from backend:', data);

            // Handle nested data structure
            const documentData = data.data || data;
            const fetchedFileData = documentData.fileData || data.fileData;
            
            if (fetchedFileData) {
              console.log('PreviewPage: Processing base64 fileData from API');
              if (typeof fetchedFileData === 'string') {
                console.log('PreviewPage: Converting base64 to ArrayBuffer');
                const binaryString = atob(fetchedFileData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const buffer = bytes.buffer;
                console.log('PreviewPage: ArrayBuffer created from base64, size:', buffer.byteLength);
                setPdfUrl(buffer);
                setCurrentPage(1);
              }
            } else {
              console.error('PreviewPage: No fileData in response');
            }
          }
        } catch (error) {
          console.error('PreviewPage: Error loading PDF:', error);
        }
      };
      loadPDF();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, document, fileData]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (numPages && currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleBackToEdit = () => {
    navigate(-1);
  };

  if (!pdfUrl) {
    return (
      <div className="preview-page">
        <div className="preview-header">
          <button className="back-btn" onClick={handleBackToEdit}>
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="preview-title">Document Preview</h1>
          <div style={{ width: '100px' }}></div>
        </div>
        <div className="preview-container">
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-page">
      <div className="preview-header">
        <button className="back-btn" onClick={handleBackToEdit}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="preview-title">{documentName} - Preview</h1>
        <div style={{ width: '100px' }}></div>
      </div>
      <div className="preview-container">
        <div className="pdf-viewer-wrapper">
          <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div>Loading PDF...</div>}>
            <Page pageNumber={currentPage} scale={1.5} />
          </Document>
          {/* Display dropped tools as read-only fields - only after PDF loads */}
          {numPages && droppedTools.filter((item) => item.page === currentPage).map((item) => {
            // Check if this is a signature/initial image (base64 data starts with 'data:image')
            const isImage = typeof item.tool.value === 'string' && item.tool.value.startsWith('data:image');
            
            return (
              <div
                key={item.id}
                className="preview-tool-field"
                style={{
                  position: 'absolute',
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                }}
                title={`${item.tool.label} - Required from: [Other parties]`}
              >
                {isImage ? (
                  <img 
                    src={item.tool.value} 
                    alt={item.tool.label}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <div className="preview-tool-content">
                    <span 
                      className="preview-tool-value"
                      style={{
                        fontFamily: item.fontFamily || 'Arial',
                        fontSize: `${item.fontSize || 14}px`,
                        color: item.fontColor || '#3b82f6',
                        fontWeight: item.fontStyles?.bold ? 'bold' : 'normal',
                        fontStyle: item.fontStyles?.italic ? 'italic' : 'normal',
                        textDecoration: item.fontStyles?.underline ? 'underline' : 'none',
                      }}
                    >
                      {item.tool.value}
                    </span>
                  </div>
                )}
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
            <span className="page-indicator">
              Page {currentPage} of {numPages}
            </span>
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
      </div>
    </div>
  );
}

export default PreviewPage;
