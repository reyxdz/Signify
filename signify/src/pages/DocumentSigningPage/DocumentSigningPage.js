import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PenTool, FileText, Mail, User, Send, Download } from 'lucide-react';
import DocumentViewer from './components/DocumentViewer/DocumentViewer';
import LeftPanel from './components/LeftPanel/LeftPanel';
import RightPanel from './components/RightPanel/RightPanel';
import RecipientSigningView from './components/RecipientSigningView/RecipientSigningView';
import PublishModal from '../../components/Modals/DocumentSigningModal/PublishModal';
import './DocumentSigningPage.css';

// Icon mapping for reconstructing tools from database
const ICON_MAP = {
  'My Signature': PenTool,
  'My Initial': FileText,
  'My Email': Mail,
  'My Full Name': User,
  'Recipient Signature': PenTool,
  'Recipient Initial': FileText,
  'Recipient Email': Mail,
  'Recipient Full Name': User,
};

function DocumentSigningPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentId, setDocumentId] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [droppedTools, setDroppedTools] = useState([]);
  const [selectedToolId, setSelectedToolId] = useState(null);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [isRecipient, setIsRecipient] = useState(false);
  const lastSavedToolsRef = useRef(null);
  const documentViewerRef = useRef(null);

  // If navigated from dashboard with document data, use it
  useEffect(() => {
    if (location.state?.document) {
      const doc = location.state.document;
      const id = location.state.documentId || doc._id || doc.id;
      console.log('Document received from dashboard:', { name: doc.name, hasFileData: !!doc.fileData });
      setDocumentId(id);
      setDocumentName(doc.name || doc.fileName || '');
      setFileData(doc.fileData || null);
      setDocumentData(doc);
      setIsPublished(doc.publishedStatus === 'published');
      setIsRecipient(location.state.isRecipient || false);
      // Store the complete document object including file data
      localStorage.setItem('currentDocument', JSON.stringify({
        id: id,
        name: doc.name || doc.fileName || '',
        fileData: doc.fileData,
        document: doc
      }));
      setDocument(null);
      
      // Load previously saved tools from database for this document
      loadToolsFromDatabase(id);
    } else {
      // Check if document is in localStorage (page reload case)
      const savedDoc = localStorage.getItem('currentDocument');
      if (savedDoc) {
        try {
          const parsed = JSON.parse(savedDoc);
          setDocumentId(parsed.id);
          setDocumentName(parsed.name);
          setFileData(parsed.fileData || null);
          setDocument(null);
          
          // Load previously saved tools from database for this document
          loadToolsFromDatabase(parsed.id);
        } catch (e) {
          console.error('Error parsing saved document:', e);
          localStorage.removeItem('currentDocument');
          navigate('/');
        }
      } else {
        // No document provided - redirect to dashboard
        navigate('/');
      }
    }
  }, [location.state, navigate]);

  // Function to load tools from database
  const loadToolsFromDatabase = async (docId) => {
    try {
      setIsLoadingFromDb(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/documents/${docId}/tools`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Tools received from server:', {
          toolCount: data.tools?.length,
          tools: data.tools?.map(t => ({
            id: t.id,
            label: t.tool?.label,
            hasValue: !!t.tool?.value,
            valueLength: t.tool?.value?.length,
            valuePreview: typeof t.tool?.value === 'string' ? t.tool.value.substring(0, 50) : 'N/A'
          }))
        });
        
        if (data.tools && data.tools.length > 0) {
          // Reconstruct tools with icons since icons can't be stored in database
          const reconstructedTools = data.tools.map(item => {
            // Initialize dimensions for signature/initial images and recipient signature/initial if not set
            const isSignatureImage = item.tool.label === 'My Signature' || item.tool.label === 'My Initial';
            const isRecipientSignature = item.tool.label === 'Recipient Signature' || item.tool.label === 'Recipient Initial';
            return {
              ...item,
              tool: {
                ...item.tool,
                // Add icon back based on label
                icon: ICON_MAP[item.tool.label],
              },
              // Set default dimensions if not already set
              ...(isSignatureImage && !item.width && { width: 120 }),
              ...(isSignatureImage && !item.height && { height: 80 }),
              ...(isRecipientSignature && !item.width && { width: 150 }),
              ...(isRecipientSignature && !item.height && { height: 60 }),
            };
          });
          
          setDroppedTools(reconstructedTools);
          console.log('setDroppedTools called with:', reconstructedTools.map(t => ({
            id: t.id,
            label: t.tool?.label,
            hasValue: !!t.tool?.value,
            valueLength: t.tool?.value?.length,
          })));
          // Store what we just loaded so we don't immediately re-save it
          lastSavedToolsRef.current = JSON.stringify(
            reconstructedTools.map(item => ({
              id: item.id,
              x: item.x,
              y: item.y,
              page: item.page,
              label: item.tool.label,
              width: item.width,
              height: item.height,
              fontFamily: item.fontFamily,
              fontSize: item.fontSize,
              fontColor: item.fontColor,
              fontStyles: item.fontStyles,
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error loading tools from database:', error);
    } finally {
      // Use timeout to ensure the ref is properly set before allowing saves
      setTimeout(() => setIsLoadingFromDb(false), 100);
    }
  };

  // Save dropped tools to database whenever they change
  useEffect(() => {
    // Skip saving if we're currently loading from database
    if (isLoadingFromDb) {
      return;
    }

    if (!documentId) {
      return;
    }

    // Don't save tools if user is a recipient - only document owner can modify tools
    if (isRecipient) {
      return;
    }

    // Create a comparison string to check if anything actually changed
    const currentToolsString = JSON.stringify(
      droppedTools.map(item => ({
        id: item.id,
        x: item.x,
        y: item.y,
        page: item.page,
        label: item.tool.label,
        width: item.width,
        height: item.height,
        fontFamily: item.fontFamily,
        fontSize: item.fontSize,
        fontColor: item.fontColor,
        fontStyles: item.fontStyles,
      }))
    );

    // Don't save if we just loaded these exact tools from the database
    if (lastSavedToolsRef.current === currentToolsString) {
      return;
    }

    const saveToolsToDatabase = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('→ Saving', droppedTools.length, 'tools to database for document:', documentId);
        
        // Filter out icon (React component) before sending - only send serializable data
        const serializableTools = droppedTools.map(item => ({
          id: item.id,
          tool: {
            id: item.tool.id,
            label: item.tool.label,
            value: item.tool.value,
            placeholder: item.tool.placeholder,
            className: item.tool.className,
          },
          x: item.x,
          y: item.y,
          page: item.page,
          ...(item.width && { width: item.width }),
          ...(item.height && { height: item.height }),
          ...(item.fontFamily && { fontFamily: item.fontFamily }),
          ...(item.fontSize && { fontSize: item.fontSize }),
          ...(item.fontColor && { fontColor: item.fontColor }),
          ...(item.fontStyles && { fontStyles: item.fontStyles }),
        }));
        
        const response = await fetch(`http://localhost:5000/api/documents/${documentId}/tools`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tools: serializableTools }),
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log(`✓ Saved ${droppedTools.length} tools to database`);
          // Update the ref with what we just saved
          lastSavedToolsRef.current = currentToolsString;
        } else {
          console.error('Failed to save tools to database:', response.status, data);
        }
      } catch (error) {
        console.error('Error saving tools to database:', error);
      }
    };

    saveToolsToDatabase();
  }, [droppedTools, documentId, isLoadingFromDb, isRecipient]);

  const handleDocumentUpload = (file) => {
    setDocument(file);
    setDocumentName(file.name);
    setDocumentId(null); // Reset documentId when uploading new file
    localStorage.removeItem('currentDocument'); // Clear saved document
    setDroppedTools([]); // Clear dropped tools
  };

  const handleBackToDashboard = () => {
    localStorage.removeItem('currentDocument');
    setDroppedTools([]);
    navigate('/');
  };

  const handleDeleteTool = (toolId) => {
    console.log('Deleting tool:', toolId);
    const updatedTools = droppedTools.filter((t) => t.id !== toolId);
    console.log('Tools after deletion:', updatedTools.length, 'remaining');
    setDroppedTools(updatedTools);
    setSelectedToolId(null);
  };

  const handleUpdateToolStyle = (toolId, styleUpdates) => {
    const updatedTools = droppedTools.map(tool => 
      tool.id === toolId 
        ? { ...tool, ...styleUpdates }
        : tool
    );
    setDroppedTools(updatedTools);
  };

  const handlePreview = () => {
    // Strip out icons (React components) before passing through route state
    const serializableTools = droppedTools.map(item => ({
      id: item.id,
      tool: {
        id: item.tool.id,
        label: item.tool.label,
        value: item.tool.value,
        placeholder: item.tool.placeholder,
        className: item.tool.className,
        // Don't include icon - it's a React component
      },
      x: item.x,
      y: item.y,
      page: item.page,
      ...(item.width && { width: item.width }),
      ...(item.height && { height: item.height }),
      ...(item.fontFamily && { fontFamily: item.fontFamily }),
      ...(item.fontSize && { fontSize: item.fontSize }),
      ...(item.fontColor && { fontColor: item.fontColor }),
      ...(item.fontStyles && { fontStyles: item.fontStyles }),
      ...(item.assignedRecipient && { assignedRecipient: item.assignedRecipient }),
    }));

    // Navigate to preview page with dropped tools data
    navigate('/preview', {
      state: {
        document: document,
        documentName: documentName,
        documentId: documentId,
        fileData: fileData,
        droppedTools: serializableTools,
      }
    });
  };

  /**
   * Extract recipients from recipient-type fields
   */
  const getRecipientsFromTools = () => {
    const recipients = new Map();
    
    droppedTools.forEach(tool => {
      if (tool.assignedRecipients && Array.isArray(tool.assignedRecipients)) {
        tool.assignedRecipients.forEach(recipient => {
          if (!recipients.has(recipient.recipientEmail)) {
            recipients.set(recipient.recipientEmail, {
              recipientEmail: recipient.recipientEmail,
              recipientName: recipient.recipientName,
              recipientId: recipient.recipientId,
            });
          }
        });
      }
    });

    return Array.from(recipients.values());
  };

  /**
   * Handle publish button click
   */
  const handlePublishClick = () => {
    const recipients = getRecipientsFromTools();
    if (recipients.length === 0) {
      alert('Please assign at least one recipient to a field before publishing');
      return;
    }
    setShowPublishModal(true);
  };

  /**
   * Handle export button click - downloads the document with signatures as PDF
   */
  const handleExportDocument = async () => {
    if (!documentId) {
      alert('Document ID is missing');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/documents/${documentId}/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Get the filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'signed-document.pdf';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) filename = filenameMatch[1];
        }

        // Create a blob from the response
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const error = await response.json();
        alert('Error exporting document: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error exporting document:', error);
      alert('Error exporting document: ' + error.message);
    }
  };

  /**
   * Handle publish confirmation
   */
  const handlePublish = async (recipients, expiresIn) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/documents/${documentId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipients, expiresIn }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to publish document');
      }

      const data = await response.json();
      setIsPublished(true);
      setDocumentData({ ...documentData, publishedStatus: 'published', publishLink: data.publishLink });
      console.log('Document published successfully');
    } catch (error) {
      console.error('Error publishing document:', error);
      throw error;
    }
  };

  /**
   * Handle unpublish
   */
  const handleUnpublish = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/documents/${documentId}/unpublish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unpublish document');
      }

      setIsPublished(false);
      setShowPublishModal(false);
      console.log('Document unpublished successfully');
    } catch (error) {
      console.error('Error unpublishing document:', error);
      throw error;
    }
  };

  // If no document is set up, show a loading state
  if (!documentId && !document) {
    return (
      <div className="document-signing-page">
        <div className="signing-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#6b7280' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If recipient mode, show recipient-specific view
  if (isRecipient) {
    console.log('Rendering RecipientSigningView with droppedTools:', droppedTools.map(t => ({
      id: t.id,
      label: t.tool?.label,
      hasValue: !!t.tool?.value,
      valueLength: t.tool?.value?.length,
    })));
    return (
      <RecipientSigningView
        documentName={documentName}
        documentId={documentId}
        fileData={fileData}
        droppedTools={droppedTools}
        onSign={(signatures) => {
          console.log('Signatures submitted:', signatures);
          // Signature submission is handled in RecipientSigningView
        }}
        onCancel={() => {
          navigate('/dashboard');
        }}
      />
    );
  }

  return (
    <div className="document-signing-page">
      <div className="signing-header">
        <div className="header-left">
          <img src={require('../../assets/images/signify_logo.png')} alt="Signify" className="header-logo" />
          <span className="header-brand">Signify</span>
        </div>
        <div className="header-center">
          {/* Center space reserved for future actions */}
        </div>
        <div className="header-right">
          {!isRecipient ? (
            <>
              <button className="export-btn" onClick={handleExportDocument} title="Export signed document as PDF">
                <Download size={18} />
                Export
              </button>
              <button className="publish-btn" onClick={handlePublishClick}>
                <Send size={18} />
                {isPublished ? 'Published' : 'Publish'}
              </button>
              <button className="preview-btn" onClick={handlePreview}>Preview</button>
            </>
          ) : (
            <button className="publish-btn" onClick={() => alert('Signing feature coming soon')}>
              <Send size={18} />
              Sign Document
            </button>
          )}
          <h2 className="header-filename">{documentName}</h2>
        </div>
      </div>
      <div className="signing-container">
        <LeftPanel />
        <DocumentViewer
          document={document}
          documentName={documentName}
          documentId={documentId}
          fileData={fileData}
          onDocumentUpload={handleDocumentUpload}
          droppedTools={droppedTools}
          setDroppedTools={setDroppedTools}
          selectedToolId={selectedToolId}
          setSelectedToolId={setSelectedToolId}
          ref={documentViewerRef}
        />
        <RightPanel
          selectedToolId={selectedToolId}
          droppedTools={droppedTools}
          onDeleteTool={handleDeleteTool}
          onUpdateToolStyle={handleUpdateToolStyle}
          documentId={documentId}
        />
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        documentName={documentName}
        recipients={getRecipientsFromTools()}
        isPublished={isPublished}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        documentId={documentId}
      />
    </div>
  );
}

export default DocumentSigningPage;
