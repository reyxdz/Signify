import React from 'react';
import { useParams } from 'react-router-dom';
import DocumentSigningPage from './DocumentSigningPage/DocumentSigningPage';

const DocumentEditorPage = ({ user }) => {
  const { documentId } = useParams();

  // For now reuse the DocumentSigningPage viewer; documentId is passed for future loading
  return (
    <div style={{ paddingTop: 24, paddingBottom: 24 }} className="container">
      <DocumentSigningPage user={user} documentId={documentId} />
    </div>
  );
};

export default DocumentEditorPage;
