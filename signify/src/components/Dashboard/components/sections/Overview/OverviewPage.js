import React, { useEffect, useState, useRef } from 'react';
import { FileText, PenTool, Users, CheckCircle, Upload, Layout, Share2, Edit2, Trash2 } from 'lucide-react';
import DocumentEditorModal from '../../../Modals/DocumentEditorModal/DocumentEditorModal';
import useDocumentEditor from './hooks/useDocumentEditor';
import './OverviewPage.css';

const OverviewPage = ({ user }) => {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalSignatures: 0,
    sharedDocuments: 0,
    completionRate: 0,
  });

  const [recentDocuments, setRecentDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchDataRef = useRef(null);

  // Document editor state management
  const {
    showEditorModal,
    selectedDocument,
    openEditor,
    closeEditor,
    saveDocument,
  } = useDocumentEditor(fetchAllData);

  // Function to fetch all overview data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch data in parallel
      const [statsRes, docsRes] = await Promise.all([
        fetch('http://localhost:5000/api/overview/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/documents/recent?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data || statsData);
      }

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setRecentDocuments(docsData.data || docsData || []);
      }
    } catch (err) {
      console.error('Error fetching overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Store fetchAllData in ref so it can be called from handleUploadDocument
  useEffect(() => {
    fetchDataRef.current = fetchAllData;
  }, []);

  // Fetch overview data on component mount
  useEffect(() => {
    if (user?.id) {
      fetchAllData();
    }
  }, [user?.id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleEditDocument = (doc) => {
    openEditor(doc);
  };

  const handleCloseEditor = () => {
    closeEditor();
  };

  const handleSaveDocument = async (updatedDoc) => {
    // Update the document in the recent documents list
    setRecentDocuments((prev) =>
      prev.map((doc) =>
        doc._id === updatedDoc._id ? updatedDoc : doc
      )
    );
    
    await saveDocument(updatedDoc);
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in first');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('Document deleted successfully!');
        // Refetch the overview data
        if (fetchDataRef.current) {
          fetchDataRef.current();
        }
      } else {
        const result = await response.json();
        alert(`Delete failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting document');
    }
  };

  const handleUploadDocument = async (e) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please log in first');
          return;
        }

        const payload = {
          name: file.name,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          size: file.size,
        };

        const response = await fetch('http://localhost:5000/api/documents/upload', {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
          alert('Document uploaded successfully!');
          // Refetch the overview data instead of reloading the page
          if (fetchDataRef.current) {
            fetchDataRef.current();
          }
        } else {
          alert(`Upload failed: ${result.message}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading document');
      }
    };
    input.click();
  };

  return (
    <div className="section-overview">
      <div className="section-header">
        <h1>Welcome back, {user?.firstName}!</h1>
        <p>Here's what's happening with your documents today</p>
      </div>

      <div className="overview-grid">
        <div className="stat-card">
          <div className="stat-icon"><FileText size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalDocuments}</div>
            <div className="stat-label">Documents</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><PenTool size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalSignatures}</div>
            <div className="stat-label">Signatures</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Users size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.sharedDocuments}</div>
            <div className="stat-label">Shared</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><CheckCircle size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.completionRate}%</div>
            <div className="stat-label">Completion</div>
          </div>
        </div>
      </div>

      <div className="overview-sections">
        <div className="overview-section">
          <h2>Recent Documents</h2>
          <div className="document-list">
            {loading ? (
              <div className="document-item">
                <div className="document-info">
                  <div className="document-name">Loading...</div>
                </div>
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="document-item">
                <div className="document-info">
                  <div className="document-name">No documents yet</div>
                </div>
              </div>
            ) : (
              recentDocuments.map((doc) => (
                <div key={doc._id || doc.id} className="document-item">
                  <div className="document-info">
                    <div className="document-name">{doc.name || doc.fileName}</div>
                    <div className="document-meta">Modified {formatDate(doc.modifiedAt || doc.updatedAt || doc.createdAt)}</div>
                  </div>
                  <div className={`document-status ${doc.status || 'pending'}`}>
                    {(doc.status || 'pending').charAt(0).toUpperCase() + (doc.status || 'pending').slice(1)}
                  </div>
                  <div className="document-actions">
                    <button 
                      className="doc-action-btn edit-btn" 
                      onClick={() => handleEditDocument(doc)}
                      title="Edit document"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="doc-action-btn delete-btn" 
                      onClick={() => handleDeleteDocument(doc._id || doc.id)}
                      title="Delete document"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overview-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-button primary" onClick={handleUploadDocument}>
              <Upload size={18} /> Upload Document
            </button>
            <button className="action-button secondary">
              <Layout size={18} /> Use Template
            </button>
            <button className="action-button secondary">
              <Share2 size={18} /> Share Document
            </button>
          </div>
        </div>
      </div>

      {showEditorModal && selectedDocument && (
        <DocumentEditorModal
          document={selectedDocument}
          onClose={handleCloseEditor}
          onSave={handleSaveDocument}
        />
      )}
    </div>
  );
};

export default OverviewPage;
