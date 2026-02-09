import React from 'react';
import { Clipboard, Plus } from 'lucide-react';
import '../Sections.css';

const Templates = () => {
  const templates = [
    { id: 1, name: 'Employment Agreement', category: 'Legal', uses: 24 },
    { id: 2, name: 'Non-Disclosure Agreement', category: 'Legal', uses: 18 },
    { id: 3, name: 'Invoice Template', category: 'Business', uses: 42 },
    { id: 4, name: 'Contract Amendment', category: 'Legal', uses: 12 },
    { id: 5, name: 'Service Agreement', category: 'Business', uses: 31 },
  ];

  return (
    <div className="section-templates">
      <div className="section-header">
        <h1>Templates</h1>
        <p>Save time with pre-made templates</p>
      </div>

      <div className="section-toolbar">
        <select className="filter-select">
          <option value="">All Categories</option>
          <option value="legal">Legal</option>
          <option value="business">Business</option>
          <option value="personal">Personal</option>
        </select>
        <button className="btn-primary">
          <Plus size={18} /> Create Template
        </button>
      </div>

      <div className="templates-grid">
        {templates.map(template => (
          <div key={template.id} className="template-card">
            <div className="template-icon"><Clipboard size={40} /></div>
            <div className="template-name">{template.name}</div>
            <div className="template-category">{template.category}</div>
            <div className="template-uses">{template.uses} uses</div>
            <button className="template-btn">Use Template</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Templates;
