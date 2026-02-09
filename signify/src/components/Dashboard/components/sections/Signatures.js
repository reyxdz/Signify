import React from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import '../Sections.css';

const Signatures = () => {
  const signatures = [
    { id: 1, name: 'John Smith', date: 'Created 1 month ago', type: 'Handwritten' },
    { id: 2, name: 'J.S.', date: 'Created 2 months ago', type: 'Initials' },
    { id: 3, name: 'John Smith (Formal)', date: 'Created 3 months ago', type: 'Formal' },
  ];

  return (
    <div className="section-signatures">
      <div className="section-header">
        <h1>My Signatures</h1>
        <p>Manage your digital signatures</p>
      </div>

      <div className="signature-intro">
        <p>Digital signatures make signing documents faster and easier. Create and manage your signatures below.</p>
      </div>

      <div className="signatures-list">
        {signatures.map(sig => (
          <div key={sig.id} className="signature-item">
            <div className="signature-preview">
              <div className="signature-box">
                <span style={{ fontSize: '24px', fontStyle: 'italic' }}>{sig.name}</span>
              </div>
            </div>
            <div className="signature-info">
              <div className="signature-name">{sig.name}</div>
              <div className="signature-type">{sig.type}</div>
              <div className="signature-date">{sig.date}</div>
            </div>
            <div className="signature-actions">
              <button className="action-btn">
                <Edit2 size={16} />
              </button>
              <button className="action-btn">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-primary btn-add-signature">
        <Plus size={18} /> Add New Signature
      </button>
    </div>
  );
};

export default Signatures;
