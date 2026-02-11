import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PenTool, FileText, Mail, User } from 'lucide-react';
import DocumentViewer from './components/DocumentViewer/DocumentViewer';
import LeftPanel from './components/LeftPanel/LeftPanel';
import RightPanel from './components/RightPanel/RightPanel';
import './DocumentSigningPage.css';

// Icon mapping for reconstructing tools from database
const ICON_MAP = {
  'My Signature': PenTool,
  'My Initial': FileText,
  'My Email': Mail,
  'My Full Name': User,
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
        if (data.tools && data.tools.length > 0) {
          // Reconstruct tools with icons since icons can't be stored in database
          const reconstructedTools = data.tools.map(item => {
            // Initialize dimensions for signature/initial images if not set
            const isSignatureImage = item.tool.label === 'My Signature' || item.tool.label === 'My Initial';
            return {
              ...item,
              tool: {
                ...item.tool,
                // Add icon back based on label
                icon: ICON_MAP[item.tool.label],
              },
              // Set default dimensions for signature images if not already set
              ...(isSignatureImage && !item.width && { width: 120 }),
              ...(isSignatureImage && !item.height && { height: 80 }),
            };
          });
          
          setDroppedTools(reconstructedTools);
          console.log('Loaded tools from database for document:', docId, reconstructedTools);
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
  }, [droppedTools, documentId, isLoadingFromDb]);

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
          <button className="preview-btn" onClick={handlePreview}>Preview</button>
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
        />
      </div>
    </div>
  );
}

export default DocumentSigningPage;
