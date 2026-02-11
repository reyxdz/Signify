import React from 'react';
import { Trash2 } from 'lucide-react';
import './RightPanel.css';

function RightPanel({ selectedToolId, droppedTools, onDeleteTool, onUpdateToolStyle }) {
  const selectedTool = droppedTools.find(t => t.id === selectedToolId);
  const isTextField = selectedTool && selectedTool.tool.label && 
    (selectedTool.tool.label === 'My Email' || selectedTool.tool.label === 'My Full Name');
  
  React.useEffect(() => {
    if (selectedToolId) {
      console.log('RightPanel received selectedToolId:', selectedToolId, 'selectedTool:', selectedTool);
    }
  }, [selectedToolId, selectedTool]);

  const handleFontFamilyChange = (e) => {
    onUpdateToolStyle(selectedToolId, { fontFamily: e.target.value });
  };

  const handleFontSizeChange = (e) => {
    const size = parseInt(e.target.value) || 14;
    onUpdateToolStyle(selectedToolId, { fontSize: size });
  };

  const handleFontColorChange = (e) => {
    onUpdateToolStyle(selectedToolId, { fontColor: e.target.value });
  };

  const handleFontStyleToggle = (style) => {
    const currentStyles = selectedTool.fontStyles || {};
    const newStyles = {
      ...currentStyles,
      [style]: !currentStyles[style]
    };
    onUpdateToolStyle(selectedToolId, { fontStyles: newStyles });
  };

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

            {isTextField && (
              <div className="text-field-styles">
                <div className="section-divider">Text Styling</div>
                
                <div className="property-item">
                  <label htmlFor="fontFamily">Font Family</label>
                  <select 
                    id="fontFamily"
                    value={selectedTool.fontFamily || 'Arial'}
                    onChange={handleFontFamilyChange}
                    className="style-select"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                  </select>
                </div>

                <div className="property-item">
                  <label htmlFor="fontSize">Font Size (px)</label>
                  <input 
                    id="fontSize"
                    type="number" 
                    min="8" 
                    max="72" 
                    value={selectedTool.fontSize || 14}
                    onChange={handleFontSizeChange}
                    className="style-input"
                  />
                </div>

                <div className="property-item">
                  <label htmlFor="fontColor">Font Color</label>
                  <input 
                    id="fontColor"
                    type="color" 
                    value={selectedTool.fontColor || '#000000'}
                    onChange={handleFontColorChange}
                    className="style-input color-input"
                  />
                </div>

                <div className="property-item">
                  <label>Font Design</label>
                  <div className="font-design-buttons">
                    <button 
                      className={`design-btn ${selectedTool.fontStyles?.bold ? 'active' : ''}`}
                      onClick={() => handleFontStyleToggle('bold')}
                      title="Bold"
                    >
                      <strong>B</strong>
                    </button>
                    <button 
                      className={`design-btn ${selectedTool.fontStyles?.italic ? 'active' : ''}`}
                      onClick={() => handleFontStyleToggle('italic')}
                      title="Italic"
                    >
                      <em>I</em>
                    </button>
                    <button 
                      className={`design-btn ${selectedTool.fontStyles?.underline ? 'active' : ''}`}
                      onClick={() => handleFontStyleToggle('underline')}
                      title="Underline"
                    >
                      <u>U</u>
                    </button>
                  </div>
                </div>
              </div>
            )}

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
