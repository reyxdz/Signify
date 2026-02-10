import React, { useState } from 'react';
import DocumentViewer from './components/DocumentViewer/DocumentViewer';
import LeftPanel from './components/LeftPanel/LeftPanel';
import RightPanel from './components/RightPanel/RightPanel';
import './DocumentSigningPage.css';

function DocumentSigningPage() {
  const [document, setDocument] = useState(null);
  const [documentName, setDocumentName] = useState('');

  const handleDocumentUpload = (file) => {
    setDocument(file);
    setDocumentName(file.name);
  };

  return (
    <div className="document-signing-page">
      <div className="signing-container">
        <LeftPanel />
        <DocumentViewer
          document={document}
          documentName={documentName}
          onDocumentUpload={handleDocumentUpload}
        />
        <RightPanel />
      </div>
    </div>
  );
}

export default DocumentSigningPage;
