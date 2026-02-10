import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DocumentSigningPage from './DocumentSigningPage/DocumentSigningPage';

const DocumentEditorPage = ({ user }) => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!documentId) {
      // No document specified — redirect back to dashboard
      navigate('/', { replace: true });
    }
  }, [documentId, navigate]);

  if (!documentId) return null;

  return (
    <div style={{ paddingTop: 24, paddingBottom: 24 }} className="container">
      <DocumentSigningPage user={user} documentId={documentId} />
    </div>
  );
};

export default DocumentEditorPage;
