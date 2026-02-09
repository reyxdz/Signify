import React from 'react';
import { Eye, MoreVertical, FileText, Upload, Search } from 'lucide-react';
import '../Sections.css';

const Documents = () => {
  const documents = [
    { id: 1, name: 'Contract_2026.pdf', size: '2.4 MB', date: '2 days ago', status: 'signed' },
    { id: 2, name: 'Agreement_Final.docx', size: '1.8 MB', date: '5 days ago', status: 'pending' },
    { id: 3, name: 'Invoice_Q1.pdf', size: '892 KB', date: '1 week ago', status: 'signed' },
    { id: 4, name: 'Report_Monthly.xlsx', size: '1.2 MB', date: '2 weeks ago', status: 'signed' },
    { id: 5, name: 'Proposal_NewClient.pdf', size: '3.1 MB', date: '3 weeks ago', status: 'draft' },
  ];

  return (
    <div className="section-documents">
      <div className="section-header">
        <h1>Documents</h1>
        <p>Manage all your documents in one place</p>
      </div>

      <div className="section-toolbar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search documents..." 
            className="search-input"
          />
        </div>
        <button className="btn-primary">
          <Upload size={18} /> Upload Document
        </button>
      </div>

      <div className="documents-table">
        <div className="table-header">
          <div className="col-name">Name</div>
          <div className="col-size">Size</div>
          <div className="col-date">Modified</div>
          <div className="col-status">Status</div>
          <div className="col-actions">Actions</div>
        </div>
        
        {documents.map(doc => (
          <div key={doc.id} className="table-row">
            <div className="col-name">
              <FileText size={18} className="file-icon" />
              {doc.name}
            </div>
            <div className="col-size">{doc.size}</div>
            <div className="col-date">{doc.date}</div>
            <div className="col-status">
              <span className={`status-badge ${doc.status}`}>
                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
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

export default Documents;
