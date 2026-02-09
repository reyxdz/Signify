import React from 'react';
import { Eye, MoreVertical, FileText, Search } from 'lucide-react';
import '../Sections.css';

const SharedWithMe = () => {
  const sharedDocs = [
    { id: 1, name: 'Q1_Budget_Review.pdf', from: 'Sarah Johnson', date: '3 days ago', action: 'pending signature' },
    { id: 2, name: 'Project_Proposal.docx', from: 'Mike Chen', date: '1 week ago', action: 'for review' },
    { id: 3, name: 'Team_Agreement.pdf', from: 'Emily Davis', date: '2 weeks ago', action: 'signed' },
    { id: 4, name: 'Contract_Update.pdf', from: 'James Wilson', date: '1 month ago', action: 'signed' },
  ];

  return (
    <div className="section-shared">
      <div className="section-header">
        <h1>Shared with Me</h1>
        <p>Documents shared by others for your attention</p>
      </div>

      <div className="section-toolbar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search shared documents..." 
            className="search-input"
          />
        </div>
      </div>

      <div className="documents-table">
        <div className="table-header">
          <div className="col-name">Document</div>
          <div className="col-from">From</div>
          <div className="col-date">Shared</div>
          <div className="col-action">Action Required</div>
          <div className="col-actions">Actions</div>
        </div>
        
        {sharedDocs.map(doc => (
          <div key={doc.id} className="table-row">
            <div className="col-name">
              <FileText size={18} className="file-icon" />
              {doc.name}
            </div>
            <div className="col-from">{doc.from}</div>
            <div className="col-date">{doc.date}</div>
            <div className="col-action">
              <span className={`action-badge ${doc.action.replace(/\s+/g, '-')}`}>
                {doc.action.charAt(0).toUpperCase() + doc.action.slice(1)}
              </span>
            </div>
            <div className="col-actions">
              <button className="action-btn">
                <Eye size={16} />
              </button>
              <button className="action-btn">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedWithMe;
