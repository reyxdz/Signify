import React from 'react';
import { Upload, Layout, Share2 } from 'lucide-react';
import './QuickActions.css';

const QuickActions = ({ onUpload, onTemplate, onShare }) => {
  return (
    <div className="quick-actions">
      <button 
        className="action-button primary"
        onClick={onUpload}
        title="Upload a new document"
      >
        <Upload size={18} />
        <span>Upload Document</span>
      </button>
      
      <button 
        className="action-button secondary"
        onClick={onTemplate}
        title="Create from template"
      >
        <Layout size={18} />
        <span>Use Template</span>
      </button>
      
      <button 
        className="action-button secondary"
        onClick={onShare}
        title="Share a document"
      >
        <Share2 size={18} />
        <span>Share Document</span>
      </button>
    </div>
  );
};

export default QuickActions;
