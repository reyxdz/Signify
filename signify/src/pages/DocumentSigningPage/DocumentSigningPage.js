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
          const reconstructedTools = data.tools.map(item => ({
            ...item,
            tool: {
              ...item.tool,
              // Add icon back based on label
              icon: ICON_MAP[item.tool.label],
            }
          }));
          
          setDroppedTools(reconstructedTools);
          console.log('Loaded tools from database for document:', docId, reconstructedTools);
        }
      }
    } catch (error) {
      console.error('Error loading tools from database:', error);
    }
  };

  // Save dropped tools to database whenever they change
  useEffect(() => {
    if (!documentId) {
      console.log('Save effect skipped - no documentId');
      return;
    }

    if (droppedTools.length === 0) {
      console.log('Save effect skipped - no tools to save');
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
            // Don't send icon as it's a React component
          },
          x: item.x,
          y: item.y,
          page: item.page,
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
        } else {
          console.error('Failed to save tools to database:', response.status, data);
        }
      } catch (error) {
        console.error('Error saving tools to database:', error);
      }
    };

    saveToolsToDatabase();
  }, [droppedTools, documentId]);

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
          ref={documentViewerRef}
        />
        <RightPanel />
      </div>
    </div>
  );
}

export default DocumentSigningPage;
