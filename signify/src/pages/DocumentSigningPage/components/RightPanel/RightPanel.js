import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Search, X, Loader } from 'lucide-react';
import './RightPanel.css';

function RightPanel({ selectedToolId, droppedTools, onDeleteTool, onUpdateToolStyle, documentId }) {
  const selectedTool = droppedTools.find(t => t.id === selectedToolId);
  const isTextField = selectedTool && selectedTool.tool.label && 
    (selectedTool.tool.label === 'My Email' || selectedTool.tool.label === 'My Full Name');
  
  const isRecipientField = selectedTool && selectedTool.tool.label && 
    (selectedTool.tool.label === 'Recipient Signature' || selectedTool.tool.label === 'Recipient Initial' || 
     selectedTool.tool.label === 'Recipient Email' || selectedTool.tool.label === 'Recipient Full Name');

  const [searchResults, setSearchResults] = useState([]);
  const [showRecipientSearch, setShowRecipientSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [assignedRecipient, setAssignedRecipient] = useState(selectedTool?.assignedRecipient || null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (selectedToolId) {
      console.log('RightPanel received selectedToolId:', selectedToolId);
    }
  }, [selectedToolId]);

  // Incremental email search with debouncing - searches database for available emails
  useEffect(() => {
    if (!isRecipientField) return;

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Set new timeout for debounced search
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Searching for:', searchQuery);
        const response = await fetch(`http://localhost:5000/api/emails/search?q=${encodeURIComponent(searchQuery)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Search results:', data.data);
          setSearchResults(data.data || []);
        } else {
          console.error('Search failed:', response.status);
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching emails:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, isRecipientField]);

  const handleAssignRecipient = (emailResult) => {
    const recipient = {
      _id: emailResult.userId,
      recipientEmail: emailResult.email,
      recipientName: emailResult.name,
    };
    setAssignedRecipient(recipient);
    setShowRecipientSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    
    // Update tool with recipient assignment
    if (selectedTool) {
      onUpdateToolStyle(selectedToolId, { assignedRecipient: recipient });
    }
  };

  const handleRemoveRecipient = () => {
    setAssignedRecipient(null);
    if (selectedTool) {
      onUpdateToolStyle(selectedToolId, { assignedRecipient: null });
    }
  };

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
            {/* Recipient Assignment Section */}
            {isRecipientField && (
              <div className="recipient-assignment-section">
                <div className="section-divider">Assign Recipient</div>
                
                {assignedRecipient ? (
                  <div className="assigned-recipient">
                    <div className="recipient-info">
                      <div className="recipient-email">{assignedRecipient.recipientEmail}</div>
                      {assignedRecipient.recipientName && (
                        <div className="recipient-name">{assignedRecipient.recipientName}</div>
                      )}
                    </div>
                    <button 
                      className="remove-recipient-btn"
                      onClick={handleRemoveRecipient}
                      title="Remove recipient assignment"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="recipient-selector">
                    <div className="search-input-wrapper">
                      <Search size={16} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search emails..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowRecipientSearch(true)}
                        className="search-input"
                        autoComplete="off"
                      />
                      {searchQuery && (
                        <button
                          className="clear-search-btn"
                          onClick={() => setSearchQuery('')}
                          title="Clear search"
                          type="button"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {showRecipientSearch && (
                      <div className="recipient-dropdown">
                        {isSearching && (
                          <div className="searching-message">
                            <Loader size={14} className="spinner" />
                            Searching...
                          </div>
                        )}

                        {!isSearching && searchQuery.trim().length > 0 && (
                          <>
                            <div className="results-header">
                              {searchResults.length === 0 ? (
                                <span className="results-count">No matches found</span>
                              ) : (
                                <span className="results-count">
                                  {searchResults.length} email{searchResults.length !== 1 ? 's' : ''} found
                                </span>
                              )}
                            </div>
                            
                            {searchResults.length > 0 && (
                              <div className="recipient-list">
                                {searchResults.map((emailResult) => (
                                  <button
                                    key={emailResult.userId}
                                    className="recipient-item"
                                    onClick={() => handleAssignRecipient(emailResult)}
                                    type="button"
                                  >
                                    <div className="recipient-item-email">{emailResult.email}</div>
                                    {emailResult.name && (
                                      <div className="recipient-item-name">{emailResult.name}</div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        
                        {!isSearching && searchQuery.trim().length === 0 && (
                          <div className="search-placeholder">
                            Type an email to search...
                          </div>
                        )}
                        
                        <button
                          className="close-search-btn"
                          onClick={() => {
                            setShowRecipientSearch(false);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          type="button"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
