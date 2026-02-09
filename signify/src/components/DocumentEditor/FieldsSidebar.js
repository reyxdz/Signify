import React from 'react';
import { FileSignature, PenTool, Stamp, User, Mail, Type, Calendar, CheckSquare } from 'lucide-react';
import './FieldsSidebar.css';

const FieldsSidebar = () => {
  const fields = [
    {
      id: 'signature',
      label: 'My Signature',
      icon: FileSignature,
      type: 'signature',
      description: 'Your saved signature',
    },
    {
      id: 'initials',
      label: 'My Initials',
      icon: PenTool,
      type: 'initials',
      description: 'Your initials',
    },
    {
      id: 'stamp',
      label: 'My Stamp',
      icon: Stamp,
      type: 'stamp',
      description: 'Your official stamp',
    },
    {
      id: 'fullname',
      label: 'My Full Name',
      icon: User,
      type: 'text',
      description: 'Your full name',
    },
    {
      id: 'email',
      label: 'My Email',
      icon: Mail,
      type: 'text',
      description: 'Your email address',
    },
    {
      id: 'text',
      label: 'Text',
      icon: Type,
      type: 'text',
      description: 'Add custom text',
    },
    {
      id: 'date',
      label: "Today's Date",
      icon: Calendar,
      type: 'date',
      description: 'Current date',
    },
    {
      id: 'check',
      label: 'Check',
      icon: CheckSquare,
      type: 'checkbox',
      description: 'Checkbox field',
    },
  ];

  const handleDragStart = (e, field) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('field', JSON.stringify(field));
  };

  return (
    <div className="fields-sidebar">
      <div className="sidebar-header">
        <h3>Form Fields</h3>
        <p>Drag fields to document</p>
      </div>

      <div className="fields-container">
        {fields.map((field) => {
          const IconComponent = field.icon;
          return (
            <div
              key={field.id}
              className="field-item"
              draggable
              onDragStart={(e) => handleDragStart(e, field)}
              title={field.description}
            >
              <div className="field-icon">
                <IconComponent size={18} />
              </div>
              <div className="field-info">
                <span className="field-label">{field.label}</span>
                <span className="field-type">{field.type}</span>
              </div>
              <div className="drag-indicator">⋮⋮</div>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <p>💡 Tip: Drag and drop fields onto the document to add them</p>
      </div>
    </div>
  );
};

export default FieldsSidebar;
