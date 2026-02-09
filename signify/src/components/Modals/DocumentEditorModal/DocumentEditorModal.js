import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import './DocumentEditorModal.css';

const DocumentEditorModal = ({ document, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    status: 'draft',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name || '',
        status: document.status || 'draft',
        description: document.description || '',
      });
    }
  }, [document]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Document name is required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/documents/${document._id}/update`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            status: formData.status,
            description: formData.description,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update document');
        setLoading(false);
        return;
      }

      const result = await response.json();
      onSave(result.data);
    } catch (err) {
      console.error('Error saving document:', err);
      setError('An error occurred while saving. Please try again.');
      setLoading(false);
    }
  };

  const statusOptions = ['draft', 'pending', 'signed', 'rejected'];

  return (
    <div className="editor-modal-overlay">
      <div className="editor-modal">
        <div className="editor-modal-header">
          <h2>Edit Document</h2>
          <button
            className="close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="editor-modal-body">
          {error && (
            <div className="error-banner">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Document Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter document name"
              className="form-input"
              maxLength={100}
            />
            <small className="char-count">
              {formData.name.length}/100
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="form-select"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Notes (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add any notes about this document"
              className="form-textarea"
              rows={4}
              maxLength={500}
            />
            <small className="char-count">
              {formData.description.length}/500
            </small>
          </div>

          <div className="document-info">
            <div className="info-item">
              <span className="info-label">File Name:</span>
              <span className="info-value">{document?.fileName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">File Size:</span>
              <span className="info-value">
                {document?.size ? `${(document.size / 1024).toFixed(2)} KB` : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Uploaded:</span>
              <span className="info-value">
                {document?.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="editor-modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditorModal;
