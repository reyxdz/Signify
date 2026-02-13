import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, Loader } from 'lucide-react';
import DocumentViewer from '../DocumentSigningPage/components/DocumentViewer/DocumentViewer';
import './ViewSignedDocumentPage.css';

const ViewSignedDocumentPage = ({ user }) => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch document details
        const docResponse = await fetch(`http://localhost:5000/api/documents/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!docResponse.ok) {
          throw new Error('Failed to load document');
        }

        const docData = await docResponse.json();
        setDocument(docData.data || docData);

        // Fetch tools with signatures
        const toolsResponse = await fetch(`http://localhost:5000/api/documents/${documentId}/tools`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (toolsResponse.ok) {
          const toolsData = await toolsResponse.json();
          const toolsArray = Array.isArray(toolsData) ? toolsData : toolsData.data || [];
          console.log('Loaded tools for viewing:', toolsArray);
          console.log('Tools count:', toolsArray.length);
          toolsArray.forEach((tool, idx) => {
            console.log(`Tool ${idx}:`, {
              id: tool.id || tool._id,
              label: tool.label,
              hasValue: !!tool.value,
              valueLength: tool.value ? tool.value.length : 0
            });
          });
          setTools(toolsArray);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading document:', err);
        setError(err.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  const handleExportDocument = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/documents/${documentId}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export document');
      }

      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${document?.name || 'document'}-signed.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting document:', err);
      alert('Failed to export document: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="view-signed-document-page">
        <div className="view-page-header">
          <button className="back-btn" onClick={() => navigate('/documents')}>
            <ArrowLeft size={20} /> Back to Documents
          </button>
        </div>
        <div className="loading-container">
          <Loader size={48} className="loading-spinner" />
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-signed-document-page">
        <div className="view-page-header">
          <button className="back-btn" onClick={() => navigate('/documents')}>
            <ArrowLeft size={20} /> Back to Documents
          </button>
        </div>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="btn-primary" onClick={() => navigate('/documents')}>
            Return to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-signed-document-page">
      <div className="view-page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/documents')}>
            <ArrowLeft size={20} /> Back
          </button>
          <div className="document-info">
            <h1>{document?.name || document?.fileName}</h1>
            <p>Signed document - Ready to view and export</p>
          </div>
        </div>
        <div className="header-right">
          <button 
            className="btn-primary export-btn"
            onClick={handleExportDocument}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <Loader size={18} className="spinner" /> Exporting...
              </>
            ) : (
              <>
                <Download size={18} /> Export PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div className="document-viewer-container">
        {document && (
          <DocumentViewer 
            documentId={documentId}
            fileData={document.fileData}
            droppedTools={tools}
            setDroppedTools={() => {}}
            onDocumentUpload={() => {}}
            isRecipientMode={true}
          />
        )}
      </div>
    </div>
  );
};

export default ViewSignedDocumentPage;
