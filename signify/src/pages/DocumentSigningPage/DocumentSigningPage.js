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
  const [fileData, setFileData] = useState(null);

  // If navigated from dashboard with document data, use it
  useEffect(() => {
    if (location.state?.document) {
      const doc = location.state.document;
      const id = location.state.documentId || doc._id || doc.id;
      console.log('Document received from dashboard:', { name: doc.name, hasFileData: !!doc.fileData });
      setDocumentId(id);
      setDocumentName(doc.name || doc.fileName || '');
      setFileData(doc.fileData || null);
      // Store the complete document object including file data
      localStorage.setItem('currentDocument', JSON.stringify({
        id: id,
        name: doc.name || doc.fileName || '',
        fileData: doc.fileData,
        document: doc
      }));
      setDocument(null);
    } else {
      // Check if document is in localStorage (page reload case)
      const savedDoc = localStorage.getItem('currentDocument');
      if (savedDoc) {
        try {
          const parsed = JSON.parse(savedDoc);
          setDocumentId(parsed.id);
          setDocumentName(parsed.name);
          setFileData(parsed.fileData || null);
          setDocument(null);
        } catch (e) {
          console.error('Error parsing saved document:', e);
          localStorage.removeItem('currentDocument');
          navigate('/');
        }
      } else {
        // No document provided - redirect to dashboard
        navigate('/');
      }
    }
  }, [location.state, navigate]);

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

  // If no document is set up, show a loading state
  if (!documentId && !document) {
    return (
      <div className="document-signing-page">
        <div className="signing-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#6b7280' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="document-signing-page">
      <div className="signing-header">
        <div className="header-left">
          <img src={require('../../assets/images/signify_logo.png')} alt="Signify" className="header-logo" />
          <span className="header-brand">Signify</span>
        </div>
        <div className="header-center">
          {/* Center space reserved for future actions */}
        </div>
        <div className="header-right">
          <h2 className="header-filename">{documentName}</h2>
        </div>
      </div>
      <div className="signing-container">
        <LeftPanel />
        <DocumentViewer
          document={document}
          documentName={documentName}
          documentId={documentId}
          fileData={fileData}
          onDocumentUpload={handleDocumentUpload}
        />
        <RightPanel />
      </div>
    </div>
  );
}

export default DocumentSigningPage;
