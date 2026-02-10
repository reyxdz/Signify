import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DocumentViewer from './components/DocumentViewer/DocumentViewer';
import LeftPanel from './components/LeftPanel/LeftPanel';
import RightPanel from './components/RightPanel/RightPanel';
import './DocumentSigningPage.css';

function DocumentSigningPage() {
  const location = useLocation();
  const [document, setDocument] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentId, setDocumentId] = useState(null);

  // If navigated from dashboard with document data, use it
  useEffect(() => {
    if (location.state?.document) {
      const doc = location.state.document;
      setDocumentId(location.state.documentId || doc._id || doc.id);
      setDocumentName(doc.name || doc.fileName || '');
      // Note: set document to null initially, actual PDF will be loaded in DocumentViewer
      setDocument(null);
    }
  }, [location.state]);

  const handleDocumentUpload = (file) => {
    setDocument(file);
    setDocumentName(file.name);
    setDocumentId(null); // Reset documentId when uploading new file
  };

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
