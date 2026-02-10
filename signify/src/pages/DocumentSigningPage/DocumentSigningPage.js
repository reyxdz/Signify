import React from 'react';
import './DocumentSigningPage.css';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import DocumentViewer from './components/DocumentViewer';

const DocumentSigningPage = ({ user }) => {
  return (
    <div className="document-signing-page container">
      <aside className="side-panel left">
        <LeftPanel />
      </aside>

      <main className="document-viewer-area">
        <header className="viewer-header">
          <h2>Document Signing</h2>
          <p className="muted">Upload a PDF or choose a document to begin placing signatures.</p>
        </header>

        <section className="viewer-card">
          <DocumentViewer />
        </section>
      </main>

      <aside className="side-panel right">
        <RightPanel />
      </aside>
    </div>
  );
};

export default DocumentSigningPage;
