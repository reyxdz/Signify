import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DocumentViewer from './components/DocumentViewer/DocumentViewer';
import LeftPanel from './components/LeftPanel/LeftPanel';
import RightPanel from './components/RightPanel/RightPanel';
import './DocumentSigningPage.css';

function DocumentSigningPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentId, setDocumentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // If navigated from dashboard with document data, use it
  useEffect(() => {
    if (location.state?.document) {
      const doc = location.state.document;
      setDocumentId(location.state.documentId || doc._id || doc.id);
      setDocumentName(doc.name || doc.fileName || '');
      // Store in localStorage so it persists across page reloads
      localStorage.setItem('currentDocument', JSON.stringify({
        id: location.state.documentId || doc._id || doc.id,
        name: doc.name || doc.fileName || '',
        document: doc
      }));
      setDocument(null);
      setIsLoading(false);
    } else {
      // Check if document is in localStorage (page reload case)
      const savedDoc = localStorage.getItem('currentDocument');
      if (savedDoc) {
        const parsed = JSON.parse(savedDoc);
        setDocumentId(parsed.id);
        setDocumentName(parsed.name);
        setDocument(null);
        setIsLoading(false);
      } else {
        // No document provided - redirect to dashboard
        setIsLoading(false);
      }
    }
  }, [location.state]);

  const handleDocumentUpload = (file) => {
    setDocument(file);
    setDocumentName(file.name);
    setDocumentId(null); // Reset documentId when uploading new file
    localStorage.removeItem('currentDocument'); // Clear saved document
  };

  const handleBackToDashboard = () => {
    localStorage.removeItem('currentDocument');
    navigate('/');
  };

  // If no document and not loading, show error and redirect
  if (!isLoading && !documentId && !document) {
    return (
      <div className="document-signing-page">
        <div className="signing-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#1f2937', marginBottom: '16px' }}>No Document Selected</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>Please select a document from the dashboard to edit.</p>
            <button
              onClick={handleBackToDashboard}
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="document-signing-page">
      <div className="signing-container">
        <LeftPanel />
        <DocumentViewer
          document={document}
          documentName={documentName}
          documentId={documentId}
          onDocumentUpload={handleDocumentUpload}
        />
        <RightPanel />
      </div>
    </div>
  );
}

export default DocumentSigningPage;
