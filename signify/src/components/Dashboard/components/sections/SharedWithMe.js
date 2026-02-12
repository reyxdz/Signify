import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, MoreVertical, FileText, Search } from 'lucide-react';
import '../Sections.css';

const SharedWithMe = () => {
  const navigate = useNavigate();
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSharedDocuments();
  }, []);

  const fetchSharedDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/documents/shared-with-me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setSharedDocuments(result.data || []);
      } else {
        setError('Failed to fetch shared documents');
      }
    } catch (err) {
      console.error('Error fetching shared documents:', err);
      setError('Error loading shared documents');
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

  const getActionBadgeClass = (status) => {
    switch(status) {
      case 'signed': return 'signed';
      case 'pending': return 'pending-signature';
      case 'declined': return 'declined';
      default: return 'pending-signature';
    }
  };

  const getActionText = (status) => {
    switch(status) {
      case 'signed': return 'Signed';
      case 'pending': return 'Pending Signature';
      case 'declined': return 'Declined';
      default: return 'Pending Signature';
    }
  };

  const filterDocuments = (docs) => {
    if (!searchQuery.trim()) return docs;
    return docs.filter(doc =>
      (doc.name || doc.fileName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredDocs = filterDocuments(sharedDocuments);

  const handleOpenDocument = (doc) => {
    console.log('Opening document:', doc);
    // Navigate to document signing page with document info
    navigate('/sign', {
      state: {
        documentId: doc._id,
        document: doc,
        isRecipient: true,
      }
    });
  };

  return (
    <div className="section-shared">
      <div className="section-header">
        <h1>Shared with Me</h1>
        <p>Documents shared by others for your attention</p>
      </div>

      <div className="section-toolbar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search shared documents..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <p>Loading shared documents...</p>
        </div>
      ) : (
        <div className="documents-section">
          <div className="section-title">
            <h2>Documents for Signature</h2>
            <span className="doc-count">{filteredDocs.length}</span>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="empty-section">
              <FileText size={32} />
              <p>No documents shared with you yet</p>
              <small>Documents shared by others will appear here</small>
            </div>
          ) : (
            <div className="documents-table">
              <div className="table-header">
                <div className="col-name">Document</div>
                <div className="col-from">From</div>
                <div className="col-date">Shared</div>
                <div className="col-action">Status</div>
                <div className="col-actions">Actions</div>
              </div>
              
              {filteredDocs.map(doc => (
                <div key={doc._id} className="table-row">
                  <div className="col-name">
                    <FileText size={18} className="file-icon" />
                    {doc.name || doc.fileName}
                  </div>
                  <div className="col-from">{doc.ownerName}</div>
                  <div className="col-date">{formatDate(doc.publishedAt || doc.createdAt)}</div>
                  <div className="col-action">
                    <span className={`action-badge ${getActionBadgeClass(doc.recipientStatus)}`}>
                      {getActionText(doc.recipientStatus)}
                    </span>
                  </div>
                  <div className="col-actions">
                    <button className="action-btn" title="View document" onClick={() => handleOpenDocument(doc)}>
                      <Eye size={16} />
                    </button>
                    <button className="action-btn" title="More options">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SharedWithMe;
