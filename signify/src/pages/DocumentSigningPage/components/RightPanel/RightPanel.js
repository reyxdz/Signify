import React from 'react';
import { Trash2 } from 'lucide-react';
import './RightPanel.css';

function RightPanel({ selectedToolId, droppedTools, onDeleteTool }) {
  const selectedTool = droppedTools.find(t => t.id === selectedToolId);
  
  React.useEffect(() => {
    if (selectedToolId) {
      console.log('RightPanel received selectedToolId:', selectedToolId, 'selectedTool:', selectedTool);
    }
  }, [selectedToolId, selectedTool]);

  return (
    <div className="right-panel">
      <div className="panel-header">
        <h3>Properties</h3>
      </div>
      <div className="panel-content">
        {selectedTool ? (
          <div className="tool-properties">
            <div className="property-item">
              <label>Field Name</label>
              <p>{selectedTool.tool.label}</p>
            </div>
            <div className="property-item">
              <label>Type</label>
              <p>{selectedTool.tool.id}</p>
            </div>
            <div className="property-item">
              <label>Position</label>
              <p>Page {selectedTool.page} • X: {Math.round(selectedTool.x)}px, Y: {Math.round(selectedTool.y)}px</p>
            </div>
            <button
              className="delete-btn"
              onClick={() => {
                console.log('Delete button clicked for tool:', selectedToolId);
                onDeleteTool(selectedToolId);
              }}
              title="Delete this field"
            >
              <Trash2 size={18} />
              Delete Field
            </button>
          </div>
        ) : (
          <p className="no-selection">Select a field to view properties</p>
        )}
      </div>
    </div>
  );
}

export default RightPanel;
