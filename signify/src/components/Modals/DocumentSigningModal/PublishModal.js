import React, { useState } from 'react';
import { Copy, Check, AlertCircle, Loader } from 'lucide-react';
import './PublishModal.css';

const PublishModal = ({
  isOpen,
  onClose,
  documentName,
  recipients = [],
  isPublished,
  onPublish,
  onUnpublish,
  documentId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [expiresIn, setExpiresIn] = useState(30);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);

  if (!isOpen) return null;

  const handlePublish = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onPublish(recipients, expiresIn);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message || 'Failed to publish document');
      setIsLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onUnpublish();
    } catch (err) {
      setError(err.message || 'Failed to unpublish document');
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    const publishLink = `${window.location.origin}/sign/${documentId}`;
    navigator.clipboard.writeText(publishLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + parseInt(expiresIn));

  return (
    <>
      {/* Overlay */}
      <div className="publish-modal-overlay" onClick={onClose}></div>

      {/* Modal */}
      <div className="publish-modal">
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {isPublished ? (
          <>
            <h2 className="modal-title">Document Published</h2>
            
            <div className="modal-content">
              <p className="modal-subtitle">Your document is now available for signing</p>

              {/* Document Info */}
              <div className="document-info">
                <p><strong>Document:</strong> {documentName}</p>
              </div>

              {/* Recipients */}
              <div className="recipients-section">
                <h3 className="section-title">Recipients</h3>
                <div className="recipients-list">
                  {recipients.length > 0 ? (
                    recipients.map((recipient, index) => (
                      <div key={index} className="recipient-row">
                        <div className="recipient-avatar">
                          {recipient.recipientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="recipient-info">
                          <p className="recipient-name">{recipient.recipientName}</p>
                          <p className="recipient-email">{recipient.recipientEmail}</p>
                        </div>
                        <span className="recipient-badge pending">Pending</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-recipients">No recipients assigned</p>
                  )}
                </div>
              </div>

              {/* Share Link */}
              <div className="share-link-container">
                <h3 className="section-title">Shareable Link</h3>
                <p className="link-description">
                  Send this link to recipients who aren't in your contact list
                </p>
                <div className="link-input-group">
                  <input
                    type="text"
                    value={`${window.location.origin}/sign/${documentId}`}
                    readOnly
                    className="link-input"
                  />
                  <button className="copy-btn" onClick={handleCopyLink}>
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Expiration Info */}
              <div className="expiration-info">
                <p>
                  <strong>Link expires:</strong> {expirationDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Close
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => setShowUnpublishConfirm(true)}
                  disabled={isLoading}
                >
                  Unpublish
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="modal-title">Publish Document</h2>

            <div className="modal-content">
              <p className="modal-subtitle">Make your document available for signing</p>

              {/* Document Info */}
              <div className="document-info">
                <p><strong>Document:</strong> {documentName}</p>
              </div>

              {/* Recipients */}
              <div className="recipients-section">
                <h3 className="section-title">Recipients</h3>
                <div className="recipients-list">
                  {recipients.length > 0 ? (
                    recipients.map((recipient, index) => (
                      <div key={index} className="recipient-row">
                        <div className="recipient-avatar">
                          {recipient.recipientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="recipient-info">
                          <p className="recipient-name">{recipient.recipientName}</p>
                          <p className="recipient-email">{recipient.recipientEmail}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-recipients">No recipients assigned</p>
                  )}
                </div>
              </div>

              {/* Expiration Setting */}
              <div className="expiration-setting">
                <label htmlFor="expiresIn">Link Expiration (days)</label>
                <input
                  id="expiresIn"
                  type="number"
                  min="1"
                  max="365"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="expiration-input"
                  disabled={isLoading}
                />
                <small className="expiration-note">
                  Expires on {expirationDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </small>
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handlePublish}
                  disabled={isLoading || recipients.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader size={16} className="spinner" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Document'
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Unpublish Confirmation Dialog */}
      {showUnpublishConfirm && (
        <>
          <div className="confirmation-overlay" onClick={() => setShowUnpublishConfirm(false)}></div>
          <div className="confirmation-dialog">
            <h3>Unpublish Document?</h3>
            <p>
              This will expire the document for all recipients and make the shareable link invalid. 
              Existing signatures will be preserved, but recipients won't be able to access the document anymore.
            </p>
            <div className="confirmation-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowUnpublishConfirm(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleUnpublish}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader size={16} className="spinner" />
                    Unpublishing...
                  </>
                ) : (
                  'Unpublish'
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default PublishModal;
