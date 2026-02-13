import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, MoreVertical, FileText, Upload, Search } from 'lucide-react';
import '../Sections.css';

const Documents = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/documents/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setDocuments(result.data || []);
      } else {
        setError('Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Error loading documents');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
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

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Helper function to get CSS class for document status
  // Kept for future use when document status badges are implemented
  // const getStatusClass = (status) => {
  //   switch(status) {
  //     case 'signed': return 'signed';
  //     case 'pending': return 'pending';
  //     case 'draft': return 'draft';
  //     default: return 'draft';
  //   }
  // };

  const filterDocuments = (docs) => {
    if (!searchQuery.trim()) return docs;
    return docs.filter(doc =>
      (doc.name || doc.fileName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredDocs = filterDocuments(documents);

  const DocumentRow = ({ doc }) => (
    <div key={doc._id} className="table-row">
      <div className="col-name">
        <FileText size={18} className="file-icon" />
        {doc.name || doc.fileName}
      </div>
      <div className="col-size">{formatSize(doc.size)}</div>
      <div className="col-date">{formatDate(doc.modifiedAt || doc.createdAt)}</div>
      <div className="col-status">
        <span className={`status-badge ${doc.status}`}>
          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
        </span>
      </div>
      <div className="col-actions">
        <button 
          className="action-btn" 
          title="View signed document"
          onClick={() => navigate(`/view-document/${doc._id}`)}
        >
          <Eye size={16} />
        </button>
        <button className="action-btn" title="More options">
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="section-documents">
      <div className="section-header">
        <h1>Documents</h1>
        <p>Manage all your documents in one place</p>
      </div>

      <div className="section-toolbar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search documents..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-primary">
          <Upload size={18} /> Upload Document
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <p>Loading documents...</p>
        </div>
      ) : (
        <div className="documents-section">
          <div className="section-title">
            <h2>Your Documents</h2>
            <span className="doc-count">{filteredDocs.length}</span>
          </div>
          
          {filteredDocs.length === 0 ? (
            <div className="empty-section">
              <FileText size={32} />
              <p>No documents yet</p>
              <small>Upload your first document to get started</small>
            </div>
          ) : (
            <div className="documents-table">
              <div className="table-header">
                <div className="col-name">Name</div>
                <div className="col-size">Size</div>
                <div className="col-date">Modified</div>
                <div className="col-status">Status</div>
                <div className="col-actions">Actions</div>
              </div>
              {filteredDocs.map(doc => (
                <DocumentRow key={doc._id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Documents;
