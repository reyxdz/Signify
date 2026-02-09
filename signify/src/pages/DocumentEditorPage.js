import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DocumentEditor from '../components/DocumentEditor/DocumentEditor';

const DocumentEditorPage = ({ user }) => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/documents/${documentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setDocument(data.data);
        } else {
          alert('Document not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        alert('Error loading document');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, navigate]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666',
      }}>
        Loading document...
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <DocumentEditor
      document={document}
      onClose={() => navigate('/')}
      onSave={() => navigate('/')}
    />
  );
};

export default DocumentEditorPage;
