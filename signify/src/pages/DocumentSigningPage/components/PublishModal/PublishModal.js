import React, { useState } from 'react';
import { X, Copy, Check, Loader, AlertCircle } from 'lucide-react';
import './PublishModal.css';

function PublishModal({ document, recipients, onPublish, onClose, onUnpublish, isPublished }) {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [expiresIn, setExpiresIn] = useState(30);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);

  const generateShareLink = () => {
    // This would be the actual shareable link
    if (isPublished && document.publishLink) {
      return `${window.location.origin}/sign/${document.publishLink}`;
    }
    return null;
  };

  const handleCopyLink = async () => {
    const link = generateShareLink();
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        setError('Failed to copy link');
      }
    }
  };

  const handlePublish = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onPublish(recipients, expiresIn);
    } catch (err) {
      setError(err.message || 'Failed to publish document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onUnpublish();
      setShowUnpublishConfirm(false);
    } catch (err) {
      setError(err.message || 'Failed to unpublish document');
    } finally {
      setIsLoading(false);
    }
  };

  const shareLink = generateShareLink();

  return (
    <div className="publish-modal-overlay">
      <div className="publish-modal">
        {/* Header */}
        <div className="publish-modal-header">
          <h2>{isPublished ? 'Document Published' : 'Publish Document'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="publish-modal-body">
          {error && (
            <div className="error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Document Summary */}
          <div className="modal-section">
            <h3 className="section-title">Document</h3>
            <div className="document-info">
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{document.name}</span>
              </div>
              {isPublished && document.expiresAt && (
                <div className="info-row">
                  <span className="info-label">Expires:</span>
                  <span className="info-value">
                    {new Date(document.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recipients */}
          <div className="modal-section">
            <h3 className="section-title">Recipients ({recipients.length})</h3>
            <div className="recipients-list">
              {recipients.map((recipient, index) => (
                <div key={index} className="recipient-row">
                  <div className="recipient-avatar">
                    {recipient.recipientName
                      ? recipient.recipientName.charAt(0).toUpperCase()
                      : recipient.recipientEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="recipient-details">
                    <div className="recipient-email">{recipient.recipientEmail}</div>
                    {recipient.recipientName && (
                      <div className="recipient-name">{recipient.recipientName}</div>
                    )}
                  </div>
                  {isPublished && (
                    <span className="recipient-status">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Share Link */}
          {isPublished && shareLink && (
            <div className="modal-section">
              <h3 className="section-title">Share Link</h3>
              <div className="share-link-container">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="share-link-input"
                />
                <button
                  className="copy-link-btn"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className="share-link-hint">
                Share this link with recipients via email, messaging, or any platform
              </p>
            </div>
          )}

          {/* Expiration Settings (for new publish) */}
          {!isPublished && (
            <div className="modal-section">
              <h3 className="section-title">Expiration</h3>
              <div className="expiration-control">
                <label htmlFor="expiresIn">This document will expire in:</label>
                <div className="expiration-input-group">
                  <input
                    id="expiresIn"
                    type="number"
                    min="1"
                    max="365"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(parseInt(e.target.value) || 30)}
                    className="expiration-input"
                  />
                  <span className="expiration-unit">days</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="publish-modal-footer">
          {isPublished ? (
            <>
              <button
                className="unpublish-btn"
                onClick={() => setShowUnpublishConfirm(true)}
                disabled={isLoading}
              >
                Unpublish
              </button>
              <button className="close-btn" onClick={onClose}>
                Done
              </button>
            </>
          ) : (
            <>
              <button className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button
                className="publish-btn"
                onClick={handlePublish}
                disabled={isLoading}
              >
                {isLoading && <Loader size={16} className="spinner" />}
                {isLoading ? 'Publishing...' : 'Publish'}
              </button>
            </>
          )}
        </div>

        {/* Unpublish Confirmation */}
        {showUnpublishConfirm && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog">
              <h3>Unpublish Document?</h3>
              <p>
                This will mark the document as expired for all recipients. They won't be able to
                access or sign it anymore. This action cannot be undone.
              </p>
              <div className="confirmation-actions">
                <button
                  className="confirm-cancel-btn"
                  onClick={() => setShowUnpublishConfirm(false)}
                >
                  Keep Published
                </button>
                <button
                  className="confirm-unpublish-btn"
                  onClick={handleUnpublish}
                  disabled={isLoading}
                >
                  {isLoading ? 'Unpublishing...' : 'Unpublish'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PublishModal;
