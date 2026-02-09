import React from 'react';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import './DocumentList.css';

const DocumentList = ({ documents, isLoading }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'signed':
        return <CheckCircle size={16} className="status-icon signed" />;
      case 'pending':
        return <AlertCircle size={16} className="status-icon pending" />;
      default:
        return <FileText size={16} className="status-icon" />;
    }
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`document-status ${status}`}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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

  if (isLoading) {
    return (
      <div className="document-list loading">
        <div className="loading-skeleton"></div>
        <div className="loading-skeleton"></div>
        <div className="loading-skeleton"></div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="document-list empty">
        <FileText size={32} />
        <p>No documents yet</p>
        <small>Upload your first document to get started</small>
      </div>
    );
  }

  return (
    <div className="document-list">
      {documents.map((doc) => (
        <div key={doc._id || doc.id} className="document-item">
          <div className="document-icon">
            <FileText size={20} />
          </div>
          <div className="document-info">
            <div className="document-name">{doc.name || doc.fileName}</div>
            <div className="document-meta">
              <Clock size={13} />
              Modified {formatDate(doc.modifiedAt || doc.updatedAt || doc.createdAt)}
            </div>
          </div>
          <div className="document-status-container">
            {getStatusBadge(doc.status || 'pending')}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentList;
