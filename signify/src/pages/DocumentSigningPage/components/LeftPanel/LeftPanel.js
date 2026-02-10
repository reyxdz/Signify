import React from 'react';
import { PenTool, FileText, Mail, User } from 'lucide-react';
import './LeftPanel.css';

function LeftPanel() {
  const tools = [
    { id: 1, icon: PenTool, label: 'My Signature', className: 'tool-signature' },
    { id: 2, icon: FileText, label: 'My Initial', className: 'tool-initial' },
    { id: 3, icon: Mail, label: 'My Email', className: 'tool-email' },
    { id: 4, icon: User, label: 'My Full Name', className: 'tool-fullname' },
  ];

  const handleDragStart = (e, tool) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(tool));
    e.dataTransfer.setData('text/plain', tool.label);
  };

  return (
    <div className="left-panel">
      <div className="panel-header">
        <h3>Tools</h3>
      </div>
      <div className="panel-content">
        <div className="tools-container">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <button
                key={tool.id}
                className={`tool-item ${tool.className}`}
                draggable
                onDragStart={(e) => handleDragStart(e, tool)}
              >
                <div className="tool-icon">
                  <IconComponent size={24} />
                </div>
                <span className="tool-label">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default LeftPanel;
