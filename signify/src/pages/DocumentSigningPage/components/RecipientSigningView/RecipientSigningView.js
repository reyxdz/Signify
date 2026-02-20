import React, { useState, useEffect } from 'react';
import { Send, Check } from 'lucide-react';
import DocumentViewer from '../DocumentViewer/DocumentViewer';
import SignatureCapture from './SignatureCapture';
import './RecipientSigningView.css';

function RecipientSigningView({
  documentName,
  documentId,
  fileData,
  droppedTools,
  onSign,
  onCancel,
  publishLink,
}) {
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [recipientSignatures, setRecipientSignatures] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(publishLink ? true : false);
  const [recipientEmailInput, setRecipientEmailInput] = useState('');

  // Get recipient fields (fields that start with "Recipient")
  const recipientFields = droppedTools.filter(tool => 
    tool?.tool?.label && tool.tool.label.startsWith('Recipient')
  );

  // Initialize recipientSignatures from tools that already have signature data
  useEffect(() => {
    const initialSignatures = {};
    console.log('RecipientSigningView: Initializing signatures from', recipientFields.length, 'recipient fields');
    
    recipientFields.forEach(tool => {
      // Check if the tool already has signature data (from database)
      if (tool.tool && tool.tool.value) {
        const value = tool.tool.value;
        console.log(`Tool ${tool.id} (${tool.tool.label}):`, {
          type: typeof value,
          length: value?.length,
          startsWithDataImage: typeof value === 'string' && value.startsWith('data:image'),
          preview: typeof value === 'string' ? value.substring(0, 100) : 'not a string'
        });
        
        // Validate signature data more carefully:
        // - Must be a non-empty string
        // - Must be a valid data URI (starts with data:image) OR valid base64
        // - Don't check length too strictly - canvas signatures can be reasonably short
        const isValidSignature = 
          typeof value === 'string' && 
          value.trim().length > 0 && 
          (
            // Valid data URI
            (value.startsWith('data:image') && value.length > 50) ||
            // Valid base64 (at least 50 chars, all valid base64 chars)
            (value.length > 50 && /^[A-Za-z0-9+/=]+$/.test(value))
          );
        
        if (isValidSignature) {
          console.log(`✓ Valid signature for tool ${tool.id} - length: ${value.length}`);
          initialSignatures[tool.id] = value;
        } else {
          console.log(`✗ Invalid signature for tool ${tool.id}:`, {
            length: value?.length,
            startsWithData: value?.startsWith('data:'),
            reason: value?.length <= 50 ? 'too short' : 'invalid format'
          });
        }
      } else {
        console.log(`Tool ${tool.id} (${tool.tool.label}): no value`);
      }
    });
    
    console.log('RecipientSigningView: Found', Object.keys(initialSignatures).length, 'valid signatures to initialize');
    
    // Only update state if there are signatures to set
    if (Object.keys(initialSignatures).length > 0) {
      console.log('Setting recipientSignatures:', Object.keys(initialSignatures));
      setRecipientSignatures(prev => ({
        ...initialSignatures,
        ...prev // Keep any new signatures they've added in this session
      }));
    }
  }, [recipientFields]);

  // Compute displayTools with signature data included
  const displayTools = recipientFields.map(tool => {
    if (recipientSignatures[tool.id]) {
      return {
        ...tool,
        tool: {
          ...tool.tool,
          value: recipientSignatures[tool.id]
        }
      };
    }
    return tool;
  });

  const handleSignField = (field) => {
    setCurrentField(field);
    setShowSignatureModal(true);
  };

  const handleCaptureSignature = (signatureData) => {
    setRecipientSignatures(prev => ({
      ...prev,
      [currentField.id]: signatureData
    }));
    setShowSignatureModal(false);
    setCurrentField(null);
  };

  const handleSubmitSignatures = async () => {
    if (Object.keys(recipientSignatures).length === 0) {
      alert('Please add at least one signature before submitting');
      return;
    }

    // For public access, require email
    if (publishLink && !recipientEmailInput) {
      alert('Please enter your email address before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // If we have a publishLink, use the public endpoint for recipient signature submission
      if (publishLink) {
        const response = await fetch(`http://localhost:5000/api/documents/published/${publishLink}/sign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            signatures: recipientSignatures,
            recipientEmail: recipientEmailInput,
          }),
        });

        if (response.ok) {
          setSubmitSuccess(true);
          setTimeout(() => {
            onCancel(); // Return to home page after success
          }, 2000);
        } else {
          const error = await response.json();
          alert('Error submitting signatures: ' + error.message);
        }
      } else {
        // Authenticated endpoint for logged-in users
        const response = await fetch(`http://localhost:5000/api/documents/${documentId}/sign`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            signatures: recipientSignatures,
          }),
        });

        if (response.ok) {
          // Fetch the updated document tools to show the signatures on the document
          try {
            const docResponse = await fetch(`http://localhost:5000/api/documents/${documentId}/tools`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (docResponse.ok) {
              const docData = await docResponse.json();
              // Update droppedTools with the new signature data
              if (docData.data && Array.isArray(docData.data)) {
                // Here we would update the tools, but since we're closing the view anyway,
                // the signatures will be visible when the user returns to the dashboard
              }
            }
          } catch (error) {
            console.log('Could not fetch updated document:', error);
          }

          setSubmitSuccess(true);
          setTimeout(() => {
            onCancel(); // Return to dashboard after success
          }, 2000);
        } else {
          const error = await response.json();
          alert('Error submitting signatures: ' + error.message);
        }
      }
    } catch (error) {
      console.error('Error submitting signatures:', error);
      alert('Error submitting signatures');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="recipient-signing-view">
        <div className="recipient-header">
          <img src={require('../../../../assets/images/signify_logo.png')} alt="Signify" className="header-logo" />
          <span className="header-brand">Signify</span>
        </div>
        <div className="success-container">
          <div className="success-icon">
            <Check size={64} />
          </div>
          <h2>Document Signed Successfully!</h2>
          <p>Thank you for signing the document. You will be redirected.</p>
        </div>
      </div>
    );
  }

  // Email dialog for recipients accessing via email link
  if (showEmailDialog) {
    return (
      <div className="recipient-signing-view">
        <div className="recipient-header">
          <img src={require('../../../../assets/images/signify_logo.png')} alt="Signify" className="header-logo" />
          <span className="header-brand">Signify</span>
        </div>
        <div className="email-dialog-container">
          <div className="email-dialog">
            <h2>Verify Your Email</h2>
            <p>Please enter the email address you were invited with to sign this document:</p>
            <input
              type="email"
              placeholder="Enter your email address"
              value={recipientEmailInput}
              onChange={(e) => setRecipientEmailInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && recipientEmailInput) {
                  setShowEmailDialog(false);
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '20px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => onCancel()}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#e5e7eb',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (recipientEmailInput) {
                    setShowEmailDialog(false);
                  } else {
                    alert('Please enter your email address');
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recipient-signing-view">
      <div className="recipient-header">
        <div className="header-left">
          <img src={require('../../../../assets/images/signify_logo.png')} alt="Signify" className="header-logo" />
          <span className="header-brand">Signify</span>
        </div>
        <div className="header-center">
          <h2 className="document-title">{documentName}</h2>
        </div>
        <div className="header-right">
          <button 
            className="cancel-btn" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className="sign-btn" 
            onClick={handleSubmitSignatures}
            disabled={isSubmitting || Object.keys(recipientSignatures).length === 0}
          >
            <Send size={18} />
            {isSubmitting ? 'Submitting...' : 'Submit Signatures'}
          </button>
        </div>
      </div>

      <div className="recipient-container">
        <div className="recipient-main">
          <DocumentViewer
            document={null}
            documentName={documentName}
            documentId={documentId}
            fileData={fileData}
            onDocumentUpload={() => {}}
            droppedTools={displayTools}
            setDroppedTools={() => {}}
            selectedToolId={null}
            setSelectedToolId={() => {}}
            isRecipientMode={true}
          />
        </div>

        <div className="recipient-sidebar">
          <div className="sidebar-section">
            <h3>Your Fields to Sign</h3>
            <div className="fields-list">
              {recipientFields.length === 0 ? (
                <p className="no-fields">No fields assigned for you to sign</p>
              ) : (
                recipientFields.map(field => (
                  <div key={field.id} className="field-item">
                    <div className="field-info">
                      <span className="field-name">{field.tool.label}</span>
                      {recipientSignatures[field.id] ? (
                        <span className="field-status signed">✓ Signed</span>
                      ) : (
                        <span className="field-status pending">Pending</span>
                      )}
                    </div>
                    <button
                      className="sign-field-btn"
                      onClick={() => handleSignField(field)}
                      disabled={isSubmitting}
                    >
                      {recipientSignatures[field.id] ? 'Edit' : 'Sign'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="sidebar-section summary">
            <h3>Summary</h3>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-label">Total Fields:</span>
                <span className="stat-value">{recipientFields.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Signed:</span>
                <span className="stat-value">{Object.keys(recipientSignatures).length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Remaining:</span>
                <span className="stat-value">{recipientFields.length - Object.keys(recipientSignatures).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Capture Modal */}
      {showSignatureModal && currentField && (
        <SignatureCapture
          fieldName={currentField.tool.label}
          onCapture={handleCaptureSignature}
          onCancel={() => {
            setShowSignatureModal(false);
            setCurrentField(null);
          }}
          existingSignature={recipientSignatures[currentField.id]}
        />
      )}
    </div>
  );
}

export default RecipientSigningView;
